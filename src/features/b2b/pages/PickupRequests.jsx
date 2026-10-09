import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import Badge from '../../../components/common/Badge'
import { b2bApi } from '../b2b.api'
import { usePagination } from '../../../hooks/usePagination'
import { formatDateTime, titleCase } from '../../../utils/formatters'

const STATUS_TONES = { requested: 'warning', scheduled: 'info', completed: 'success', cancelled: 'neutral' }

export default function PickupRequests() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await b2bApi.listPickups({ page, pageSize })
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
        title="Pickup requests"
        // description="Airport and hotel pickups requested by partners."
        breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Pickup requests' }]}
      />
      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No pickup requests"
          columns={[
            { key: 'partner', header: 'Partner', render: (row) => <span className="strong">{row.partner}</span> },
            { key: 'location', header: 'Location' },
            { key: 'pickupAt', header: 'Pickup time', render: (row) => formatDateTime(row.pickupAt) },
            { key: 'travelers', header: 'Travelers' },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={STATUS_TONES[row.status] ?? 'neutral'}>{titleCase(row.status)}</Badge>,
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
