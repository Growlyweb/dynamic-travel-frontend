import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ErrorState from '../../../components/common/ErrorState'
import UserStatusBadge from './UserStatusBadge'
import { formatDate, initials, titleCase } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function UserTable({ rows, loading, error, onRetry, onView, onDelete }) {
  if (error) {
    return <ErrorState title="Could not load users" message={getApiErrorMessage(error)} onRetry={onRetry} />
  }

  return (
    <DataTable
      loading={loading}
      data={rows}
      emptyTitle="No users found"
      emptyDescription="Try adjusting the filters, or invite a new team member."
      columns={[
        {
          key: 'name',
          header: 'Name',
          render: (row) => (
            <div className="cell-user">
              <span className="avatar avatar--sm">{initials(row.name)}</span>
              <span className="strong">{row.name}</span>
            </div>
          ),
        },
        { key: 'email', header: 'Email' },
        { key: 'role', header: 'Role', render: (row) => titleCase(row.role) },
        { key: 'status', header: 'Status', render: (row) => <UserStatusBadge status={row.status} /> },
        { key: 'createdAt', header: 'Joined', render: (row) => formatDate(row.createdAt) },
        {
          key: 'actions',
          header: '',
          align: 'right',
          render: (row) => (
            <TableActions
              actions={[
                { label: 'View', onClick: () => onView?.(row) },
                { label: 'Delete', tone: 'danger', onClick: () => onDelete?.(row) },
              ]}
            />
          ),
        },
      ]}
    />
  )
}
