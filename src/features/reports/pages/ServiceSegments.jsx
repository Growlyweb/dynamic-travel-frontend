import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Layers, PieChart, Receipt, TrendingUp } from 'lucide-react'
import { exportToCsv, exportToExcel } from '@/utils/exportEngine'

import AccountingTabs from '../components/AccountingTabs'
import ExportButtons from '../components/ExportButtons'
import PeriodFilter from '../components/PeriodFilter'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import ReportDonutChart from '../components/ReportDonutChart'
import { reportsApi, formatMoney, formatPct } from '../reports.api'
import { formatDateShort, todayISO } from '../accounting/dates'

const now = new Date()

export default function ServiceSegments() {
  const [range, setRange] = useState({ from: `${now.getFullYear()}-01-01`, to: todayISO() })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await reportsApi.getSegmentReport(range.from, range.to)
      setData(response.data)
    } catch (err) {
      setError(err?.message || 'Could not load the segment report.')
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to])

  useEffect(() => {
    load()
  }, [load])

  const rows = (data?.segments || []).filter(
    (segment) => segment.revenue !== 0 || segment.cost !== 0 || segment.files > 0
  )
  const monthly = data?.monthly || []
  const totals = data?.totals || { revenue: 0, cost: 0, grossProfit: 0, grossMargin: 0, files: 0 }

  const exportRows = rows.map((segment) => ({
    segment: segment.name,
    files: segment.files,
    revenue: segment.revenue,
    cost: segment.cost,
    grossProfit: segment.grossProfit,
    margin: formatPct(segment.margin),
    share: formatPct(segment.share),
  }))

  const headers = [
    { key: 'segment', label: 'Segment' },
    { key: 'files', label: 'Files' },
    { key: 'revenue', label: 'Revenue (BDT)' },
    { key: 'cost', label: 'Direct cost (BDT)' },
    { key: 'grossProfit', label: 'Gross profit (BDT)' },
    { key: 'margin', label: 'Margin' },
    { key: 'share', label: 'Revenue share' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Service Segments"
        description="Visa, tours, air tickets, hotels and transport — which line of business actually earns the margin."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Segments' }]}
        actions={
          <ExportButtons
            onCsv={() => exportToCsv(`Segment-Performance-${range.from}-${range.to}`, headers, exportRows)}
            onExcel={() =>
              exportToExcel(`Segment-Performance-${range.from}-${range.to}`, {
                title: 'Service Segment Performance',
                subtitle: `${formatDateShort(range.from)} — ${formatDateShort(range.to)}`,
                headers: headers.map((header) => ({
                  ...header,
                  isCurrency: ['revenue', 'cost', 'grossProfit'].includes(header.key),
                })),
                rows: exportRows,
                summaryTotals: [
                  { label: 'Revenue', value: formatMoney(totals.revenue) },
                  { label: 'Gross Profit', value: formatMoney(totals.grossProfit) },
                  { label: 'Files', value: totals.files },
                ],
              })
            }
            disabled={!data}
          />
        }
      />

      <AccountingTabs />

      <PeriodFilter from={range.from} to={range.to} onChange={({ from, to }) => setRange({ from, to })} />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-medium text-rose-700">{error}</div>
      ) : null}

      {loading || !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
          <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Preparing segment analysis…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Revenue" value={formatMoney(totals.revenue)} hint="All service lines" icon={TrendingUp} tone="primary" />
            <MetricCard label="Direct cost" value={formatMoney(totals.cost)} hint="Supplier & embassy costs" icon={Receipt} tone="warning" />
            <MetricCard
              label="Gross profit"
              value={formatMoney(totals.grossProfit)}
              hint={`Margin ${formatPct(totals.grossMargin)}`}
              icon={Layers}
              tone="success"
            />
            <MetricCard label="Files delivered" value={Number(totals.files).toLocaleString('en-IN')} hint="Across all segments" icon={PieChart} tone="violet" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard title="Revenue mix" subtitle={`${formatDateShort(range.from)} — ${formatDateShort(range.to)}`}>
              <ReportDonutChart
                segments={rows
                  .filter((segment) => segment.revenue > 0)
                  .map((segment) => ({ label: segment.short, value: segment.revenue, color: segment.color }))}
                centerLabel={formatMoney(totals.revenue)}
                centerSub="Revenue"
                title=""
                size={175}
                thickness={24}
                bare
              />
            </SectionCard>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-span-2">
              {rows.map((segment) => (
                <div
                  key={segment.id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_24px_rgba(15,23,42,0.03)]"
                >
                  <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: segment.color }} />
                  <div className="flex items-start justify-between gap-2 pl-1">
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">{segment.name}</p>
                      <p className="text-[10px] text-slate-400">{segment.files} files</p>
                    </div>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: segment.soft, color: segment.color }}
                    >
                      {formatPct(segment.margin)}
                    </span>
                  </div>
                  <p className="mt-2 pl-1 text-[17px] font-bold tabular-nums text-slate-900">{formatMoney(segment.revenue)}</p>
                  <div className="mt-1 flex items-center justify-between pl-1 text-[10px] text-slate-500">
                    <span>GP {formatMoney(segment.grossProfit)}</span>
                    <span>{segment.share.toFixed(1)}% share</span>
                  </div>
                  <div className="mt-2 ml-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.max(2, segment.share))}%`, backgroundColor: segment.color }}
                    />
                  </div>
                </div>
              ))}
              <div className="rounded-2xl border border-slate-900 bg-slate-900 p-4 text-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[12px] font-bold">All service lines</p>
                    <p className="text-[10px] text-slate-400">{totals.files} files</p>
                  </div>
                  <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    {formatPct(totals.grossMargin)} margin
                  </span>
                </div>
                <p className="mt-2 text-[17px] font-bold tabular-nums">{formatMoney(totals.revenue)}</p>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>GP {formatMoney(totals.grossProfit)}</span>
                  <span>100% of revenue</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-full rounded-full bg-emerald-400" />
                </div>
              </div>
            </div>
          </div>

          <SectionCard
            title="Revenue by segment and month"
            subtitle="Six-month trend, most recent on the right"
            flush
            bodyClassName="p-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Segment</th>
                    {monthly.map((month) => (
                      <th key={`${month.year}-${month.month}`} className="px-3 py-2.5 text-right font-semibold">
                        {month.label}
                      </th>
                    ))}
                    <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((segment) => (
                    <tr key={segment.id} className="bg-white">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-sm" style={{ backgroundColor: segment.color }} />
                          <span className="font-semibold text-slate-800">{segment.name}</span>
                        </span>
                      </td>
                      {monthly.map((month) => (
                        <td key={`${segment.id}-${month.year}-${month.month}`} className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                          {formatMoney(month[segment.id] || 0)}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-right font-bold tabular-nums text-slate-900">
                        {formatMoney(segment.revenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-[10px] font-semibold tabular-nums text-slate-500">{segment.share.toFixed(1)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#0F172A] font-bold text-white">
                    <td className="px-4 py-2.5 text-[10px] uppercase tracking-wider">Total</td>
                    {monthly.map((month) => {
                      const total = rows.reduce((sum, segment) => sum + (month[segment.id] || 0), 0)
                      return (
                        <td key={`total-${month.year}-${month.month}`} className="px-3 py-2.5 text-right tabular-nums">
                          {formatMoney(total)}
                        </td>
                      )
                    })}
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.revenue)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Segment P&L summary" subtitle="Revenue, direct cost, gross profit and margin" flush bodyClassName="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-[11.5px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Segment</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Files</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Revenue</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Direct cost</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Gross profit</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((segment) => (
                    <tr key={segment.id} className="bg-white">
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{segment.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{segment.files}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">{formatMoney(segment.revenue)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatMoney(segment.cost)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700">{formatMoney(segment.grossProfit)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            segment.margin >= 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {formatPct(segment.margin)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 font-bold text-white">
                    <td className="px-4 py-2.5">All segments</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{totals.files}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.revenue)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.cost)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMoney(totals.grossProfit)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatPct(totals.grossMargin)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
