import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { Plus, Download, Edit, Trash2, CreditCard, Search } from 'lucide-react'

import { vendorApi, exportToCsv } from '../vendor.api'
import PaymentModal from '../components/PaymentModal'
import { formatDate, formatNumber } from '@/utils/formatters'

export default function VendorPayments() {
  const [payments, setPayments] = useState([])
  const [vendors, setVendors] = useState([])
  const [services, setServices] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [deletingPayment, setDeletingPayment] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, vRes, sRes, bRes] = await Promise.all([
        vendorApi.getPayments({
          vendorId: vendorFilter,
          serviceId: serviceFilter,
          from,
          to,
        }),
        vendorApi.getVendors(),
        vendorApi.getServices(),
        vendorApi.getBills(),
      ])

      if (pRes.success) setPayments(pRes.data)
      if (vRes.success) setVendors(vRes.data)
      if (sRes.success) setServices(sRes.data)
      if (bRes.success) setBills(bRes.data)
    } catch (err) {
      console.error('Failed to load payments:', err)
    } finally {
      setLoading(false)
    }
  }, [vendorFilter, serviceFilter, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredPayments = useMemo(() => {
    if (!search.trim()) return payments
    const q = search.trim().toLowerCase()
    return payments.filter(
      (p) =>
        p.voucherNo.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        p.serviceName.toLowerCase().includes(q) ||
        (p.account && p.account.toLowerCase().includes(q)) ||
        (p.method && p.method.toLowerCase().includes(q)) ||
        (p.note && p.note.toLowerCase().includes(q))
    )
  }, [payments, search])

  const handleExport = () => {
    const headers = [
      { label: 'SL', key: (r, i) => i + 1 },
      { label: 'Date', key: (r) => formatDate(r.date) },
      { label: 'Voucher No', key: 'voucherNo' },
      { label: 'Vendor', key: 'vendorName' },
      { label: 'Service', key: 'serviceName' },
      { label: 'Method', key: (r) => String(r.method).toUpperCase() },
      { label: 'Account / Ref', key: 'account' },
      { label: 'Amount (BDT)', key: 'amount' },
      { label: 'Note', key: 'note' },
    ]
    exportToCsv('Vendor_Payments', headers, filteredPayments)
  }

  const handleSavePayment = async (data) => {
    if (editingPayment) {
      await vendorApi.updatePayment(editingPayment.id, data)
    } else {
      await vendorApi.createPayment(data)
    }
    loadData()
  }

  const handleDelete = async () => {
    if (!deletingPayment) return
    setDeleting(true)
    try {
      await vendorApi.deletePayment(deletingPayment.id)
      setDeletingPayment(null)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Payments"
        description="Record outbound payments, voucher receipts, and segment settlements."
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: 'Payments' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs gap-1.5 h-9 bg-white"
            >
              <Download className="size-3.5 text-muted-foreground" /> Export Excel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingPayment(null)
                setModalOpen(true)
              }}
              className="bg-primary text-white hover:bg-primary-strong text-xs gap-1.5 h-9"
            >
              <Plus className="size-3.5" /> Record Payment
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search voucher no, vendor, service, account, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Vendor:</span>
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Service:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Services</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">From:</span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 px-2 text-xs rounded-lg border border-border bg-surface text-foreground"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">To:</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 px-2 text-xs rounded-lg border border-border bg-surface text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Payments Table (Section 4.5) */}
      <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12 text-center">SL</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-28">Voucher No</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Method & Account</TableHead>
                <TableHead className="text-right">Amount (BDT)</TableHead>
                <TableHead>Note / Ref</TableHead>
                <TableHead className="text-right pr-4 w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    Loading payments...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                    No payment vouchers recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((row, idx) => (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs text-foreground whitespace-nowrap">
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-emerald-600">
                      {row.voucherNo}
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/vendors/${row.vendorId}`}
                        className="font-medium text-sm text-foreground hover:text-primary transition-colors hover:underline block"
                      >
                        {row.vendorName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {row.serviceName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <span className="font-semibold uppercase text-foreground">{row.method}</span>
                        {row.account && (
                          <span className="text-muted-foreground ml-1.5 font-mono">
                            ({row.account})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                      ৳{formatNumber(row.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {row.note || '—'}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingPayment(row)
                            setModalOpen(true)
                          }}
                          className="size-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit Payment"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeletingPayment(row)}
                          className="size-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Payment"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {filteredPayments.length > 0 && (
              <TableFooter className="bg-muted/60 font-semibold border-t-2 border-border">
                <TableRow>
                  <TableCell colSpan={6} className="pl-4 text-xs font-bold uppercase tracking-wider text-foreground">
                    Total ({filteredPayments.length} Payments)
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{formatNumber(totalAmount)}
                  </TableCell>
                  <TableCell colSpan={2} className="pr-4"></TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePayment}
        payment={editingPayment}
        vendors={vendors}
        services={services}
        bills={bills}
        payments={payments}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={Boolean(deletingPayment)}
        title={`Delete Payment Voucher ${deletingPayment?.voucherNo}?`}
        message="Deleting this payment will automatically recalculate vendor dues and segment balances."
        confirmLabel={deleting ? 'Deleting...' : 'Delete Payment'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPayment(null)}
      />
    </div>
  )
}
