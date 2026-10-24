import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Badge from '../../../components/common/Badge'
import { b2bApi } from '../b2b.api'
import { formatDate } from '../../../utils/formatters'

const TONES = {
  pending: 'warning',
  documents_verified: 'info',
  rejected: 'danger',
}

export default function PartnerApplications() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await b2bApi.listApplications()
      setRows(result.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDecision() {
    if (!pending) return
    setSaving(true)
    setError('')
    try {
      await b2bApi.setApplicationStatus(pending.id, pending.action)
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
      />

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No pending applications"
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
                  onClick={() => navigate(`/b2b/documents?partnerId=${row.id}`)}
                  className="text-sm font-semibold text-[#2F80ED] hover:underline"
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
                            : navigate(`/b2b/documents?partnerId=${row.id}`),
                      },
                      { label: 'Reject', tone: 'danger', onClick: () => setPending({ id: row.id, action: 'rejected' }) },
                    ]}
                  />
                ) : null,
            },
          ]}
        />
      </div>

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
