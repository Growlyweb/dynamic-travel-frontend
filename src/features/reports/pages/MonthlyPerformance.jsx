import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { CalendarRange, TrendingUp } from 'lucide-react'
import { printReportDocument } from '@/utils/exportEngine'

import AccountingTabs from '../components/AccountingTabs'
import ExportButtons from '../components/ExportButtons'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import PerformanceChart from '../components/PerformanceChart'
import { reportsApi, formatMoney, formatPct } from '../reports.api'
import { formatDateShort } from '../accounting/dates'

export default function MonthlyPerformance() {
  const navigate = useNavigate()
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await reportsApi.getMonthly(year)
      setData(response.data)
    } catch (err) {
      setError(err?.message || 'Could not load monthly performance.')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => {
    load()
  }, [load])

  const rows = useMemo(() => data?.rows || [], [data])
  const totals = data?.totals || { revenue: 0, cogs: 0, opex: 0, grossProfit: 0, netProfit: 0, files: 0, collections: 0, margin: 0 }

  const series = useMemo(
    () =>
      rows.map((row) => ({
        label: row.monthName,
        revenue: row.revenue,
        cost: row.cogs + row.opex,
        profit: row.netProfit,
      })),
    [rows]
  )

  const quarters = useMemo(() => {
    return [0, 1, 2, 3].map((quarter) => {
      const slice = rows.slice(quarter * 3, quarter * 3 + 3)
      return {
        label: `Q${quarter + 1}`,
        revenue: slice.reduce((sum, row) => sum + row.revenue, 0),
        netProfit: slice.reduce((sum, row) => sum + row.netProfit, 0),
        files: slice.reduce((sum, row) => sum + row.files, 0),
      }
    })
  }, [rows])

  const ebitda = totals.grossProfit - totals.opex
  const collectionRate = totals.revenue > 0 ? (totals.collections / totals.revenue) * 100 : 0

  const printStatement = () => {
    printReportDocument({
      title: `Monthly Performance — ${year}`,
      subtitle: 'Revenue, direct costs, overheads and profit by month',
      dateRange: `Financial year ${year}`,
      headers: [
        { key: 'month', label: 'Month' },
        { key: 'revenue', label: 'Revenue', align: 'right', isCurrency: true },
        { key: 'cogs', label: 'Direct costs', align: 'right', isCurrency: true },
        { key: 'opex', label: 'Operating expenses', align: 'right', isCurrency: true },
        { key: 'net', label: 'Net profit', align: 'right', isCurrency: true },
        { key: 'margin', label: 'Margin', align: 'right' },
        { key: 'files', label: 'Files', align: 'right' },
        { key: 'collections', label: 'Collections', align: 'right', isCurrency: true },
      ],
      rows: rows.map((row) => ({
        month: row.monthName,
        revenue: formatMoney(row.revenue),
        cogs: formatMoney(row.cogs),
        opex: formatMoney(row.opex),
        net: formatMoney(row.netProfit),
        margin: formatPct(row.margin),
        files: row.files,
        collections: formatMoney(row.collections),
      })),
      summaryTotals: [
        { value: `${year} total`, colspan: 1 },
        { value: formatMoney(totals.revenue), align: 'right' },
        { value: formatMoney(totals.cogs), align: 'right' },
        { value: formatMoney(totals.opex), align: 'right' },
        { value: formatMoney(totals.netProfit), align: 'right' },
        { value: formatPct(totals.margin), align: 'right' },
        { value: totals.files, align: 'right' },
        { value: formatMoney(totals.collections), align: 'right' },
      ],
      metadata: {
        'Collection rate': formatPct(collectionRate),
        'Gross margin': formatPct(totals.revenue ? (totals.grossProfit / totals.revenue) * 100 : 0),
      },
    })
  }

  const openMonth = (row) => {
    navigate(`/reports/profit-loss?from=${row.from}&to=${row.to}`)
  }

  const openPnl = () => {
    navigate(`/reports/profit-loss?from=${year}-01-01&to=${rows[rows.length - 1]?.to || `${year}-12-31`}`)
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monthly Performance"
        description={`Twelve-month management accounts for ${year} — revenue, direct costs, overheads and cash collection.`}
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Monthly' }]}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <ExportButtons
              onCsv={() => reportsApi.exportMonthly(year, 'csv')}
              onExcel={() => reportsApi.exportMonthly(year, 'excel')}
              onPrint={printStatement}
              disabled={!data}
            />
            <button
              type="button"
              onClick={openPnl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <TrendingUp className="size-3.5 text-primary" />
              Open P&amp;L
            </button>
          </div>
        }
      />

      <AccountingTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.03)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarRange className="size-4 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Financial year</span>
          <select
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11.5px] font-semibold text-slate-700 outline-none focus:border-primary"
          >
            {(data?.availableYears?.length ? data.availableYears : [year]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span className="text-slate-500">
            Revenue <strong className="ml-1 tabular-nums text-slate-900">{formatMoney(totals.revenue)}</strong>
          </span>
          <span className="text-slate-500">
            Net profit{' '}
            <strong className={`ml-1 tabular-nums ${totals.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatMoney(totals.netProfit)}
            </strong>
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-medium text-rose-700">{error}</div>
      ) : null}

      {loading || !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
          <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Preparing monthly accounts…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Annual revenue" value={formatMoney(totals.revenue)} hint={`${totals.files} files posted`} tone="primary" />
            <MetricCard label="Gross profit" value={formatMoney(totals.grossProfit)} hint={`Gross margin ${formatPct(totals.revenue ? (totals.grossProfit / totals.revenue) * 100 : 0)}`} tone="success" />
            <MetricCard label="Net profit" value={formatMoney(totals.netProfit)} hint={`Net margin ${formatPct(totals.margin)}`} tone={totals.netProfit >= 0 ? 'success' : 'danger'} />
            <MetricCard label="Collections" value={formatMoney(totals.collections)} hint={`${formatPct(collectionRate)} of revenue`} tone="violet" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quarters.map((quarter) => (
              <div key={quarter.label} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{quarter.label}</span>
                  <span className="text-[10px] text-slate-400">{quarter.files} files</span>
                </div>
                <p className="mt-1 text-[15px] font-bold tabular-nums text-slate-900">{formatMoney(quarter.revenue)}</p>
                <p className={`text-[10.5px] font-semibold ${quarter.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  net {formatMoney(quarter.netProfit)}
                </p>
              </div>
            ))}
          </div>

          <SectionCard title="Revenue, cost and profit trend" subtitle={`${year} by month`}>
            <PerformanceChart data={series} height={270} title="" subtitle="Net profit line uses the same scale as revenue and cost." />
          </SectionCard>

          <SectionCard title="Monthly management accounts" subtitle="Click a month to open its profit & loss" flush bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 text-left font-semibold">Month</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Revenue</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Direct costs</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Expenses</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Gross profit</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Net profit</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Margin</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Files</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Collections</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((row) => {
                    const hasData = row.revenue > 0 || row.opex > 0
                    return (
                      <tr
                        key={row.month}
                        onClick={() => hasData && openMonth(row)}
                        className={`${hasData ? 'cursor-pointer hover:bg-slate-50/70' : 'opacity-55'} ${
                          row.isCurrent ? 'bg-[#E6F2FD]/40' : 'bg-white'
                        }`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{row.monthName}</span>
                            {row.isCurrent ? (
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">
                                current
                              </span>
                            ) : null}
                          </div>
                          <span className="text-[9.5px] text-slate-400">
                            {formatDateShort(row.from)} — {formatDateShort(row.to)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">{formatMoney(row.revenue)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatMoney(row.cogs)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatMoney(row.opex)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{formatMoney(row.grossProfit)}</td>
                        <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${row.netProfit >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                          {formatMoney(row.netProfit)}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              row.margin >= 10 ? 'bg-emerald-50 text-emerald-700' : row.margin > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {formatPct(row.margin)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{row.files}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{formatMoney(row.collections)}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0F172A] font-bold text-white">
                    <td className="px-4 py-2.5 text-[10px] uppercase tracking-wider">{year} total</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.revenue)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.cogs)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.opex)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.grossProfit)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.netProfit)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatPct(totals.margin)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{totals.files}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.collections)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SectionCard title="Cash conversion" subtitle="Collections against revenue">
              <p className="text-[22px] font-bold tabular-nums text-emerald-700">{formatPct(collectionRate)}</p>
              <p className="mt-1 text-[10.5px] text-slate-500">
                {formatMoney(totals.collections)} collected of {formatMoney(totals.revenue)} invoiced this year.
              </p>
            </SectionCard>
            <SectionCard title="Operating profit" subtitle="Gross profit less overheads">
              <p className={`text-[22px] font-bold tabular-nums ${ebitda >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>{formatMoney(ebitda)}</p>
              <p className="mt-1 text-[10.5px] text-slate-500">Overheads {formatMoney(totals.opex)} for the year.</p>
            </SectionCard>
            <SectionCard title="Busiest month" subtitle="By revenue posted">
              {(() => {
                const best = [...rows].sort((a, b) => b.revenue - a.revenue)[0]
                return (
                  <>
                    <p className="text-[22px] font-bold tabular-nums text-slate-900">{best?.monthName || '—'}</p>
                    <p className="mt-1 text-[10.5px] text-slate-500">
                      {formatMoney(best?.revenue || 0)} · {best?.files || 0} files
                    </p>
                  </>
                )
              })()}
            </SectionCard>
          </div>
        </>
      )}
    </div>
  )
}
