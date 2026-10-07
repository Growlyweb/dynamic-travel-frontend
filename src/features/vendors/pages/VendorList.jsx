import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import VendorDueBadge from '../components/VendorDueBadge'
import AddVendorModal from '../components/AddVendorModal'
import RecordBillModal from '../components/RecordBillModal'
import RecordPaymentModal from '../components/RecordPaymentModal'
import AddPassportModal from '../components/AddPassportModal'
import AcknowledgementSlipModal from '../components/AcknowledgementSlipModal'
import { vendorApi } from '../vendor.api'
import { formatCurrency } from '@/utils/formatters'
import {
  Building2,
  Search,
  Plus,
  ReceiptText,
  CreditCard,
  KeyRound,
  ExternalLink,
  Phone,
  Mail,
  SlidersHorizontal,
  FileText,
} from 'lucide-react'

const SEGMENTS = ['ALL', 'Air Tickets', 'Visas', 'Passports', 'Umrah', 'Hajj', 'Hotels', 'Transport']

export default function VendorList() {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('ALL')
  const [dueFilter, setDueFilter] = useState('ALL')

  // Modals
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [recordBillOpen, setRecordBillOpen] = useState(false)
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [passportIntakeOpen, setPassportIntakeOpen] = useState(false)
  const [activeVendorForAction, setActiveVendorForAction] = useState(null)
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [slipModalOpen, setSlipModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await vendorApi.listVendors({ pageSize: 50 })
      setVendors(res.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filteredVendors = vendors.filter((v) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      v.company?.toLowerCase().includes(q) ||
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.phone?.toLowerCase().includes(q)

    const matchesSegment = segmentFilter === 'ALL' || v.segments?.includes(segmentFilter)

    const finDue = v.dynamicDue ?? v._calculated?.dynamicDue ?? 0
    let matchesDue = true
    if (dueFilter === 'positive') matchesDue = finDue > 0
    else if (dueFilter === 'settled') matchesDue = finDue === 0
    else if (dueFilter === 'advance') matchesDue = finDue < 0

    return matchesSearch && matchesSegment && matchesDue
  })

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

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Vendor Directory & Suppliers"
          description="Comprehensive partner registry with real-time dynamic dues, service segments, and financial ledger."
          breadcrumbs={[{ label: 'Vendors' }, { label: 'Vendor List' }]}
        />
        <Button
          onClick={() => setAddVendorOpen(true)}
          className="rounded-xl gap-2 shadow-xs cursor-pointer h-10 px-4"
        >
          <Plus className="size-4" />
          <span>Register New Vendor</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search vendor name, agency, phone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs sm:text-sm"
              />
            </div>

            {/* Segment Dropdown */}
            <div className="md:col-span-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">Segment:</span>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                {SEGMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s === 'ALL' ? 'All Segments' : s}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Balance Status Filter */}
            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">Balance:</span>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={dueFilter}
                onChange={(e) => setDueFilter(e.target.value)}
              >
                <option value="ALL">All Balances</option>
                <option value="positive">Pending Due (Red)</option>
                <option value="settled">Settled (Green)</option>
                <option value="advance">Advance Credit (Blue)</option>
              </select>
            </div>
          </div>

          {/* Quick Segment Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground mr-1">Quick Filter:</span>
            {SEGMENTS.map((seg) => (
              <button
                key={seg}
                type="button"
                onClick={() => setSegmentFilter(seg)}
                className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  segmentFilter === seg
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {seg === 'ALL' ? 'All' : seg}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/80">
                <tr>
                  <th className="p-3 pl-4">Agency / Supplier</th>
                  <th className="p-3">Contact Person & Phone</th>
                  <th className="p-3">Service Segments</th>
                  <th className="p-3 text-center">Passports</th>
                  <th className="p-3 text-right">Opening Due</th>
                  <th className="p-3 text-right">Bills</th>
                  <th className="p-3 text-right">Payments</th>
                  <th className="p-3 text-right">Dynamic Due</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      No vendors found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => {
                    const fin = vendor._calculated || {}
                    const dynamicDue = fin.dynamicDue ?? vendor.dynamicDue ?? 0

                    return (
                      <tr key={vendor.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3 pl-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/vendors/${vendor.id}`)}
                            className="font-bold text-sm text-foreground hover:text-primary transition-colors text-left cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{vendor.company}</span>
                            <ExternalLink className="size-3 text-muted-foreground" />
                          </button>
                          <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                            {vendor.address || 'Dhaka, Bangladesh'}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-foreground">{vendor.name}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="size-3 text-primary" />
                            <span>{vendor.phone}</span>
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-[190px]">
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

                        <td className="p-3 text-center font-semibold text-foreground">
                          {vendor.passportCount || 0}
                        </td>

                        <td className="p-3 text-right font-mono text-muted-foreground">
                          {formatCurrency(fin.openingDue || vendor.openingDue || 0, 'BDT')}
                        </td>

                        <td className="p-3 text-right font-mono text-foreground font-medium">
                          +{formatCurrency(fin.totalBills || 0, 'BDT')}
                        </td>

                        <td className="p-3 text-right font-mono text-emerald-600 font-medium">
                          -{formatCurrency(fin.totalPayments || 0, 'BDT')}
                        </td>

                        <td className="p-3 text-right">
                          <VendorDueBadge amount={dynamicDue} />
                        </td>

                        <td className="p-3 text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Record Bill"
                              className="text-primary hover:bg-primary/10 cursor-pointer"
                              onClick={() => {
                                setActiveVendorForAction(vendor)
                                setRecordBillOpen(true)
                              }}
                            >
                              <ReceiptText className="size-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Record Payment"
                              className="text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              onClick={() => {
                                setActiveVendorForAction(vendor)
                                setRecordPaymentOpen(true)
                              }}
                            >
                              <CreditCard className="size-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon-xs"
                              title="Passport Intake"
                              className="text-amber-600 hover:bg-amber-50 cursor-pointer"
                              onClick={() => {
                                setActiveVendorForAction(vendor)
                                setPassportIntakeOpen(true)
                              }}
                            >
                              <KeyRound className="size-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="xs"
                              className="text-xs h-7 ml-1 cursor-pointer"
                              onClick={() => navigate(`/vendors/${vendor.id}`)}
                            >
                              Ledger
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
        defaultVendorId={activeVendorForAction?.id}
        onSubmit={handleCreateBill}
      />

      <RecordPaymentModal
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        vendors={vendors}
        defaultVendorId={activeVendorForAction?.id}
        onSubmit={handleCreatePayment}
      />

      <AddPassportModal
        open={passportIntakeOpen}
        onOpenChange={setPassportIntakeOpen}
        vendors={vendors}
        defaultVendorId={activeVendorForAction?.id}
        onSubmit={handlePassportIntake}
      />

      <AcknowledgementSlipModal
        slip={selectedSlip}
        open={slipModalOpen}
        onOpenChange={setSlipModalOpen}
      />
    </div>
  )
}
