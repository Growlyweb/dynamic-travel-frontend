import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import RecordBillModal from '../components/RecordBillModal'
import { vendorApi } from '../vendor.api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { ReceiptText, Plus, Search, Building2, Calendar, FileText, ArrowRight } from 'lucide-react'

export default function VendorBills() {
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('ALL')
  const [recordBillOpen, setRecordBillOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [billsRes, vendorsRes] = await Promise.all([
        vendorApi.listBills({ pageSize: 100 }),
        vendorApi.listVendors({ pageSize: 50 }),
      ])
      setBills(billsRes.items || [])
      setVendors(vendorsRes.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateBill = async (data) => {
    await vendorApi.createBill(data)
    await loadData()
  }

  const filteredBills = bills.filter((b) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      b.billNumber?.toLowerCase().includes(q) ||
      b.vendorName?.toLowerCase().includes(q) ||
      b.reference?.toLowerCase().includes(q) ||
      b.notes?.toLowerCase().includes(q)

    const matchesSegment = segmentFilter === 'ALL' || b.segment === segmentFilter

    return matchesSearch && matchesSegment
  })

  const totalBilled = filteredBills.reduce((acc, b) => acc + Number(b.amount || 0), 0)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Vendor Invoices & Bills Payable"
          description="Track incoming bills across Air Tickets, Visas, Umrah, Hotels, and calculate dynamic ledger dues."
          breadcrumbs={[{ label: 'Vendors' }, { label: 'Bills' }]}
        />
        <Button
          onClick={() => setRecordBillOpen(true)}
          className="rounded-xl gap-2 shadow-xs cursor-pointer h-10 px-4"
        >
          <Plus className="size-4" />
          <span>Record New Bill</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Invoices Count
            </p>
            <p className="text-2xl font-bold font-mono text-foreground">{filteredBills.length}</p>
            <p className="text-[11px] text-muted-foreground">Recorded supplier invoices</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Billed Amount
            </p>
            <p className="text-2xl font-bold font-mono text-primary">
              {formatCurrency(totalBilled, 'BDT')}
            </p>
            <p className="text-[11px] text-muted-foreground">Added to vendor running dues</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Suppliers
            </p>
            <p className="text-2xl font-bold font-mono text-foreground">{vendors.length}</p>
            <p className="text-[11px] text-muted-foreground">Registered billing partners</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-border/80 shadow-xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-8 relative">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search bill number, vendor agency, reference, PNR..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">Segment:</span>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={segmentFilter}
                onChange={(e) => setSegmentFilter(e.target.value)}
              >
                <option value="ALL">All Service Segments</option>
                <option value="Air Tickets">Air Tickets</option>
                <option value="Visas">Visas</option>
                <option value="Passports">Passports</option>
                <option value="Umrah">Umrah</option>
                <option value="Hajj">Hajj</option>
                <option value="Hotels">Hotels</option>
                <option value="Transport">Transport</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/80">
                <tr>
                  <th className="p-3 pl-4">Bill No</th>
                  <th className="p-3">Vendor Agency</th>
                  <th className="p-3">Segment</th>
                  <th className="p-3">Reference / PNR / Sector</th>
                  <th className="p-3">Bill Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-right pr-4">Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No bills found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-sm text-primary">
                        {b.billNumber}
                      </td>

                      <td className="p-3 font-semibold text-foreground">
                        {b.vendorName}
                      </td>

                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {b.segment}
                        </Badge>
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {b.reference || '—'}
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        {formatDate(b.billDate)}
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        {formatDate(b.dueDate)}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {formatCurrency(b.amount, 'BDT')}
                      </td>

                      <td className="p-3 text-right pr-4">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-primary gap-1 cursor-pointer"
                          onClick={() => navigate(`/vendors/${b.vendorId}`)}
                        >
                          <span>Ledger</span>
                          <ArrowRight className="size-3" />
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

      {/* Modal */}
      <RecordBillModal
        open={recordBillOpen}
        onOpenChange={setRecordBillOpen}
        vendors={vendors}
        onSubmit={handleCreateBill}
      />
    </div>
  )
}
