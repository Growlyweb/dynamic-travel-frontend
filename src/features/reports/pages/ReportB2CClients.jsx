import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Users,
  Plus,
  Receipt,
  CheckCircle2,
  AlertCircle,
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

export default function ReportB2CClients() {
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
      const res = await reportsApi.getB2CClients()
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load B2C clients report:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddClient = async (clientData) => {
    await reportsApi.addB2CClient(clientData)
    loadData()
  }

  const filteredClients = useMemo(() => {
    if (!data?.clients) return []
    let list = [...data.clients]

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
  }, [data?.clients, search, statusFilter])

  const paginatedClients = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredClients.slice(start, start + pageSize)
  }, [filteredClients, page, pageSize])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="B2C Clients Report"
          description="Direct retail travel customers buying at standard consumer retail prices."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'B2C Clients' }]}
        />
        <ReportTabs />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading B2C clients...</p>
        </div>
      </div>
    )
  }

  const { summary, services = [] } = data || {}

  const columns = [
    {
      key: 'name',
      header: 'Client Name',
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
      header: 'Collection Progress',
      render: (row) => {
        const pct = Math.min(100, Math.round(row.collectedPercent || 0))
        return (
          <div className="flex items-center gap-2 min-w-32">
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
        // title="B2C Retail Clients"
        // description="Individual retail travelers and direct clients purchasing travel tickets, visas & customized vacation tours."
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'B2C Clients' },
        ]}

      />


      {/* Clients Canonical TableCard & Table */}
      <TableCard>
        <TableHeader
          title="B2C Client Directory & Receivables"
          subtitle="Retail orders, invoice balances, payment history & collection status"
          icon={Users}
          actionText="Add Client"
          onAction={() => setAddModalOpen(true)}
        />

        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search client by name, phone number..."
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
          data={paginatedClients}
          headerClassName="bg-[#2F80ED] text-white"
          emptyText="No B2C clients match your search"
        />

        <TablePagination
          currentPage={page}
          totalEntries={filteredClients.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </TableCard>

      {/* Add B2C Client Modal */}
      <AddClientModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        type="B2C"
        services={services}
        onSave={handleAddClient}
      />
    </div>
  )
}
