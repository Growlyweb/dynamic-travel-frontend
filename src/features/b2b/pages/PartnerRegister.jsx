import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, FileText, Upload } from 'lucide-react'

import PartnerAuthShell from '../components/PartnerAuthShell'
import { b2bApi } from '../b2b.api'

const DOCUMENT_TYPES = [
  { key: 'trade_license', label: 'Trade License', hint: 'Required for company verification' },
  { key: 'business_card', label: 'Business Card', hint: 'Owner or authorized signatory' },
  { key: 'other', label: 'Other Document', hint: 'IATA, TIN, bank letter, etc.' },
]

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PartnerRegister() {
  const [form, setForm] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    country: 'Bangladesh',
    address: '',
    password: '',
    confirm: '',
  })
  const [documents, setDocuments] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(null)

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const addFiles = async (type, fileList) => {
    setError('')
    const files = [...fileList]
    for (const file of files) {
      if (file.size > 900 * 1024) {
        setError(`${file.name} is too large. Please upload a file under 900 KB.`)
        continue
      }
      const dataUrl = await readFile(file)
      setDocuments((current) => [
        ...current,
        {
          id: `${Date.now()}_${file.name}`,
          name: file.name,
          fileName: file.name,
          type,
          size: file.size,
          dataUrl,
        },
      ])
    }
  }

  const removeDocument = (id) => setDocuments((current) => current.filter((document) => document.id !== id))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }
    try {
      setSaving(true)
      const partner = await b2bApi.registerPartner({
        ...form,
        documents,
      })
      setSubmitted(partner)
    } catch (err) {
      setError(err?.message || 'Could not submit your application.')
    } finally {
      setSaving(false)
    }
  }

  if (submitted) {
    return (
      <PartnerAuthShell title="Application submitted" subtitle="Your account is not active yet.">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" />
          <h3 className="mt-3 text-lg font-bold text-emerald-900">{submitted.company}</h3>
          <p className="mt-1 text-sm text-emerald-800">
            Application received. Our admin team will verify your documents, then approve your partner account.
          </p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Application ID: {submitted.id}
          </p>
        </div>
        <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          You will be able to log in after the account status becomes <strong>Approved / Active</strong>.
        </div>
        <Link
          to="/partner/login"
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2F80ED] text-sm font-bold text-white hover:bg-[#1d6fd0]"
        >
          Back to partner login
        </Link>
      </PartnerAuthShell>
    )
  }

  return (
    <PartnerAuthShell
      title="Become a B2B partner"
      subtitle="Register your agency, upload documents and wait for admin verification."
      wide
    >
      <form onSubmit={submit} className="space-y-6">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </div>
        ) : null}

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Company information</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Agency / Company name *
              <input required value={form.company} onChange={(e) => update('company', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Contact person *
              <input required value={form.name} onChange={(e) => update('name', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Email address *
              <input required type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Phone number *
              <input required value={form.phone} onChange={(e) => update('phone', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Country *
              <input required value={form.country} onChange={(e) => update('country', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Business address
              <input value={form.address} onChange={(e) => update('address', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
            </label>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Upload documents</h3>
          <p className="mt-1 text-xs text-slate-500">Trade License, Business Card or other business proof. At least one document is required.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {DOCUMENT_TYPES.map((type) => (
              <label key={type.key} className="cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-center hover:border-[#2F80ED] hover:bg-blue-50/50">
                <Upload className="mx-auto size-5 text-[#2F80ED]" />
                <p className="mt-1 text-xs font-bold text-slate-700">{type.label}</p>
                <p className="text-[10px] text-slate-400">{type.hint}</p>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(event) => {
                    addFiles(type.key, event.target.files)
                    event.target.value = ''
                  }}
                />
              </label>
            ))}
          </div>

          {documents.length ? (
            <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {documents.map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <FileText className="size-4 shrink-0 text-[#2F80ED]" />
                    <span className="truncate font-medium text-slate-700">{document.fileName}</span>
                  </span>
                  <button type="button" onClick={() => removeDocument(document.id)} className="text-xs font-semibold text-rose-600 hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Portal login</h3>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Password *
              <input required type="password" minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Confirm password *
              <input required type="password" minLength={6} value={form.confirm} onChange={(e) => update('confirm', e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#2F80ED]" />
            </label>
          </div>
        </section>

        <button type="submit" disabled={saving} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2F80ED] text-sm font-bold text-white hover:bg-[#1d6fd0] disabled:opacity-60">
          {saving ? 'Submitting application…' : 'Submit partner application'}
        </button>

        <p className="text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/partner/login" className="font-bold text-[#2F80ED] hover:underline">Sign in</Link>
        </p>
      </form>
    </PartnerAuthShell>
  )
}
