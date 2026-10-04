import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ErrorState from '../../../components/common/ErrorState'
import VisaStatusBadge from './VisaStatusBadge'
import { formatDate } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function VisaTable({ rows, loading, error, onRetry, onView }) {
  if (error) {
    return <ErrorState title="Could not load applications" message={getApiErrorMessage(error)} onRetry={onRetry} />
  }

  return (
    <DataTable
      loading={loading}
      data={rows}
      emptyTitle="No applications found"
      emptyDescription="Try adjusting the filters or search terms."
      columns={[
        { key: 'reference', header: 'Reference' },
        {
          key: 'applicant',
          header: 'Applicant',
          render: (row) => (
            <div>
              <p className="strong">{row.applicant}</p>
              <p className="muted small">{row.type}</p>
            </div>
          ),
        },
        { key: 'country', header: 'Country' },
        { key: 'submittedAt', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
        { key: 'assignee', header: 'Assignee' },
        { key: 'status', header: 'Status', render: (row) => <VisaStatusBadge status={row.status} /> },
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
