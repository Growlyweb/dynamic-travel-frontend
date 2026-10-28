import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { HandCoins, PlusCircle, Search } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import SaleModal from '../components/SaleModal'
import SaleViewModal from '../components/SaleViewModal'
import MoneyReceiptModal from '../components/MoneyReceiptModal'
import ReceiptViewModal from '../components/ReceiptViewModal'
import AddCostModal from '../components/AddCostModal'
import CancelSaleModal from '../components/CancelSaleModal'
import { simpleApi } from '../simple.api'
import { usePermission } from '@/hooks/usePermission'
import { useServerTable } from '@/hooks/useServerTable'
import { useToast } from '@/context/ToastContext'
import { PERMISSIONS } from '@/utils/permissions'
import { errorMessage } from '@/utils/errors'
import { formatMoney } from '@/features/reports/lib/format'
import { formatDateShort, firstOfMonth, todayISO } from '@/features/reports/lib/dates'
import { Table, TableBadge, TablePagination } from '@/components/re-table'

const now = new Date()

const statusOf = (row) => {
  if (row.status === 'Cancelled') return 'Cancelled'
  if (row.due <= 0) return 'Paid'
  if (row.received > 0) return 'Partial'
  return 'Due'
}

const statusTone = { Paid: 'success', Partial: 'warning', Due: 'info', Cancelled: 'danger' }

