import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import Badge from '../../../components/common/Badge'
import CommissionSummary from '../components/CommissionSummary'
import { b2bApi } from '../b2b.api'
import { usePagination } from '../../../hooks/usePagination'
import { formatCurrency } from '../../../utils/formatters'

export default function Commissions() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await b2bApi.listCommissions({ page, pageSize })
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  const earned = rows.filter((row) => row.status === 'earned').reduce((sum, row) => sum + row.amount, 0)
  const paid = rows.filter((row) => row.status === 'paid').reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className="stack">
      <PageHeader
        title="Commissions"
        // description="Partner earnings per booking."
        breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Commissions' }]}
      />
      <CommissionSummary summary={{ totalEarned: earned + paid, outstanding: earned, paidOut: paid, averageRate: '6–8%' }} />
      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No commission entries"
          columns={[
            { key: 'partner', header: 'Partner', render: (row) => <span className="strong">{row.partner}</span> },
            { key: 'booking', header: 'Booking' },
            { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
            { key: 'rate', header: 'Rate' },
            { key: 'month', header: 'Period' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={row.status === 'paid' ? 'success' : 'warning'}>{row.status}</Badge>,
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
    </div>
  )
}
