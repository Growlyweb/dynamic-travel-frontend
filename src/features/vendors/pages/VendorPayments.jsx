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
import { Badge } from '@/components/ui/badge'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import ExportMenu from '@/components/common/ExportMenu'
import { Plus, ArrowUpRight, Edit, Trash2, Printer, Search } from 'lucide-react'

import {
  vendorApi,
  exportToCsv,
  exportToExcel,
  printPaymentVoucher,
  printReportDocument,
} from '../vendor.api'
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
  const [typeFilter, setTypeFilter] = useState('all') // 'all' | 'regular' | 'advance'
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [modalIsAdvance, setModalIsAdvance] = useState(false)
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
          type: typeFilter,
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
  }, [vendorFilter, serviceFilter, typeFilter, from, to])

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
        (p.advancePurpose && p.advancePurpose.toLowerCase().includes(q)) ||
        (p.note && p.note.toLowerCase().includes(q))
    )
  }, [payments, search])

  const totalAmount = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const advanceAmount = filteredPayments
    .filter((p) => p.isAdvance)
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  const regularAmount = totalAmount - advanceAmount

  // ── Export Handlers (PDF, Excel, CSV) ──────────────────────
  const handleExportCsv = () => {
    const headers = [
      { label: 'SL', key: (r, i) => i + 1 },
      { label: 'Date', key: (r) => formatDate(r.date) },
      { label: 'Voucher No', key: 'voucherNo' },
      { label: 'Type', key: (r) => (r.isAdvance ? 'Advance' : 'Regular') },
      { label: 'Vendor', key: 'vendorName' },
      { label: 'Service', key: 'serviceName' },
      { label: 'Method', key: (r) => String(r.method).toUpperCase() },
      { label: 'Account / Ref', key: 'account' },
      { label: 'Amount (BDT)', key: 'amount' },
      { label: 'Advance Purpose', key: (r) => r.advancePurpose || '' },
      { label: 'Note', key: 'note' },
    ]
    exportToCsv('Vendor_Payments_List', headers, filteredPayments)
  }

  const handleExportExcel = () => {
    const headers = [
      { label: 'SL', key: (r, i) => i + 1 },
      { label: 'Date', key: (r) => formatDate(r.date) },
      { label: 'Voucher No', key: 'voucherNo' },
      { label: 'Payment Type', key: (r) => (r.isAdvance ? 'Advance Deposit' : 'Regular Bill Payment') },
      { label: 'Vendor Name', key: 'vendorName' },
      { label: 'Service / Segment', key: 'serviceName' },
      { label: 'Method', key: (r) => String(r.method).toUpperCase() },
      { label: 'Account / Reference', key: 'account' },
      { label: 'Amount (BDT)', key: 'amount', isCurrency: true, align: 'right' },
      { label: 'Advance Purpose', key: (r) => r.advancePurpose || '' },
      { label: 'Note / Remarks', key: 'note' },
    ]
    exportToExcel('Vendor_Payments_Report', {
      title: 'Vendor Payments & Advance Clearances',
      subtitle: `Official payment voucher register · Total: ৳${formatNumber(totalAmount)}`,
      headers,
      rows: filteredPayments,
      summaryTotals: [
        { value: 'Grand Total (BDT)', colspan: 8, align: 'right' },
        { value: `৳${formatNumber(totalAmount)}`, align: 'right' },
        { value: '', colspan: 2 },
      ],
      metadata: {
        'Total Transactions': filteredPayments.length,
        'Regular Payments': `৳${formatNumber(regularAmount)}`,
        'Advance Payments': `৳${formatNumber(advanceAmount)}`,
        'Period': from && to ? `${formatDate(from)} to ${formatDate(to)}` : 'All Dates',
      },
    })
  }

  const handleExportPdf = () => {
    const headers = [
      { label: 'SL', key: (r, i) => i + 1, align: 'center' },
      { label: 'Date', key: (r) => formatDate(r.date) },
      { label: 'Voucher No', key: 'voucherNo' },
      { label: 'Type', key: (r) => (r.isAdvance ? 'ADVANCE' : 'REGULAR') },
      { label: 'Vendor', key: 'vendorName' },
      { label: 'Service', key: 'serviceName' },
      { label: 'Method & Account', key: (r) => `${String(r.method).toUpperCase()} ${r.account ? `(${r.account})` : ''}` },
      { label: 'Amount (BDT)', key: (r) => `৳${formatNumber(r.amount)}`, align: 'right', isCurrency: true },
      { label: 'Note / Purpose', key: (r) => r.advancePurpose ? `Adv: ${r.advancePurpose}` : (r.note || '—') },
    ]
    printReportDocument({
      title: 'Vendor Payments & Advances Report',
      subtitle: `${filteredPayments.length} transactions recorded · Regular: ৳${formatNumber(regularAmount)} · Advance: ৳${formatNumber(advanceAmount)}`,
      dateRange: from && to ? `${formatDate(from)} to ${formatDate(to)}` : 'All Time',
      headers,
      rows: filteredPayments,
      summaryTotals: [
        { value: 'Grand Total', colspan: 7, align: 'right' },
        { value: `৳${formatNumber(totalAmount)}`, align: 'right' },
        { value: '', colspan: 1 },
      ],
      metadata: {
        'Payment Filter': typeFilter === 'advance' ? 'Advance Payments Only' : typeFilter === 'regular' ? 'Regular Payments Only' : 'All Payments',
        'Vendor Filter': vendorFilter === 'all' ? 'All Vendors' : (vendors.find((v) => v.id === vendorFilter)?.name || vendorFilter),
      },
    })
  }

  const handlePrintVoucher = (payment) => {
    const vendor = vendors.find((v) => v.id === payment.vendorId)
    const service = services.find((s) => s.id === payment.serviceId)
    printPaymentVoucher({ payment, vendor, service })
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Payments"
        description="Record outbound payments, advance deposits, voucher receipts, and segment settlements."
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: 'Payments' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Multi-format Export Menu (PDF, Excel, CSV) */}
            <ExportMenu
              label="Export"
              onExportPdf={handleExportPdf}
              onExportExcel={handleExportExcel}
              onExportCsv={handleExportCsv}
            />

            {/* Advance Payment Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPayment(null)
                setModalIsAdvance(true)
                setModalOpen(true)
              }}
              className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 text-xs gap-1.5 h-9 font-medium shadow-xs"
            >
              <ArrowUpRight className="size-3.5 text-blue-600" /> Pay Advance
            </Button>

            {/* Regular Record Payment Button */}
            <Button
              size="sm"
              onClick={() => {
                setEditingPayment(null)
                setModalIsAdvance(false)
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

          {/* Payment Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="all">All Payments</option>
              <option value="regular">Regular Payments</option>
              <option value="advance">Advance Payments</option>
            </select>
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

      {/* Payments Table */}
      <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12 text-center">SL</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-28">Voucher No</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Method & Account</TableHead>
                <TableHead className="text-right">Amount (BDT)</TableHead>
                <TableHead>Note / Purpose</TableHead>
                <TableHead className="text-right pr-4 w-28">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    Loading payments...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
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
                      {row.isAdvance ? (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold gap-1 inline-flex items-center">
                          <ArrowUpRight className="size-3" /> Advance
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px] bg-muted/30">
                          Regular
                        </Badge>
                      )}
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
                      {row.advancePurpose ? (
                        <span className="text-blue-700 font-medium">Adv: {row.advancePurpose}</span>
                      ) : (
                        row.note || '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* Print Payment Voucher Button */}
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handlePrintVoucher(row)}
                          className="size-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Print / Save Payment Voucher (PDF)"
                        >
                          <Printer className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingPayment(row)
                            setModalIsAdvance(Boolean(row.isAdvance))
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
              <TableFooter>
                <TableRow className="bg-muted/50 font-semibold text-xs border-t-2 border-border">
                  <TableCell colSpan={7} className="text-right py-3">
                    Total Filtered Payments:
                  </TableCell>
                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400 py-3 font-bold text-sm">
                    ৳{formatNumber(totalAmount)}
                  </TableCell>
                  <TableCell colSpan={2} className="text-xs text-muted-foreground py-3">
                    {advanceAmount > 0 ? `(Regular: ৳${formatNumber(regularAmount)} · Advance: ৳${formatNumber(advanceAmount)})` : ''}
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      {/* Modal */}
      <PaymentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSavePayment}
        payment={editingPayment}
        initialIsAdvance={modalIsAdvance}
        vendors={vendors}
        services={services}
        bills={bills}
        payments={payments}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingPayment)}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Payment Voucher"
        message={`Are you sure you want to delete payment voucher ${deletingPayment?.voucherNo} for ${deletingPayment?.vendorName}? This will increase the vendor's outstanding balance.`}
        confirmLabel="Delete Voucher"
        danger
      />
    </div>
  )
}
