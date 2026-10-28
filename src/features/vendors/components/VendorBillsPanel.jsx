import { useState } from 'react'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import ReasonDialog from '../../../components/common/ReasonDialog'
import BillModal from './BillModal'
import { vendorApi } from '../vendor.api'
import { useServerTable } from '../../../hooks/useServerTable'
import { usePermission } from '../../../hooks/usePermission'
import { useToast } from '../../../context/ToastContext'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatCurrency, formatDate } from '../../../utils/formatters'

// The bills of one vendor, or of all vendors when `vendorId` is not given.
export default function VendorBillsPanel({ vendors, vendorId, onChanged }) {
  const { can } = usePermission()
  const toast = useToast()
  const [dates, setDates] = useState({ from: '', to: '' })
  const [adding, setAdding] = useState(false)
  const [voiding, setVoiding] = useState(null)

  const table = useServerTable({ table: vendorId ? 'vendor-bills-one' : 'vendor-bills', fetcher: vendorApi.listBills, filters: { vendorId, ...dates } })

  const changed = () => {
    table.reload()
    onChanged?.()
  }

  return (
    <div className="stack">
      <div className="filters">
        <Input label="Search" type="search" placeholder="Bill, invoice, vendor…" value={table.search} onChange={(event) => table.setSearch(event.target.value)} />
        <Input label="From" type="date" value={dates.from} onChange={(event) => setDates({ ...dates, from: event.target.value })} />
        <Input label="To" type="date" value={dates.to} onChange={(event) => setDates({ ...dates, to: event.target.value })} />
        {can(PERMISSIONS.VENDOR_MANAGE) ? <div className="field" style={{ alignSelf: 'end' }}><Button onClick={() => setAdding(true)}>New bill</Button></div> : null}
      </div>

      {table.error ? (
        <ErrorState title="Could not load the bills" message={errorMessage(table.error)} onRetry={table.reload} />
      ) : (
        <>
          <DataTable
            loading={table.loading}
            refreshing={table.refreshing}
            data={table.rows}
            emptyTitle="No bills"
            emptyDescription="Bills from vendors appear here."
            columns={[
              { key: 'billNo', header: 'Bill', render: (row) => <span><span className="strong">{row.billNo}</span><br /><span className="muted small">{row.invoiceRef || '—'}</span></span> },
              ...(vendorId ? [] : [{ key: 'vendorName', header: 'Vendor' }]),
              { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
              { key: 'dueDate', header: 'Due on', render: (row) => formatDate(row.dueDate) },
              { key: 'service', header: 'Service', render: (row) => row.service || '—' },
              { key: 'amount', header: 'Amount', align: 'right', render: (row) => formatCurrency(row.amount, 'BDT') },
              { key: 'paid', header: 'Paid', align: 'right', render: (row) => formatCurrency(row.paid, 'BDT') },
              { key: 'due', header: 'Due', align: 'right', render: (row) => <span className="strong" style={{ color: row.due > 0 ? '#c62828' : undefined }}>{formatCurrency(row.due, 'BDT')}</span> },
              { key: 'status', header: 'Status', render: (row) => (row.status === 'void' ? <Badge tone="danger" title={row.voidReason}>Voided</Badge> : row.due <= 0 ? <Badge tone="success">Paid</Badge> : <Badge tone="warning">Open</Badge>) },
              { key: 'actions', header: '', align: 'right', render: (row) => (row.status === 'posted' && can(PERMISSIONS.ACCOUNTS_VOID) ? <Button size="sm" variant="ghost" onClick={() => setVoiding(row)}>Void</Button> : null) },
            ]}
          />
          <TablePagination {...table.paginationProps} />
        </>
      )}

      <BillModal open={adding} vendors={vendors} vendorId={vendorId} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); toast.success('Bill saved.'); changed() }} />

      <ReasonDialog
        open={Boolean(voiding)}
        title={`Void bill ${voiding?.billNo ?? ''}`}
        message="The bill stays in the history, marked as voided. What we owe the vendor goes down and the cost is taken out of the books. Enter a corrected bill after it."
        confirmLabel="Void bill"
        onCancel={() => setVoiding(null)}
        onConfirm={async (reason) => {
          await vendorApi.voidBill(voiding.id, reason)
          setVoiding(null)
          toast.success('Bill voided.')
          changed()
        }}
      />
    </div>
  )
}
