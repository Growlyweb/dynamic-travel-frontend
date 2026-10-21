import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  Users,
  FileSpreadsheet,
  Printer,
  DollarSign,
  AlertCircle,
  Landmark,
} from 'lucide-react'

import { reportsApi, formatMoney, formatPercentVal } from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import ReportComparisonChart from '../components/ReportComparisonChart'
import ReportDonutChart from '../components/ReportDonutChart'
import {
  Table,
  TableCard,
  TableHeader,
  TableBadge,
} from '@/components/re-table'

export default function ReportOverview() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getFinancialOverview()
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load financial overview:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          // title="Financial Overview"
          // description="Operational financial reporting, sales channels & executive summary."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'Overview' }]}
        />
      </div>
    )
  }

  const {
    monthName,
    year,
    currentMonth,
    customerDues,
    b2bDues,
    b2cDues,
    vendorPayables,
    totalPartnerCapital,
    partnerA,
    partnerB,
    last6Months,
    topDues,
    categories,
    expensesBreakdown,
  } = data

  const handlePrint = () => {
    reportsApi.exportMonthlyReport(year, data.month, 'pdf')
  }

  const handleExcelExport = () => {
    reportsApi.exportMonthlyReport(year, data.month, 'excel')
  }

  // Canonical ReTable Columns matching project design
  const dueColumns = [
    {
      key: 'name',
      header: 'Agency / Client',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.contact}</span>
        </div>
      ),
    },
    {
      key: 't',
      header: 'Channel',
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded text-xs font-semibold ${row.t === 'B2B'
            ? 'bg-primary-soft text-primary'
            : 'bg-emerald-50 text-emerald-700'
            }`}
        >
          {row.t}
        </span>
      ),
    },
    {
      key: 'inv',
      header: 'Invoiced',
      align: 'right',
      render: (row) => formatMoney(row.inv),
    },
    {
      key: 'paid',
      header: 'Paid',
      align: 'right',
      render: (row) => (
        <span className="text-emerald-700 font-medium">{formatMoney(row.paid)}</span>
      ),
    },
    {
      key: 'due',
      header: 'Due Amount',
      align: 'right',
      render: (row) => (
        <span className="text-rose-600 font-bold">{formatMoney(row.due)}</span>
      ),
    },
    {
      key: 'collected',
      header: 'Collection Progress',
      render: (row) => {
        const pct = row.inv > 0 ? Math.min(100, Math.round((row.paid / row.inv) * 100)) : 0
        return (
          <div className="flex items-center gap-2 min-w-28">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground font-medium min-w-8">{pct}%</span>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => {
        const variant =
          row.status === 'Paid'
            ? 'success'
            : row.status === 'Partial'
              ? 'warning'
              : 'danger'
        return (
          <TableBadge type="status" variant={variant}>
            {row.status}
          </TableBadge>
        )
      },
    },
  ]

  // Category segments for Donut chart
  const categorySegments = categories.map((c) => ({
    label: c.n,
    value: currentMonth.by[c.n] || 0,
    color: c.c,
  }))

  // Channel segments for Donut chart
  const channelSegments = [
    { label: 'B2B Partners', value: currentMonth.b2b, color: '#0879E8' },
    { label: 'B2C Direct', value: currentMonth.b2c, color: '#16a34a' },
  ]

  const maxExpense = Math.max(1, ...expensesBreakdown.map((e) => e.amount))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Overview"
        // description={`${monthName} ${year} · Consolidated Operations & Revenue Performance · Currency: BDT (৳)`}
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'Overview' },
        ]}

      />


      {/* 1. Primary Highlight Metric Cards (Project Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportMetricCard
          label={`Selling Price · ${monthName}`}
          value={formatMoney(currentMonth.sell)}
          subtext={`${currentMonth.salesCount} sales this month`}
          // badge="Gross Sales"
          icon={TrendingUp}
          variant="primary"
        />
        <ReportMetricCard
          label={`Direct & Vendor Costs`}
          value={formatMoney(currentMonth.cost)}
          subtext="Direct package & visa costs"
          // badge="Direct Costs"
          icon={Receipt}
          variant="danger"
        />
        <ReportMetricCard
          label={`Net Operating Profit`}
          value={formatMoney(currentMonth.net)}
          subtext={`Net margin: ${currentMonth.margin.toFixed(1)}%`}
          // badge={currentMonth.net >= 0 ? 'Profitable' : 'Deficit'}
          icon={DollarSign}
          variant={currentMonth.net >= 0 ? 'success' : 'danger'}
        />
        <ReportMetricCard
          label="Operating Expenses"
          value={formatMoney(currentMonth.ex)}
          subtext="Salaries, rent & utilities"
          // badge="Overhead"
          icon={CreditCard}
          variant="warning"
        />
      </div>

      {/* 2. Channel & Balance Sheet Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportMetricCard
          label="B2B Partner Revenue"
          value={formatMoney(currentMonth.b2b)}
          subtext={`${formatPercentVal(currentMonth.b2b, currentMonth.sell)} of total sales`}
          // badge="Wholesale"
          icon={Building2}
          variant="primary"
        />
        <ReportMetricCard
          label="B2C Client Revenue"
          value={formatMoney(currentMonth.b2c)}
          subtext={`${formatPercentVal(currentMonth.b2c, currentMonth.sell)} of total sales`}
          // badge="Retail"
          icon={Users}
          variant="success"
        />
        <ReportMetricCard
          label="Customer Receivables"
          value={formatMoney(customerDues)}
          subtext={`B2B: ${formatMoney(b2bDues)} · B2C: ${formatMoney(b2cDues)}`}
          // badge="Outstanding"
          icon={AlertCircle}
          variant="danger"
        />
        <ReportMetricCard
          label="Partner Capital"
          value={formatMoney(totalPartnerCapital)}
          subtext={`A: ${partnerA.sharePercent.toFixed(1)}% · B: ${partnerB.sharePercent.toFixed(1)}%`}
          // badge="Net Equity"
          icon={Landmark}
          variant="neutral"
        />
      </div>

      {/* 3. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportComparisonChart
          data={last6Months}
          title="Revenue vs Direct Costs (Last 6 Months)"
        />

        <ReportDonutChart
          segments={channelSegments}
          centerLabel={formatMoney(currentMonth.sell)}
          centerSub="Total Sales"
          title="Revenue Channel Distribution: B2B vs B2C"
        />
      </div>

      {/* 4. Secondary Charts & Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportDonutChart
          segments={categorySegments}
          centerLabel={formatMoney(currentMonth.sell)}
          centerSub="Category Sales"
          title={`Category Distribution · ${monthName}`}
        />

        {/* Operating Expenses Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="card__title mb-0">Operating Expenses Breakdown</p>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Total: {formatMoney(currentMonth.ex)}
            </span>
          </div>

          <div className="space-y-3">
            {expensesBreakdown.map((item) => {
              const pct = (item.amount / maxExpense) * 100
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-foreground">{item.name}</span>
                    <span className="font-semibold text-foreground">{formatMoney(item.amount)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Partner Equity Ratio */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-foreground">Partner Equity Ratio</span>
              <span className="text-muted-foreground">Total: {formatMoney(totalPartnerCapital)}</span>
            </div>
            <div className="h-4 flex rounded-md overflow-hidden bg-slate-100">
              <div
                className="bg-[#0879E8] h-full flex items-center justify-center text-[10px] text-white font-bold"
                style={{ width: `${partnerA.sharePercent}%` }}
              >
                A ({partnerA.sharePercent.toFixed(1)}%)
              </div>
              <div
                className="bg-[#16a34a] h-full flex items-center justify-center text-[10px] text-white font-bold"
                style={{ width: `${partnerB.sharePercent}%` }}
              >
                B ({partnerB.sharePercent.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Top Customer & Agency Receivables Table (Canonical ReTable) */}
      <TableCard>
        <TableHeader
          title="Top Customer & Agency Receivables"
          subtitle="Priority outstanding client balances requiring collection follow-up"
          icon={AlertCircle}
        />
        <Table
          columns={dueColumns}
          data={topDues}
          headerClassName="bg-[#2F80ED] text-white"
          emptyText="No outstanding dues found"
        />
      </TableCard>
    </div>
  )
}
