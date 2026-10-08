import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
import {
  Receipt,
  CreditCard,
  Edit,
  ArrowLeft,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Phone,
  Mail,
  MapPin,
  Download,
} from 'lucide-react'

import { vendorApi, exportToCsv } from '../vendor.api'
import DueBadge from '../components/DueBadge'
import BillModal from '../components/BillModal'
import PaymentModal from '../components/PaymentModal'
import { formatDate, formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/helpers'

export default function VendorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vendor, setVendor] = useState(null)
  const [segmentDue, setSegmentDue] = useState([])
  const [ledger, setLedger] = useState([])
  const [services, setServices] = useState([])
  const [bills, setBills] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  // Tabs: 'segments' | 'ledger' | 'profile'
  const [activeTab, setActiveTab] = useState('segments')

  // Modals
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, segRes, ledgRes, sRes, bRes, pRes] = await Promise.all([
        vendorApi.getVendor(id),
        vendorApi.getVendorSegmentDue(id),
        vendorApi.getVendorLedger(id),
        vendorApi.getServices(),
        vendorApi.getBills({ vendorId: id }),
        vendorApi.getPayments({ vendorId: id }),
      ])

      if (vRes.success) setVendor(vRes.data)
      if (segRes.success) setSegmentDue(segRes.data)
      if (ledgRes.success) setLedger(ledgRes.data)
      if (sRes.success) setServices(sRes.data)
      if (bRes.success) setBills(bRes.data)
      if (pRes.success) setPayments(pRes.data)
    } catch (err) {
      console.error('Failed to load vendor ledger:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleExportLedger = () => {
    const headers = [
      { label: 'Date', key: (r) => formatDate(r.date) },
      { label: 'Type', key: (r) => String(r.type).toUpperCase() },
      { label: 'Reference', key: 'ref' },
      { label: 'Service / Description', key: (r) => `${r.serviceName} - ${r.description}` },
      { label: 'Billed / Debit (BDT)', key: 'billed' },
      { label: 'Paid / Credit (BDT)', key: 'paid' },
      { label: 'Running Balance (BDT)', key: 'balance' },
    ]
    exportToCsv(`${vendor?.name || 'Vendor'}_Ledger`, headers, ledger)
  }

  const handleExportSegments = () => {
    const headers = [
      { label: 'Service', key: 'serviceName' },
      { label: 'Total Billed (BDT)', key: 'billed' },
      { label: 'Total Paid (BDT)', key: 'paid' },
      { label: 'Due (BDT)', key: 'due' },
    ]
    exportToCsv(`${vendor?.name || 'Vendor'}_Segment_Due`, headers, segmentDue)
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-muted-foreground text-sm">
        Loading vendor details and running ledger...
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-base text-foreground font-semibold">Vendor not found</p>
        <Link to="/vendors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="size-4 mr-1.5" /> Back to Vendors
          </Button>
        </Link>
      </div>
    )
  }

  const isCreditExceeded = vendor.creditLimit > 0 && vendor.totalDue > vendor.creditLimit

  return (
    <div className="space-y-6">
      <PageHeader
        title={vendor.name}
        description={`Code: ${vendor.vendorCode} · ${vendor.isActive ? 'Active' : 'Inactive'} Supplier`}
        breadcrumbs={[
          { label: 'Vendors', to: '/vendors' },
          { label: vendor.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/vendors">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9 bg-white">
                <ArrowLeft className="size-3.5" /> All Vendors
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBillModalOpen(true)}
              className="text-xs gap-1.5 h-9 bg-white"
            >
              <Receipt className="size-3.5 text-amber-600" /> Add Bill
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPaymentModalOpen(true)}
              className="text-xs gap-1.5 h-9  bg-white"
            >
              <CreditCard className="size-3.5 text-emerald-600" /> Add Payment
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate(`/vendors/${vendor.id}/edit`)}
              className="bg-primary text-white hover:bg-primary-strong text-xs gap-1.5 h-9"
            >
              <Edit className="size-3.5" /> Edit Vendor
            </Button>
          </div>
        }
      />

      {/* Credit Limit Exceeded Warning (Section 11 #9) */}
      {isCreditExceeded && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40">
          <AlertTriangle className="size-5 shrink-0 text-amber-600" />
          <div>
            <span className="font-bold">Credit Limit Warning: </span>
            This vendor's current due (৳{formatNumber(vendor.totalDue)}) exceeds the configured
            credit limit of ৳{formatNumber(vendor.creditLimit)} by ৳
            {formatNumber(vendor.totalDue - vendor.creditLimit)}.
          </div>
        </div>
      )}

      {/* 4.6 Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Billed */}
        <div className="bg-white border border-border rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Billed</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 dark:bg-amber-950/40">
              <Receipt className="size-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mt-2">
            ৳{formatNumber(vendor.totalBilled)}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Opening balance + All bills recorded
          </p>
        </div>

        {/* Total Paid */}
        <div className="bg-white border border-border rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Paid</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40">
              <CreditCard className="size-4" />
            </span>
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ৳{formatNumber(vendor.totalPaid)}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Total payments and clearances made
          </p>
        </div>

        {/* Total Due */}
        <div className="bg-white border border-border rounded-xl p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Current Total Due</span>
            <DueBadge amount={vendor.totalDue} />
          </div>
          <h3
            className={cn(
              'text-2xl font-bold mt-2',
              vendor.totalDue > 0
                ? 'text-rose-600'
                : vendor.totalDue < 0
                  ? 'text-blue-600'
                  : 'text-emerald-600'
            )}
          >
            ৳{formatNumber(Math.abs(vendor.totalDue))}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {vendor.totalDue > 0
              ? 'Outstanding balance payable'
              : vendor.totalDue < 0
                ? 'Advance deposit with vendor'
                : 'Account balanced & settled'}
          </p>
        </div>
      </div>

      {/* Tabs Navigation (Section 4.6: Tab 1 Segment Due, Tab 2 Ledger, Tab 3 Profile) */}
      <div className="flex border-b border-border space-x-1">
        <button
          type="button"
          onClick={() => setActiveTab('segments')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'segments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Layers className="size-4" />
          <span>Tab 1: Segment Due ({segmentDue.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'ledger'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="size-4" />
          <span>Tab 2: Running Ledger ({ledger.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={cn(
            'px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2',
            activeTab === 'profile'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Building2 className="size-4" />
          <span>Tab 3: Vendor Profile</span>
        </button>
      </div>

      {/* Tab 1: Segment Due Table */}
      {activeTab === 'segments' && (
        <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Segment Breakdown</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Billed, paid, and outstanding dues grouped per service category
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportSegments}
              className="text-xs gap-1.5 h-8"
            >
              <Download className="size-3.5 text-muted-foreground" /> Export
            </Button>
          </div>

          <div className="relative w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-12 text-center">SL</TableHead>
                  <TableHead>Service / Segment</TableHead>
                  <TableHead className="text-right">Billed (BDT)</TableHead>
                  <TableHead className="text-right">Paid (BDT)</TableHead>
                  <TableHead className="text-right pr-4">Due (BDT)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segmentDue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No services linked to this vendor yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  segmentDue.map((row, idx) => (
                    <TableRow key={row.serviceId} className="hover:bg-muted/30">
                      <TableCell className="text-center text-xs font-medium text-muted-foreground">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-sm text-foreground">
                          {row.serviceName}
                        </span>
                        {row.serviceCode && (
                          <span className="text-[10px] font-mono uppercase bg-muted text-muted-foreground px-1.5 py-0.5 rounded ml-2">
                            {row.serviceCode}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground text-xs">
                        ৳{formatNumber(row.billed)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400 text-xs">
                        ৳{formatNumber(row.paid)}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <DueBadge amount={row.due} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 2: Ledger Table with Running Balance */}
      {activeTab === 'ledger' && (
        <div className="bg-white border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Vendor Statement / Running Ledger</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bills and payments mixed chronologically with running account balance
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportLedger}
              className="text-xs gap-1.5 h-8"
            >
              <Download className="size-3.5 text-muted-foreground" /> Export Ledger
            </Button>
          </div>

          <div className="relative w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead className="w-24">Type</TableHead>
                  <TableHead className="w-28">Ref / Voucher</TableHead>
                  <TableHead>Service / Description</TableHead>
                  <TableHead className="text-right">Billed [Debit] (BDT)</TableHead>
                  <TableHead className="text-right">Paid [Credit] (BDT)</TableHead>
                  <TableHead className="text-right pr-4">Running Balance (BDT)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No ledger activity recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledger.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/30 text-xs">
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(row.date)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[11px] font-semibold uppercase',
                            row.type === 'bill'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40'
                              : row.type === 'payment'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40'
                                : 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40'
                          )}
                        >
                          {row.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-foreground">
                        {row.ref}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-foreground">{row.serviceName}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            {row.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {row.billed > 0 ? `৳${formatNumber(row.billed)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                        {row.paid > 0 ? `৳${formatNumber(row.paid)}` : '—'}
                      </TableCell>
                      <TableCell className="text-right pr-4 font-bold">
                        <DueBadge amount={row.balance} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {ledger.length > 0 && (
                <TableFooter className="bg-muted/60 font-semibold border-t-2 border-border">
                  <TableRow>
                    <TableCell colSpan={4} className="pl-4 text-xs font-bold uppercase tracking-wider text-foreground">
                      Final Account Standing
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-foreground">
                      ৳{formatNumber(vendor.totalBilled)}
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      ৳{formatNumber(vendor.totalPaid)}
                    </TableCell>
                    <TableCell className="text-right pr-4 text-xs font-bold">
                      <DueBadge amount={vendor.totalDue} />
                    </TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </div>
      )}

      {/* Tab 3: Profile Card */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-border rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <h3 className="font-semibold text-base text-foreground">Vendor Profile & Terms</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Supplier identity, linked services, and financial boundaries
              </p>
            </div>
            <Link to={`/vendors/${vendor.id}/edit`}>
              <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8">
                <Edit className="size-3.5" /> Edit Profile
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground block">Vendor Name</span>
                <span className="font-semibold text-foreground text-base">{vendor.name}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Vendor Code</span>
                <span className="font-mono font-semibold text-primary">{vendor.vendorCode}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Contact Mobile</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span>
                    {vendor.mobile?.number
                      ? `${vendor.mobile?.countryCode || '+88'} ${vendor.mobile.number}`
                      : '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="size-3.5 text-muted-foreground" />
                  <span>{vendor.email || '—'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Office Address</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <MapPin className="size-3.5 text-muted-foreground" />
                  <span>{vendor.address || '—'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground block">Opening Balance</span>
                <span className="font-semibold text-foreground">
                  ৳{formatNumber(vendor.openingBalance || 0)}{' '}
                  <span className="text-xs text-muted-foreground font-normal capitalize">
                    ({vendor.openingBalanceType || 'due'})
                  </span>
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Credit Limit</span>
                <span className="font-semibold text-foreground">
                  {vendor.creditLimit > 0 ? `৳${formatNumber(vendor.creditLimit)}` : 'No Limit Set'}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Fixed Security Advance</span>
                <span className="font-semibold text-foreground">
                  ৳{formatNumber(vendor.fixedAdvance || 0)}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Status</span>
                <span
                  className={cn(
                    'inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1',
                    vendor.isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-muted text-muted-foreground border border-border'
                  )}
                >
                  {vendor.isActive ? 'Active Vendor' : 'Inactive'}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block mb-1">
                  Active Services & Segments
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(vendor.serviceNames || []).map((srv) => (
                    <span
                      key={srv}
                      className="px-2.5 py-1 text-xs rounded-lg bg-primary-soft text-primary-strong font-medium border border-primary/20"
                    >
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <BillModal
        open={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        onSave={async (billData) => {
          await vendorApi.createBill(billData)
          loadData()
        }}
        vendors={[vendor]}
        services={services}
        initialVendorId={vendor.id}
      />

      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSave={async (paymentData) => {
          await vendorApi.createPayment(paymentData)
          loadData()
        }}
        vendors={[vendor]}
        services={services}
        bills={bills}
        payments={payments}
        initialVendorId={vendor.id}
      />
    </div>
  )
}
