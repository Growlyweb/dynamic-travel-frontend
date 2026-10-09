import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import Button from '../../../components/common/Button'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Badge from '../../../components/common/Badge'
import { b2bApi } from '../b2b.api'
import { formatDate } from '../../../utils/formatters'

export default function PartnerApplications() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null) // { id, action }
  const [saving, setSaving] = useState(false)

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
    try {
      await b2bApi.setApplicationStatus(pending.id, pending.action)
      setPending(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Partner applications"
        // description="Agencies that applied to join your partner program."
        breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Applications' }]}
      />
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
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={row.status === 'pending' ? 'warning' : 'neutral'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) =>
                row.status === 'pending' ? (
                  <TableActions
                    actions={[
                      { label: 'Approve', onClick: () => setPending({ id: row.id, action: 'approved' }) },
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
        title={pending?.action === 'approved' ? 'Approve partner' : 'Reject application'}
        message={pending?.action === 'approved' ? 'Grant this agency partner access?' : 'Reject this application?'}
        confirmLabel={pending?.action === 'approved' ? 'Approve' : 'Reject'}
        tone={pending?.action === 'approved' ? 'primary' : 'danger'}
        loading={saving}
        onConfirm={handleDecision}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
