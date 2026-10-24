import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { CalendarDays, Download, Eye, HandCoins, Search, Trash2 } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import BigCard from '../components/BigCard'
import MoneyReceiptModal from '../components/MoneyReceiptModal'
import ReceiptViewModal from '../components/ReceiptViewModal'
import { simpleApi } from '../simple.api'
import { formatMoney } from '@/features/reports/reports.api'
import { formatDateShort } from '@/features/reports/accounting/dates'
import { printSimpleReceipt } from '../receipts.print'
import { Table, TablePagination } from '@/components/re-table'

const PAGE_SIZE = 10

export default function MoneyReceipts() {
  const [data, setData] = useState({ rows: [], summary: {} })
  const [sales, setSales] = useState([])
  const [filters, setFilters] = useState({ from: '', to: '', search: '' })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [viewNo, setViewNo] = useState('')
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [receipts, saleRows] = await Promise.all([
        simpleApi.listReceipts(filters),
        simpleApi.listSales({}),
      ])
      setData(receipts)
      setSales(saleRows.rows)
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load money receipts.' })
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

  const remove = async (receipt) => {
    if (
      !window.confirm(
        `Delete receipt ${receipt.no}? The client due will go up by ${formatMoney(receipt.totalApplied)} and the money will be removed from ${receipt.paymentType}.`
      )
    ) {
      return
    }
    try {
      await simpleApi.deleteReceipt(receipt.id)
      await load()
      setNotice({ type: 'success', text: 'Money receipt deleted. Due and money were reversed.' })
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not delete the receipt.' })
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
      key: 'date',
      header: 'Payment Date',
      render: (row) => <span className="whitespace-nowrap text-sm text-slate-600">{formatDateShort(row.date)}</span>,
    },
    {
      key: 'no',
      header: 'Voucher No',
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={() => setViewNo(row.no)}
            className="text-sm font-bold text-[#2F80ED] hover:underline"
          >
            {row.no}
          </button>
          <p className="text-[11px] text-slate-400">Doc: {row.invoiceNo || 'Overall'}</p>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client Name',
      render: (row) => (
        <div className="min-w-40 max-w-52">
          <p className="truncate text-sm font-semibold text-slate-900">{row.clientName}</p>
          <p className="text-[11px] text-slate-500">{row.clientPhone || '—'}</p>
          <p className="truncate text-[10px] text-slate-400">{row.category}</p>
        </div>
      ),
    },
    {
      key: 'invoiceType',
      header: 'Invoice Type',
      render: (row) => (
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2F80ED]">
          {row.invoiceType}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'Payment Type',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-800">{row.paymentType}</p>
          <p className="text-[10px] text-slate-400">{row.accountName}</p>
        </div>
      ),
    },
    {
      key: 'manualNo',
      header: 'Manual Receipt No',
      render: (row) => <span className="text-sm text-slate-500">{row.manualNo || '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Paid Amount',
      align: 'right',
      render: (row) => (
        <div className="whitespace-nowrap text-right">
          <p className="text-sm font-bold tabular-nums text-slate-900">{formatMoney(row.amount)}</p>
          {row.discount > 0 ? (
            <p className="text-[10px] text-amber-600">Discount {formatMoney(row.discount)}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewNo(row.no)}
            className="inline-flex items-center gap-1 rounded-md bg-[#2F80ED] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"
          >
            <Eye className="size-3" /> View
          </button>
          <button
            type="button"
            onClick={() => printSimpleReceipt(row)}
            className="inline-flex items-center gap-1 rounded-md bg-[#2F80ED] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[#1d6fd0]"
          >
            <Download className="size-3" /> Print
          </button>
          <button
            type="button"
            onClick={() => remove(row)}
            className="inline-flex items-center gap-1 rounded-md bg-[#DC2626] px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-[#b91c1c]"
          >
            <Trash2 className="size-3" /> Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Money Receipts"
        description="Every payment received, with its MR number, client, account and printable receipt."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Money Receipts' }]}
        actions={
          <Button
            onClick={() => setReceiptOpen(true)}
            className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white hover:bg-[#1d6fd0]"
          >
            <HandCoins className="size-5" /> Add Money Receipt
          </Button>
        }
      />

      <SimpleTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigCard label="Total Received" value={formatMoney(data.summary.total || 0)} hint={`${data.summary.count || 0} receipts`} tone="green" />
        <BigCard label="Cash" value={formatMoney(data.summary.cash || 0)} hint="Cash receipts" tone="blue" />
        <BigCard label="Bank" value={formatMoney(data.summary.bank || 0)} hint="Bank receipts" tone="slate" />
        <BigCard label="bKash" value={formatMoney(data.summary.bkash || 0)} hint="Mobile wallet" tone="amber" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
            placeholder="Search MR no, client, invoice or phone…"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-base outline-none focus:border-[#2F80ED]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="size-4 text-slate-400" />
          <input
            type="date"
            value={filters.from}
            onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#2F80ED]"
          />
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            value={filters.to}
            onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
            className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#2F80ED]"
          />
          {filters.from || filters.to || filters.search ? (
            <button
              type="button"
              onClick={() => setFilters({ from: '', to: '', search: '' })}
              className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-base text-slate-500">
          Loading money receipts…
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          dense
          headerClassName="bg-[#2F80ED] text-white"
          emptyText="No money receipts yet"
          emptyDescription="Receive a payment from a sale and it will appear here."
        />
      )}

      <TablePagination
        currentPage={current}
        totalEntries={data.rows.length}
        pageSize={PAGE_SIZE}
        itemLabel="receipts"
        onPageChange={setPage}
      />

      <MoneyReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sales={sales}
        onSave={async (payload) => {
          const receipt = await simpleApi.addReceipt(payload)
          await load()
          setViewNo(receipt.no)
          setNotice({ type: 'success', text: 'Money receipt saved.' })
        }}
      />

      <ReceiptViewModal open={Boolean(viewNo)} onOpenChange={(open) => !open && setViewNo('')} receiptNo={viewNo} />

      {notice ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.text}
        </div>
      ) : null}
    </div>
  )
}
