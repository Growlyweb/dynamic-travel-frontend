import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  CalendarClock,
  CircleDollarSign,
  FilePlus2,
  FolderKanban,
  HandCoins,
  Landmark,
  PlusCircle,
  Receipt,
  RefreshCw,
  RotateCcw,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

import AccountingTabs from '../components/AccountingTabs'
import MonthNavigator from '../components/MonthNavigator'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import AgingBars from '../components/AgingBars'
import PerformanceChart from '../components/PerformanceChart'
import ReportDonutChart from '../components/ReportDonutChart'
import VoucherModal from '../components/VoucherModal'
import FileModal from '../components/FileModal'
import PaymentModal from '../components/PaymentModal'
import VoucherDetailModal from '../components/VoucherDetailModal'
import FileDetailModal from '../components/FileDetailModal'
import { reportsApi, formatMoney, formatPct } from '../reports.api'
import { formatDateShort } from '../accounting/dates'

const change = (current, previous) =>
  Number(previous) > 0 ? ((Number(current) - Number(previous)) / Number(previous)) * 100 : null

function TopList({ title, subtitle, items, tone, emptyText, to, linkLabel }) {
  const max = Math.max(1, ...items.map((item) => Number(item.due) || 0))
  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      actions={
        to ? (
          <Link to={to} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
            {linkLabel || 'View all'} <ArrowRight className="size-3" />
          </Link>
        ) : null
      }
    >
      {items.length === 0 ? (
        <p className="py-8 text-center text-[12px] text-slate-400">{emptyText}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {index + 1}
                  </span>
                  <span className="truncate text-[12px] font-semibold text-slate-700">{item.name}</span>
                  <span
                    className={`shrink-0 rounded px-1 py-0.5 text-[9px] font-bold ${
                      item.type === 'B2B'
                        ? 'bg-[#E6F2FD] text-primary'
                        : item.type === 'Vendor'
                          ? 'bg-violet-50 text-violet-700'
                          : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
                <span className={`shrink-0 text-[12px] font-bold tabular-nums ${tone}`}>{formatMoney(item.due)}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${tone === 'text-rose-600' ? 'bg-rose-400' : 'bg-violet-400'}`}
                  style={{ width: `${Math.max(3, (item.due / max) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

export default function AccountDashboard() {
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lookups, setLookups] = useState({ accounts: [], parties: [], files: [] })

  const [voucherOpen, setVoucherOpen] = useState(false)
  const [fileOpen, setFileOpen] = useState(false)
  const [payment, setPayment] = useState({ open: false, mode: 'receipt', partyId: '', fileId: '' })
  const [journalId, setJournalId] = useState(null)
  const [fileId, setFileId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await reportsApi.getDashboard(period)
      if (response.success) setData(response.data)
    } catch (err) {
      console.error(err)
      setError(err?.message || 'Could not load the accounts overview.')
    } finally {
      setLoading(false)
    }
  }, [period])

  const loadLookups = useCallback(async () => {
    try {
      const [accountsRes, partiesRes, filesRes] = await Promise.all([
        reportsApi.getChartOfAccounts(),
        reportsApi.getParties(),
        reportsApi.getFiles({}),
      ])
      setLookups({
        accounts: accountsRes.data.rows,
        parties: partiesRes.data,
        files: filesRes.data.rows,
      })
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    loadLookups()
  }, [loadLookups])

  const refreshAll = async () => {
    await Promise.all([loadData(), loadLookups()])
  }

  const balances = useMemo(() => {
    if (!data) return {}
    const map = {}
    for (const party of data.receivables.parties) map[party.id] = party.due
    for (const party of data.payables.parties) map[party.id] = party.due
    return map
  }, [data])

  const handleCreateJournal = async (payload) => {
    await reportsApi.createJournal(payload)
    await refreshAll()
  }

  const handleCreateFile = async (payload) => {
    await reportsApi.createFile(payload)
    await refreshAll()
  }

  const handlePayment = async (payload) => {
    if (payment.mode === 'receipt') await reportsApi.createReceipt(payload)
    else await reportsApi.createPayment(payload)
    await refreshAll()
  }

  const handleReset = async () => {
    if (
      !window.confirm(
        'Reset the accounting demo data? This clears every voucher and file you have created and restores the sample books.'
      )
    ) {
      return
    }
    await reportsApi.resetToDefaultData()
    await refreshAll()
    setJournalId(null)
    setFileId(null)
  }

  const openReceive = (partyId = '', fileIdValue = '') =>
    setPayment({ open: true, mode: 'receipt', partyId, fileId: fileIdValue })
  const openPay = (partyId = '') => setPayment({ open: true, mode: 'payment', partyId, fileId: '' })

  if (!data && loading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Accounts Overview" breadcrumbs={[{ label: 'Accounts' }]} />
        <AccountingTabs />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <PageHeader title="Accounts Overview" breadcrumbs={[{ label: 'Accounts' }]} />
        <AccountingTabs />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-2 size-6 text-rose-500" />
          <p className="text-sm font-semibold text-rose-700">{error || 'Unable to load the accounts overview.'}</p>
          <Button onClick={loadData} className="mt-3 gap-1.5" size="sm">
            <RefreshCw className="size-3.5" /> Try again
          </Button>
        </div>
      </div>
    )
  }

  const { kpis, previous, previousRange, pl, series, segments, aging, topReceivables, topPayables } = data
  const revenueDelta = change(kpis.revenue, previous.totalRevenue)
  const grossDelta = change(kpis.grossProfit, previous.grossProfit)
  const opexDelta = change(kpis.opex, previous.totalOpex)
  const netDelta = change(kpis.netProfit, previous.netProfit)

  const segmentSegments = segments.map((segment) => ({
    label: segment.short,
    value: Math.max(0, segment.revenue),
    color: segment.color,
  }))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Accounts Overview"
        description="A live view of the agency's books — revenue, costs, receivables, payables and profit."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Overview' }]}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setFileOpen(true)} className="gap-1.5">
              <FilePlus2 className="size-3.5" /> Open file
            </Button>
            <Button size="sm" onClick={() => setVoucherOpen(true)} className="gap-1.5 bg-primary text-white">
              <PlusCircle className="size-3.5" /> New voucher
            </Button>
          </div>
        }
      />

      <AccountingTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.03)] lg:flex-row lg:items-center lg:justify-between">
        <MonthNavigator year={period.year} month={period.month} onChange={setPeriod} />
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 font-medium">
            <CalendarClock className="size-3" /> As at {formatDateShort(data.asOf)}
          </span>
          <button
            type="button"
            onClick={() => openReceive()}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-600 hover:bg-slate-50"
          >
            <HandCoins className="size-3 text-emerald-600" /> Receive
          </button>
          <button
            type="button"
            onClick={() => openPay()}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-600 hover:bg-slate-50"
          >
            <Banknote className="size-3 text-rose-500" /> Pay supplier
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Reset the demo accounting data"
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600"
          >
            <RotateCcw className="size-3" /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Service revenue"
          value={formatMoney(kpis.revenue)}
          delta={revenueDelta}
          hint={`vs ${formatDateShort(previousRange.from)}–${formatDateShort(previousRange.to)}`}
          icon={TrendingUp}
          tone="primary"
        />
        <MetricCard
          label="Gross profit"
          value={formatMoney(kpis.grossProfit)}
          delta={grossDelta}
          hint={`Gross margin ${formatPct(kpis.grossMargin)}`}
          icon={CircleDollarSign}
          tone="success"
        />
        <MetricCard
          label="Operating expenses"
          value={formatMoney(kpis.opex)}
          delta={opexDelta}
          invertDelta
          hint="Salaries, rent & overheads"
          icon={Receipt}
          tone="warning"
        />
        <MetricCard
          label="Net profit"
          value={formatMoney(kpis.netProfit)}
          delta={netDelta}
          hint={`Net margin ${formatPct(kpis.netMargin)}`}
          icon={Landmark}
          tone={kpis.netProfit >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Cash & bank"
          value={formatMoney(kpis.cash)}
          hint={`${data.cash.length} accounts`}
          icon={Wallet}
          tone="primary"
          footer={
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {data.cash.map((account) => (
                <span key={account.code} className="whitespace-nowrap">
                  {account.code}: <strong className="text-slate-700">{formatMoney(account.balance)}</strong>
                </span>
              ))}
            </div>
          }
        />
        <MetricCard
          label="Receivables"
          value={formatMoney(kpis.receivables)}
          hint={`Overdue ${formatMoney(kpis.overdue)}`}
          icon={Users}
          tone="danger"
          onClick={() => openReceive()}
        />
        <MetricCard
          label="Payables"
          value={formatMoney(kpis.payables)}
          hint="Supplier bills outstanding"
          icon={Building2}
          tone="violet"
          onClick={() => openPay()}
        />
        <MetricCard
          label="Total equity"
          value={formatMoney(kpis.equity)}
          hint={`Including YTD profit ${formatMoney(data.ytd.netProfit)}`}
          icon={Landmark}
          tone="slate"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Revenue, cost & profit"
          subtitle="Last six months"
          icon={TrendingUp}
          className="xl:col-span-2"
        >
          <PerformanceChart data={series} title="" />
        </SectionCard>

        <SectionCard title="Segment mix" subtitle={`Revenue · ${formatDateShort(data.from)} — ${formatDateShort(data.to)}`}>
          {segmentSegments.length ? (
            <ReportDonutChart
              segments={segmentSegments}
              centerLabel={formatMoney(pl.totalRevenue)}
              centerSub="Revenue"
              title=""
              size={170}
              thickness={22}
              bare
            />
          ) : (
            <p className="py-10 text-center text-[12px] text-slate-400">No revenue posted in this period.</p>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard title="Receivables ageing" subtitle="Outstanding balances by age" icon={CalendarClock}>
          <AgingBars aging={aging} total={data.receivables.totalAging} />
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-[11px] text-slate-500">Total receivable</span>
            <span className="text-[13px] font-bold tabular-nums text-slate-900">
              {formatMoney(data.receivables.summary.due)}
            </span>
          </div>
        </SectionCard>

        <TopList
          title="Top receivables"
          subtitle="Clients & agents owing the most"
          items={topReceivables}
          tone="text-rose-600"
          emptyText="No outstanding receivables."
          to="/reports/b2b-agents"
        />

        <TopList
          title="Top payables"
          subtitle="Supplier balances to settle"
          items={topPayables}
          tone="text-violet-700"
          emptyText="No outstanding payables."
          to="/reports/payables"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Recent vouchers"
          subtitle="Latest postings across the ledger"
          className="xl:col-span-2"
          flush
          bodyClassName="p-0"
          actions={
            <Link to="/reports/journal" className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
              Journal <ArrowRight className="size-3" />
            </Link>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 font-semibold">Voucher</th>
                  <th className="px-4 py-2.5 font-semibold">Narration</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentJournals.slice(0, 7).map((journal) => (
                  <tr
                    key={journal.id}
                    className="cursor-pointer bg-white transition hover:bg-slate-50/70"
                    onClick={() => setJournalId(journal.id)}
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[10.5px] font-semibold text-slate-600">
                      {journal.no}
                    </td>
                    <td className="max-w-72 truncate px-4 py-2.5 text-slate-700">{journal.narration}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{formatDateShort(journal.date)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                      {formatMoney(journal.debit)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase ${
                          journal.status === 'void'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {journal.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Files in progress"
          subtitle="Open visa, tour and ticket jobs"
          icon={FolderKanban}
          actions={
            <Link to="/reports/visa-files" className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
              Files <ArrowRight className="size-3" />
            </Link>
          }
        >
          <div className="space-y-2">
            {data.openFiles.length === 0 ? (
              <p className="py-8 text-center text-[12px] text-slate-400">No open files.</p>
            ) : (
              data.openFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setFileId(file.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-2 text-left transition hover:border-slate-200 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[11.5px] font-semibold text-slate-800">
                      {file.fileNo} · {file.applicant}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {file.type} · {file.destination}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[11.5px] font-bold tabular-nums text-slate-800">{formatMoney(file.sale)}</p>
                    <p className="text-[9.5px] font-semibold text-rose-500">due {formatMoney(file.due)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <VoucherModal
        open={voucherOpen}
        onOpenChange={setVoucherOpen}
        accounts={lookups.accounts}
        parties={lookups.parties}
        files={lookups.files}
        onSave={handleCreateJournal}
      />
      <FileModal
        open={fileOpen}
        onOpenChange={setFileOpen}
        parties={lookups.parties}
        accounts={lookups.accounts}
        onSave={handleCreateFile}
      />
      <PaymentModal
        open={payment.open}
        onOpenChange={(open) => setPayment((current) => ({ ...current, open }))}
        mode={payment.mode}
        parties={lookups.parties}
        files={lookups.files}
        balances={balances}
        defaultPartyId={payment.partyId}
        defaultFileId={payment.fileId}
        onSave={handlePayment}
      />
      <VoucherDetailModal
        open={Boolean(journalId)}
        onOpenChange={(open) => !open && setJournalId(null)}
        journalId={journalId}
        onChanged={refreshAll}
      />
      <FileDetailModal
        open={Boolean(fileId)}
        onOpenChange={(open) => !open && setFileId(null)}
        fileId={fileId}
        onChanged={refreshAll}
        onReceive={(file) => {
          setFileId(null)
          openReceive(file.partyId, file.id)
        }}
      />
    </div>
  )
}
