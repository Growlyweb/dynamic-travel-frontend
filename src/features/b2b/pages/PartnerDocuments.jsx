import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import Badge from '../../../components/common/Badge'
import { b2bApi } from '../b2b.api'
import { usePagination } from '../../../hooks/usePagination'
import { formatDate } from '../../../utils/formatters'

const STATUS_TONES = { verified: 'success', pending: 'warning', rejected: 'danger' }

export default function PartnerDocuments() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await b2bApi.listDocuments({ page, pageSize })
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
        title="Partner documents"
        description="Licenses, certificates and policies uploaded by partners."
        breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Documents' }]}
      />
      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No documents uploaded"
          columns={[
            { key: 'name', header: 'Document', render: (row) => <span className="strong">{row.name}</span> },
            { key: 'partner', header: 'Partner' },
            { key: 'uploadedAt', header: 'Uploaded', render: (row) => formatDate(row.uploadedAt) },
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
