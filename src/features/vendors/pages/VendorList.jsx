import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import VendorFormModal from '../components/VendorFormModal'
import { vendorApi } from '../vendor.api'
import { useServerTable } from '../../../hooks/useServerTable'
import { usePermission } from '../../../hooks/usePermission'
import { useToast } from '../../../context/ToastContext'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatCurrency } from '../../../utils/formatters'

export default function VendorList({ openNew = false }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { can } = usePermission()
  const [active, setActive] = useState('')
  const [creating, setCreating] = useState(openNew)

  const table = useServerTable({ table: 'vendors', fetcher: vendorApi.listVendors, filters: { active } })
  const canManage = can(PERMISSIONS.VENDOR_MANAGE)

  async function toggle(vendor) {
    try {
      await vendorApi.setActive(vendor.id, !vendor.active)
      toast.success(vendor.active ? `${vendor.name} is switched off.` : `${vendor.name} is switched on.`)
      table.reload()
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Vendors"
        description="The suppliers we buy from, what they billed us and what we owe."
        breadcrumbs={[{ label: 'Vendors' }]}
        actions={canManage ? <Button onClick={() => setCreating(true)}>New vendor</Button> : null}
      />

      <div className="card stack">
        <div className="filters">
          <Input label="Search" type="search" placeholder="Name, code or phone…" value={table.search} onChange={(event) => table.setSearch(event.target.value)} />
          <Select label="Status" placeholder="All" value={active} onChange={(event) => setActive(event.target.value)} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Switched off' }]} />
        </div>

        {table.error ? (
          <ErrorState title="Could not load the vendors" message={errorMessage(table.error)} onRetry={table.reload} />
        ) : (
          <>
            <DataTable
              loading={table.loading}
              refreshing={table.refreshing}
              data={table.rows}
              emptyTitle="No vendors yet"
              emptyDescription="Add the suppliers you buy visas, tickets and hotels from."
              onRowClick={(row) => navigate(`/vendors/${row.id}`)}
              columns={[
                { key: 'name', header: 'Vendor', render: (row) => <span><span className="strong">{row.name}</span><br /><span className="muted small">{row.code} · {row.phone || row.email || '—'}</span></span> },
                { key: 'billed', header: 'Billed', align: 'right', render: (row) => formatCurrency(row.billed, 'BDT') },
                { key: 'paid', header: 'Paid', align: 'right', render: (row) => formatCurrency(row.paid, 'BDT') },
                { key: 'due', header: 'We owe', align: 'right', render: (row) => <span className="strong" style={{ color: row.due > 0 ? '#c62828' : undefined }}>{formatCurrency(row.due, 'BDT')}</span> },
                { key: 'overdue', header: 'Overdue', align: 'right', render: (row) => (row.overdue > 0 ? <Badge tone="danger">{formatCurrency(row.overdue, 'BDT')}</Badge> : '—') },
                { key: 'advance', header: 'Paid ahead', align: 'right', render: (row) => (row.advance > 0 ? formatCurrency(row.advance, 'BDT') : '—') },
                { key: 'active', header: 'Status', render: (row) => <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? 'Active' : 'Switched off'}</Badge> },
                {
                  key: 'actions',
                  header: '',
                  align: 'right',
                  render: (row) =>
                    canManage ? (
                      <Button size="sm" variant="ghost" onClick={(event) => { event.stopPropagation(); toggle(row) }}>
                        {row.active ? 'Switch off' : 'Switch on'}
                      </Button>
                    ) : null,
                },
              ]}
            />
            <TablePagination {...table.paginationProps} />
          </>
        )}
      </div>

      <VendorFormModal
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(saved) => {
          setCreating(false)
          toast.success(`${saved.name} added.`)
          table.reload()
        }}
      />
    </div>
  )
}
