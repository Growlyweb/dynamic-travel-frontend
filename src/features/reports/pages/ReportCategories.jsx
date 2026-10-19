import React, { useState, useEffect, useCallback } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Tag,
  Plus,
  Trash2,
  AlertCircle,
  Filter,
} from 'lucide-react'

import {
  reportsApi,
  formatMoney,
  MONTH_NAMES,
} from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import ReportDonutChart from '../components/ReportDonutChart'
import AddCategoryModal from '../components/AddCategoryModal'
import {
  Table,
  TableCard,
  TableHeader,
  TableBadge,
} from '@/components/re-table'

export default function ReportCategories() {
  const today = new Date()
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  // Modal
  const [addModalOpen, setAddModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getCategoryReport(selectedYear, selectedMonth)
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load category report:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedYear, selectedMonth])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddCategory = async (catData) => {
    await reportsApi.addCategory(catData)
    loadData()
  }

  const handleDeleteCategory = async (catName) => {
    if (window.confirm(`Are you sure you want to delete category "${catName}"?`)) {
      try {
        await reportsApi.deleteCategory(catName)
        loadData()
      } catch (err) {
        alert(err.message || 'Failed to delete category')
      }
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Sales Categories"
          description="Create your own sales categories. Each one gets a dedicated card and analytics chart."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'Categories' }]}
        />
        <ReportTabs />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading categories report...</p>
        </div>
      </div>
    )
  }

  const {
    monthName,
    categories = [],
    totalCategorySales = 0,
    availableYears = [],
  } = data || {}

  // Canonical Table Columns
  const tableColumns = [
    {
      key: 'n',
      header: 'Category',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span
            className="size-3.5 rounded-sm shrink-0 shadow-2xs"
            style={{ backgroundColor: row.c }}
          />
          <span className="font-bold text-foreground text-sm">{row.n}</span>
        </div>
      ),
    },
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
      header: 'Cost Price',
      align: 'right',
      render: (row) => formatMoney(row.cost),
    },
    {
      key: 'profit',
      header: 'Gross Profit',
      align: 'right',
      render: (row) => (
        <span
          className={`font-bold ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
        >
          {formatMoney(row.profit)}
        </span>
      ),
    },
    {
      key: 'share',
      header: 'Share of Sales',
      render: (row) => {
        const sharePct = row.share ? row.share.toFixed(1) : '0.0'
        return (
          <div className="flex items-center gap-2.5 min-w-36">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, row.share || 0)}%`,
                  backgroundColor: row.c,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-muted-foreground min-w-10 text-right">
              {sharePct}%
            </span>
          </div>
        )
      },
    },
    {
      key: 'actions',
      header: 'Status / Action',
      align: 'center',
      render: (row) => {
        if (row.isUsed) {
          return (
            <TableBadge type="status" variant="info">
              In Use
            </TableBadge>
          )
        }
        return (
          <button
            type="button"
            onClick={() => handleDeleteCategory(row.n)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
            title="Delete unused category"
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </button>
        )
      },
    },
  ]

  const chartSegments = categories.map((c) => ({
    label: c.n,
    value: c.sell,
    color: c.c,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Categories"
        // description="Configure dynamic revenue categories. Each category automatically generates metric cards and revenue analytics."
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'Categories' },
        ]}

      />

      {/* Filter Bar */}
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

        <div className="text-xs text-muted-foreground font-medium">
          Total Category Revenue: <b className="text-foreground text-sm">{formatMoney(totalCategorySales)}</b>
        </div>
      </div>


      {/* Category Performance Table */}
      <TableCard>
        <TableHeader
          title={`Category Performance · ${monthName} ${selectedYear}`}
          subtitle="Detailed revenue, direct costs, gross margins, and sales volume share"
          icon={Tag}
          actionText="Add Category"
          onAction={() => setAddModalOpen(true)}
        />

        <Table
          columns={tableColumns}
          data={categories}
          headerClassName="bg-[#2F80ED] text-white"
        />

        <div className="p-3.5 bg-primary-soft/60 border border-primary/20 rounded-xl text-xs text-foreground flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-primary" />
          <span>
            New categories show ৳0 until sales entries are recorded under that category in the Monthly Report. Categories with existing entries cannot be deleted to preserve audit integrity.
          </span>
        </div>
      </TableCard>

      {/* Visual Charts & Category Swatches Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ReportDonutChart
            segments={chartSegments}
            centerLabel={formatMoney(totalCategorySales)}
            centerSub="Category Revenue"
            title={`Category Distribution · ${monthName}`}
          />
        </div>

        <div className="card">
          <p className="card__title">Category Configuration & Color Palette</p>
          <p className="text-xs text-muted-foreground mb-4">
            Color-coded categories are used across financial reporting, daily sales ledgers, and voucher distribution.
          </p>

          <div className="space-y-2.5">
            {categories.map((c) => (
              <div
                key={c.n}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-5 rounded-md shadow-2xs"
                    style={{ backgroundColor: c.c }}
                  />
                  <div>
                    <span className="font-semibold text-sm text-foreground block">
                      {c.n}
                    </span>
                    <span className="text-xs text-muted-foreground">Color: {c.c}</span>
                  </div>
                </div>

                <div>
                  {c.isUsed ? (
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      In Use
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground bg-surface px-2 py-0.5 rounded border border-border">
                      No Entries
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      <AddCategoryModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        existingCount={categories.length}
        onSave={handleAddCategory}
      />
    </div>
  )
}
