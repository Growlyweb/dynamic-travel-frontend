import React, { useState, useEffect, useCallback, useMemo } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Plus,
  CreditCard,
  DollarSign,
  Download,
  Calendar,
  AlertTriangle,
  Trash2,
  Info,
  CheckCircle2,
  Receipt,
} from 'lucide-react'

import { reportsApi, formatMoney } from '../reports.api'
import ReportTabs from '../components/ReportTabs'
import ReportMetricCard from '../components/ReportMetricCard'
import AddVendorBillModal from '../components/AddVendorBillModal'
import RecordVendorPaymentModal from '../components/RecordVendorPaymentModal'
import {
  Table,
  TableCard,
  TableHeader,
  TableToolbar,
  TableBadge,
  TablePagination,
} from '@/components/re-table'

export default function ReportVendorPayables() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Modals
  const [addBillModalOpen, setAddBillModalOpen] = useState(false)
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await reportsApi.getVendorPayables()
      if (res.success) {
        setData(res.data)
      }
    } catch (err) {
      console.error('Failed to load vendor payables:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddBill = async (billData) => {
    await reportsApi.addVendorBill(billData)
    loadData()
  }

  const handleRecordPayment = async ({ billNo, amount }) => {
    await reportsApi.recordVendorPayment({ billNo, amount })
    loadData()
  }

  const handleDeleteBill = async (billNo, name) => {
    if (window.confirm(`Delete bill reference "${billNo}" for ${name}?`)) {
      await reportsApi.deleteVendorBill(billNo)
      loadData()
    }
  }

  const handleExport = (format) => {
    reportsApi.exportVendorPayables(format)
  }

  const filteredBills = useMemo(() => {
    if (!data?.bills) return []
    let list = [...data.bills]

    if (statusFilter) {
      list = list.filter((b) => b.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(
        (b) =>
          b.name?.toLowerCase().includes(q) ||
          b.billNo?.toLowerCase().includes(q)
      )
    }

    return list
  }, [data?.bills, statusFilter, search])

  const paginatedBills = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredBills.slice(start, start + pageSize)
  }, [filteredBills, page, pageSize])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Vendor Payables"
          description="Supplier invoices, tour operator accounts, and outstanding supplier liabilities."
          breadcrumbs={[{ label: 'Reports', to: '/reports/overview' }, { label: 'Vendor Payables' }]}
        />
        <ReportTabs />
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Loading vendor accounts...</p>
        </div>
      </div>
    )
  }

  const { summary } = data || {}
  const todayStr = new Date().toISOString().slice(0, 10)

  const columns = [
    {
      key: 'name',
      header: 'Supplier / Vendor',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
            <Building2 className="size-4" />
          </div>
          <div>
            <span className="font-semibold text-foreground text-sm block">{row.name}</span>
            <span className="text-xs font-mono text-muted-foreground">{row.billNo}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'billed',
      header: 'Billed Amount',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-foreground">{formatMoney(row.billed)}</span>
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
      key: 'payable',
      header: 'Payable Balance',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-rose-600">{formatMoney(row.payable)}</span>
      ),
    },
    {
      key: 'progress',
      header: 'Settlement %',
      render: (row) => {
        const pct = Math.min(100, Math.round(row.paidPercent || 0))
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
      key: 'dueDate',
      header: 'Payment Due Date',
      render: (row) => {
        const isOverdue = row.payable > 0 && row.dueDate < todayStr
        return (
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className={`size-3.5 ${isOverdue ? 'text-rose-600' : 'text-muted-foreground'}`} />
            <span className={isOverdue ? 'font-bold text-rose-600' : 'text-foreground font-medium'}>
              {row.dueDate}
            </span>
            {isOverdue && (
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                Overdue
              </span>
            )}
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
      header: 'Actions',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1.5">
          {row.payable > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedBillForPayment(row)
                setPaymentModalOpen(true)
              }}
              className="h-8 px-2.5 text-xs text-primary border-primary/30 hover:bg-primary-soft/50"
            >
              <CreditCard className="size-3.5 mr-1" />
              <span>Pay Bill</span>
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteBill(row.billNo, row.name)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-50"
            title="Delete bill"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendor Payables"
        // description="Unpaid supplier balances, hotel chains, airline consolidators, and vendor credit reconciliation."
        breadcrumbs={[
          { label: 'Reports', to: '/reports/overview' },
          { label: 'Vendor Payables' },
        ]}
      />

      {/* 3. Table Card */}
      <TableCard>
        <TableHeader
          title="Supplier Accounts & Bill Register"
          description={`Showing ${filteredBills.length} recorded supplier bills`}
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
              <Button
                type="button"
                size="sm"
                onClick={() => setAddBillModalOpen(true)}
                className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary-strong text-white"
              >
                <Plus className="size-3.5" />
                <span>Add Vendor Bill</span>
              </Button>
            </div>
          }
        />

        <TableToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search vendor or bill reference..."
          actions={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg outline-none text-foreground font-medium"
            >
              <option value="">All Bill Statuses</option>
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          }
        />

        <Table
          columns={columns}
          data={paginatedBills}
          emptyMessage="No vendor bills found matching your filter."
        />

        {filteredBills.length > pageSize && (
          <TablePagination
            page={page}
            totalItems={filteredBills.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        )}
      </TableCard>

      {/* Modals */}
      <AddVendorBillModal
        open={addBillModalOpen}
        onOpenChange={setAddBillModalOpen}
        onSave={handleAddBill}
      />

      <RecordVendorPaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        bill={selectedBillForPayment}
        onSave={handleRecordPayment}
      />
    </div>
  )
}
