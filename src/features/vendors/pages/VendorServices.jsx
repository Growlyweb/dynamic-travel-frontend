import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import AddPassportModal from '../components/AddPassportModal'
import AcknowledgementSlipModal from '../components/AcknowledgementSlipModal'
import { vendorApi } from '../vendor.api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import {
  KeyRound,
  Layers,
  Search,
  Plus,
  Printer,
  FileCheck2,
  Plane,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'

const SEGMENT_METRICS_CONFIG = [
  { name: 'Air Tickets', icon: Plane, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/40' },
  { name: 'Visas', icon: FileCheck2, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' },
  { name: 'Passports', icon: KeyRound, color: 'text-primary bg-primary/10' },
  { name: 'Umrah', icon: Layers, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' },
  { name: 'Hajj', icon: Layers, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40' },
  { name: 'Hotels', icon: Building, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' },
]

export default function VendorServices() {
  const [vendors, setVendors] = useState([])
  const [passports, setPassports] = useState([])
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [segmentFilter, setSegmentFilter] = useState('ALL')

  // Modals
  const [intakeOpen, setIntakeOpen] = useState(false)
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [slipModalOpen, setSlipModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vendorsRes, passportsRes, billsRes] = await Promise.all([
        vendorApi.listVendors({ pageSize: 50 }),
        vendorApi.listPassports({ pageSize: 50 }),
        vendorApi.listBills({ pageSize: 100 }),
      ])
      setVendors(vendorsRes.items || [])
      setPassports(passportsRes.items || [])
      setBills(billsRes.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleStatusChange = async (id, newStatus) => {
    await vendorApi.updatePassportStatus(id, newStatus)
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

  const filteredPassports = passports.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      p.holderName?.toLowerCase().includes(q) ||
      p.passportNumber?.toLowerCase().includes(q) ||
      p.vendorName?.toLowerCase().includes(q) ||
      p.country?.toLowerCase().includes(q)

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    const matchesSegment = segmentFilter === 'ALL' || p.serviceSegment === segmentFilter

    return matchesSearch && matchesStatus && matchesSegment
  })

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Passport & Service Segment Operations"
          description="Track physical travel documents, custody state, service segments, and linked Acknowledgement Slips."
          breadcrumbs={[{ label: 'Vendors' }, { label: 'Services & Passports' }]}
        />
        <Button
          onClick={() => setIntakeOpen(true)}
          className="rounded-xl gap-2 shadow-xs cursor-pointer h-10 px-4"
        >
          <KeyRound className="size-4" />
          <span>Intake Passports & Generate Slip</span>
        </Button>
      </div>

      {/* Segment Cards Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {SEGMENT_METRICS_CONFIG.map((seg) => {
          const Icon = seg.icon
          const segPassports = passports.filter((p) => p.serviceSegment === seg.name)
          const segBills = bills.filter((b) => b.segment === seg.name)
          const totalBilled = segBills.reduce((acc, b) => acc + Number(b.amount || 0), 0)

          return (
            <Card key={seg.name} className="p-3.5 space-y-2 border-border/80 hover:shadow-xs transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground truncate">{seg.name}</span>
                <div className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${seg.color}`}>
                  <Icon className="size-3.5" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-foreground truncate">
                  {formatCurrency(totalBilled, 'BDT')}
                </p>
                <p className="text-[10.5px] text-muted-foreground mt-0.5">
                  {segPassports.length} passports in cycle
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Search & Filter */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search passport number, traveler name, agency, country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">Status:</span>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Custody States</option>
                <option value="received">In Vault / Received</option>
                <option value="in_embassy">In Embassy / VFS</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="delivered">Delivered / Handed Over</option>
              </select>
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">Segment:</span>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                <option value="ALL">All Segments</option>
                <option value="Umrah">Umrah</option>
                <option value="Visas">Visas</option>
                <option value="Passports">Passports</option>
                <option value="Hajj">Hajj</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passport Custody Tracking Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/80">
                <tr>
                  <th className="p-3 pl-4">Passport Number</th>
                  <th className="p-3">Passenger / Holder</th>
                  <th className="p-3">Vendor Agency</th>
                  <th className="p-3">Segment & Country</th>
                  <th className="p-3">Intake Date</th>
                  <th className="p-3">Expected Return</th>
                  <th className="p-3">Custody Status</th>
                  <th className="p-3 text-right pr-4">Acknowledgement Slip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPassports.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No passports match the current search or status filters.
                    </td>
                  </tr>
                ) : (
                  filteredPassports.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-sm text-primary">
                        {p.passportNumber}
                      </td>

                      <td className="p-3 font-semibold text-foreground">
                        {p.holderName}
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {p.vendorName}
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-foreground">{p.serviceSegment}</span>
                        <span className="text-muted-foreground"> ({p.country})</span>
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        {formatDate(p.submissionDate)}
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        {formatDate(p.deliveryExpected)}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <select
                            className="h-7 px-2 rounded-lg border border-input bg-background text-[11px] font-medium text-foreground outline-none cursor-pointer"
                            value={p.status}
                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                          >
                            <option value="received">In Vault</option>
                            <option value="in_embassy">In Embassy</option>
                            <option value="ready_for_pickup">Ready for Pickup</option>
                            <option value="delivered">Delivered</option>
                          </select>
                        </div>
                      </td>

                      <td className="p-3 text-right pr-4">
                        <Button
                          variant="outline"
                          size="xs"
                          className="h-7 text-xs text-primary gap-1.5 cursor-pointer"
                          onClick={async () => {
                            const slip = await vendorApi.getAcknowledgementSlip(p.acknowledgementSlipId)
                            setSelectedSlip(slip)
                            setSlipModalOpen(true)
                          }}
                        >
                          <Printer className="size-3" />
                          <span>View Slip</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddPassportModal
        open={intakeOpen}
        onOpenChange={setIntakeOpen}
        vendors={vendors}
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
