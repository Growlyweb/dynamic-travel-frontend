import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import TablePagination from '../../../components/tables/TablePagination'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import Button from '../../../components/common/Button'
import UserFilters from '../components/UserFilters'
import UserTable from '../components/UserTable'
import CreateStaffModal from '../components/CreateStaffModal'
import { usersApi } from '../users.api'
import { useServerTable } from '../../../hooks/useServerTable'
import { useToast } from '../../../context/ToastContext'
import { APP_ROUTES } from '../../../utils/constants'
import { errorMessage } from '../../../utils/errors'

export default function Users() {
  const navigate = useNavigate()
  const toast = useToast()
  const [filters, setFilters] = useState({ search: '', status: '', role: '' })
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const table = useServerTable({
    table: 'users',
    fetcher: usersApi.list,
    filters: { status: filters.status, role: filters.role },
  })
  const { setSearch } = table

  function changeFilters(next) {
    setFilters(next)
    setSearch(next.search)
  }

  async function handleDeactivate() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await usersApi.remove(deleteTarget.id)
      toast.success(`${deleteTarget.name} was deactivated.`)
      table.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setDeleteTarget(null)
      setDeleting(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Users"
        description="The people who work here and the accounts of partners and customers."
        breadcrumbs={[{ label: 'Users' }]}
        actions={<Button onClick={() => setCreating(true)}>New staff member</Button>}
      />

      <div className="card">
        <div className="stack">
          <UserFilters value={filters} onChange={changeFilters} />
          <UserTable
            rows={table.rows}
            loading={table.loading}
            refreshing={table.refreshing}
            error={table.error}
            onRetry={table.reload}
            onView={(user) => navigate(APP_ROUTES.USER_DETAILS(user.id))}
            onDelete={(user) => setDeleteTarget(user)}
          />
          <TablePagination {...table.paginationProps} />
        </div>
      </div>

      <CreateStaffModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={({ user, inviteSent }) => {
          setCreating(false)
          toast[inviteSent ? 'success' : 'info'](inviteSent ? `Invitation sent to ${user.email}.` : `${user.name} was created. The invitation email could not be sent: use Resend invitation.`)
          table.reload()
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Deactivate account"
        message={`${deleteTarget?.name ?? 'This person'} will lose access at once. The record and its history stay.`}
        confirmLabel="Deactivate"
        loading={deleting}
        onConfirm={handleDeactivate}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
