import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import RecordPaymentModal from '../components/RecordPaymentModal'
import { vendorApi } from '../vendor.api'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { CreditCard, Plus, Search, Building2, Calendar, Landmark, ArrowRight } from 'lucide-react'

export default function VendorPayments() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('ALL')
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [paymentsRes, vendorsRes] = await Promise.all([
        vendorApi.listPayments({ pageSize: 100 }),
        vendorApi.listVendors({ pageSize: 50 }),
      ])
      setPayments(paymentsRes.items || [])
      setVendors(vendorsRes.items || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreatePayment = async (data) => {
    await vendorApi.createPayment(data)
    await loadData()
  }

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      p.voucherNumber?.toLowerCase().includes(q) ||
      p.vendorName?.toLowerCase().includes(q) ||
      p.reference?.toLowerCase().includes(q) ||
      p.account?.toLowerCase().includes(q)

    const matchesMethod = methodFilter === 'ALL' || p.method?.includes(methodFilter)

    return matchesSearch && matchesMethod
  })

  const totalPaid = filteredPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Vendor Disbursements & Payment Vouchers"
          description="Issue and track payment vouchers. Disbursements directly credit running ledgers and reduce dynamic dues."
          breadcrumbs={[{ label: 'Vendors' }, { label: 'Payments' }]}
        />
        <Button
          onClick={() => setRecordPaymentOpen(true)}
          className="rounded-xl gap-2 shadow-xs cursor-pointer h-10 px-4"
        >
          <CreditCard className="size-4" />
          <span>Issue Payment Voucher</span>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Vouchers Issued
            </p>
            <p className="text-2xl font-bold font-mono text-foreground">{filteredPayments.length}</p>
            <p className="text-[11px] text-muted-foreground">Settlement transactions</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Disbursed Volume
            </p>
            <p className="text-2xl font-bold font-mono text-emerald-600">
              {formatCurrency(totalPaid, 'BDT')}
            </p>
            <p className="text-[11px] text-muted-foreground">Credited against vendor dues</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Payment Channels
            </p>
            <p className="text-2xl font-bold font-mono text-foreground">4 Gateways</p>
            <p className="text-[11px] text-muted-foreground">Bank, Cheque, MFS, Cash</p>
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
                placeholder="Search voucher number, vendor agency, TrxID, cheque no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs sm:text-sm"
              />
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0 font-medium">Method:</span>
              <select
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs sm:text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
              >
                <option value="ALL">All Payment Methods</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="MFS">MFS (bKash/Nagad)</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/80">
                <tr>
                  <th className="p-3 pl-4">Voucher No</th>
                  <th className="p-3">Vendor Recipient</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Disbursing Account</th>
                  <th className="p-3">Reference / TrxID</th>
                  <th className="p-3 text-right">Disbursed Amount</th>
                  <th className="p-3 text-right pr-4">Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No payment vouchers found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-sm text-emerald-600">
                        {p.voucherNumber}
                      </td>

                      <td className="p-3 font-semibold text-foreground">
                        {p.vendorName}
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        {formatDate(p.paymentDate)}
                      </td>

                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px]">
                          {p.method}
                        </Badge>
                      </td>

                      <td className="p-3 text-muted-foreground">
                        {p.account}
                      </td>

                      <td className="p-3 font-mono text-muted-foreground">
                        {p.reference || '—'}
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(p.amount, 'BDT')}
                      </td>

                      <td className="p-3 text-right pr-4">
                        <Button
                          variant="ghost"
                          size="xs"
                          className="h-7 text-xs text-primary gap-1 cursor-pointer"
                          onClick={() => navigate(`/vendors/${p.vendorId}`)}
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
      <RecordPaymentModal
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        vendors={vendors}
        onSubmit={handleCreatePayment}
      />
    </div>
  )
}
