import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ErrorState from '../../../components/common/ErrorState'
import Badge from '../../../components/common/Badge'
import { formatDate, initials } from '../../../utils/formatters'
import { errorMessage } from '../../../utils/errors'

export default function CustomerTable({ rows, memberIds, loading, refreshing, error, onRetry, onView }) {
  if (error) {
    return <ErrorState title="Could not load customers" message={errorMessage(error)} onRetry={onRetry} />
  }

  return (
    <DataTable
      loading={loading}
      refreshing={refreshing}
      data={rows}
      emptyTitle="No customers yet"
      columns={[
        {
          key: 'name',
          header: 'Customer',
          render: (row) => (
            <div className="cell-user">
              <span className="avatar avatar--sm">{initials(row.name)}</span>
              <div>
                <p className="strong">
                  {row.name} {memberIds?.has?.(row.id) ? <Badge tone="primary">Member</Badge> : null}
                </p>
                <p className="muted small">{row.email || '—'}</p>
              </div>
            </div>
          ),
        },
        { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
        { key: 'status', header: 'Account', render: (row) => <Badge tone={row.status === 'ACTIVE' ? 'success' : 'neutral'}>{String(row.status).toLowerCase()}</Badge> },
        { key: 'joinedAt', header: 'Joined', render: (row) => formatDate(row.joinedAt) },
        {
          key: 'actions',
          header: '',
          align: 'right',
          render: (row) => <TableActions actions={[{ label: 'View', onClick: () => onView?.(row) }]} />,
        },
      ]}
    />
  )
}
