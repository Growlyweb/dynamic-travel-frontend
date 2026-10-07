import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import VendorDueBadge from '../components/VendorDueBadge'
import RecordBillModal from '../components/RecordBillModal'
import RecordPaymentModal from '../components/RecordPaymentModal'
import AddPassportModal from '../components/AddPassportModal'
import AcknowledgementSlipModal from '../components/AcknowledgementSlipModal'
import { vendorApi } from '../vendor.api'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'
import {
  Building2,
  ArrowLeft,
  ReceiptText,
  CreditCard,
  KeyRound,
  Printer,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Layers,
  Calculator,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react'

export default function VendorDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('ledger')

  // Modals
  const [recordBillOpen, setRecordBillOpen] = useState(false)
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [passportIntakeOpen, setPassportIntakeOpen] = useState(false)
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [slipModalOpen, setSlipModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await vendorApi.getVendor(id)
      setVendor(data)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!vendor && !loading) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Vendor not found.</p>
        <Button onClick={() => navigate('/vendors/list')}>Back to Vendor List</Button>
      </div>
    )
  }

  const fin = vendor?.financials || {}
  const bills = fin.bills || []
  const payments = fin.payments || []

  // Build Chronological Ledger Items
  const ledgerItems = []

  // 1. Opening Balance
  ledgerItems.push({
    id: 'opening',
    date: vendor?.joinedAt || '2025-01-01',
    type: 'Opening Balance',
    description: 'Initial Opening Due recorded on account setup',
    reference: 'LEDGER-START',
    debit: fin.openingDue > 0 ? fin.openingDue : 0,
    credit: fin.openingDue < 0 ? Math.abs(fin.openingDue) : 0,
    rawAmount: fin.openingDue || 0,
  })

  // 2. Bills (+ to due)
  bills.forEach((b) => {
    ledgerItems.push({
      id: b.id,
      date: b.billDate,
      type: 'Bill (Payable)',
      description: `${b.segment}: ${b.reference || b.notes || 'Service invoice'}`,
      reference: b.billNumber,
      debit: Number(b.amount || 0),
      credit: 0,
      rawAmount: Number(b.amount || 0),
    })
  })

  // 3. Payments (- to due)
  payments.forEach((p) => {
    ledgerItems.push({
      id: p.id,
      date: p.paymentDate,
      type: 'Payment (Disbursement)',
      description: `Paid via ${p.method} (${p.account || ''})`,
      reference: p.voucherNumber,
      debit: 0,
      credit: Number(p.amount || 0),
      rawAmount: -Number(p.amount || 0),
    })
  })

  // Sort chronological
  ledgerItems.sort((a, b) => new Date(a.date) - new Date(b.date))

  // Calculate Running Balance line by line
  let running = 0
  const ledgerWithRunningBalance = ledgerItems.map((item) => {
    running += item.rawAmount
    return {
      ...item,
      runningBalance: running,
    }
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigate('/vendors/list')}
            className="rounded-xl cursor-pointer"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                {vendor?.company || 'Vendor Details'}
              </h1>
              <Badge variant="outline" className="text-xs">
                {vendor?.status?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Partner ID: {vendor?.id} · Joined {formatDate(vendor?.joinedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-xs h-9 cursor-pointer"
            onClick={() => setRecordBillOpen(true)}
          >
            <ReceiptText className="size-4 text-primary" />
            <span>Record Bill</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-xs h-9 cursor-pointer"
            onClick={() => setRecordPaymentOpen(true)}
          >
            <CreditCard className="size-4 text-emerald-600" />
            <span>Record Payment</span>
          </Button>

          <Button
            size="sm"
            variant="default"
            className="rounded-xl gap-1.5 text-xs h-9 cursor-pointer shadow-xs"
            onClick={() => setPassportIntakeOpen(true)}
          >
            <KeyRound className="size-4" />
            <span>Passport Intake</span>
          </Button>
        </div>
      </div>

      {/* Dynamic Ledger Financial Banner */}
      <Card className="border-primary/20 bg-gradient-to-r from-card via-background to-primary/5 shadow-xs">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            {/* Opening Due */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                1. Opening Ledger Due
              </p>
              <div className="text-xl font-bold font-mono text-muted-foreground">
                {formatCurrency(fin.openingDue || 0, 'BDT')}
              </div>
              <p className="text-[11px] text-muted-foreground">Baseline setup amount</p>
            </div>

            {/* Total Bills */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                2. Total Billed (+)
              </p>
              <div className="text-xl font-bold font-mono text-foreground">
                +{formatCurrency(fin.totalBills || 0, 'BDT')}
              </div>
              <p className="text-[11px] text-muted-foreground">{fin.billCount || 0} recorded invoices</p>
            </div>

            {/* Total Payments */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                3. Total Payments (-)
              </p>
              <div className="text-xl font-bold font-mono text-emerald-600">
                -{formatCurrency(fin.totalPayments || 0, 'BDT')}
              </div>
              <p className="text-[11px] text-muted-foreground">{fin.paymentCount || 0} payment vouchers</p>
            </div>

            {/* Resulting Dynamic Due */}
            <div className="p-3.5 rounded-2xl bg-muted/60 border border-border/70 space-y-1 text-left sm:text-right">
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                Current Dynamic Due
              </p>
              <div>
                <VendorDueBadge amount={fin.dynamicDue || 0} className="text-sm px-3 py-1 font-bold" />
              </div>
              <p className="text-[10.5px] text-muted-foreground font-mono">
                = Opening + Bills - Payments
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Profile Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 flex items-center gap-3 border-border/80">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="size-4" />
          </div>
          <div>
            <p className="text-muted-foreground">Contact Person</p>
            <p className="font-semibold text-foreground text-sm">{vendor?.name || '—'}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-border/80">
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <Phone className="size-4" />
          </div>
          <div>
            <p className="text-muted-foreground">Mobile & WhatsApp</p>
            <p className="font-semibold text-foreground text-sm">{vendor?.phone || '—'}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3 border-border/80">
          <div className="size-9 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
            <Mail className="size-4" />
          </div>
          <div>
            <p className="text-muted-foreground">Email Address</p>
            <p className="font-semibold text-foreground text-sm truncate">{vendor?.email || '—'}</p>
          </div>
        </Card>
      </div>

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="ledger">Running Financial Ledger</TabsTrigger>
          <TabsTrigger value="services">Service Breakdown ({vendor?.serviceBreakdown?.length || 0})</TabsTrigger>
          <TabsTrigger value="bills">Bills ({bills.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="passports">Passports ({vendor?.passports?.length || 0})</TabsTrigger>
        </TabsList>

        {/* Tab 1: Running Financial Ledger */}
        <TabsContent value="ledger">
          <Card className="border-border/80">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Chronological Transaction Ledger</CardTitle>
                <CardDescription className="text-xs">
                  Line-by-line running balance audit. Every bill debits and payment credits the ledger.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-8 cursor-pointer"
                onClick={() => window.print()}
              >
                <Printer className="size-3.5" />
                <span>Print Ledger</span>
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-y border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Date</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3">Transaction Details</th>
                      <th className="p-3 text-right">Debit (+)</th>
                      <th className="p-3 text-right">Credit (-)</th>
                      <th className="p-3 text-right pr-4">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {ledgerWithRunningBalance.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 pl-4 font-mono text-muted-foreground whitespace-nowrap">
                          {formatDate(item.date)}
                        </td>
                        <td className="p-3 font-mono font-semibold text-primary">
                          {item.reference}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-foreground">{item.type}</span>
                          <p className="text-[11px] text-muted-foreground">{item.description}</p>
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-foreground">
                          {item.debit > 0 ? `+${formatCurrency(item.debit, 'BDT')}` : '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-medium text-emerald-600">
                          {item.credit > 0 ? `-${formatCurrency(item.credit, 'BDT')}` : '—'}
                        </td>
                        <td className="p-3 text-right pr-4">
                          <VendorDueBadge amount={item.runningBalance} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Service Segment Breakdown */}
        <TabsContent value="services">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base font-bold">Assigned Service Segment Performance</CardTitle>
              <CardDescription className="text-xs">
                Segment-specific due and expense tracking for {vendor?.company}.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-y border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Service Segment</th>
                      <th className="p-3 text-center">Billed Invoices</th>
                      <th className="p-3 text-center">Passports Tracked</th>
                      <th className="p-3 text-right pr-4">Total Billed Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(vendor?.serviceBreakdown || []).map((seg) => (
                      <tr key={seg.segment} className="hover:bg-muted/30">
                        <td className="p-3 pl-4 font-semibold text-foreground flex items-center gap-2">
                          <Layers className="size-4 text-primary" />
                          <span>{seg.segment}</span>
                        </td>
                        <td className="p-3 text-center">{seg.billCount}</td>
                        <td className="p-3 text-center font-bold text-foreground">
                          {seg.passportCount}
                        </td>
                        <td className="p-3 text-right pr-4 font-mono font-semibold text-foreground">
                          {formatCurrency(seg.billedAmount, 'BDT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Bills */}
        <TabsContent value="bills">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Vendor Bills & Invoices</CardTitle>
                <CardDescription className="text-xs">List of invoices billed by {vendor?.company}.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setRecordBillOpen(true)} className="gap-1.5 text-xs h-8 cursor-pointer">
                <Plus className="size-3.5" />
                <span>Record Bill</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-y border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Bill No</th>
                      <th className="p-3">Segment</th>
                      <th className="p-3">Reference / PNR</th>
                      <th className="p-3">Bill Date</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3 text-right pr-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {bills.map((b) => (
                      <tr key={b.id} className="hover:bg-muted/30">
                        <td className="p-3 pl-4 font-mono font-semibold text-primary">{b.billNumber}</td>
                        <td className="p-3 font-medium">{b.segment}</td>
                        <td className="p-3 text-muted-foreground">{b.reference}</td>
                        <td className="p-3 font-mono text-muted-foreground">{formatDate(b.billDate)}</td>
                        <td className="p-3 font-mono text-muted-foreground">{formatDate(b.dueDate)}</td>
                        <td className="p-3 text-right pr-4 font-mono font-bold text-foreground">
                          {formatCurrency(b.amount, 'BDT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Payments */}
        <TabsContent value="payments">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Disbursed Payment Vouchers</CardTitle>
                <CardDescription className="text-xs">Payment disbursements issued to {vendor?.company}.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setRecordPaymentOpen(true)} className="gap-1.5 text-xs h-8 cursor-pointer">
                <Plus className="size-3.5" />
                <span>Issue Payment</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-y border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Voucher No</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Method</th>
                      <th className="p-3">Disbursing Account</th>
                      <th className="p-3">Reference / TrxID</th>
                      <th className="p-3 text-right pr-4">Paid Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="p-3 pl-4 font-mono font-semibold text-emerald-600">{p.voucherNumber}</td>
                        <td className="p-3 font-mono text-muted-foreground">{formatDate(p.paymentDate)}</td>
                        <td className="p-3 font-medium">{p.method}</td>
                        <td className="p-3 text-muted-foreground">{p.account}</td>
                        <td className="p-3 font-mono text-muted-foreground">{p.reference || '—'}</td>
                        <td className="p-3 text-right pr-4 font-mono font-bold text-emerald-600">
                          {formatCurrency(p.amount, 'BDT')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Passports */}
        <TabsContent value="passports">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Passports Received & In Custody</CardTitle>
                <CardDescription className="text-xs">
                  Physical travel documents provided by {vendor?.company}.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setPassportIntakeOpen(true)} className="gap-1.5 text-xs h-8 cursor-pointer">
                <Plus className="size-3.5" />
                <span>Intake Passports</span>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-y border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Passenger Name</th>
                      <th className="p-3">Passport Number</th>
                      <th className="p-3">Segment</th>
                      <th className="p-3">Destination</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right pr-4">Acknowledgement Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {(vendor?.passports || []).map((p) => (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="p-3 pl-4 font-semibold text-foreground">{p.holderName}</td>
                        <td className="p-3 font-mono font-bold text-primary">{p.passportNumber}</td>
                        <td className="p-3 font-medium">{p.serviceSegment}</td>
                        <td className="p-3 text-muted-foreground">{p.country}</td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px]">
                            {p.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right pr-4">
                          <Button
                            variant="ghost"
                            size="xs"
                            className="h-7 text-xs text-primary gap-1 cursor-pointer"
                            onClick={async () => {
                              const slip = await vendorApi.getAcknowledgementSlip(p.acknowledgementSlipId)
                              setSelectedSlip(slip)
                              setSlipModalOpen(true)
                            }}
                          >
                            <Printer className="size-3" />
                            <span>Slip</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <RecordBillModal
        open={recordBillOpen}
        onOpenChange={setRecordBillOpen}
        vendors={[vendor]}
        defaultVendorId={vendor?.id}
        onSubmit={async (data) => {
          await vendorApi.createBill(data)
          await loadData()
        }}
      />

      <RecordPaymentModal
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        vendors={[vendor]}
        defaultVendorId={vendor?.id}
        onSubmit={async (data) => {
          await vendorApi.createPayment(data)
          await loadData()
        }}
      />

      <AddPassportModal
        open={passportIntakeOpen}
        onOpenChange={setPassportIntakeOpen}
        vendors={[vendor]}
        defaultVendorId={vendor?.id}
        onSubmit={async (data) => {
          const res = await vendorApi.createPassportIntake(data)
          await loadData()
          if (res?.slip) {
            setSelectedSlip(res.slip)
            setSlipModalOpen(true)
          }
        }}
      />

      <AcknowledgementSlipModal
        slip={selectedSlip}
        open={slipModalOpen}
        onOpenChange={setSlipModalOpen}
      />
    </div>
  )
}
