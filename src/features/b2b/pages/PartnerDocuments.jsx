import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import TableActions from '../../../components/tables/TableActions'
import Badge from '../../../components/common/Badge'
import { b2bApi } from '../b2b.api'
import { usePagination } from '../../../hooks/usePagination'
import { formatDate } from '../../../utils/formatters'

const STATUS_TONES = { verified: 'success', pending: 'warning', rejected: 'danger' }

export default function PartnerDocuments() {
  const [searchParams] = useSearchParams()
  const partnerId = searchParams.get('partnerId') || ''
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await b2bApi.listDocuments({ page, pageSize, partnerId: partnerId || undefined })
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } catch (err) {
      setError(err?.message || 'Could not load documents.')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, partnerId])

  useEffect(() => {
    load()
  }, [load])

  const verify = async (id) => {
    try {
      await b2bApi.verifyDocument(id)
      await load()
    } catch (err) {
      setError(err?.message || 'Could not verify the document.')
    }
  }

  const reject = async (id) => {
    try {
      await b2bApi.rejectDocument(id)
      await load()
    } catch (err) {
      setError(err?.message || 'Could not reject the document.')
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Partner documents"
        description="Verify Trade License, Business Card and other business documents before activating a partner."
        breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Documents' }]}
      />

      {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      {partnerId ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Showing documents for one partner application. Verify every uploaded document to unlock approval.
        </div>
      ) : null}

      <div className="card">
        <DataTable
          loading={loading}
          data={rows}
          emptyTitle="No documents uploaded"
          columns={[
            {
              key: 'name',
              header: 'Document',
              render: (row) => (
                <div>
                  <p className="strong">{row.name}</p>
                  <p className="text-xs capitalize text-slate-400">{row.type.replace('_', ' ')}</p>
                </div>
              ),
            },
            { key: 'partner', header: 'Partner' },
            { key: 'uploadedAt', header: 'Uploaded', render: (row) => formatDate(row.uploadedAt) },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <Badge tone={STATUS_TONES[row.status] ?? 'neutral'}>{row.status}</Badge>,
            },
            {
              key: 'actions',
              header: '',
              align: 'right',
              render: (row) => (
                <div className="flex items-center justify-end gap-2">
                  {row.dataUrl ? (
                    <button
                      type="button"
                      onClick={() => window.open(row.dataUrl, '_blank', 'noopener,noreferrer')}
                      className="text-xs font-semibold text-[#2F80ED] hover:underline"
                    >
                      View
                    </button>
                  ) : null}
                  <TableActions
                    actions={[
                      ...(row.status !== 'verified' ? [{ label: 'Verify', onClick: () => verify(row.id) }] : []),
                      ...(row.status !== 'rejected' ? [{ label: 'Reject', tone: 'danger', onClick: () => reject(row.id) }] : []),
                    ]}
                  />
                </div>
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
