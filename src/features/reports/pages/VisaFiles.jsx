import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Eye,
  FilePlus2,
  FolderKanban,
  HandCoins,
  Plane,
  Printer,
  Search,
  Stamp,
  TrendingUp,
} from 'lucide-react'
import { printReportDocument } from '@/utils/exportEngine'

import AccountingTabs from '../components/AccountingTabs'
import ExportButtons from '../components/ExportButtons'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import PeriodFilter from '../components/PeriodFilter'
import FileModal from '../components/FileModal'
import FileDetailModal from '../components/FileDetailModal'
import PaymentModal from '../components/PaymentModal'
import { reportsApi, formatMoney, formatPct } from '../reports.api'
import { formatDateShort, todayISO } from '../accounting/dates'
import { FILE_TYPES, SEGMENTS } from '../accounting/coa'
import { printFileInvoice } from '../reports.print'
import { Table, TableBadge, TablePagination } from '@/components/re-table'

const PAGE_SIZE = 12
const now = new Date()

const TYPE_ICON = { Visa: Stamp, Tour: Plane, 'Air Ticket': Plane, Hotel: Plane, Transport: Plane }
const TYPE_TONE = { Visa: 'blue', Tour: 'green', 'Air Ticket': 'purple', Hotel: 'amber', Transport: 'gray' }
const STATUS_TONE = { Processing: 'warning', Completed: 'success', Cancelled: 'danger' }

const segmentColor = (type) => SEGMENTS.find((segment) => segment.id === FILE_TYPES[type]?.segment)?.color || '#64748B'

