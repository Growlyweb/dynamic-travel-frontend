import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ErrorState from '../../../components/common/ErrorState'
import Badge from '../../../components/common/Badge'
import { formatDate, formatCurrency, initials } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function CustomerTable({ rows, memberIds, loading, error, onRetry, onView }) {
  if (error) {
    return <ErrorState title="Could not load customers" message={getApiErrorMessage(error)} onRetry={onRetry} />
  }

  return (
    <DataTable
      loading={loading}
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
                <p className="muted small">{row.email}</p>
              </div>
            </div>
          ),
        },
        { key: 'country', header: 'Country' },
        { key: 'bookings', header: 'Bookings' },
        { key: 'totalSpend', header: 'Total spend', render: (row) => formatCurrency(row.totalSpend) },
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
