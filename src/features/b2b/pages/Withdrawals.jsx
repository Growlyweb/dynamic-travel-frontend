import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import TableActions from '../../../components/tables/TableActions'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Badge from '../../../components/common/Badge'
import { b2bApi } from '../b2b.api'
import { usePagination } from '../../../hooks/usePagination'
import { formatDate, formatCurrency } from '../../../utils/formatters'

const STATUS_TONES = { pending: 'warning', approved: 'info', paid: 'success', rejected: 'danger' }

export default function Withdrawals() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(null) // { id, action }
  const [saving, setSaving] = useState(false)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await b2bApi.listWithdrawals({ page, pageSize })
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  async function handleDecision() {
    if (!pending) return
    setSaving(true)
    try {
      await b2bApi.setWithdrawalStatus(pending.id, pending.action)
      setPending(null)
      await load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Withdrawal requests"
        description="Partner payout requests and their status."
        breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Withdrawals' }]}
      />
      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No withdrawal requests"
          columns={[
            { key: 'partner', header: 'Partner', render: (row) => <span className="strong">{row.partner}</span> },
            { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
            { key: 'method', header: 'Method' },
            { key: 'requestedAt', header: 'Requested', render: (row) => formatDate(row.requestedAt) },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={STATUS_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>,
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
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.action === 'approved' ? 'Approve withdrawal' : 'Reject withdrawal'}
        message="Update the status of this withdrawal request?"
        confirmLabel={pending?.action === 'approved' ? 'Approve' : 'Reject'}
        tone={pending?.action === 'approved' ? 'primary' : 'danger'}
        loading={saving}
        onConfirm={handleDecision}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
