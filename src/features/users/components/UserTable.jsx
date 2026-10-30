import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ErrorState from '../../../components/common/ErrorState'
import Badge from '../../../components/common/Badge'
import UserStatusBadge from './UserStatusBadge'
import { formatDate, initials } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'
import { ACCOUNT_TYPES } from '../users.api'

const typeLabel = (role) => ACCOUNT_TYPES.find((type) => type.value === role)?.label ?? role

export default function UserTable({ rows, loading, refreshing, error, onRetry, onView, onDelete }) {
  if (error) {
    return <ErrorState title="Could not load users" message={getApiErrorMessage(error)} onRetry={onRetry} />
  }

  return (
    <DataTable
      loading={loading}
      refreshing={refreshing}
      data={rows}
      emptyTitle="No users found"
      emptyDescription="Try adjusting the filters, or add a new team member."
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
        { key: 'email', header: 'Email', render: (row) => row.email ?? row.phone ?? '—' },
        { key: 'role', header: 'Type', render: (row) => typeLabel(row.role) },
        {
          key: 'roles',
          header: 'Roles',
          render: (row) =>
            row.role === 'STAFF' ? (
              row.roles.length ? (
                <div className="row" style={{ flexWrap: 'wrap', gap: 4 }}>
                  {row.roles.map((role) => (
                    <Badge key={role.id ?? role._id} tone={role.system ? 'neutral' : 'info'}>
                      {role.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="muted">Old permission list</span>
              )
            ) : row.role === 'ADMIN' ? (
              <span className="muted">Everything</span>
            ) : (
              '—'
            ),
        },
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
                ...(row.role === 'ADMIN' || row.role === 'STAFF' ? [{ label: 'Deactivate', tone: 'danger', onClick: () => onDelete?.(row) }] : []),
              ]}
            />
          ),
        },
      ]}
    />
  )
}
