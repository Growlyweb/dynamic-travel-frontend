import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import TablePagination from '../../../components/tables/TablePagination'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import UserFilters from '../components/UserFilters'
import UserTable from '../components/UserTable'
import { usersApi } from '../users.api'
import { useDebounce } from '../../../hooks/useDebounce'
import { usePagination } from '../../../hooks/usePagination'
import { APP_ROUTES } from '../../../utils/constants'

export default function Users() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ search: '', status: '', role: '' })
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const search = useDebounce(filters.search, 350)
  const { page, pageSize, goToPage, changePageSize } = usePagination()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await usersApi.list({
        page,
        pageSize,
        search,
        status: filters.status || undefined,
        role: filters.role || undefined,
      })
      setRows(result.items ?? [])
      setTotal(result.total ?? 0)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search, filters.status, filters.role])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    goToPage(1)
  }, [search, filters.status, filters.role, goToPage])

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)
    try {
      await usersApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch (deleteError) {
      setError(deleteError)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader title="Users" description="Manage back-office users and their access." breadcrumbs={[{ label: 'Users' }]} />

      <div className="card">
        <div className="stack">
          <UserFilters value={filters} onChange={setFilters} />
          <UserTable
            rows={rows}
            loading={loading}
            error={error}
            onRetry={load}
            onView={(user) => navigate(APP_ROUTES.USER_DETAILS(user.id))}
            onDelete={(user) => setDeleteTarget(user)}
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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        message={`Remove ${deleteTarget?.name ?? 'this user'}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
