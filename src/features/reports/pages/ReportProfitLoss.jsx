import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  ScrollText,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Plus,
  Trash2,
  Printer,
  Download,
  Calendar,
  Sparkles,
  CheckCircle2,
  PieChart,
} from 'lucide-react'

import { reportsApi, formatMoney, MONTH_NAMES } from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import ReportComparisonChart from '../components/ReportComparisonChart'
import AddExpenseModal from '../components/AddExpenseModal'

export default function ReportProfitLoss() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())

  // Modal
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getProfitAndLossReport(selectedYear, selectedMonth)
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load P&L report:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddExpense = async (expenseData) => {
    await reportsApi.addOperatingExpense(expenseData)
    loadData()
  }

  const handleDeleteExpense = async (index, name) => {
    if (window.confirm(`Delete expense line item "${name}"?`)) {
      await reportsApi.deleteOperatingExpense(index)
      loadData()
    }
  }

  const handleExport = (format) => {
    reportsApi.exportProfitLossReport(selectedYear, selectedMonth, format)
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="P&L and Expenses"
          description="Operational profit and loss statement, operating overhead allocation, and bottom-line margin reconciliation."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'P&L and Expenses' }]}
        />
        <ReportTabs />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Calculating profit & loss statement...</p>
        </div>
      </div>
    )
  }

  const {
    year,
    month,
    monthName,
    isLiveMonth,
    revenue = 0,
    directCosts = 0,
    grossProfit = 0,
    grossMargin = 0,
    totalOperatingExpenses = 0,
    netProfit = 0,
    netMargin = 0,
    categoryBreakdown = [],
    expensesList = [],
    trend6Months = [],
    availableYears = [2026],
  } = data || {}

  const maxExpenseAmt = Math.max(1, ...expensesList.map((e) => e.amount))

  return (
    <div className="space-y-6">
      <PageHeader
        title="P&L and Expenses"
        // description={`${monthName} ${year} · Comprehensive Financial Statement & Operating Expenses Breakdown.`}
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'P&L and Expenses' },
        ]}
      />

      {/* Filter and Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-border rounded-xl p-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-white border border-border rounded-lg outline-none font-medium text-foreground"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-white border border-border rounded-lg outline-none font-medium text-foreground"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {isLiveMonth && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Month
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="gap-1.5 text-xs h-8.5 bg-white"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            className="gap-1.5 text-xs h-8.5 bg-white"
          >
            <Download className="size-3.5" />
            <span>Export Excel</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => reportsApi.exportMonthlyReport(selectedYear, selectedMonth, 'pdf')}
            className="gap-1.5 text-xs h-8.5 bg-slate-900 text-white hover:bg-slate-800"
          >
            <Printer className="size-3.5" />
            <span>Print / PDF</span>
          </Button>
        </div>
      </div>


      {/* 2. Detailed Statement & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Financial Statement Table (7 cols) */}
        <div className="lg:col-span-7 card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="card__title mb-0.5">Profit & Loss Statement</p>
              <p className="text-xs text-muted-foreground">
                Consolidated operations for {monthName} {year}
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-md text-slate-700">
              BDT (৳)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-border/60">
                {/* Revenue Section */}
                <tr className="bg-slate-50 font-semibold text-foreground">
                  <td className="py-2.5 px-3 uppercase tracking-wider text-[11px] text-muted-foreground">
                    Operating Revenue
                  </td>
                  <td className="py-2.5 px-3 text-right"></td>
                </tr>
                {categoryBreakdown.map((cat) => (
                  <tr key={cat.name} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 pl-6 text-foreground flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name} Sales Revenue</span>
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-foreground">
                      {formatMoney(cat.revenue)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-border">
                  <td className="py-2.5 px-3 pl-6 text-primary">Total Gross Revenue</td>
                  <td className="py-2.5 px-3 text-right font-bold text-primary">
                    {formatMoney(revenue)}
                  </td>
                </tr>

                {/* Direct Costs Section */}
                <tr className="bg-slate-50 font-semibold text-foreground">
                  <td className="py-2.5 px-3 uppercase tracking-wider text-[11px] text-muted-foreground">
                    Cost of Sales (COGS)
                  </td>
                  <td className="py-2.5 px-3 text-right"></td>
                </tr>
                <tr className="hover:bg-slate-50/70">
                  <td className="py-2 px-3 pl-6 text-foreground">
                    Direct Tour, Hotel & Visa Procurement Costs
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-rose-600">
                    −{formatMoney(directCosts)}
                  </td>
                </tr>
                <tr className="font-bold border-t border-border bg-slate-50/50">
                  <td className="py-2.5 px-3 text-foreground">Gross Profit</td>
                  <td className="py-2.5 px-3 text-right font-bold text-foreground">
                    {formatMoney(grossProfit)}
                  </td>
                </tr>

                {/* Operating Expenses Section */}
                <tr className="bg-slate-50 font-semibold text-foreground">
                  <td className="py-2.5 px-3 uppercase tracking-wider text-[11px] text-muted-foreground">
                    Operating Expenses
                  </td>
                  <td className="py-2.5 px-3 text-right"></td>
                </tr>
                {expensesList.map((exp) => (
                  <tr key={exp.name} className="hover:bg-slate-50/70">
                    <td className="py-2 px-3 pl-6 text-muted-foreground">{exp.name}</td>
                    <td className="py-2 px-3 text-right font-medium text-rose-600">
                      −{formatMoney(exp.amount)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-border">
                  <td className="py-2.5 px-3 pl-6 text-amber-700">Total Operating Expenses</td>
                  <td className="py-2.5 px-3 text-right font-bold text-rose-600">
                    −{formatMoney(totalOperatingExpenses)}
                  </td>
                </tr>

                {/* Net Profit Bottom Line */}
                <tr className="border-t-2 border-border bg-emerald-50/50 text-foreground font-bold text-sm">
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span>Net Operating Profit</span>
                    </span>
                  </td>
                  <td
                    className={`py-3 px-3 text-right text-base font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                  >
                    {formatMoney(netProfit)}
                  </td>
                </tr>
                <tr className="bg-white text-muted-foreground font-medium">
                  <td className="py-2 px-3">Net Profit Margin %</td>
                  <td className="py-2 px-3 text-right font-bold text-foreground">
                    {netMargin.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Operating Overhead Allocation (5 cols) */}
        <div className="lg:col-span-5 card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="card__title mb-0.5">Operating Overhead</p>
              <p className="text-xs text-muted-foreground">Monthly expense distribution</p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setAddExpenseModalOpen(true)}
              className="gap-1 text-xs h-8 bg-white border-border"
            >
              <Plus className="size-3.5" />
              <span>Add Expense</span>
            </Button>
          </div>

          <div className="space-y-3.5 pt-2">
            {expensesList.map((exp) => {
              const pct = exp.percentOfExpenses || 0
              return (
                <div key={exp.name} className="space-y-1.5 group">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground">{exp.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {formatMoney(exp.amount)}
                      </span>
                      <span className="text-[11px] text-muted-foreground min-w-8 text-right">
                        ({pct.toFixed(1)}%)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.index, exp.name)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 transition-opacity ml-1"
                        title="Delete expense"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-300"
                      style={{ width: `${(exp.amount / maxExpenseAmt) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
            <span className="font-bold text-foreground">Consolidated Monthly Overhead:</span>
            <span className="font-bold text-rose-600 text-sm">
              {formatMoney(totalOperatingExpenses)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Revenue vs Direct Costs 6-Month Comparison */}
      <ReportComparisonChart
        data={trend6Months}
        title="Revenue vs Direct Costs (Last 6 Months)"
      />

      {/* Modal */}
      <AddExpenseModal
        open={addExpenseModalOpen}
        onOpenChange={setAddExpenseModalOpen}
        onSave={handleAddExpense}
      />
    </div>
  )
}
