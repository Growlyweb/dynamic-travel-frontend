import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import Badge from '../../../components/common/Badge'
import { toursApi } from '../tours.api'
import { usePagination } from '../../../hooks/usePagination'
import { formatDate, formatCurrency } from '../../../utils/formatters'

const STATUS_TONES = { pending: 'warning', quoted: 'info', booked: 'success', closed: 'neutral' }

export default function CustomTours() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await toursApi.listCustom({ page, pageSize })
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="stack">
      <PageHeader
        title="Custom tour requests"
        description="Itineraries requested by customers that need a quote."
        breadcrumbs={[{ label: 'Tours' }, { label: 'Custom tours' }]}
      />
      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No custom requests"
          emptyDescription="Custom itinerary requests will appear here."
          columns={[
            { key: 'name', header: 'Request', render: (row) => <span className="strong">{row.name}</span> },
            { key: 'customer', header: 'Customer' },
            { key: 'travelers', header: 'Travelers' },
            { key: 'budget', header: 'Budget', render: (row) => formatCurrency(row.budget) },
            { key: 'requestedAt', header: 'Requested', render: (row) => formatDate(row.requestedAt) },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={STATUS_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>,
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
