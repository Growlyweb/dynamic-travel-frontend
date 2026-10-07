import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/layout/PageHeader'
import VendorDueBadge from '../components/VendorDueBadge'
import VendorQuickDropdown from '../components/VendorQuickDropdown'
import AddVendorModal from '../components/AddVendorModal'
import RecordBillModal from '../components/RecordBillModal'
import RecordPaymentModal from '../components/RecordPaymentModal'
import AddPassportModal from '../components/AddPassportModal'
import AcknowledgementSlipModal from '../components/AcknowledgementSlipModal'
import CampaignComposeModal from '../components/CampaignComposeModal'
import { vendorApi } from '../vendor.api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  Building2,
  ReceiptText,
  CreditCard,
  KeyRound,
  Send,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  Printer,
  Layers,
  ArrowUpRight,
  Calculator,
} from 'lucide-react'

export default function VendorDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState(null)
  const [vendors, setVendors] = useState([])
  const [recentBills, setRecentBills] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [recentPassports, setRecentPassports] = useState([])

  // Modal States
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [recordBillOpen, setRecordBillOpen] = useState(false)
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [passportIntakeOpen, setPassportIntakeOpen] = useState(false)
  const [campaignOpen, setCampaignOpen] = useState(false)
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [slipModalOpen, setSlipModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [metricsRes, vendorsRes, billsRes, paymentsRes, passportsRes] = await Promise.all([
        vendorApi.getDashboardMetrics(),
        vendorApi.listVendors({ pageSize: 10 }),
        vendorApi.listBills({ pageSize: 5 }),
        vendorApi.listPayments({ pageSize: 5 }),
        vendorApi.listPassports({ pageSize: 5 }),
      ])
      setMetrics(metricsRes)
      setVendors(vendorsRes.items || [])
      setRecentBills(billsRes.items || [])
      setRecentPayments(paymentsRes.items || [])
      setRecentPassports(passportsRes.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateVendor = async (data) => {
    await vendorApi.createVendor(data)
    await loadData()
  }

  const handleCreateBill = async (data) => {
    await vendorApi.createBill(data)
    await loadData()
  }

  const handleCreatePayment = async (data) => {
    await vendorApi.createPayment(data)
    await loadData()
  }

  const handlePassportIntake = async (data) => {
    const res = await vendorApi.createPassportIntake(data)
    await loadData()
    if (res?.slip) {
      setSelectedSlip(res.slip)
      setSlipModalOpen(true)
    }
  }

  const handleCreateCampaign = async (data) => {
    await vendorApi.createCampaign(data)
    await loadData()
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Vendor Management & Operations"
            description="Manage agency partners, track dynamic dues, monitor passport processing, and broadcast marketing automation campaigns."
            breadcrumbs={[{ label: 'Vendors' }, { label: 'Dashboard' }]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <VendorQuickDropdown
            vendors={vendors}
            onSelectVendor={(v) => navigate(`/vendors/${v.id}`)}
            onAddNewVendor={() => setAddVendorOpen(true)}
          />
        </div>
      </div>

      {/* Dynamic Financial Formula Callout Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-background to-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
            <Calculator className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Real-Time Dynamic Financial Ledger Rule
              </span>
              <Badge variant="outline" className="text-[10px] py-0">
                Non-Static Live Computation
              </Badge>
            </div>
            <p className="text-xs font-mono font-medium text-foreground mt-0.5">
              Due = Opening Due + Total Bills - Total Payments
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
            <span className="size-2 rounded-full bg-rose-500 inline-block"></span> Red: Positive Due (&gt;0)
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 inline-block"></span> Green: Settled (0)
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-sky-600 dark:text-sky-400 font-bold flex items-center gap-1">
            <span className="size-2 rounded-full bg-sky-500 inline-block"></span> Blue: Advance (&lt;0)
          </span>
        </div>
      </div>

      {/* Main KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dynamic Due */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Outstanding Due
            </CardTitle>
            <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <AlertCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(metrics?.overallDynamicDue || 0, 'BDT')}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="font-semibold text-rose-600">{metrics?.positiveDueCount || 0}</span> vendors with pending dues
            </p>
          </CardContent>
        </Card>

        {/* Total Billed */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Recorded Bills
            </CardTitle>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ReceiptText className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(metrics?.totalBillsAmount || 0, 'BDT')}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Opening base: {formatCurrency(metrics?.totalOpeningDue || 0, 'BDT')}
            </p>
          </CardContent>
        </Card>

        {/* Total Disbursed Payments */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Disbursed Payments
            </CardTitle>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CreditCard className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {formatCurrency(metrics?.totalPaymentsAmount || 0, 'BDT')}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="font-semibold text-sky-600">{metrics?.advanceCount || 0}</span> vendors in advance credit
            </p>
          </CardContent>
        </Card>

        {/* Passport & Document Custody */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Passports in Operations
            </CardTitle>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <KeyRound className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {metrics?.totalPassports || 0} <span className="text-xs font-normal text-muted-foreground">in custody</span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="text-amber-600 font-semibold">{metrics?.inEmbassyPassports || 0} Embassy</span> ·{' '}
              <span className="text-emerald-600 font-semibold">{metrics?.readyPassports || 0} Ready</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Dock */}
      <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Quick Operations:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-xs h-9 cursor-pointer"
            onClick={() => setAddVendorOpen(true)}
          >
            <Building2 className="size-4 text-primary" />
            <span>Add Vendor</span>
          </Button>

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
            <span>Issue Payment</span>
          </Button>

          <Button
            size="sm"
            variant="default"
            className="rounded-xl gap-1.5 text-xs h-9 cursor-pointer shadow-xs"
            onClick={() => setPassportIntakeOpen(true)}
          >
            <KeyRound className="size-4" />
            <span>Passport Intake & Slip</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            className="rounded-xl gap-1.5 text-xs h-9 cursor-pointer"
            onClick={() => setCampaignOpen(true)}
          >
            <Send className="size-4 text-primary" />
            <span>Dispatch Campaign</span>
          </Button>
        </div>
      </div>

      {/* Two-Column Core Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Live Vendor Ledger & Dues */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Vendor Dynamic Dues & Balance Sheet</CardTitle>
                <CardDescription className="text-xs">
                  Real-time calculated dues per agency partner. Click any vendor to view running ledger.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-primary cursor-pointer"
                onClick={() => navigate('/vendors/list')}
              >
                <span>Full Directory</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-y border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Vendor Agency</th>
                      <th className="p-3">Assigned Segments</th>
                      <th className="p-3 text-right">Opening Due</th>
                      <th className="p-3 text-right">Bills</th>
                      <th className="p-3 text-right">Payments</th>
                      <th className="p-3 text-right pr-4">Dynamic Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {vendors.map((vendor) => {
                      const fin = vendor._calculated || {}
                      return (
                        <tr
                          key={vendor.id}
                          className="hover:bg-muted/40 cursor-pointer transition-colors"
                          onClick={() => navigate(`/vendors/${vendor.id}`)}
                        >
                          <td className="p-3 pl-4">
                            <div className="font-semibold text-foreground text-sm">
                              {vendor.company}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                              <span>{vendor.name}</span>
                              <span>•</span>
                              <span>{vendor.phone}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {vendor.segments?.map((seg) => (
                                <span
                                  key={seg}
                                  className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium"
                                >
                                  {seg}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono text-muted-foreground">
                            {formatCurrency(fin.openingDue || 0, 'BDT')}
                          </td>
                          <td className="p-3 text-right font-mono text-foreground font-medium">
                            +{formatCurrency(fin.totalBills || 0, 'BDT')}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-600 font-medium">
                            -{formatCurrency(fin.totalPayments || 0, 'BDT')}
                          </td>
                          <td className="p-3 text-right pr-4">
                            <VendorDueBadge amount={fin.dynamicDue || 0} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Active Passport Processing Desk */}
          <Card className="border-border/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Active Passport Intake & Visas</CardTitle>
                <CardDescription className="text-xs">
                  Physical document custody tracking with linked Acknowledgement Slips.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-primary cursor-pointer"
                onClick={() => navigate('/vendors/services')}
              >
                <span>View All Passports</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-y border-border/80">
                    <tr>
                      <th className="p-3 pl-4">Passenger Name</th>
                      <th className="p-3">Passport No</th>
                      <th className="p-3">Vendor Agency</th>
                      <th className="p-3">Segment & Country</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right pr-4">Slip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {recentPassports.map((p) => (
                      <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                        <td className="p-3 pl-4 font-semibold text-foreground">
                          {p.holderName}
                        </td>
                        <td className="p-3 font-mono font-bold text-primary">
                          {p.passportNumber}
                        </td>
                        <td className="p-3 text-muted-foreground">{p.vendorName}</td>
                        <td className="p-3">
                          <span className="font-medium text-foreground">{p.serviceSegment}</span>
                          <span className="text-muted-foreground"> ({p.country})</span>
                        </td>
                        <td className="p-3">
                          {p.status === 'in_embassy' && (
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300">
                              In Embassy
                            </Badge>
                          )}
                          {p.status === 'ready_for_pickup' && (
                            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300">
                              Ready for Pickup
                            </Badge>
                          )}
                          {p.status === 'delivered' && (
                            <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300">
                              Delivered
                            </Badge>
                          )}
                          {p.status === 'received' && (
                            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300">
                              In Vault
                            </Badge>
                          )}
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
        </div>

        {/* Right Column (1 Col): Marketing & Automated Workflows */}
        <div className="space-y-6">
          {/* Automated Workflows Widget */}
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <Sparkles className="size-4 text-primary" /> Automated Sequences
                </CardTitle>
                <Badge variant="secondary" className="text-[10px]">
                  {metrics?.activeWorkflowsCount || 4} Active
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Audio/SMS/Email automated workflow triggers running in real-time.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Passport Auto Slip Notice</span>
                  <span className="text-emerald-600 text-[10px] font-bold">ENABLED</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Triggers SMS & printable PDF slip upon passport intake.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Embassy Submission Alert</span>
                  <span className="text-emerald-600 text-[10px] font-bold">ENABLED</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Automated email to agency partner when passport arrives at consulate.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Dynamic Due Payment Notice</span>
                  <span className="text-emerald-600 text-[10px] font-bold">ENABLED</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Dispatches ledger balance summary if positive due &gt; 0 on 1st of month.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full text-xs h-9 rounded-xl cursor-pointer"
                onClick={() => navigate('/vendors/marketing')}
              >
                <span>Manage All Automations</span>
                <ArrowRight className="size-3.5 ml-1 text-primary" />
              </Button>
            </CardContent>
          </Card>

          {/* Marketing Contacts & Broadcast Hub */}
          <Card className="border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <Send className="size-4 text-primary" /> Synced Marketing Hub
              </CardTitle>
              <CardDescription className="text-xs">
                {metrics?.contactsCount || 5} contacts automatically synced from vendor profiles.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs space-y-2">
                <p className="text-foreground font-semibold">
                  Launch Ramadan & Winter Promo Campaign
                </p>
                <p className="text-muted-foreground text-[11px]">
                  Send tailored B2B bulk SMS and WhatsApp brochures directly to agencies.
                </p>
                <Button
                  size="sm"
                  className="w-full text-xs h-8 rounded-lg shadow-xs cursor-pointer gap-1"
                  onClick={() => setCampaignOpen(true)}
                >
                  <Send className="size-3.5" />
                  <span>Compose Offer Broadcast</span>
                </Button>
              </div>

              <div className="space-y-2 pt-1 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Recent Campaign</span>
                  <span className="font-semibold text-emerald-600">Delivered (97%)</span>
                </div>
                <p className="text-foreground font-medium truncate">
                  Ramadan 2026 Umrah Flight & Clock Tower Block Fares
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <AddVendorModal
        open={addVendorOpen}
        onOpenChange={setAddVendorOpen}
        onSubmit={handleCreateVendor}
      />

      <RecordBillModal
        open={recordBillOpen}
        onOpenChange={setRecordBillOpen}
        vendors={vendors}
        onSubmit={handleCreateBill}
      />

      <RecordPaymentModal
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        vendors={vendors}
        onSubmit={handleCreatePayment}
      />

      <AddPassportModal
        open={passportIntakeOpen}
        onOpenChange={setPassportIntakeOpen}
        vendors={vendors}
        onSubmit={handlePassportIntake}
      />

      <AcknowledgementSlipModal
        slip={selectedSlip}
        open={slipModalOpen}
        onOpenChange={setSlipModalOpen}
      />

      <CampaignComposeModal
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        totalContacts={metrics?.contactsCount || 5}
        onSubmit={handleCreateCampaign}
      />
    </div>
  )
}
