import DataTable from '../../../components/tables/DataTable'
import TableActions from '../../../components/tables/TableActions'
import ErrorState from '../../../components/common/ErrorState'
import PartnerStatusBadge from './PartnerStatusBadge'
import { formatDate } from '../../../utils/formatters'
import { errorMessage } from '../../../utils/errors'

export default function PartnerTable({ rows, loading, refreshing, error, onRetry, onView }) {
  if (error) {
    return <ErrorState title="Could not load partners" message={errorMessage(error)} onRetry={onRetry} />
  }

  return (
    <DataTable
      loading={loading}
      refreshing={refreshing}
      data={rows}
      emptyTitle="No partners found"
      columns={[
        {
          key: 'name',
          header: 'Partner',
          render: (row) => (
            <div>
              <p className="strong">{row.company}</p>
              <p className="muted small">{row.name}</p>
            </div>
          ),
        },
        { key: 'licenseNo', header: 'License no.' },
        { key: 'contact', header: 'Contact', render: (row) => <span className="small">{row.email || row.phone || '—'}</span> },
        { key: 'documents', header: 'Documents', render: (row) => `${row.verifiedDocumentCount}/${row.documentCount} verified` },
        { key: 'joinedAt', header: 'Joined', render: (row) => formatDate(row.joinedAt) },
        { key: 'status', header: 'Status', render: (row) => <PartnerStatusBadge status={row.status} /> },
        {
          key: 'actions',
          header: '',
          align: 'right',
          render: (row) => (onView ? <TableActions actions={[{ label: 'View', onClick: () => onView(row) }]} /> : null),
        },
      ]}
    />
  )
}
