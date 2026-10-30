import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import TablePagination from '../../../components/tables/TablePagination'
import Input from '../../../components/common/Input'
import CustomerTable from '../components/CustomerTable'
import { b2cApi } from '../b2c.api'
import { activeMembershipMap } from '../../membership/membership.api'
import { useServerTable } from '../../../hooks/useServerTable'
import { APP_ROUTES } from '../../../utils/constants'

export default function Customers() {
  const navigate = useNavigate()
  const [memberIds, setMemberIds] = useState(() => new Set())
  const table = useServerTable({ table: 'customers', fetcher: b2cApi.list })

  // Who has an active membership, for the badge. A person who may not read memberships just sees no badge.
  useEffect(() => {
    activeMembershipMap().then(setMemberIds).catch(() => {})
  }, [])

  return (
    <div className="stack">
      <PageHeader title="Customers" breadcrumbs={[{ label: 'Customers · B2C' }, { label: 'Customers' }]} />
      <div className="card stack">
        <Input label="Search" type="search" placeholder="Name, email or phone…" value={table.search} onChange={(event) => table.setSearch(event.target.value)} />
        <CustomerTable
          rows={table.rows}
          memberIds={memberIds}
          loading={table.loading}
          refreshing={table.refreshing}
          error={table.error}
          onRetry={table.reload}
          onView={(row) => navigate(APP_ROUTES.B2C_CUSTOMER_DETAILS(row.id))}
        />
        <TablePagination {...table.paginationProps} />
      </div>
    </div>
  )
}
