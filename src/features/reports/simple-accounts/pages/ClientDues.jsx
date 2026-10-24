import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { HandCoins, Search } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import MoneyReceiptModal from '../components/MoneyReceiptModal'
import BigCard from '../components/BigCard'
import SectionCard from '@/features/reports/components/SectionCard'
import ReportDonutChart from '@/features/reports/components/ReportDonutChart'
import AgingBars from '@/features/reports/components/AgingBars'
import { simpleApi } from '../simple.api'
import { formatMoney } from '@/features/reports/reports.api'
import { formatDateShort } from '@/features/reports/accounting/dates'
import { Table, TablePagination } from '@/components/re-table'

const PAGE_SIZE = 10

export default function ClientDues() {
  const [data, setData] = useState({ rows: [], totals: {} })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [receiptFor, setReceiptFor] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await simpleApi.listDue())
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load client dues.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return data.rows.filter((row) => {
      if (typeFilter && row.partyType !== typeFilter) return false
      if (!query) return true
      return `${row.fileNo} ${row.partyName} ${row.category}`.toLowerCase().includes(query)
    })
  }, [data.rows, search, typeFilter])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const aging = useMemo(() => {
    const buckets = [
      { label: '0–30 days', color: '#16A34A', amount: 0 },
      { label: '31–60 days', color: '#0879E8', amount: 0 },
      { label: '61–90 days', color: '#D97706', amount: 0 },
      { label: '90+ days', color: '#DC2626', amount: 0 },
    ]
    for (const row of data.rows) {
      const index = row.daysWaiting <= 30 ? 0 : row.daysWaiting <= 60 ? 1 : row.daysWaiting <= 90 ? 2 : 3
      buckets[index].amount += row.due
    }
    return buckets
  }, [data.rows])
  const overdue = data.rows.filter((row) => row.daysWaiting > 30).reduce((sum, row) => sum + row.due, 0)

  const columns = [
    {
      key: 'fileNo',
      header: 'Invoice',
      render: (row) => <span className="text-sm font-bold text-slate-900">{row.fileNo}</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (row) => <span className="whitespace-nowrap text-sm text-slate-600">{formatDateShort(row.date)}</span>,
    },
    {
      key: 'client',
      header: 'Client',
      render: (row) => (
        <div>
          <p className="text-sm font-semibold text-slate-900">{row.partyName}</p>
          <p className="text-xs text-slate-400">{row.partyType === 'B2B' ? 'B2B Agent' : 'B2C Customer'}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <span className="text-sm text-slate-600">{row.category}</span>,
    },
    {
      key: 'sale',
      header: 'Selling Price',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-700">{formatMoney(row.sale)}</span>,
    },
    {
      key: 'received',
      header: 'Received',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-emerald-700">{formatMoney(row.received)}</span>,
    },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (row) => (
        <span className={`text-sm font-bold tabular-nums ${row.due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {formatMoney(row.due)}
        </span>
      ),
    },
    {
      key: 'days',
      header: 'Days Waiting',
      align: 'center',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
            row.daysWaiting > 30 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          {row.daysWaiting} days
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      align: 'center',
      render: (row) => (
        <button
          type="button"
          onClick={() => setReceiptFor(row)}
          className="inline-flex items-center gap-1 rounded-lg bg-[#2F80ED] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1d6fd0]"
        >
          <HandCoins className="size-3.5" /> Money Receipt
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Client Dues"
        description="Every client who still owes money, oldest first."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Client Dues' }]}
        actions={
          <button
            type="button"
            onClick={() => setReceiptFor({})}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#2F80ED] px-5 text-base font-semibold text-white hover:bg-[#1d6fd0]"
          >
            <HandCoins className="size-5" /> Money Receipt
          </button>
        }
      />

      <SimpleTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigCard label="Total Due" value={formatMoney(data.totals.due || 0)} hint={`${data.totals.count || 0} sales with due`} tone="red" />
        <BigCard label="B2B Due" value={formatMoney(data.totals.b2b || 0)} hint="Agents who owe us" tone="blue" />
        <BigCard label="B2C Due" value={formatMoney(data.totals.b2c || 0)} hint="Customers who owe us" tone="green" />
        <BigCard label="Overdue" value={formatMoney(overdue)} hint="Waiting more than 30 days" tone="amber" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="B2B and B2C Dues" subtitle="Where the unpaid money sits">
          <ReportDonutChart
            bare
            title=""
            segments={[
              { label: 'B2B Agents', value: data.totals.b2b || 0, color: '#0879E8' },
              { label: 'B2C Customers', value: data.totals.b2c || 0, color: '#16A34A' },
            ]}
            centerSub="Total Due"
          />
        </SectionCard>
        <SectionCard title="How Long Money Has Been Waiting" subtitle="Red is over 90 days">
          <AgingBars aging={aging} total={data.totals.due || 0} columns={4} />
        </SectionCard>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice, client or category…"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-base outline-none focus:border-[#2F80ED]"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-base outline-none focus:border-[#2F80ED]"
        >
          <option value="">All clients</option>
          <option value="B2B">B2B Agents</option>
          <option value="B2C">B2C Customers</option>
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-base text-slate-500">
          Loading client dues…
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 lg:hidden">Swipe the table sideways to see the Due and Money Receipt button.</p>
          <Table
            columns={columns}
            data={rows}
            headerClassName="bg-[#2F80ED] text-white"
            emptyText="No client dues"
            emptyDescription="Everybody has paid. Good."
          />
        </>
      )}

      <TablePagination
        currentPage={current}
        totalEntries={filtered.length}
        pageSize={PAGE_SIZE}
        itemLabel="dues"
        onPageChange={setPage}
      />

      <MoneyReceiptModal
        open={Boolean(receiptFor)}
        onOpenChange={(open) => !open && setReceiptFor(null)}
        sale={receiptFor && receiptFor.id ? receiptFor : null}
        sales={data.rows}
        onSave={async (payload) => {
          await simpleApi.addReceipt(payload)
          await load()
          setNotice({ type: 'success', text: 'Money receipt saved. Due updated.' })
        }}
      />

      {notice ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            notice.type === 'error'
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
