import { Link } from 'react-router-dom'
import DataTable from '../../../components/tables/DataTable'
import Badge from '../../../components/common/Badge'
import { formatDate, titleCase } from '../../../utils/formatters'
import { APP_ROUTES } from '../../../utils/constants'

const STATUS_TONES = {
  submitted: 'info',
  in_review: 'warning',
  action_required: 'danger',
  approved: 'success',
  rejected: 'neutral',
}

export default function RecentApplications({ items = [] }) {
  return (
    <div className="card">
      <div className="row between mb-3">
        <p className="card__title" style={{ marginBottom: 0 }}>
          Recent visa applications
        </p>
        <Link to={APP_ROUTES.VISA_APPLICATIONS}>View all</Link>
      </div>
      <DataTable
        columns={[
          { key: 'reference', header: 'Ref' },
          { key: 'applicant', header: 'Applicant' },
          { key: 'country', header: 'Country' },
          { key: 'submittedAt', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
          {
            key: 'status',
            header: 'Status',
            render: (row) => <Badge tone={STATUS_TONES[row.status] ?? 'neutral'}>{titleCase(row.status)}</Badge>,
          },
        ]}
        data={items}
        emptyTitle="No applications yet"
      />
    </div>
  )
}
