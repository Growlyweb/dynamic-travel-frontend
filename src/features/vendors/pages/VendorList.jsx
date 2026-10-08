import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import {
  Plus,
  Download,
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Receipt,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
} from 'lucide-react'

import { vendorApi, exportToCsv } from '../vendor.api'
import DueBadge from '../components/DueBadge'
import BillModal from '../components/BillModal'
import PaymentModal from '../components/PaymentModal'
import { cn } from '@/utils/helpers'

export default function VendorList() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [vendors, setVendors] = useState([])
  const [services, setServices] = useState([])
  const [bills, setBills] = useState([])
  const [payments, setPaymentsList] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState(searchParams.get('serviceId') || 'all')
  const [sortByDueDesc, setSortByDueDesc] = useState(false)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Modals & Actions
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [activeVendorId, setActiveVendorId] = useState(null)
  const [deleteVendorTarget, setDeleteVendorTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, sRes, bRes, pRes] = await Promise.all([
        vendorApi.getVendors(),
        vendorApi.getServices(),
        vendorApi.getBills(),
        vendorApi.getPayments(),
      ])
      if (vRes.success) setVendors(vRes.data)
      if (sRes.success) setServices(sRes.data)
      if (bRes.success) setBills(bRes.data)
      if (pRes.success) setPaymentsList(pRes.data)
    } catch (err) {
      console.error('Failed to load vendors:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter & Search logic
  const filteredVendors = useMemo(() => {
    let list = [...vendors]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((v) => {
        const fullPhone = `${v.mobile?.countryCode || ''} ${v.mobile?.number || ''}`.toLowerCase()
        return (
          v.name.toLowerCase().includes(q) ||
          v.vendorCode.toLowerCase().includes(q) ||
          fullPhone.includes(q) ||
          (v.email && v.email.toLowerCase().includes(q))
        )
      })
    }

    if (statusFilter !== 'all') {
      const isAct = statusFilter === 'active'
      list = list.filter((v) => v.isActive === isAct)
    }

    if (serviceFilter !== 'all') {
      list = list.filter((v) => v.services?.includes(serviceFilter))
    }

    if (sortByDueDesc) {
      list.sort((a, b) => b.totalDue - a.totalDue)
    }

    return list
  }, [vendors, search, statusFilter, serviceFilter, sortByDueDesc])

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize))
  const paginatedVendors = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredVendors.slice(start, start + pageSize)
  }, [filteredVendors, page, pageSize])

  const handleExport = () => {
    const headers = [
      { label: 'SL', key: (r, idx) => idx + 1 },
      { label: 'Vendor Code', key: 'vendorCode' },
      { label: 'Vendor Name', key: 'name' },
      {
        label: 'Mobile',
        key: (r) => `${r.mobile?.countryCode || ''} ${r.mobile?.number || ''}`.trim(),
      },
      { label: 'Email', key: 'email' },
      { label: 'Services', key: (r) => (r.serviceNames || []).join(', ') },
      { label: 'Total Due (BDT)', key: 'totalDue' },
      { label: 'Status', key: (r) => (r.isActive ? 'Active' : 'Inactive') },
    ]
    exportToCsv('Vendor_List', headers, filteredVendors)
  }

  const handleToggleStatus = async (vendor) => {
    try {
      await vendorApi.toggleVendorStatus(vendor.id)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    if (!deleteVendorTarget) return
    setDeleting(true)
    setActionError(null)
    try {
      await vendorApi.deleteVendor(deleteVendorTarget.id)
      setDeleteVendorTarget(null)
      loadData()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleAddBill = (vId) => {
    setActiveVendorId(vId)
    setBillModalOpen(true)
  }

  const handleAddPayment = (vId) => {
    setActiveVendorId(vId)
    setPaymentModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Manage supplier directory, service associations, outstanding dues, and payment ledgers."
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: 'Directory' },
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
            <Link to="/vendors/new">
              <Button size="sm" className="bg-primary text-white hover:bg-primary-strong text-xs gap-1.5 h-9">
                <Plus className="size-3.5" /> Add Vendor
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar (Section 4.1) */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by vendor name, code (VND-XXXX), mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-9 px-2.5 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Service:</span>
            <select
              value={serviceFilter}
              onChange={(e) => {
                setServiceFilter(e.target.value)
                setPage(1)
              }}
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

          {/* Sort by Due Descending Toggle */}
          <Button
            type="button"
            variant={sortByDueDesc ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setSortByDueDesc(!sortByDueDesc)}
            className={cn(
              'h-9 text-xs gap-1.5 bg-white',
              sortByDueDesc && 'border-primary text-primary font-semibold'
            )}
          >
            <ArrowUpDown className="size-3.5" />
            Sort by Due {sortByDueDesc ? '(Highest First)' : ''}
          </Button>
        </div>
      </div>

      {/* Main Vendor Table */}
      <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-12 text-center">SL</TableHead>
                <TableHead className="w-28">Vendor Code</TableHead>
                <TableHead>Vendor Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Services</TableHead>
                <TableHead className="text-right">Total Due</TableHead>
                <TableHead className="text-center w-24">Status</TableHead>
                <TableHead className="text-right pr-4 w-20">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-muted-foreground">
                    Loading vendors...
                  </TableCell>
                </TableRow>
              ) : paginatedVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-muted-foreground">
                    No vendors found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedVendors.map((row, idx) => {
                  const sl = (page - 1) * pageSize + idx + 1
                  return (
                    <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center text-xs font-medium text-muted-foreground">
                        {sl}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                        {row.vendorCode}
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/vendors/${row.id}`}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors hover:underline block"
                        >
                          {row.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-foreground whitespace-nowrap">
                        {row.mobile?.number
                          ? `${row.mobile?.countryCode || '+88'} ${row.mobile.number}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.email || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {(row.serviceNames || []).map((srv) => (
                            <span
                              key={srv}
                              className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
                            >
                              {srv}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DueBadge amount={row.totalDue} />
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(row)}
                          title="Click to toggle status"
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold transition-colors cursor-pointer',
                            row.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                          )}
                        >
                          {row.isActive ? (
                            <>
                              <CheckCircle2 className="size-3" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="size-3" /> Inactive
                            </>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Vendor actions"
                              className="size-8 p-0"
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => handleAddBill(row.id)}>
                              <Receipt className="size-4 text-amber-600" /> Add Bill
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddPayment(row.id)}>
                              <CreditCard className="size-4 text-emerald-600" /> Add Payment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/vendors/${row.id}`)}>
                              <Eye className="size-4 text-muted-foreground" /> View Ledger
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/vendors/${row.id}/edit`)}>
                              <Edit className="size-4 text-muted-foreground" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />

                            {/* Delete Rule (Section 4.1 & 11): Delete shown ONLY if no bills and no payments */}
                            {row.hasTransactions ? (
                              <DropdownMenuItem
                                disabled
                                className="text-xs text-muted-foreground cursor-not-allowed"
                                title="Cannot delete vendor with recorded transactions. Set to Inactive instead."
                              >
                                <Trash2 className="size-4 text-muted-foreground/40" /> Has transactions
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => {
                                  setActionError(null)
                                  setDeleteVendorTarget(row)
                                }}
                              >
                                <Trash2 className="size-4" /> Delete Vendor
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination & Page Size (Section 4.1: 20 per page default, selectable 20 / 50 / 100) */}
        <div className="p-3.5 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="h-7 px-2 text-xs rounded border border-border bg-surface text-foreground"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Showing {filteredVendors.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
              {Math.min(page * pageSize, filteredVendors.length)} of {filteredVendors.length} vendors
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="xs"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="h-7 px-2.5"
            >
              Previous
            </Button>
            <span className="px-2 font-medium text-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="xs"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="h-7 px-2.5"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={Boolean(deleteVendorTarget)}
        title={`Delete Vendor "${deleteVendorTarget?.name}"?`}
        message={
          actionError ? (
            <span className="text-rose-600 font-medium">{actionError}</span>
          ) : (
            'Are you sure you want to permanently remove this vendor? This action cannot be undone.'
          )
        }
        confirmLabel={deleting ? 'Deleting...' : 'Delete Vendor'}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteVendorTarget(null)
          setActionError(null)
        }}
      />

      {/* Add Bill Modal */}
      <BillModal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        onSave={async (billData) => {
          await vendorApi.createBill(billData)
          loadData()
        }}
        vendors={vendors}
        services={services}
        initialVendorId={activeVendorId}
      />

      {/* Add Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSave={async (paymentData) => {
          await vendorApi.createPayment(paymentData)
          loadData()
        }}
        vendors={vendors}
        services={services}
        bills={bills}
        payments={payments}
        initialVendorId={activeVendorId}
      />
    </div>
  )
}
