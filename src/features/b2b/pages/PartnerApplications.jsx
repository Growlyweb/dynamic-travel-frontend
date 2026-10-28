import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import TablePagination from '../../../components/tables/TablePagination'
import Select from '../../../components/common/Select'
import PartnerTable from '../components/PartnerTable'
import { b2bApi } from '../b2b.api'
import { useServerTable } from '../../../hooks/useServerTable'
import { usePermission } from '../../../hooks/usePermission'
import { APP_ROUTES } from '../../../utils/constants'

// Partners that have registered and wait for a decision.
export default function PartnerApplications() {
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [status, setStatus] = useState('pending')
  const table = useServerTable({ table: 'b2b-applications', fetcher: b2bApi.listPartners, filters: { status } })

  return (
    <div className="stack">
      <PageHeader title="Partner applications" description="Check the trade license and business documents, then approve the partner." breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Applications' }]} />
      <div className="card stack">
        <div className="filters">
          <Select label="Waiting for" value={status} onChange={(event) => setStatus(event.target.value)} options={[{ value: 'pending', label: 'A first look' }, { value: 'under_review', label: 'A decision (under review)' }]} />
        </div>
        <PartnerTable rows={table.rows} loading={table.loading} refreshing={table.refreshing} error={table.error} onRetry={table.reload} onView={isAdmin ? (row) => navigate(APP_ROUTES.B2B_PARTNER_DETAILS(row.id)) : undefined} />
        <TablePagination {...table.paginationProps} />
      </div>
    </div>
  )
}
