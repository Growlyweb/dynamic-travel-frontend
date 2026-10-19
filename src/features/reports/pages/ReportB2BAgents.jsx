import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Handshake,
  Plus,
  Building2,
  AlertCircle,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'

import { reportsApi, formatMoney } from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import AddClientModal from '../components/AddClientModal'
import {
  Table,
  TableCard,
  TableHeader,
  TableToolbar,
  TableBadge,
  TablePagination,
} from '@/components/re-table'

export default function ReportB2BAgents() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)

  // Search & Filter
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Modal
  const [addModalOpen, setAddModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getB2BAgents()
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load B2B agents report:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddAgent = async (agentData) => {
    await reportsApi.addB2BAgent(agentData)
    loadData()
  }

  const filteredAgents = useMemo(() => {
    if (!data?.agents) return []
    let list = [...data.agents]

    if (statusFilter) {
      list = list.filter((a) => a.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.contact?.toLowerCase().includes(q)
      )
    }

    return list
  }, [data?.agents, search, statusFilter])

  const paginatedAgents = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredAgents.slice(start, start + pageSize)
  }, [filteredAgents, page, pageSize])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="B2B Agents Report"
          description="Agencies buying travel services at wholesale partner rates on credit terms."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'B2B Agents' }]}
        />
        <ReportTabs />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading B2B agents...</p>
        </div>
      </div>
    )
  }

  const { summary, services = [] } = data || {}

  const columns = [
    {
      key: 'name',
      header: 'Agency Name',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-foreground text-sm">{row.name}</span>
          <span className="text-xs text-muted-foreground">Phone: {row.contact}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row) => <span className="text-muted-foreground text-xs">{row.contact}</span>,
    },
    {
      key: 'inv',
      header: 'Invoiced Amount',
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
        <span
          className={`font-bold ${row.due > 0 ? 'text-rose-600' : 'text-muted-foreground'
            }`}
        >
          {formatMoney(row.due)}
        </span>
      ),
    },
    {
      key: 'collected',
      header: 'Collection %',
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
            <span className="text-xs font-semibold text-muted-foreground min-w-8">
              {pct}%
            </span>
          </div>
        )
      },
    },
    {
      key: 'creditUsed',
      header: 'Credit Used / Limit',
      render: (row) => {
        const pct = Math.min(100, Math.round(row.creditUsedPercent || 0))
        const isOverLimit = row.creditUsedPercent > 80
        return (
          <div className="flex flex-col gap-1 min-w-36">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
              <span>{formatMoney(row.due)}</span>
              <span className="text-muted-foreground/80">/ {formatMoney(row.limit)}</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isOverLimit ? 'bg-danger' : 'bg-primary'
                  }`}
                style={{ width: `${pct}%` }}
              />
            </div>
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

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'B2B Agents' },
        ]}
      />


      {/* Canonical TableCard & Table */}
      <TableCard>
        <TableHeader
          title="B2B Agency Directory & Receivables"
          subtitle="Credit utilization, total billings, payments, and balance status"
          icon={Handshake}
          actionText="Add Agent"
          onAction={() => setAddModalOpen(true)}
        />

        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search agency by name, phone number..."
          filters={[
            {
              id: 'status',
              value: statusFilter,
              placeholder: 'All Account Statuses',
              options: [
                { value: 'Paid', label: 'Paid / Settled' },
                { value: 'Partial', label: 'Partial Payment' },
                { value: 'Unpaid', label: 'Unpaid' },
                { value: 'Overdue', label: 'Overdue Accounts' },
              ],
              onChange: (val) => {
                setStatusFilter(val)
                setPage(1)
              },
            },
          ]}
        />

        <Table
          columns={columns}
          data={paginatedAgents}
          headerClassName="bg-[#2F80ED] text-white"
          emptyText="No B2B agencies match your search"
        />

        <TablePagination
          currentPage={page}
          totalEntries={filteredAgents.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {/* Add B2B Agent Modal */}
      <AddClientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        type="B2B"
        services={services}
        onSave={handleAddAgent}
      />
    </div>
  )
}
