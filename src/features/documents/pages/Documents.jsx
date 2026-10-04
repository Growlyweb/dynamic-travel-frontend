import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import TableActions from '../../../components/tables/TableActions'
import Select from '../../../components/common/Select'
import DocumentStatusBadge from '../components/DocumentStatusBadge'
import { documentsApi } from '../documents.api'
import { usePagination } from '../../../hooks/usePagination'
import { APP_ROUTES, DOCUMENT_STATUSES } from '../../../utils/constants'
import { formatDate } from '../../../utils/formatters'

export default function Documents() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await documentsApi.list({ page, pageSize, status: status || undefined })
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, status])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    goToPage(1)
  }, [status, goToPage])

  return (
    <div className="stack">
      <PageHeader
        title="Documents"
        description="Identity and travel documents uploaded by customers."
        breadcrumbs={[{ label: 'Documents' }]}
      />
      <div className="card stack">
        <Select
          label="Status"
          placeholder="All statuses"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          options={DOCUMENT_STATUSES.map((value) => ({ value, label: value }))}
        />
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No documents found"
          columns={[
            { key: 'name', header: 'File', render: (row) => <span className="strong">{row.name}</span> },
            { key: 'owner', header: 'Owner' },
            { key: 'type', header: 'Type' },
            { key: 'size', header: 'Size' },
            { key: 'uploadedAt', header: 'Uploaded', render: (row) => formatDate(row.uploadedAt) },
            { key: 'status', header: 'Status', render: (row) => <DocumentStatusBadge status={row.status} /> },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <TableActions
                  actions={[{ label: 'View', onClick: () => navigate(APP_ROUTES.DOCUMENT_DETAILS(row.id)) }]}
                />
              ),
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
