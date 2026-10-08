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
import { Plus, Download, Edit, Trash2, Receipt, Search } from 'lucide-react'

import { vendorApi, exportToCsv } from '../vendor.api'
import BillModal from '../components/BillModal'
import DueBadge from '../components/DueBadge'
import { formatDate, formatNumber } from '@/utils/formatters'

export default function VendorBills() {
  const [bills, setBills] = useState([])
  const [vendors, setVendors] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  // Modals
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBill, setEditingBill] = useState(null)
  const [deletingBill, setDeletingBill] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [bRes, vRes, sRes] = await Promise.all([
        vendorApi.getBills({
          vendorId: vendorFilter,
          serviceId: serviceFilter,
          from,
          to,
        }),
        vendorApi.getVendors(),
        vendorApi.getServices(),
      ])

      if (bRes.success) setBills(bRes.data)
      if (vRes.success) setVendors(vRes.data)
      if (sRes.success) setServices(sRes.data)
    } catch (err) {
      console.error('Failed to load bills:', err)
    } finally {
      setLoading(false)
    }
  }, [vendorFilter, serviceFilter, from, to])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredBills = useMemo(() => {
    if (!search.trim()) return bills
    const q = search.trim().toLowerCase()
    return bills.filter(
      (b) =>
        b.billNo.toLowerCase().includes(q) ||
        b.vendorName.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q) ||
        (b.invoiceRef && b.invoiceRef.toLowerCase().includes(q)) ||
        (b.note && b.note.toLowerCase().includes(q))
    )
  }, [bills, search])

  const handleExport = () => {
    const headers = [
      { label: 'SL', key: (r, i) => i + 1 },
      { label: 'Date', key: (r) => formatDate(r.date) },
      { label: 'Bill No', key: 'billNo' },
      { label: 'Vendor', key: 'vendorName' },
      { label: 'Service', key: 'serviceName' },
      { label: 'Invoice Ref', key: 'invoiceRef' },
      { label: 'Amount (BDT)', key: 'amount' },
      { label: 'Paid (BDT)', key: 'paid' },
      { label: 'Due (BDT)', key: 'due' },
    ]
    exportToCsv('Vendor_Bills', headers, filteredBills)
  }

  const handleSaveBill = async (billData) => {
    if (editingBill) {
      await vendorApi.updateBill(editingBill.id, billData)
    } else {
      await vendorApi.createBill(billData)
    }
    loadData()
  }

  const handleDelete = async () => {
    if (!deletingBill) return
    setDeleting(true)
    try {
      await vendorApi.deleteBill(deletingBill.id)
      setDeletingBill(null)
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const totalAmount = filteredBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
  const totalPaid = filteredBills.reduce((sum, b) => sum + (Number(b.paid) || 0), 0)
  const totalDue = filteredBills.reduce((sum, b) => sum + (Number(b.due) || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Bills"
        description="Record and track payable invoices and purchases from suppliers across segments."
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: 'Bills' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="bg-white text-xs gap-1.5 h-9"
            >
              <Download className="size-3.5 text-muted-foreground" /> Export Excel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingBill(null)
                setModalOpen(true)
              }}
              className="bg-primary text-white hover:bg-primary-strong text-xs gap-1.5 h-9"
            >
              <Plus className="size-3.5" /> Record Bill
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
              placeholder="Search bill no, vendor, service, invoice ref..."
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

      {/* Bills Table (Section 4.4) */}
      <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12 text-center">SL</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-28">Bill No</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Invoice Ref</TableHead>
                <TableHead className="text-right">Amount (BDT)</TableHead>
                <TableHead className="text-right">Paid (BDT)</TableHead>
                <TableHead className="text-right">Due (BDT)</TableHead>
                <TableHead className="text-right pr-4 w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    Loading bills...
                  </TableCell>
                </TableRow>
              ) : filteredBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                    No bills recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBills.map((row, idx) => (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-center text-xs font-medium text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="text-xs text-foreground whitespace-nowrap">
                      {formatDate(row.date)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {row.billNo}
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
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {row.invoiceRef || '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-foreground text-xs">
                      ৳{formatNumber(row.amount)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                      ৳{formatNumber(row.paid)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DueBadge amount={row.due} />
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            setEditingBill(row)
                            setModalOpen(true)
                          }}
                          className="size-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit Bill"
                        >
                          <Edit className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setDeletingBill(row)}
                          className="size-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete Bill"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {filteredBills.length > 0 && (
              <TableFooter className="bg-muted/60 font-semibold border-t-2 border-border">
                <TableRow>
                  <TableCell colSpan={6} className="pl-4 text-xs font-bold uppercase tracking-wider text-foreground">
                    Total ({filteredBills.length} Bills)
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-foreground">
                    ৳{formatNumber(totalAmount)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ৳{formatNumber(totalPaid)}
                  </TableCell>
                  <TableCell className="text-right text-xs font-bold">
                    <DueBadge amount={totalDue} />
                  </TableCell>
                  <TableCell className="pr-4"></TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      {/* Bill Modal */}
      <BillModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveBill}
        bill={editingBill}
        vendors={vendors}
        services={services}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={Boolean(deletingBill)}
        title={`Delete Bill ${deletingBill?.billNo}?`}
        message="Deleting this bill will automatically adjust vendor dues and segment balances."
        confirmLabel={deleting ? 'Deleting...' : 'Delete Bill'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingBill(null)}
      />
    </div>
  )
}
