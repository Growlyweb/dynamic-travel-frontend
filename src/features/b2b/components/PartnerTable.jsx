import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ErrorState from '../../../components/common/ErrorState'
import PartnerStatusBadge from './PartnerStatusBadge'
import { formatDate, formatCurrency, titleCase } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function PartnerTable({ rows, loading, error, onRetry, onView }) {
  if (error) {
    return <ErrorState title="Could not load partners" message={getApiErrorMessage(error)} onRetry={onRetry} />
  }

  return (
    <DataTable
      loading={loading}
      data={rows}
      emptyTitle="No partners yet"
      columns={[
        {
          key: 'name',
          header: 'Partner',
          render: (row) => (
            <div>
              <p className="strong">{row.name}</p>
              <p className="muted small">{row.company}</p>
            </div>
          ),
        },
        { key: 'country', header: 'Country' },
        { key: 'tier', header: 'Tier', render: (row) => titleCase(row.tier) },
        { key: 'commissionDue', header: 'Commission due', render: (row) => formatCurrency(row.commissionDue) },
        { key: 'joinedAt', header: 'Joined', render: (row) => formatDate(row.joinedAt) },
        { key: 'status', header: 'Status', render: (row) => <PartnerStatusBadge status={row.status} /> },
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
