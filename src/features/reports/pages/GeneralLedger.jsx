import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { BookOpen, RefreshCw, Wallet } from 'lucide-react'

import AccountingTabs from '../components/AccountingTabs'
import AccountSelect from '../components/AccountSelect'
import ExportButtons from '../components/ExportButtons'
import PeriodFilter from '../components/PeriodFilter'
import MetricCard from '../components/MetricCard'
import { reportsApi, formatMoney } from '../reports.api'
import { formatDateShort, todayISO } from '../accounting/dates'
import { printLedger } from '../reports.print'
import { Table, TableBadge, TablePagination } from '@/components/re-table'

const PAGE_SIZE = 20
const now = new Date()
const YEAR_START = `${now.getFullYear()}-01-01`

const TYPE_TONE = { OB: 'gray', SV: 'blue', RV: 'green', PV: 'rose', JV: 'purple', CV: 'amber' }
const TYPE_LABEL = { OB: 'Opening', SV: 'Sale', RV: 'Receipt', PV: 'Payment', JV: 'Journal', CV: 'Contra' }

export default function GeneralLedger() {
  const [accounts, setAccounts] = useState([])
  const [code, setCode] = useState('1020')
  const [range, setRange] = useState({ from: YEAR_START, to: todayISO() })
  const [ledger, setLedger] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    reportsApi
      .getChartOfAccounts()
      .then((response) => {
        if (active) setAccounts(response.data.rows)
      })
      .catch((err) => console.error(err))
    return () => {
      active = false
    }
  }, [])

  const load = useCallback(async () => {
    if (!code) {
      setLedger(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await reportsApi.getLedger({ code, from: range.from, to: range.to })
      setLedger(response.data)
      setPage(1)
    } catch (err) {
      setError(err?.message || 'Could not load this ledger.')
      setLedger(null)
    } finally {
      setLoading(false)
    }
  }, [code, range.from, range.to])

  useEffect(() => {
    load()
  }, [load])

  const pages = Math.max(1, Math.ceil((ledger?.rows.length || 0) / PAGE_SIZE))
  const current = Math.min(page, pages)
  const pageRows = useMemo(
    () => (ledger?.rows || []).slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [ledger, current]
  )

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => (
        <span className="whitespace-nowrap text-[11.5px] font-medium text-slate-600">{formatDateShort(row.date)}</span>
      ),
    },
    {
      key: 'no',
      header: 'Voucher',
      render: (row) => (
        <div>
          <span className="font-mono text-[10.5px] font-bold text-slate-700">{row.no}</span>
          <span className="mt-0.5 block">
            <TableBadge type="pill" variant={TYPE_TONE[row.type] || 'gray'} className="!px-1.5 !py-0 !text-[9px]">
              {TYPE_LABEL[row.type] || row.type}
            </TableBadge>
          </span>
        </div>
      ),
    },
    {
      key: 'narration',
      header: 'Particulars',
      render: (row) => (
        <div className="max-w-[320px]">
          <span className="block truncate text-[11.5px] text-slate-700">{row.narration}</span>
          <span className="block text-[10px] text-slate-400">
            {row.ref || row.partyName || row.fileNo || ''}
          </span>
        </div>
      ),
    },
    {
      key: 'debit',
      header: 'Debit',
      align: 'right',
      render: (row) => (
        <span className="text-[11.5px] font-medium tabular-nums text-slate-700">
          {row.debit ? formatMoney(row.debit) : '—'}
        </span>
      ),
    },
    {
      key: 'credit',
      header: 'Credit',
      align: 'right',
      render: (row) => (
        <span className="text-[11.5px] font-medium tabular-nums text-slate-700">
          {row.credit ? formatMoney(row.credit) : '—'}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Running balance',
      align: 'right',
      render: (row) => (
        <span className={`text-[11.5px] font-bold tabular-nums ${row.balance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
          {formatMoney(row.balance)}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="General Ledger"
        description="Account-by-account movements with a running balance and full voucher references."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'General Ledger' }]}
        actions={
          <ExportButtons
            onCsv={() => reportsApi.exportLedger({ code, from: range.from, to: range.to }, 'csv')}
            onExcel={() => reportsApi.exportLedger({ code, from: range.from, to: range.to }, 'excel')}
            onPrint={() => ledger && printLedger(ledger)}
            disabled={!ledger}
          />
        }
      />

      <AccountingTabs />

      <PeriodFilter from={range.from} to={range.to} onChange={({ from, to }) => setRange({ from, to })} />

      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.03)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-[#E6F2FD] text-primary">
              <Wallet className="size-4" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ledger account</p>
              <p className="text-[12px] font-bold text-slate-900">
                {ledger?.account?.name || 'Select an account'}
              </p>
            </div>
          </div>
          <div className="w-full sm:w-96">
            <AccountSelect
              value={code}
              onChange={setCode}
              accounts={accounts}
              placeholder="Choose any account…"
            />
          </div>
        </div>

        {ledger ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-slate-100 pt-3 text-[11px]">
            <span className="text-slate-500">
              Code <strong className="ml-1 font-mono text-slate-800">{ledger.account.code}</strong>
            </span>
            <span className="text-slate-500">
              Type <strong className="ml-1 text-slate-800">{ledger.account.type}</strong>
            </span>
            <span className="text-slate-500">
              Group <strong className="ml-1 text-slate-800">{ledger.account.group}</strong>
            </span>
            <span className="text-slate-500">
              Entries <strong className="ml-1 tabular-nums text-slate-800">{ledger.entries}</strong>
            </span>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
          <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading ledger…
        </div>
      ) : ledger ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Opening balance" value={formatMoney(ledger.opening)} hint={formatDateShort(range.from)} icon={BookOpen} tone="slate" />
            <MetricCard label="Total debit" value={formatMoney(ledger.debit)} hint="In this period" tone="primary" />
            <MetricCard label="Total credit" value={formatMoney(ledger.credit)} hint="In this period" tone="warning" />
            <MetricCard
              label="Closing balance"
              value={formatMoney(ledger.closing)}
              hint={formatDateShort(range.to)}
              tone={ledger.closing < 0 ? 'danger' : 'success'}
            />
          </div>

          <Table
            columns={columns}
            data={pageRows}
            headerClassName="bg-[#0F172A] text-white"
            emptyText="No movements in this period"
            emptyDescription="Change the period or choose another account."
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[11.5px]">
              <span className="text-slate-500">
                Opening <strong className="ml-1 tabular-nums text-slate-800">{formatMoney(ledger.opening)}</strong>
              </span>
              <span className="text-slate-500">
                Debit <strong className="ml-1 tabular-nums text-slate-800">{formatMoney(ledger.debit)}</strong>
              </span>
              <span className="text-slate-500">
                Credit <strong className="ml-1 tabular-nums text-slate-800">{formatMoney(ledger.credit)}</strong>
              </span>
              <span className="text-slate-500">
                Closing{' '}
                <strong className={`ml-1 tabular-nums ${ledger.closing < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {formatMoney(ledger.closing)}
                </strong>
              </span>
            </div>
            <TablePagination
              currentPage={current}
              totalEntries={ledger.rows.length}
              pageSize={PAGE_SIZE}
              itemLabel="entries"
              onPageChange={setPage}
            />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <RefreshCw className="mx-auto mb-2 size-6 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">Choose an account to view its ledger</p>
        </div>
      )}
    </div>
  )
}
