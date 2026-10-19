import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Plus,
  FileSpreadsheet,
  Printer,
  Download,
  Trash2,
  TrendingUp,
  Receipt,
  DollarSign,
  Layers,
  Filter,
} from 'lucide-react'

import {
  reportsApi,
  formatMoney,
  formatPercentVal,
  MONTH_NAMES,
} from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import DailyTrendChart from '../components/DailyTrendChart'
import ReportDonutChart from '../components/ReportDonutChart'
import AddDailyEntryModal from '../components/AddDailyEntryModal'
import {
  Table,
  TableCard,
  TableHeader,
  TableToolbar,
  TableBadge,
  TablePagination,
} from '@/components/re-table'

export default function ReportMonthly() {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  // Search & Filter
  const [entrySearch, setEntrySearch] = useState('')
  const [entryTypeFilter, setEntryTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Modal
  const [addEntryOpen, setAddEntryOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getMonthlyReport(selectedYear, selectedMonth)
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load monthly report:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddEntry = async (entryData) => {
    await reportsApi.addDailyEntry(entryData)
    loadData()
  }

  const handleDeleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction entry?')) {
      await reportsApi.deleteDailyEntry(id)
      loadData()
    }
  }

  const handleDownloadMonthCsv = () => {
    reportsApi.exportMonthlyReport(selectedYear, selectedMonth, 'csv')
  }

  const handleDownloadMonthExcel = () => {
    reportsApi.exportMonthlyReport(selectedYear, selectedMonth, 'excel')
  }

  const handlePrintPdf = () => {
    reportsApi.exportMonthlyReport(selectedYear, selectedMonth, 'pdf')
  }

  const handleDownloadYearly = () => {
    reportsApi.exportYearlyReport(selectedYear, 'csv')
  }

  const handleDownloadYearlyExcel = () => {
    reportsApi.exportYearlyReport(selectedYear, 'excel')
  }

  const filteredEntries = useMemo(() => {
    if (!data?.entries) return []
    let list = [...data.entries]

    if (entryTypeFilter) {
      list = list.filter((e) => e.k === entryTypeFilter)
    }

    if (entrySearch.trim()) {
      const q = entrySearch.toLowerCase().trim()
      list = list.filter(
        (e) =>
          e.desc?.toLowerCase().includes(q) ||
          e.cat?.toLowerCase().includes(q) ||
          e.ch?.toLowerCase().includes(q) ||
          e.d?.includes(q)
      )
    }

    return list
  }, [data?.entries, entrySearch, entryTypeFilter])

  const paginatedEntries = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredEntries.slice(start, start + pageSize)
  }, [filteredEntries, page, pageSize])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Monthly Financial Report"
          description="Detailed breakdown of sales, costs, operating expenses & yearly performance."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'Monthly Report' }]}
        />
        <ReportTabs />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading monthly report...</p>
        </div>
      </div>
    )
  }

  const {
    monthName,
    isLiveMonth,
    agg,
    categories = [],
    dailyBreakdown,
    yearlyRows = [],
    yearTotal,
    availableYears = [],
  } = data || {}

  // Daily entries table columns
  const dailyColumns = [
    {
      key: 'd',
      header: 'Date',
      render: (row) => (
        <span className="font-semibold text-foreground text-xs sm:text-sm">
          {row.d}
        </span>
      ),
    },
    {
      key: 'k',
      header: 'Type',
      align: 'center',
      render: (row) => (
        <TableBadge
          type="status"
          variant={row.k === 'Sale' ? 'info' : 'warning'}
        >
          {row.k}
        </TableBadge>
      ),
    },
    {
      key: 'cat',
      header: 'Category / Channel',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">{row.cat}</span>
          {row.ch && row.ch !== 'General' && (
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-muted-foreground font-semibold">
              {row.ch}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'desc',
      header: 'Description',
      render: (row) => <span className="text-muted-foreground">{row.desc}</span>,
    },
    {
      key: 'sell',
      header: 'Selling Price',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-foreground">
          {row.k === 'Sale' ? formatMoney(row.sell) : '—'}
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost / Expense',
      align: 'right',
      render: (row) => (
        <span className="text-foreground">{formatMoney(row.cost)}</span>
      ),
    },
    {
      key: 'profit',
      header: 'Profit',
      align: 'right',
      render: (row) => {
        const profit = row.k === 'Sale' ? row.sell - row.cost : -row.cost
        return (
          <span
            className={`font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
          >
            {formatMoney(profit)}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleDeleteEntry(row.id)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Delete entry"
        >
          <Trash2 className="size-4" />
        </button>
      ),
    },
  ]

  // Yearly Summary Columns
  const yearlyColumns = [
    {
      key: 'monthName',
      header: 'Month',
      render: (row) => {
        const isCurrent =
          row.monthIndex === today.getMonth() && selectedYear === today.getFullYear()
        return (
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{row.monthName}</span>
            {isCurrent && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-primary-soft text-primary">
                Current
              </span>
            )}
          </div>
        )
      },
    },
    ...categories.map((c) => ({
      key: `cat_${c.n}`,
      header: c.n,
      align: 'right',
      render: (row) => formatMoney(row.byCategory[c.n] || 0),
    })),
    {
      key: 'sell',
      header: 'Selling Price',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-foreground">{formatMoney(row.sell)}</span>
      ),
    },
    {
      key: 'cost',
      header: 'Direct Cost',
      align: 'right',
      render: (row) => formatMoney(row.cost),
    },
    {
      key: 'expenses',
      header: 'Expenses',
      align: 'right',
      render: (row) => formatMoney(row.expenses),
    },
    {
      key: 'net',
      header: 'Net Profit',
      align: 'right',
      render: (row) => (
        <span
          className={`font-bold ${row.net >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
        >
          {formatMoney(row.net)}
        </span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin %',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-muted-foreground">
          {row.margin.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'dl',
      header: 'Export',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          onClick={() =>
            reportsApi.exportMonthlyReport(selectedYear, row.monthIndex, 'csv')
          }
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary bg-primary-soft hover:bg-primary-soft/80 rounded-md transition-colors"
        >
          <Download className="size-3" />
          <span>CSV</span>
        </button>
      ),
    },
  ]

  const categorySegments = categories.map((c) => ({
    label: c.n,
    value: agg?.by[c.n] || 0,
    color: c.c,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monthly Financial Report"
        // description={
        //   isLiveMonth
        //     ? `Live active month · Real-time operational transaction ledger & performance summary.`
        //     : `Historical performance report for ${monthName} ${selectedYear}.`
        // }
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'Monthly Report' },
        ]}

      />


      {/* Filter Bar (Matching FilterBar.jsx) */}
      <div className="bg-white border border-border rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mr-1">
            <Filter className="size-3.5 text-primary" />
            <span>Reporting Period:</span>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="h-8 px-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs text-muted-foreground">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-8 px-2 text-xs rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
            >
              {availableYears?.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          {isLiveMonth ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Active Month ({monthName} {selectedYear})
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSelectedYear(today.getFullYear())
                setSelectedMonth(today.getMonth())
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Back to Current Month
            </button>
          )}
        </div>
      </div>

      {/* Primary Monthly KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportMetricCard
          label={`Selling Price · ${monthName}`}
          value={formatMoney(agg?.sell || 0)}
          subtext={`${agg?.salesCount || 0} confirmed sales`}
          badge="Gross Sales"
          icon={TrendingUp}
          variant="primary"
        />
        <ReportMetricCard
          label={`Cost Price · ${monthName}`}
          value={formatMoney(agg?.cost || 0)}
          subtext="Direct vendor & package costs"
          badge="Direct Costs"
          icon={Receipt}
          variant="danger"
        />
        <ReportMetricCard
          label={`Net Profit · ${monthName}`}
          value={formatMoney(agg?.net || 0)}
          subtext={`Net margin: ${(agg?.margin || 0).toFixed(1)}%`}
          badge={(agg?.net || 0) >= 0 ? 'Profitable' : 'Deficit'}
          icon={DollarSign}
          variant={(agg?.net || 0) >= 0 ? 'success' : 'danger'}
        />
        <ReportMetricCard
          label="Operating Expenses"
          value={formatMoney(agg?.ex || 0)}
          subtext="Salaries, rent & utilities"
          badge="Overhead"
          icon={Layers}
          variant="warning"
        />
      </div>

      {/* Visual Charts: Daily Trend Bar Chart & Category Share */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DailyTrendChart
            days={dailyBreakdown}
            title={`Daily Selling vs Cost · ${monthName} ${selectedYear}`}
          />
        </div>

        <div>
          <ReportDonutChart
            segments={categorySegments}
            centerLabel={formatMoney(agg?.sell || 0)}
            centerSub="Monthly Revenue"
            title={`Category Distribution · ${monthName}`}
          />
        </div>
      </div>

      {/* Daily Entries TableCard with Signature Table Styling */}
      <TableCard>
        <TableHeader
          title={`Daily Entries · ${monthName} ${selectedYear}`}
          subtitle={`${data?.entries?.length || 0} transaction records in this period`}
          actionText="Add Entry"
          onAction={() => setAddEntryOpen(true)}
          icon={Calendar}
        />

        <TableToolbar
          search={entrySearch}
          onSearchChange={setEntrySearch}
          searchPlaceholder="Search entries by description, category, channel, date..."
          filters={[
            {
              id: 'typeFilter',
              value: entryTypeFilter,
              placeholder: 'All Transaction Types',
              options: [
                { value: 'Sale', label: 'Sales Only' },
                { value: 'Expense', label: 'Expenses Only' },
              ],
              onChange: (val) => {
                setEntryTypeFilter(val)
                setPage(1)
              },
            },
          ]}
        />

        <Table
          columns={dailyColumns}
          data={paginatedEntries}
          headerClassName="bg-[#2F80ED] text-white"
          emptyText={`No entries found for ${monthName} ${selectedYear}`}
          emptyDescription="Click 'Add Entry' to record a sale or operational expense."
        />

        {/* Live Month Footer Totals */}
        {filteredEntries.length > 0 && (
          <div className="mt-3 p-4 bg-slate-50 border border-border rounded-xl flex flex-wrap items-center justify-between text-xs sm:text-sm font-semibold gap-3 text-foreground">
            <div>
              <span>Period Total ({filteredEntries.length} entries):</span>
            </div>
            <div className="flex items-center gap-6">
              <div>
                <span className="text-muted-foreground font-normal mr-1.5">Sales:</span>
                <span className="text-primary font-bold">{formatMoney(agg?.sell || 0)}</span>
              </div>
              <div>
                <span className="text-muted-foreground font-normal mr-1.5">Cost + Exp:</span>
                <span className="text-foreground font-bold">
                  {formatMoney((agg?.cost || 0) + (agg?.ex || 0))}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-normal mr-1.5">Net Profit:</span>
                <span
                  className={`font-bold ${(agg?.net || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}
                >
                  {formatMoney(agg?.net || 0)}
                </span>
              </div>
            </div>
          </div>
        )}

        <TablePagination
          currentPage={page}
          totalEntries={filteredEntries.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {/* Yearly Consolidated Performance Table */}
      <TableCard>
        <TableHeader
          title={`Yearly Financial Report · ${selectedYear}`}
          subtitle="Consolidated 12-month performance and category distribution"
          icon={Calendar}
          extraActions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadYearly}
                className="text-xs gap-1.5 bg-surface border-border"
              >
                <Download className="size-3.5 text-primary" />
                <span>Download {selectedYear} CSV</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadYearlyExcel}
                className="text-xs gap-1.5 bg-surface border-border"
              >
                <FileSpreadsheet className="size-3.5 text-emerald-600" />
                <span>Yearly Excel</span>
              </Button>
            </div>
          }
        />

        <Table
          columns={yearlyColumns}
          data={yearlyRows}
          headerClassName="bg-[#2F80ED] text-white"
        />

        {/* Annual Consolidated Summary Footer */}
        {yearTotal && (
          <div className="mt-3 p-4 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between text-xs sm:text-sm font-semibold gap-4">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/40 text-blue-200 text-xs">
                Annual Consolidated
              </span>
              <span>Year {selectedYear} Totals:</span>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <span className="text-slate-400 font-normal mr-1.5">Annual Sales:</span>
                <span className="text-blue-300 font-bold">{formatMoney(yearTotal.sell)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-normal mr-1.5">Direct Costs:</span>
                <span className="text-slate-200">{formatMoney(yearTotal.cost)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-normal mr-1.5">Expenses:</span>
                <span className="text-amber-300">{formatMoney(yearTotal.ex)}</span>
              </div>
              <div>
                <span className="text-slate-400 font-normal mr-1.5">Net Profit:</span>
                <span className="text-emerald-400 font-bold text-base">
                  {formatMoney(yearTotal.net)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-normal mr-1.5">Margin:</span>
                <span className="text-slate-200">{yearTotal.margin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </TableCard>

      {/* Add Daily Entry Modal */}
      <AddDailyEntryModal
        open={addEntryOpen}
        onOpenChange={setAddEntryOpen}
        categories={categories}
        defaultDate={`${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`}
        onSave={handleAddEntry}
      />
    </div>
  )
}
