import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { AlertTriangle, CheckCircle2, Landmark, Scale } from 'lucide-react'

import AccountingTabs from '../components/AccountingTabs'
import ExportButtons from '../components/ExportButtons'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import { reportsApi, formatMoney, formatPct } from '../reports.api'
import { formatDateShort, todayISO } from '../accounting/dates'
import { printBalanceSheet } from '../reports.print'

function StatementTable({ title, groups, extraRows = [], total, totalLabel, negativeTone = false }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{title}</p>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-semibold">Account</th>
              <th className="w-32 px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <FragmentGroup key={group.group} group={group} negativeTone={negativeTone} />
            ))}
            {extraRows.map((row) =>
              row.section ? (
                <tr key={row.label} className="border-t border-slate-100 bg-slate-50/70">
                  <td colSpan={2} className="px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
                    {row.label}
                  </td>
                </tr>
              ) : (
                <tr key={row.label} className={`border-t border-slate-100 ${row.strong ? 'bg-slate-50/60' : 'bg-white'}`}>
                  <td className={`px-3 py-2 ${row.strong ? 'font-bold text-slate-800' : 'text-slate-700'}`}>{row.label}</td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums ${
                      row.strong ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
                    }`}
                  >
                    {formatMoney(row.amount)}
                  </td>
                </tr>
              )
            )}
          </tbody>
          <tfoot>
            <tr className="bg-[#0F172A] font-bold text-white">
              <td className="px-3 py-2.5 text-[10px] uppercase tracking-wider">{totalLabel}</td>
              <td className="px-3 py-2.5 text-right text-[12.5px] tabular-nums">{formatMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function FragmentGroup({ group, negativeTone }) {
  return (
    <>
      <tr className="bg-slate-50/70">
        <td colSpan={2} className="px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
          {group.group}
        </td>
      </tr>
      {group.rows.map((row) => (
        <tr key={row.code} className="border-b border-slate-50 bg-white">
          <td className="px-3 py-2">
            <span className="font-medium text-slate-700">{row.name}</span>
            <span className="ml-1.5 font-mono text-[9.5px] text-slate-400">{row.code}</span>
          </td>
          <td
            className={`px-3 py-2 text-right tabular-nums ${
              row.amount < 0 ? 'text-rose-600' : negativeTone ? 'text-slate-700' : 'text-slate-800'
            }`}
          >
            {formatMoney(row.amount)}
          </td>
        </tr>
      ))}
      <tr className="border-b border-slate-100 bg-slate-50/50">
        <td className="px-3 py-1.5 text-right text-[10px] font-semibold text-slate-500">Total {group.group}</td>
        <td className="px-3 py-1.5 text-right text-[10.5px] font-bold tabular-nums text-slate-700">
          {formatMoney(group.total)}
        </td>
      </tr>
    </>
  )
}

export default function BalanceSheet() {
  const [asOf, setAsOf] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await reportsApi.getBalanceSheet(asOf)
      setData(response.data)
    } catch (err) {
      setError(err?.message || 'Could not build the balance sheet.')
    } finally {
      setLoading(false)
    }
  }, [asOf])

  useEffect(() => {
    load()
  }, [load])

  const currentAssets = data?.assetGroups.find((group) => group.group === 'Current Assets')?.total || 0
  const currentLiabilities = data?.liabilityGroups.find((group) => group.group === 'Current Liabilities')?.total || 0
  const workingCapital = currentAssets - currentLiabilities

  return (
    <div className="space-y-5">
      <PageHeader
        title="Balance Sheet"
        description="Assets, liabilities and partner equity at a point in time — with retained earnings for the year."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Balance Sheet' }]}
        actions={
          <ExportButtons
            onCsv={() => reportsApi.exportBalanceSheet(asOf, 'csv')}
            onExcel={() => reportsApi.exportBalanceSheet(asOf, 'excel')}
            onPrint={() => data && printBalanceSheet(data)}
            disabled={!data}
          />
        }
      />

      <AccountingTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Scale className="size-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Position as at</span>
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
            {data.balanced ? 'Balance sheet balances' : `Out by ${formatMoney(data.difference)}`}
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
          Preparing balance sheet…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total assets" value={formatMoney(data.totalAssets)} hint="Net of accumulated depreciation" icon={Landmark} tone="primary" />
            <MetricCard label="Total liabilities" value={formatMoney(data.totalLiabilities)} hint="Supplier & statutory balances" tone="warning" />
            <MetricCard label="Capital & reserves" value={formatMoney(data.capitalEquity)} hint="Excluding current year earnings" tone="violet" />
            <MetricCard
              label="Current year earnings"
              value={formatMoney(data.netProfit)}
              hint={`Accumulated equity ${formatMoney(data.totalEquity)}`}
              tone={data.netProfit >= 0 ? 'success' : 'danger'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SectionCard
              title="Assets"
              subtitle={`As at ${formatDateShort(asOf)}`}
              actions={
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10.5px] font-bold tabular-nums text-slate-700">
                  {formatMoney(data.totalAssets)}
                </span>
              }
            >
              <StatementTable
                title="Application of funds"
                groups={data.assetGroups}
                total={data.totalAssets}
                totalLabel="Total assets"
              />
            </SectionCard>

            <SectionCard
              title="Liabilities & equity"
              subtitle={`As at ${formatDateShort(asOf)}`}
              actions={
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10.5px] font-bold tabular-nums text-slate-700">
                  {formatMoney(data.totalLiabilitiesAndEquity)}
                </span>
              }
            >
              <StatementTable
                title="Sources of funds"
                groups={data.liabilityGroups}
                extraRows={[
                  { label: 'Total liabilities', amount: data.totalLiabilities, strong: true },
                  { label: 'Partners’ equity', section: true },
                  ...data.equityGroups.flatMap((group) =>
                    group.rows.map((row) => ({ label: `${row.code} · ${row.name}`, amount: row.amount }))
                  ),
                  { label: 'Current year earnings', amount: data.netProfit },
                  { label: 'Total equity', amount: data.totalEquity, strong: true },
                ]}
                total={data.totalLiabilitiesAndEquity}
                totalLabel="Liabilities & equity"
              />
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SectionCard title="Working capital" subtitle="Current assets less current liabilities">
              <p className={`text-[22px] font-bold tabular-nums ${workingCapital >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatMoney(workingCapital)}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10.5px] text-slate-500">
                <span>Current assets {formatMoney(currentAssets)}</span>
                <span>Current liabilities {formatMoney(currentLiabilities)}</span>
              </div>
            </SectionCard>
            <SectionCard title="Debt to equity" subtitle="Total liabilities over total equity">
              <p className="text-[22px] font-bold tabular-nums text-slate-900">
                {data.totalEquity > 0 ? formatPct((data.totalLiabilities / data.totalEquity) * 100) : '—'}
              </p>
              <p className="mt-2 text-[10.5px] text-slate-500">A lower ratio means the agency is funded mainly by partners.</p>
            </SectionCard>
            <SectionCard title="Balance check" subtitle="Assets = liabilities + equity">
              <p className={`text-[22px] font-bold tabular-nums ${data.balanced ? 'text-emerald-700' : 'text-rose-600'}`}>
                {data.balanced ? 'Balanced' : formatMoney(data.difference)}
              </p>
              <p className="mt-2 text-[10.5px] text-slate-500">
                Total assets {formatMoney(data.totalAssets)} · total claims {formatMoney(data.totalLiabilitiesAndEquity)}
              </p>
            </SectionCard>
          </div>

          <p className="text-center text-[10.5px] text-slate-400">
            Current year earnings are carried from the profit & loss for {asOf.slice(0, 4)} · accumulated depreciation is
            shown as a negative asset.
          </p>
        </>
      )}
    </div>
  )
}
