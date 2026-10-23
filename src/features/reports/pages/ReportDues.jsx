import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  AlertCircle,
  Clock,
  DollarSign,
  Download,
  Users,
  Handshake,
  CheckCircle2,
  Info,
  Calendar,
} from 'lucide-react'

import { reportsApi, formatMoney } from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import ReportDonutChart from '../components/ReportDonutChart'
import RecordPaymentModal from '../components/RecordPaymentModal'
import {
  Table,
  TableCard,
  TableHeader,
  TableToolbar,
  TableBadge,
  TablePagination,
} from '@/components/re-table'

export default function ReportDues() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Payment modal state
  const [selectedClientForPayment, setSelectedClientForPayment] = useState(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getDuesReport()
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load dues report:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRecordPayment = async ({ name, amount }) => {
    await reportsApi.recordClientPayment({ name, amount })
    loadData()
  }

  const handleExport = (format) => {
    reportsApi.exportDuesReport(format)
  }

  const filteredClients = useMemo(() => {
    if (!data?.dueClients) return []
    let list = [...data.dueClients]

    if (channelFilter !== 'ALL') {
      list = list.filter((c) => c.t === channelFilter)
    }

    if (statusFilter) {
      list = list.filter((c) => c.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.contact?.toLowerCase().includes(q)
      )
    }

    return list
  }, [data?.dueClients, channelFilter, statusFilter, search])

  const paginatedClients = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredClients.slice(start, start + pageSize)
  }, [filteredClients, page, pageSize])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Due Management"
          // description="Who owes the agency money, categorized by B2B agency partners and direct B2C clients."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'Dues' }]}
        />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading receivables and dues...</p>
        </div>
      </div>
    )
  }

  const { summary, channelDistribution = [], aging = [] } = data || {}

  const columns = [
    {
      key: 'name',
      header: 'Agency / Client',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-foreground text-sm">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.contact || 'No phone'}</span>
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
          {row.t === 'B2B' ? 'B2B Agent' : 'B2C Client'}
        </span>
      ),
    },
    {
      key: 'inv',
      header: 'Total Invoiced',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-foreground">{formatMoney(row.inv)}</span>
      ),
    },
    {
      key: 'paid',
      header: 'Paid Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-emerald-700">{formatMoney(row.paid)}</span>
      ),
    },
    {
      key: 'due',
      header: 'Outstanding Due',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-rose-600">{formatMoney(row.due)}</span>
      ),
    },
    {
      key: 'over',
      header: 'Overdue',
      align: 'right',
      render: (row) => (
        row.over > 0 ? (
          <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs">
            {formatMoney(row.over)}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )
      ),
    },
    {
      key: 'collection',
      header: 'Collected %',
      render: (row) => {
        const pct = Math.min(100, Math.round(row.collectedPercent || 0))
        return (
          <div className="flex items-center gap-2 min-w-28">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-medium text-muted-foreground min-w-8">
              {pct}%
            </span>
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
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedClientForPayment(row)
            setPaymentModalOpen(true)
          }}
          className="h-8 px-2.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <DollarSign className="size-3.5 mr-1" />
          <span>Pay Due</span>
        </Button>
      ),
    },
  ]

  const totalAgingAmount = aging.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) || 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Due Management"
        // description="Comprehensive accounts receivable tracking, aging brackets, and outstanding collection workflows."
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'Dues' },
        ]}
      />

      {/* 2. Visual Analytics: Donut & Aging Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dues by Channel */}
        <ReportDonutChart
          title="Dues Distribution by Channel"
          segments={channelDistribution}
          centerLabel={formatMoney(summary?.totalDues || 0)}
          centerSub="Total Dues"
        />

        {/* Dues Aging Analysis Card */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <p className="card__title mb-0">Receivables Aging Analysis</p>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-700">
              {formatMoney(totalAgingAmount)} Total Tracked
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {aging.map((bracket) => {
              const amt = Number(bracket.amount) || 0
              const pct = Math.round((amt / totalAgingAmount) * 100)
              return (
                <div key={bracket.label} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: bracket.color }}
                      />
                      <span className="font-semibold text-foreground">{bracket.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{formatMoney(amt)}</span>
                      <span className="text-muted-foreground text-[11px] min-w-8 text-right">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: bracket.color,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Aging stack visual bar */}
          <div className="pt-2">
            <div className="flex h-3 rounded-md overflow-hidden bg-slate-100">
              {aging.map((bracket) => {
                const amt = Number(bracket.amount) || 0
                const pct = (amt / totalAgingAmount) * 100
                if (pct <= 0) return null
                return (
                  <div
                    key={bracket.label}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: bracket.color,
                    }}
                    title={`${bracket.label}: ${formatMoney(amt)}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Accounting Rule Banner */}
      {/* <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <Info className="size-4 shrink-0 text-amber-600" />
        <span className="font-medium">
          Accounting Standard: <strong>Due Balance = Total Invoiced Amount − Payments Applied − Advance Credits Applied</strong>. Overdue amounts trigger automated payment reminders to clients.
        </span>
      </div> */}

      {/* 4. Table Card */}
      <TableCard>
        <TableHeader
          title="Outstanding Due Accounts"
          description={`Showing ${filteredClients.length} accounts with unpaid balances`}
          actions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                className="gap-1.5 text-xs h-9 bg-white"
              >
                <Download className="size-3.5" />
                <span>Export CSV</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                className="gap-1.5 text-xs h-9 bg-white"
              >
                <Download className="size-3.5" />
                <span>Export Excel</span>
              </Button>
            </div>
          }
        />

        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search agency or client..."
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs">
                {['ALL', 'B2B', 'B2C'].map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setChannelFilter(ch)}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${channelFilter === ch
                      ? 'bg-white shadow-xs font-semibold text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {ch === 'ALL' ? 'All Channels' : ch}
                  </button>
                ))}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg outline-none text-foreground font-medium"
              >
                <option value="">All Statuses</option>
                <option value="Overdue">Overdue</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>
          }
        />

        <Table
          columns={columns}
          data={paginatedClients}
          emptyMessage="No pending dues found matching the filter criteria."
        />

        {filteredClients.length > pageSize && (
          <TablePagination
            page={page}
            totalItems={filteredClients.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </TableCard>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        client={selectedClientForPayment}
        onSave={handleRecordPayment}
      />
    </div>
  )
}