export default function VisaFiles() {
  const [range, setRange] = useState({ from: `${now.getFullYear()}-01-01`, to: todayISO() })
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [lookups, setLookups] = useState({ accounts: [], parties: [] })
  const [fileOpen, setFileOpen] = useState(false)
  const [fileId, setFileId] = useState(null)
  const [payment, setPayment] = useState({ open: false, partyId: '', fileId: '' })
  const [notice, setNotice] = useState(null)

  const apiFilters = useMemo(
    () => ({
      type: type === 'all' ? undefined : type,
      status: status === 'all' ? undefined : status,
      search,
      from: range.from,
      to: range.to,
    }),
    [type, status, search, range.from, range.to]
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await reportsApi.getFiles({ from: range.from, to: range.to })
      setData(response.data)
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load service files.' })
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to])

  const loadLookups = useCallback(async () => {
    try {
      const [accountsRes, partiesRes] = await Promise.all([
        reportsApi.getChartOfAccounts(),
        reportsApi.getParties(),
      ])
      setLookups({ accounts: accountsRes.data.rows, parties: partiesRes.data })
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  useEffect(() => {
    setPage(1)
  }, [apiFilters])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const baseRows = useMemo(() => data?.rows || [], [data])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return baseRows.filter((row) => {
      if (type !== 'all' && row.type !== type) return false
      if (status !== 'all' && row.status !== status) return false
      if (!query) return true
      return [row.fileNo, row.applicant, row.destination, row.detail, row.passportNo, row.partyName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [baseRows, type, status, search])

  const summary = useMemo(() => {
    const sale = rows.reduce((sum, row) => sum + row.sale, 0)
    const cost = rows.reduce((sum, row) => sum + row.cost, 0)
    const profit = sale - cost
    return {
      count: rows.length,
      sale,
      cost,
      profit,
      margin: sale > 0 ? (profit / sale) * 100 : 0,
      received: rows.reduce((sum, row) => sum + row.received, 0),
      due: rows.reduce((sum, row) => sum + row.due, 0),
      averageTicket: rows.length ? sale / rows.length : 0,
    }
  }, [rows])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const byType = useMemo(() => {
    const map = new Map()
    for (const row of rows) {
      if (!map.has(row.type)) {
        map.set(row.type, { type: row.type, count: 0, sale: 0, cost: 0, profit: 0, due: 0 })
      }
      const bucket = map.get(row.type)
      bucket.count += 1
      bucket.sale += row.sale
      bucket.cost += row.cost
      bucket.profit += row.profit
      bucket.due += row.due
    }
    return [...map.values()].sort((a, b) => b.sale - a.sale)
  }, [rows])

  const topDestinations = useMemo(() => {
    const map = new Map()
    for (const row of rows) {
      const key = row.destination || '—'
      if (!map.has(key)) map.set(key, { destination: key, count: 0, sale: 0, profit: 0 })
      const bucket = map.get(key)
      bucket.count += 1
      bucket.sale += row.sale
      bucket.profit += row.profit
    }
    return [...map.values()].sort((a, b) => b.profit - a.profit).slice(0, 7)
  }, [rows])

  const typeCounts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const visible = baseRows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false
      if (!query) return true
      return [row.fileNo, row.applicant, row.destination, row.detail, row.passportNo, row.partyName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    const counts = { all: visible.length }
    for (const row of visible) counts[row.type] = (counts[row.type] || 0) + 1
    return counts
  }, [baseRows, status, search])

  const balances = useMemo(() => {
    const map = {}
    for (const row of baseRows) map[row.partyId] = (map[row.partyId] || 0) + row.due
    return map
  }, [baseRows])

  const handleCreateFile = async (payload) => {
    const response = await reportsApi.createFile(payload)
    setNotice({ type: 'success', text: `File ${response.data.fileNo} posted with invoice and supplier costs.` })
    await load()
  }

  const handlePayment = async (payload) => {
    await reportsApi.createReceipt(payload)
    setNotice({ type: 'success', text: 'Receipt posted and applied to the file.' })
    await load()
  }

  const printInvoice = async (row) => {
    try {
      const response = await reportsApi.getFile(row.id)
      printFileInvoice({
        ...response.data,
        partyCode: response.data.party?.code,
        partyPhone: response.data.party?.phone,
      })
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not prepare the invoice.' })
    }
  }

  const printList = () => {
    printReportDocument({
      title: 'Visa & Tour File Profitability',
      subtitle: 'Job-wise sale, direct cost and gross profit',
      dateRange: `${formatDateShort(range.from)} — ${formatDateShort(range.to)}`,
      headers: [
        { key: 'fileNo', label: 'File' },
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Service' },
        { key: 'applicant', label: 'Applicant' },
        { key: 'destination', label: 'Destination' },
        { key: 'sale', label: 'Sale', align: 'right', isCurrency: true },
        { key: 'cost', label: 'Cost', align: 'right', isCurrency: true },
        { key: 'profit', label: 'Gross profit', align: 'right', isCurrency: true },
        { key: 'margin', label: 'Margin', align: 'right' },
        { key: 'due', label: 'Due', align: 'right', isCurrency: true },
      ],
      rows: rows.map((row) => ({
        fileNo: row.fileNo,
        date: formatDateShort(row.date),
        type: row.type,
        applicant: row.applicant,
        destination: row.destination,
        sale: formatMoney(row.sale),
        cost: formatMoney(row.cost),
        profit: formatMoney(row.profit),
        margin: formatPct(row.margin),
        due: formatMoney(row.due),
      })),
      summaryTotals: [
        { value: `${rows.length} files`, colspan: 5 },
        { value: formatMoney(summary.sale), align: 'right' },
        { value: formatMoney(summary.cost), align: 'right' },
        { value: formatMoney(summary.profit), align: 'right' },
        { value: formatPct(summary.margin), align: 'right' },
        { value: formatMoney(summary.due), align: 'right' },
      ],
      metadata: {
        'Average ticket': formatMoney(summary.averageTicket),
        Received: formatMoney(summary.received),
        'Outstanding': formatMoney(summary.due),
      },
    })
  }

  const columns = [
    {
      key: 'fileNo',
      header: 'File',
      render: (row) => (
        <div>
          <span className="font-mono text-[10.5px] font-bold text-slate-800">{row.fileNo}</span>
          <span className="block text-[10px] text-slate-400">{formatDateShort(row.date)}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Service',
      render: (row) => (
        <div className="max-w-44">
          <TableBadge type="pill" variant={TYPE_TONE[row.type] || 'gray'} className="!px-2 !py-0.5 !text-[9.5px]">
            {row.type}
          </TableBadge>
          <span className="mt-0.5 block truncate text-[10.5px] font-medium text-slate-600">{row.destination}</span>
          <span className="block truncate text-[9.5px] text-slate-400">{row.detail}</span>
        </div>
      ),
    },
    {
      key: 'applicant',
      header: 'Applicant / client',
      render: (row) => (
        <div className="max-w-40">
          <span className="block truncate text-[11.5px] font-semibold text-slate-800">{row.applicant}</span>
          <span className="block truncate text-[10px] text-slate-400">
            {row.partyName}
            {row.pax > 1 ? ` · ${row.pax} pax` : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'sale',
      header: 'Sale',
      align: 'right',
      render: (row) => (
        <span className="text-[11.5px] font-semibold tabular-nums text-slate-800">{formatMoney(row.sale)}</span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'right',
      render: (row) => <span className="text-[11.5px] tabular-nums text-slate-500">{formatMoney(row.cost)}</span>,
    },
    {
      key: 'profit',
      header: 'Gross profit',
      align: 'right',
      render: (row) => (
        <div>
          <span className={`text-[11.5px] font-bold tabular-nums ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {formatMoney(row.profit)}
          </span>
          <span
            className={`ml-1 rounded px-1 py-0.5 text-[9px] font-bold ${
              row.margin >= 25
                ? 'bg-emerald-50 text-emerald-700'
                : row.margin >= 12
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-rose-50 text-rose-600'
            }`}
          >
            {formatPct(row.margin)}
          </span>
        </div>
      ),
    },
    {
      key: 'received',
      header: 'Received',
      align: 'right',
      render: (row) => (
        <span className="text-[11px] tabular-nums text-emerald-700">{row.received ? formatMoney(row.received) : '—'}</span>
      ),
    },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (row) => (
        <span className={`text-[11.5px] font-bold tabular-nums ${row.due > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
          {row.due > 0 ? formatMoney(row.due) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <TableBadge type="status" variant={STATUS_TONE[row.status] || 'info'} showDot={false}>
          {row.status}
        </TableBadge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-0.5" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => setFileId(row.id)}
            className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-primary"
            title="View file"
          >
            <Eye className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => printInvoice(row)}
            className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Print invoice"
          >
            <Printer className="size-3.5" />
          </button>
          {row.due > 0 && row.status !== 'Cancelled' ? (
            <button
              type="button"
              onClick={() => setPayment({ open: true, partyId: row.partyId, fileId: row.id })}
              className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
              title="Receive payment"
            >
              <HandCoins className="size-3.5" />
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Visa & Tour Files"
        description="Every visa application, tour booking and ticket as a profit centre — sale, supplier cost and margin in one ledger."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Visa & Tour Files' }]}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <ExportButtons
              onCsv={() => reportsApi.exportFiles(apiFilters, 'csv')}
              onExcel={() => reportsApi.exportFiles(apiFilters, 'excel')}
              onPrint={printList}
              disabled={!data}
            />
            <Button size="sm" onClick={() => setFileOpen(true)} className="gap-1.5 bg-primary text-white">
              <FilePlus2 className="size-3.5" /> Open file
            </Button>
          </div>
        }
      />

      <AccountingTabs />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Files in period"
          value={summary.count.toLocaleString('en-IN')}
          hint={`Average ticket ${formatMoney(summary.averageTicket)}`}
          icon={FolderKanban}
          tone="primary"
        />
        <MetricCard
          label="Sale value"
          value={formatMoney(summary.sale)}
          hint="Invoiced across all files"
          icon={TrendingUp}
          tone="primary"
        />
        <MetricCard
          label="Direct service cost"
          value={formatMoney(summary.cost)}
          hint="Embassy, airline, hotel & DMC"
          icon={Stamp}
          tone="warning"
        />
        <MetricCard
          label="Gross profit"
          value={formatMoney(summary.profit)}
          hint={`Margin ${formatPct(summary.margin)} · due ${formatMoney(summary.due)}`}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <PeriodFilter from={range.from} to={range.to} onChange={({ from, to }) => setRange({ from, to })} />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setType('all')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                type === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All files
              <span className={`rounded px-1 text-[9px] ${type === 'all' ? 'bg-white/20' : 'bg-slate-100'}`}>
                {typeCounts.all || 0}
              </span>
            </button>
            {Object.keys(FILE_TYPES).map((fileType) => {
              const Icon = TYPE_ICON[fileType] || Plane
              const active = type === fileType
              return (
                <button
                  key={fileType}
                  type="button"
                  onClick={() => setType(fileType)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
                    active ? 'text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  style={active ? { backgroundColor: segmentColor(fileType) } : undefined}
                >
                  <Icon className="size-3.5" />
                  {fileType}
                  <span className={`rounded px-1 text-[9px] ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {typeCounts[fileType] || 0}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search file, applicant, passport…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 outline-none focus:border-primary"
            >
              <option value="all">All statuses</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
          <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-slate-500">Loading service files…</p>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={pageRows}
            headerClassName="bg-[#0F172A] text-white"
            emptyText="No files match this view"
            emptyDescription="Try a different period, service type or search term."
            onRowClick={(row) => setFileId(row.id)}
          />
          <TablePagination
            currentPage={current}
            totalEntries={rows.length}
            pageSize={PAGE_SIZE}
            itemLabel="files"
            onPageChange={setPage}
          />
        </>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Profitability by service" subtitle="Contribution of each travel segment" flush bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 font-semibold">Service</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Files</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Sale</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Gross profit</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byType.map((bucket) => {
                  const margin = bucket.sale > 0 ? (bucket.profit / bucket.sale) * 100 : 0
                  return (
                    <tr key={bucket.type} className="bg-white">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-sm" style={{ backgroundColor: segmentColor(bucket.type) }} />
                          <span className="font-semibold text-slate-800">{bucket.type}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{bucket.count}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                        {formatMoney(bucket.sale)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                        {formatMoney(bucket.profit)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            margin >= 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {formatPct(margin)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Top destinations by profit" subtitle="Where the margin is coming from">
          <div className="space-y-2">
            {topDestinations.map((destination, index) => {
              const max = Math.max(1, topDestinations[0]?.profit || 1)
              return (
                <div key={destination.destination} className="flex items-center gap-2.5">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[9.5px] font-bold text-slate-500">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[11.5px] font-semibold text-slate-700">{destination.destination}</span>
                      <span className="shrink-0 text-[11.5px] font-bold tabular-nums text-emerald-700">
                        {formatMoney(destination.profit)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.max(3, (destination.profit / max) * 100)}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[9.5px] text-slate-400">{destination.count} files</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>
      </div>

      <FileModal
        open={fileOpen}
        onOpenChange={setFileOpen}
        parties={lookups.parties}
        accounts={lookups.accounts}
        onSave={handleCreateFile}
      />
      <FileDetailModal
        open={Boolean(fileId)}
        onOpenChange={(open) => !open && setFileId(null)}
        fileId={fileId}
        onChanged={load}
        onReceive={(file) => {
          setFileId(null)
          setPayment({ open: true, partyId: file.partyId, fileId: file.id })
        }}
      />
      <PaymentModal
        open={payment.open}
        onOpenChange={(open) => setPayment((current) => ({ ...current, open }))}
        mode="receipt"
        parties={lookups.parties}
        files={baseRows}
        balances={balances}
        defaultPartyId={payment.partyId}
        defaultFileId={payment.fileId}
        onSave={handlePayment}
      />

      {notice ? (
        <div
          role="status"
          className={`fixed right-4 top-4 z-50 rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold shadow-lg ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {notice.text}
        </div>
      ) : null}
    </div>
  )
}
