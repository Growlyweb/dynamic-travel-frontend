import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { AlertTriangle, CheckCircle2, Scale } from 'lucide-react'

import AccountingTabs from '../components/AccountingTabs'
import ExportButtons from '../components/ExportButtons'
import MetricCard from '../components/MetricCard'
import { reportsApi, formatMoney } from '../reports.api'
import { formatDateShort, todayISO } from '../accounting/dates'
import { printTrialBalance } from '../reports.print'

const TYPE_LABEL = {
  Asset: 'Assets',
  Liability: 'Liabilities',
  Equity: 'Equity',
  Income: 'Income',
  Expense: 'Expenses',
}

export default function TrialBalance() {
  const [asOf, setAsOf] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await reportsApi.getTrialBalance(asOf)
      setData(response.data)
    } catch (err) {
      setError(err?.message || 'Could not build the trial balance.')
    } finally {
      setLoading(false)
    }
  }, [asOf])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trial Balance"
        description="The control check of the books: every debit must have an equal and opposite credit."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Trial Balance' }]}
        actions={
          <ExportButtons
            onCsv={() => reportsApi.exportTrialBalance(asOf, 'csv')}
            onExcel={() => reportsApi.exportTrialBalance(asOf, 'excel')}
            onPrint={() => data && printTrialBalance(data, asOf)}
            disabled={!data}
          />
        }
      />

      <AccountingTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Scale className="size-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Balances as at</span>
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
        {data ? (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide ${
              data.balanced
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {data.balanced ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
            {data.balanced ? 'Books in balance' : 'Out of balance'}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {loading || !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
          <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Preparing trial balance…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Debit balances" value={formatMoney(data.totals.debit)} hint={`${data.rows.length} accounts`} tone="primary" />
            <MetricCard label="Credit balances" value={formatMoney(data.totals.credit)} hint="Every posted voucher" tone="violet" />
            <MetricCard
              label="Difference"
              value={formatMoney(data.totals.difference)}
              hint={data.balanced ? 'Fully reconciled' : 'Investigate this variance'}
              tone={data.balanced ? 'success' : 'danger'}
            />
            <MetricCard
              label="Ledger movement"
              value={formatMoney(data.totals.movementDebit)}
              hint="Total debits posted to date"
              tone="slate"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.035)]">
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="bg-[#0F172A] text-left text-[10px] uppercase tracking-wider text-white">
                    <th className="w-20 px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Account</th>
                    <th className="px-4 py-3 font-semibold">Group</th>
                    <th className="w-40 px-4 py-3 text-right font-semibold">Debit balance</th>
                    <th className="w-40 px-4 py-3 text-right font-semibold">Credit balance</th>
                  </tr>
                </thead>
                {data.groups.map((group) => (
                  <tbody key={group.type} className="divide-y divide-slate-100">
                    <tr className="bg-slate-50/80">
                      <td colSpan={3} className="px-4 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {TYPE_LABEL[group.type] || group.type}
                        </span>
                        <span className="ml-2 text-[10px] text-slate-400">
                          {group.rows.length} {group.rows.length === 1 ? 'account' : 'accounts'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-[11px] font-bold tabular-nums text-slate-700">
                        {formatMoney(group.debit)}
                      </td>
                      <td className="px-4 py-2 text-right text-[11px] font-bold tabular-nums text-slate-700">
                        {formatMoney(group.credit)}
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.code} className="bg-white transition hover:bg-slate-50/60">
                        <td className="px-4 py-2.5 font-mono text-[10.5px] font-semibold text-slate-500">{row.code}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{row.name}</td>
                        <td className="px-4 py-2.5 text-[10.5px] text-slate-400">{row.group}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                          {row.debitBalance ? formatMoney(row.debitBalance) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                          {row.creditBalance ? formatMoney(row.creditBalance) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
                <tfoot>
                  <tr className="bg-[#0F172A] font-bold text-white">
                    <td colSpan={3} className="px-4 py-3 text-[11px] uppercase tracking-wider">
                      Grand total · as at {formatDateShort(asOf)}
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums">{formatMoney(data.totals.debit)}</td>
                    <td className="px-4 py-3 text-right text-[13px] tabular-nums">{formatMoney(data.totals.credit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-[11px] leading-relaxed text-slate-500">
            <Scale className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
            <p>
              Closing debit and credit balances are shown by account. The trial balance reconciles only when total debits equal
              total credits — a difference of {formatMoney(data.totals.difference)} is currently reported.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
