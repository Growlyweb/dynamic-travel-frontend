import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { AlertCircle, Building2, FileText, Search, Wallet } from 'lucide-react'
import { printReportDocument } from '@/utils/exportEngine'

import AccountingTabs from '../components/AccountingTabs'
import AgingBars from '../components/AgingBars'
import ExportButtons from '../components/ExportButtons'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import PaymentModal from '../components/PaymentModal'
import StatementModal from '../components/StatementModal'
import { reportsApi, formatMoney, formatPct } from '../reports.api'
import { formatDateShort, todayISO } from '../accounting/dates'
import { Table, TableBadge, TablePagination } from '@/components/re-table'

const PAGE_SIZE = 10
const STATUS_TONE = { Paid: 'success', Partial: 'warning', Unpaid: 'info', Overdue: 'danger' }

export default function Payables() {
  const [asOf, setAsOf] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentVendor, setPaymentVendor] = useState('')
  const [statementParty, setStatementParty] = useState('')
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await reportsApi.getPayables(asOf)
      setData(response.data)
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load payables.' })
    } finally {
      setLoading(false)
    }
  }, [asOf])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, status, asOf])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const parties = useMemo(() => data?.parties || [], [data])
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return parties.filter((party) => {
      if (status && party.status !== status) return false
      if (!query) return true
      return party.name.toLowerCase().includes(query) || party.code.toLowerCase().includes(query)
    })
  }, [parties, search, status])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const balances = useMemo(() => {
    const map = {}
    for (const party of parties) map[party.id] = party.due
    return map
  }, [parties])

  const handlePayment = async (payload) => {
    await reportsApi.createPayment(payload)
    setNotice({ type: 'success', text: 'Supplier payment posted.' })
    await load()
  }

  const printList = () => {
    printReportDocument({
      title: 'Supplier Payables Ageing',
      subtitle: 'Outstanding supplier balances with ageing',
      dateRange: `As at ${formatDateShort(asOf)}`,
      headers: [
        { key: 'code', label: 'Code' },
        { key: 'name', label: 'Supplier' },
        { key: 'bills', label: 'Bills', align: 'right' },
        { key: 'billed', label: 'Billed', align: 'right', isCurrency: true },
        { key: 'paid', label: 'Paid', align: 'right', isCurrency: true },
        { key: 'due', label: 'Outstanding', align: 'right', isCurrency: true },
        { key: 'overdue', label: 'Overdue', align: 'right', isCurrency: true },
        { key: 'status', label: 'Status' },
      ],
      rows: filtered.map((party) => ({
        code: party.code,
        name: party.name,
        bills: party.invoices,
        billed: formatMoney(party.invoiced),
        paid: formatMoney(party.collected),
        due: formatMoney(party.due),
        overdue: formatMoney(party.overdue),
        status: party.status,
      })),
      summaryTotals: [
        { value: `${filtered.length} suppliers`, colspan: 2 },
        { value: formatMoney(filtered.reduce((sum, party) => sum + party.invoiced, 0)), align: 'right' },
        { value: formatMoney(filtered.reduce((sum, party) => sum + party.collected, 0)), align: 'right' },
        { value: formatMoney(filtered.reduce((sum, party) => sum + party.due, 0)), align: 'right' },
        { value: formatMoney(filtered.reduce((sum, party) => sum + party.overdue, 0)), align: 'right' },
        { value: '' },
      ],
      metadata: {
        'Total payable': formatMoney(data?.summary.due || 0),
        Overdue: formatMoney(data?.summary.overdue || 0),
        'Settlement rate': data?.summary.invoiced ? formatPct((data.summary.collected / data.summary.invoiced) * 100) : '—',
      },
    })
  }

  const columns = [
    {
      key: 'name',
      header: 'Supplier',
      render: (row) => (
        <div>
          <span className="block text-[12px] font-bold text-slate-800">{row.name}</span>
          <span className="block text-[10px] text-slate-400">{row.code}</span>
        </div>
      ),
    },
    {
      key: 'bills',
      header: 'Bills',
      align: 'center',
      render: (row) => <span className="text-[11.5px] tabular-nums text-slate-500">{row.invoices}</span>,
    },
    {
      key: 'invoiced',
      header: 'Billed',
      align: 'right',
      render: (row) => <span className="text-[11.5px] tabular-nums text-slate-700">{formatMoney(row.invoiced)}</span>,
    },
    {
      key: 'collected',
      header: 'Paid',
      align: 'right',
      render: (row) => <span className="text-[11.5px] tabular-nums text-emerald-700">{formatMoney(row.collected)}</span>,
    },
    {
      key: 'due',
      header: 'Outstanding',
      align: 'right',
      render: (row) => (
        <span className={`text-[12px] font-bold tabular-nums ${row.due > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
          {formatMoney(row.due)}
        </span>
      ),
    },
    {
      key: 'overdue',
      header: 'Overdue',
      align: 'right',
      render: (row) => (
        <span className={`text-[11.5px] font-semibold tabular-nums ${row.overdue > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
          {row.overdue > 0 ? formatMoney(row.overdue) : '—'}
        </span>
      ),
    },
    {
      key: 'oldest',
      header: 'Oldest',
      align: 'right',
      render: (row) => (
        <span className={`text-[10.5px] font-medium ${row.oldestDays > 60 ? 'text-rose-600' : 'text-slate-400'}`}>
          {row.oldestDays > 0 ? `${row.oldestDays}d` : '—'}
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
        <div className="flex items-center justify-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              setPaymentVendor(row.id)
              setPaymentOpen(true)
            }}
            className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
            title="Pay supplier"
          >
            <Wallet className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setStatementParty(row.id)}
            className="grid size-7 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-primary"
            title="Statement of account"
          >
            <FileText className="size-3.5" />
          </button>
        </div>
      ),
    },
  ]

  const summary = data?.summary || { count: 0, invoiced: 0, collected: 0, due: 0, overdue: 0 }
  const settlementRate = summary.invoiced > 0 ? (summary.collected / summary.invoiced) * 100 : 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Supplier Payables"
        description="Bills owed to airlines, hotels, DMCs and transport suppliers — with ageing and settlement."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Payables' }]}
        actions={
          <ExportButtons
            onCsv={() => reportsApi.exportPayables(asOf, 'csv')}
            onExcel={() => reportsApi.exportPayables(asOf, 'excel')}
            onPrint={printList}
            disabled={!data}
          />
        }
      />

      <AccountingTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ageing as at</span>
          <input
            type="date"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11.5px] font-semibold text-slate-700 outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setAsOf(todayISO())}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-primary hover:bg-[#E6F2FD]"
          >
            Today
          </button>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setPaymentVendor('')
            setPaymentOpen(true)
          }}
          className="gap-1.5 bg-primary text-white hover:bg-primary/90"
        >
          <Wallet className="size-3.5" /> Pay supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total billed" value={formatMoney(summary.invoiced)} hint={`${summary.count} suppliers`} icon={Building2} tone="primary" />
        <MetricCard label="Paid to suppliers" value={formatMoney(summary.collected)} hint={`${formatPct(settlementRate)} of bills`} tone="success" />
        <MetricCard label="Outstanding" value={formatMoney(summary.due)} hint="Payable balance" tone="warning" />
        <MetricCard label="Overdue" value={formatMoney(summary.overdue)} hint="Past agreed terms" tone="danger" />
      </div>

      <SectionCard title="Ageing profile" subtitle="Payables by due bucket" icon={AlertCircle}>
        <AgingBars aging={data?.aging || []} total={data?.totalAging} />
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px]">
          <span className="text-slate-500">
            Total payable <strong className="ml-1 tabular-nums text-slate-900">{formatMoney(summary.due)}</strong>
          </span>
          <span className="text-slate-500">
            Overdue <strong className="ml-1 tabular-nums text-rose-600">{formatMoney(summary.overdue)}</strong>
          </span>
          <span className="text-slate-500">
            Settlement rate <strong className="ml-1 tabular-nums text-emerald-700">{formatPct(settlementRate)}</strong>
          </span>
        </div>
      </SectionCard>

      <SectionCard
        title="Supplier ledger"
        subtitle="Balances, ageing and last payment"
        flush
        bodyClassName="p-0"
      >
        <div className="flex flex-col gap-2 border-b border-slate-100 p-3.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search supplier or code…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-medium text-slate-700 outline-none focus:border-primary"
          >
            <option value="">All statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-500">Loading payables…</div>
        ) : (
          <Table
            columns={columns}
            data={rows}
            headerClassName="bg-[#0F172A] text-white"
            emptyText="No supplier balances match this view"
            emptyDescription="Adjust the search or status filter."
          />
        )}
        <div className="px-3.5 pb-3.5">
          <TablePagination
            currentPage={current}
            totalEntries={filtered.length}
            pageSize={PAGE_SIZE}
            itemLabel="suppliers"
            onPageChange={setPage}
          />
        </div>
      </SectionCard>

      <SectionCard title="How payables are calculated" icon={Building2}>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Supplier costs are credited to <strong>Accounts Payable</strong> when a file is booked on credit. Payments debit the
          control account and are applied to the oldest bill first, which is why the ageing profile always reconciles to the
          payable balance in the general ledger.
        </p>
      </SectionCard>

      <PaymentModal
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        mode="payment"
        parties={parties}
        balances={balances}
        defaultPartyId={paymentVendor}
        onSave={handlePayment}
      />
      <StatementModal
        open={Boolean(statementParty)}
        onOpenChange={(open) => !open && setStatementParty('')}
        partyId={statementParty}
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