export default function Sales() {
  const { can } = usePermission()
  const toast = useToast()
  const canManage = can(PERMISSIONS.ACCOUNTS_EDIT)
  const canCancel = can(PERMISSIONS.ACCOUNTS_VOID)

  const [filters, setFilters] = useState({
    from: firstOfMonth(now.getFullYear(), now.getMonth()),
    to: todayISO(),
    category: '',
  })
  const [categories, setCategories] = useState([])
  const [priceList, setPriceList] = useState([])
  const [dues, setDues] = useState([])
  const [saleOpen, setSaleOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [receiptFor, setReceiptFor] = useState(null)
  const [receiptViewNo, setReceiptViewNo] = useState('')
  const [costFor, setCostFor] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  const table = useServerTable({ table: 'accounts-sales', fetcher: simpleApi.listSales, filters })
  const rows = table.rows
  const summary = table.extras.summary ?? {}

  useEffect(() => {
    Promise.all([simpleApi.getCategories(), simpleApi.getPriceList()])
      .then(([categoryRows, prices]) => {
        setCategories(categoryRows)
        setPriceList(prices)
      })
      .catch((error) => toast.error(errorMessage(error)))
  }, [toast])

  // The invoices that still owe money, for the money receipt form.
  const loadDues = () => simpleApi.listDue({ pageSize: 500 }).then((result) => setDues(result.rows)).catch(() => setDues([]))
  useEffect(() => {
    loadDues()
  }, [])

  const setFilter = (key) => (event) => setFilters((current) => ({ ...current, [key]: event.target.value }))

  const refresh = async (message) => {
    if (message) toast.success(message)
    table.reload()
    loadDues()
  }

  const current = table.page
  const pageSize = table.pageSize

  const columns = [
    {
      key: 'sl',
      header: 'SL.',
      render: (row, index) => (
        <span className="text-sm text-slate-500">{(current - 1) * pageSize + index + 1}</span>
      ),
    },
    {
      key: 'fileNo',
      header: 'Invoice',
      render: (row) => (
        <div>
          <p className="whitespace-nowrap text-sm font-bold text-slate-900">{row.fileNo}</p>
          <p className="text-[11px] text-slate-500">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Sales Date',
      render: (row) => (
        <div className="whitespace-nowrap">
          <p className="text-sm text-slate-700">{formatDateShort(row.date)}</p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client Name',
      render: (row) => (
        <div className="min-w-32 max-w-40">
          <p className="truncate text-sm font-semibold text-[#2F80ED]">{row.partyName}</p>
          <p className="text-[11px] text-slate-500">{row.partyPhone || (row.partyType === 'B2B' ? 'B2B Agent' : 'B2C Customer')}</p>
          <p className="truncate text-[10px] text-slate-400">
            Created by {row.createdByName || 'System'}
          </p>
        </div>
      ),
    },
    {
      key: 'sale',
      header: 'Sales Price',
      align: 'right',
      render: (row) => (
        <div className="whitespace-nowrap text-right">
          <p className="text-sm font-semibold tabular-nums text-slate-900">{formatMoney(row.sale)}</p>
          <div className="text-[10px] tabular-nums text-slate-400">
            {row.discount > 0 ? <p>Discount {formatMoney(row.discount)}</p> : null}
            <p>Cost {formatMoney(row.cost)}</p>
            <p>File profit {formatMoney(row.profit)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'received',
      header: 'Rec Amount',
      align: 'right',
      render: (row) => (
        <span className="whitespace-nowrap text-sm font-medium tabular-nums text-emerald-700">{formatMoney(row.received)}</span>
      ),
    },
    {
      key: 'due',
      header: 'Due Amount',
      align: 'right',
      render: (row) => (
        <div className="whitespace-nowrap text-right">
          <p className={`text-sm font-bold tabular-nums ${row.due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {formatMoney(row.due)}
          </p>
          <div className="mt-0.5">
            <TableBadge type="status" variant={statusTone[statusOf(row)]} showDot={false}>
              {statusOf(row)}
            </TableBadge>
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setViewing(row)}
            className="rounded-md bg-[#2F80ED] px-1.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"
          >
            View
          </button>
          {canManage && row.status !== 'Cancelled' ? (
            <button
              type="button"
              onClick={() => {
                setEditing(row)
                setSaleOpen(true)
              }}
              className="rounded-md bg-[#2F80ED] px-1.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"
            >
              Edit
            </button>
          ) : null}
          {canCancel && row.status !== 'Cancelled' ? (
            <button
              type="button"
              onClick={() => setCancelling(row)}
              className="rounded-md bg-[#DC2626] px-1.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#b91c1c]"
            >
              Cancel
            </button>
          ) : null}
          {canManage && row.due > 0 && row.status !== 'Cancelled' ? (
            <button
              type="button"
              onClick={() => setReceiptFor(row)}
              className="rounded-md bg-[#2F80ED] px-1.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"
            >
              Money Receipt
            </button>
          ) : null}
          {canManage && row.status !== 'Cancelled' ? (
            <button
              type="button"
              onClick={() => setCostFor(row)}
              className="rounded-md bg-[#2F80ED] px-1.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"
            >
              Add Cost
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Sales"
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Sales' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              onClick={() => setReceiptFor({})}
              className="h-11 gap-2 bg-[#2F80ED] px-4 text-base text-white hover:bg-[#1d6fd0]"
            >
              <HandCoins className="size-5" /> Money Receipt
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setEditing(null)
                setSaleOpen(true)
              }}
              className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white"
            >
              <PlusCircle className="size-5" /> New Sale
            </Button>
          </div>
        }
      />

      <SimpleTabs />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={table.search}
              onChange={(event) => table.setSearch(event.target.value)}
              placeholder="Search invoice, client, phone…"
              className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-base outline-none focus:border-[#2F80ED] focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <input
            type="date"
            value={filters.from}
            onChange={setFilter('from')}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#2F80ED]"
          />
          <input
            type="date"
            value={filters.to}
            onChange={setFilter('to')}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#2F80ED]"
          />
          <select
            value={filters.category}
            onChange={setFilter('category')}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#2F80ED]"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.label} value={category.label}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
          <span>{Number(summary.count ?? 0).toLocaleString()} sales</span>
          <span>Selling {formatMoney(summary.sale)}</span>
          {summary.discount > 0 ? <span>Discount {formatMoney(summary.discount)}</span> : null}
          <span>Cost {formatMoney(summary.cost)}</span>
          <span>Profit {formatMoney(summary.profit)}</span>
          <span>Received {formatMoney(summary.received)}</span>
          <span>Due {formatMoney(summary.due)}</span>
        </div>
      </div>

      {table.error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
          {errorMessage(table.error)}{' '}
          <button type="button" onClick={table.reload} className="font-semibold underline">Try again</button>
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-500 lg:hidden">Swipe the table sideways to see all columns and actions.</p>
          <Table
            columns={columns}
            data={rows}
            dense
            loading={table.loading}
            refreshing={table.refreshing}
            headerClassName="bg-[#2F80ED] text-white"
            emptyText="No sales found"
            emptyDescription="Change the date or search, or create a new sale."
          />
          <TablePagination {...table.paginationProps} itemLabel="sales" />
        </>
      )}

      <SaleModal
        open={saleOpen}
        onOpenChange={(open) => {
          setSaleOpen(open)
          if (!open) setEditing(null)
        }}
        sale={editing}
        categories={categories}
        priceList={priceList}
        onSave={async (payload) => {
          if (editing) await simpleApi.updateSale(editing.id, payload)
          else await simpleApi.createSale(payload)
          await refresh(editing ? 'Sale updated.' : 'Sale saved.')
        }}
      />
      <SaleViewModal
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
        sale={viewing}
        onEdit={(sale) => {
          setViewing(null)
          setEditing(sale)
          setSaleOpen(true)
        }}
        onReceipt={(sale) => {
          setViewing(null)
          setReceiptFor(sale)
        }}
        onCost={(sale) => {
          setViewing(null)
          setCostFor(sale)
        }}
      />
      <MoneyReceiptModal
        open={Boolean(receiptFor)}
        onOpenChange={(open) => !open && setReceiptFor(null)}
        sale={receiptFor && receiptFor.id ? receiptFor : null}
        sales={dues}
        onSave={async (payload) => {
          const receipt = await simpleApi.addReceipt(payload)
          await refresh('Money receipt saved. Due updated.')
          setReceiptViewNo(receipt.no)
        }}
      />
      <ReceiptViewModal
        open={Boolean(receiptViewNo)}
        onOpenChange={(open) => !open && setReceiptViewNo('')}
        receiptNo={receiptViewNo}
      />
      <AddCostModal
        open={Boolean(costFor)}
        onOpenChange={(open) => !open && setCostFor(null)}
        sale={costFor}
        onSave={async (payload) => {
          await simpleApi.addCost(costFor.id, payload)
          await refresh('Cost added. Profit updated.')
        }}
      />

      <CancelSaleModal
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
        sale={cancelling}
        onConfirm={async (body) => {
          await simpleApi.cancelSale(cancelling.id, body)
          await refresh('Sale cancelled.')
        }}
      />
    </div>
  )
}
