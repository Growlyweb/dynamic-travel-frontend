import { useCallback, useEffect, useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Badge from '../../../components/common/Badge'
import PartnerDocumentsModal from '../components/PartnerDocumentsModal'
import { b2bApi } from '../b2b.api'
import { formatDate } from '../../../utils/formatters'
import { CheckCircle2, ArrowRight } from 'lucide-react'

const TONES = {
  pending: 'warning',
  documents_verified: 'info',
  approved: 'success',
  rejected: 'danger',
}

export default function PartnerApplications() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'pending' | 'approved' | 'rejected'
  const [rows, setRows] = useState([])
  const [allRows, setAllRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)
  const [reviewPartner, setReviewPartner] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [approvedNotice, setApprovedNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const allRes = await b2bApi.listApplications({ status: 'all' })
      const items = allRes.items ?? []
      setAllRows(items)
      setRows(items)
      // If review modal is active, sync its partner reference with latest row data
      setReviewPartner((prev) => {
        if (!prev) return null
        return items.find((item) => item.id === prev.id) || prev
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Counts for tab badges
  const counts = useMemo(() => {
    const pendingCount = allRows.filter((r) => ['pending', 'documents_verified', 'under_review'].includes(r.status)).length
    const approvedCount = allRows.filter((r) => r.status === 'approved').length
    const rejectedCount = allRows.filter((r) => r.status === 'rejected').length
    const allCount = allRows.length
    return { pending: pendingCount, approved: approvedCount, rejected: rejectedCount, all: allCount }
  }, [allRows])

  // Client-side filtering guarantee matching current active tab
  const displayedRows = useMemo(() => {
    if (activeTab === 'all') return allRows
    if (activeTab === 'pending') {
      return allRows.filter((r) => ['pending', 'documents_verified', 'under_review'].includes(r.status))
    }
    if (activeTab === 'approved') {
      return allRows.filter((r) => r.status === 'approved')
    }
    if (activeTab === 'rejected') {
      return allRows.filter((r) => r.status === 'rejected')
    }
    return allRows
  }, [allRows, activeTab])

  async function handleDecision() {
    if (!pending) return
    setSaving(true)
    setError('')
    try {
      const partnerObj = rows.find((r) => r.id === pending.id)
      await b2bApi.setApplicationStatus(pending.id, pending.action)
      if (pending.action === 'approved') {
        setApprovedNotice({
          id: pending.id,
          name: partnerObj?.company || 'Partner',
        })
      }
      setPending(null)
      await load()
    } catch (err) {
      setError(err?.message || 'Could not update this application.')
      setPending(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Partner applications"
        description="Verify trade licenses and business documents, then approve the partner portal."
        breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Applications' }]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/b2b/partners"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#2F80ED] transition inline-flex items-center gap-1.5"
            >
              Go to Partners Directory <ArrowRight className="size-3.5" />
            </Link>
            <button
              type="button"
              onClick={async () => {
                await b2bApi.resetToSeedData()
                setApprovedNotice(null)
                await load()
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition"
            >
              Reset demo data
            </button>
          </div>
        }
      />

      {approvedNotice ? (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                {approvedNotice.name} has been approved and activated!
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                The partner account is now active and listed in the Partners Directory.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/b2b/partners/${approvedNotice.id}`)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition inline-flex items-center gap-1 cursor-pointer"
            >
              View Partner Profile <ArrowRight className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => setApprovedNotice(null)}
              className="text-xs font-medium px-2 py-1 text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {/* Status Filter Tabs - All Applications at first per requirement */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>All Applications</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'all'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {counts.all}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>Pending Review</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'pending'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {counts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>Approved Partners</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'approved'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {counts.approved}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <span>Rejected</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[11px] font-bold ${
              activeTab === 'rejected'
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {counts.rejected}
          </span>
        </button>
      </div>

      <div className="card">
        <DataTable
          loading={loading}
          data={displayedRows}
          emptyTitle={
            activeTab === 'approved'
              ? 'No approved partners yet'
              : activeTab === 'pending'
              ? 'No pending applications'
              : activeTab === 'rejected'
              ? 'No rejected applications'
              : 'No applications found'
          }
          columns={[
            { key: 'company', header: 'Company', render: (row) => <span className="strong">{row.company}</span> },
            { key: 'contact', header: 'Contact' },
            { key: 'email', header: 'Email' },
            { key: 'country', header: 'Country' },
            { key: 'submittedAt', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
            {
              key: 'documents',
              header: 'Documents',
              render: (row) => (
                <button
                  type="button"
                  onClick={() => setReviewPartner(row)}
                  className="text-sm font-semibold text-[#2F80ED] hover:underline cursor-pointer"
                >
                  {row.verifiedDocuments}/{row.documents} verified
                </button>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={TONES[row.status] ?? 'neutral'}>{row.status.replace('_', ' ')}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) =>
                ['pending', 'documents_verified'].includes(row.status) ? (
                  <TableActions
                    actions={[
                      {
                        label: row.status === 'documents_verified' ? 'Approve' : 'Review documents',
                        onClick: () =>
                          row.status === 'documents_verified'
                            ? setPending({ id: row.id, action: 'approved' })
                            : setReviewPartner(row),
                      },
                      { label: 'Reject', tone: 'danger', onClick: () => setPending({ id: row.id, action: 'rejected' }) },
                    ]}
                  />
                ) : row.status === 'approved' ? (
                  <button
                    type="button"
                    onClick={() => navigate(`/b2b/partners/${row.id}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    View Partner <ArrowRight className="size-3" />
                  </button>
                ) : null,
            },
          ]}
        />
      </div>

      <PartnerDocumentsModal
        open={Boolean(reviewPartner)}
        partner={reviewPartner}
        onClose={() => setReviewPartner(null)}
        onPartnerUpdated={async () => {
          await load()
          const updated = (await b2bApi.listApplications({ status: 'all' })).items?.find(
            (p) => p.id === reviewPartner?.id
          )
          if (updated?.status === 'approved') {
            setApprovedNotice({ id: updated.id, name: updated.company })
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.action === 'approved' ? 'Approve partner account' : 'Reject application'}
        message={
          pending?.action === 'approved'
            ? 'This will activate the partner portal. All documents must already be verified.'
            : 'Reject this application? The partner will not be able to log in.'
        }
        confirmLabel={pending?.action === 'approved' ? 'Activate account' : 'Reject'}
        tone={pending?.action === 'approved' ? 'primary' : 'danger'}
        loading={saving}
        onConfirm={handleDecision}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
