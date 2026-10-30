import { useState } from 'react'
import DataTable from '../../../components/tables/DataTable'
import TablePagination from '../../../components/tables/TablePagination'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import ReasonDialog from '../../../components/common/ReasonDialog'
import PaymentModal from './PaymentModal'
import { vendorApi, PAYMENT_METHODS } from '../vendor.api'
import { useServerTable } from '../../../hooks/useServerTable'
import { usePermission } from '../../../hooks/usePermission'
import { useToast } from '../../../context/ToastContext'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatCurrency, formatDate } from '../../../utils/formatters'

const methodLabel = (value) => PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value

// The payments to one vendor, or to all vendors when `vendorId` is not given.
export default function VendorPaymentsPanel({ vendors, vendorId, onChanged }) {
  const { can } = usePermission()
  const toast = useToast()
  const [dates, setDates] = useState({ from: '', to: '' })
  const [adding, setAdding] = useState(false)
  const [voiding, setVoiding] = useState(null)

  const table = useServerTable({ table: vendorId ? 'vendor-payments-one' : 'vendor-payments', fetcher: vendorApi.listPayments, filters: { vendorId, ...dates } })

  const changed = () => {
    table.reload()
    onChanged?.()
  }

  return (
    <div className="stack">
      <div className="filters">
        <Input label="From" type="date" value={dates.from} onChange={(event) => setDates({ ...dates, from: event.target.value })} />
        <Input label="To" type="date" value={dates.to} onChange={(event) => setDates({ ...dates, to: event.target.value })} />
        {can(PERMISSIONS.VENDOR_MANAGE) ? <div className="field" style={{ alignSelf: 'end' }}><Button onClick={() => setAdding(true)}>New payment</Button></div> : null}
      </div>

      {table.error ? (
        <ErrorState title="Could not load the payments" message={errorMessage(table.error)} onRetry={table.reload} />
      ) : (
        <>
          <DataTable
            loading={table.loading}
            refreshing={table.refreshing}
            data={table.rows}
            emptyTitle="No payments"
            emptyDescription="Payments to vendors appear here."
            columns={[
              { key: 'voucherNo', header: 'Voucher', render: (row) => <span className="strong">{row.voucherNo}</span> },
              ...(vendorId ? [] : [{ key: 'vendorName', header: 'Vendor' }]),
              { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
              { key: 'method', header: 'Paid from', render: (row) => methodLabel(row.method) },
              { key: 'type', header: 'Type', render: (row) => (row.isAdvance ? <Badge tone="info">Advance</Badge> : 'Payment') },
              { key: 'amount', header: 'Amount', align: 'right', render: (row) => <span className="strong">{formatCurrency(row.amount, 'BDT')}</span> },
              { key: 'note', header: 'Note', render: (row) => <span className="muted small">{row.note || '—'}</span> },
              { key: 'status', header: 'Status', render: (row) => (row.status === 'void' ? <Badge tone="danger" title={row.voidReason}>Voided</Badge> : <Badge tone="success">Posted</Badge>) },
              { key: 'actions', header: '', align: 'right', render: (row) => (row.status === 'posted' && can(PERMISSIONS.ACCOUNTS_VOID) ? <Button size="sm" variant="ghost" onClick={() => setVoiding(row)}>Void</Button> : null) },
            ]}
          />
          <TablePagination {...table.paginationProps} />
        </>
      )}

      <PaymentModal open={adding} vendors={vendors} vendorId={vendorId} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); toast.success('Payment saved.'); changed() }} />

      <ReasonDialog
        open={Boolean(voiding)}
        title={`Void payment ${voiding?.voucherNo ?? ''}`}
        message="The payment stays in the history, marked as voided. What we owe the vendor goes back up and the money goes back to the account it came from."
        confirmLabel="Void payment"
        onCancel={() => setVoiding(null)}
        onConfirm={async (reason) => {
          await vendorApi.voidPayment(voiding.id, reason)
          setVoiding(null)
          toast.success('Payment voided.')
          changed()
        }}
      />
    </div>
  )
}
