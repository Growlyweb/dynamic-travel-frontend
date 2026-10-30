import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermission } from '../../../hooks/usePermission'
import PageHeader from '../../../components/layout/PageHeader'
import TablePagination from '../../../components/tables/TablePagination'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import PartnerTable from '../components/PartnerTable'
import { b2bApi } from '../b2b.api'
import { useServerTable } from '../../../hooks/useServerTable'
import { APP_ROUTES, PARTNER_STATUSES } from '../../../utils/constants'

const label = (value) => value.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())

// Partners register on the website. They are not created here: staff review them and decide.
export default function Partners() {
  const navigate = useNavigate()
  const { isAdmin } = usePermission()
  const [status, setStatus] = useState('')
  const table = useServerTable({ table: 'b2b-partners', fetcher: b2bApi.listPartners, filters: { status } })

  return (
    <div className="stack">
      <PageHeader title="Partners" breadcrumbs={[{ label: 'Partners · B2B' }, { label: 'Partners' }]} />
      <div className="card stack">
        <div className="filters">
          <Input label="Search" type="search" placeholder="Company or license number…" value={table.search} onChange={(event) => table.setSearch(event.target.value)} />
          <Select label="Status" placeholder="All statuses" value={status} onChange={(event) => setStatus(event.target.value)} options={PARTNER_STATUSES.map((value) => ({ value, label: label(value) }))} />
        </div>
        <PartnerTable rows={table.rows} loading={table.loading} refreshing={table.refreshing} error={table.error} onRetry={table.reload} onView={isAdmin ? (row) => navigate(APP_ROUTES.B2B_PARTNER_DETAILS(row.id)) : undefined} />
        <TablePagination {...table.paginationProps} />
      </div>
    </div>
  )
}
