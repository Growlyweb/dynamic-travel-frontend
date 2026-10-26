import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock3, FileText, LogOut, ShieldCheck, Upload, XCircle } from 'lucide-react'

import { b2bApi } from '../b2b.api'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/formatters'

const STATUS = {
  pending: { label: 'Pending document verification', tone: 'amber', icon: Clock3 },
  documents_verified: { label: 'Documents verified — waiting for final approval', tone: 'blue', icon: ShieldCheck },
  approved: { label: 'Account active', tone: 'green', icon: CheckCircle2 },
  rejected: { label: 'Application rejected', tone: 'red', icon: XCircle },
  suspended: { label: 'Account suspended', tone: 'red', icon: XCircle },
}

const TONE = {
  amber: 'border-amber-200 bg-amber-50 text-amber-900',
  blue: 'border-blue-200 bg-blue-50 text-blue-900',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  red: 'border-rose-200 bg-rose-50 text-rose-900',
}

const DOC_STATUS = {
  pending: 'bg-amber-50 text-amber-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-rose-50 text-rose-700',
}

export default function PartnerPortal() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [partner, setPartner] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!user?.partnerId) return
    setLoading(true)
    try {
      const [partnerData, documentData] = await Promise.all([
        b2bApi.getPartner(user.partnerId),
        b2bApi.getPartnerDocuments(user.partnerId),
      ])
      setPartner(partnerData)
      setDocuments(documentData)
    } catch (err) {
      setError(err?.message || 'Could not load your partner account.')
    } finally {
      setLoading(false)
    }
  }, [user?.partnerId])

  useEffect(() => {
    load()
  }, [load])

  const upload = async (file) => {
    if (!file) return
    if (file.size > 900 * 1024) {
      setError('Please upload a file under 900 KB.')
      return
    }
    setUploading(true)
    setError('')
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      await b2bApi.uploadPartnerDocument(user.partnerId, {
        name: file.name,
        fileName: file.name,
        type: 'other',
        size: file.size,
        dataUrl,
      })
      setNotice('Document uploaded. Our team will verify it.')
      await load()
    } catch (err) {
      setError(err?.message || 'Could not upload the document.')
    } finally {
      setUploading(false)
    }
  }

  const signOut = async () => {
    await logout()
    navigate('/partner/login', { replace: true })
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#F5F8FC] text-sm text-slate-500">Loading partner portal…</div>
  }

  if (!partner) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F5F8FC] p-6">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
          <p className="font-bold text-rose-700">{error || 'Partner account not found.'}</p>
          <button type="button" onClick={signOut} className="mt-4 text-sm font-semibold text-[#2F80ED]">Back to login</button>
        </div>
      </div>
    )
  }

  const status = STATUS[partner.status] || STATUS.pending
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/company_logo.png" alt="ABL Travels" className="size-11 rounded-lg object-contain" />
            <div>
              <p className="text-sm font-extrabold text-slate-900">ABL Travels</p>
              <p className="text-[11px] text-slate-500">B2B Partner Portal</p>
            </div>
          </div>
          <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-8">
        <div className={`flex items-start gap-3 rounded-2xl border p-4 ${TONE[status.tone]}`}>
          <StatusIcon className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-bold">{status.label}</p>
            <p className="mt-0.5 text-sm opacity-80">
              {partner.company} · Application ID {partner.id}
              {partner.approvedAt ? ` · Approved ${formatDate(partner.approvedAt)}` : ''}
            </p>
          </div>
        </div>

        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Company profile</h2>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ['Company', partner.company],
                ['Contact person', partner.name],
                ['Email', partner.email],
                ['Phone', partner.phone || '—'],
                ['Country', partner.country || '—'],
                ['Address', partner.address || '—'],
                ['Partner tier', partner.tier || 'bronze'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-semibold text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Verification documents</h2>
                <p className="text-sm text-slate-500">Trade License, Business Card or business proof.</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#2F80ED] px-3 py-2 text-xs font-bold text-white hover:bg-[#1d6fd0]">
                <Upload className="size-3.5" /> {uploading ? 'Uploading…' : 'Upload'}
                <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploading} onChange={(e) => upload(e.target.files?.[0])} />
              </label>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {documents.length ? documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-800">
                      <FileText className="size-4 shrink-0 text-[#2F80ED]" /> {document.name}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(document.uploadedAt)} · {document.type.replace('_', ' ')}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${DOC_STATUS[document.status] || 'bg-slate-100 text-slate-600'}`}>
                    {document.status}
                  </span>
                </div>
              )) : (
                <p className="py-8 text-center text-sm text-slate-400">No documents uploaded.</p>
              )}
            </div>
          </section>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          Your account is <strong>{partner.status === 'approved' && partner.isActive ? 'active' : 'not active yet'}</strong>. Only approved partners can use B2B pricing, bookings and the partner portal.
        </div>
      </main>
    </div>
  )
}
