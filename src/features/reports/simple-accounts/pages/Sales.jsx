import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  HandCoins,
  PlusCircle,
  Search,
} from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import SaleModal from '../components/SaleModal'
import SaleViewModal from '../components/SaleViewModal'
import MoneyReceiptModal from '../components/MoneyReceiptModal'
import ReceiptViewModal from '../components/ReceiptViewModal'
import AddCostModal from '../components/AddCostModal'
import { simpleApi } from '../simple.api'
import { useAuth } from '@/hooks/useAuth'
import { formatMoney } from '@/features/reports/reports.api'
import { formatDateShort, firstOfMonth, todayISO } from '@/features/reports/accounting/dates'
import { Table, TableBadge, TablePagination } from '@/components/re-table'

const PAGE_SIZE = 12
const now = new Date()

const statusOf = (row) => {
  if (row.status === 'Cancelled') return 'Cancelled'
  if (row.due <= 0) return 'Paid'
  if (row.received > 0) return 'Partial'
  return 'Due'
}

const statusTone = { Paid: 'success', Partial: 'warning', Due: 'info', Cancelled: 'danger' }

export default function Sales() {
  const { user } = useAuth()
  const canManage = ['admin', 'manager'].includes(user?.role)
  const canSeeProfit = ['admin', 'manager'].includes(user?.role)

  const [filters, setFilters] = useState({
    search: '',
    from: firstOfMonth(now.getFullYear(), now.getMonth()),
    to: todayISO(),
    category: '',
    status: '',
  })
  const [data, setData] = useState({ rows: [], summary: {} })
  const [allSales, setAllSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState([])
  const [priceList, setPriceList] = useState([])
  const [saleOpen, setSaleOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [receiptFor, setReceiptFor] = useState(null)
  const [receiptViewNo, setReceiptViewNo] = useState('')
  const [costFor, setCostFor] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [result, categoryRows, prices, allSales] = await Promise.all([
        simpleApi.listSales(filters),
        simpleApi.getCategories(),
        simpleApi.getPriceList(),
        simpleApi.listSales({}),
      ])
      setData(result)
      setCategories(categoryRows)
      setPriceList(prices)
      setAllSales(allSales.rows)
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load sales.' })
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [filters])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const pages = Math.max(1, Math.ceil(data.rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = useMemo(
    () => data.rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [data.rows, current]
  )

  const setFilter = (key) => (event) => setFilters((currentFilters) => ({ ...currentFilters, [key]: event.target.value }))

  const refresh = async (message) => {
    if (message) setNotice({ type: 'success', text: message })
    await load()
  }

  const deleteSale = async (sale) => {
    if (!window.confirm(`Delete sale ${sale.fileNo}? Its money and due will be removed.`)) return
    try {
      await simpleApi.deleteSale(sale.id)
      await refresh('Sale deleted.')
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not delete the sale.' })
    }
  }

  const columns = [
    {
      key: 'sl',
      header: 'SL.',
      render: (row, index) => (
        <span className="text-sm text-slate-500">{(current - 1) * PAGE_SIZE + index + 1}</span>
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
            Sales {row.salesBy || 'Admin'} · Created {row.createdBy || 'ABL Travel'}
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
          {canSeeProfit ? (
            <div className="text-[10px] tabular-nums text-slate-400">
              <p>Cost {formatMoney(row.cost)}</p>
              <p>Profit {formatMoney(row.profit)}</p>
            </div>
          ) : null}
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
      key: 'receiptNo',
      header: 'MR. No.',
      render: (row) =>
        row.receiptNo ? (
          <button
            type="button"
            onClick={() => setReceiptViewNo(row.receiptNo)}
            className="whitespace-nowrap text-sm font-semibold text-[#2F80ED] underline-offset-2 hover:underline"
            title="View money receipt"
          >
            {row.receiptNo}
          </button>
        ) : (
          <span className="whitespace-nowrap text-sm text-slate-400">—</span>
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
          {canManage && row.status !== 'Cancelled' ? (
            <button
              type="button"
              onClick={() => deleteSale(row)}
              className="rounded-md bg-[#DC2626] px-1.5 py-1.5 text-[10px] font-semibold text-white hover:bg-[#b91c1c]"
            >
              Delete
            </button>
          ) : null}
          {row.due > 0 && row.status !== 'Cancelled' ? (
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
              value={filters.search}
              onChange={setFilter('search')}
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
        {/* <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <span>{data.rows.length} sales</span>
          <span>Selling {formatMoney(data.rows.reduce((sum, row) => sum + row.sale, 0))}</span>
          {canSeeProfit ? <span>Profit {formatMoney(data.rows.reduce((sum, row) => sum + row.profit, 0))}</span> : null}
          <span>Due {formatMoney(data.rows.reduce((sum, row) => sum + row.due, 0))}</span>
        </div> */}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-base text-slate-500">
          Loading sales…
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 lg:hidden">Swipe the table sideways to see all columns and actions.</p>
          <Table
            columns={columns}
            data={rows}
            dense
            headerClassName="bg-[#2F80ED] text-white"
            emptyText="No sales found"
            emptyDescription="Change the date or search, or create a new sale."
          />
        </>
      )}

      <TablePagination
        currentPage={current}
        totalEntries={data.rows.length}
        pageSize={PAGE_SIZE}
        itemLabel="sales"
        onPageChange={setPage}
      />

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
        sales={allSales}
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

      {notice ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${notice.type === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-800'
            : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
        >
          {notice.text}
        </div>
      ) : null}
    </div>
  )
}
