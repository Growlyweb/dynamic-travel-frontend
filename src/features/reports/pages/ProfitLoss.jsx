import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { ArrowDownRight, ArrowUpRight, Layers, Percent, Receipt, TrendingUp } from 'lucide-react'

import AccountingTabs from '../components/AccountingTabs'
import ExportButtons from '../components/ExportButtons'
import PeriodFilter from '../components/PeriodFilter'
import MetricCard from '../components/MetricCard'
import SectionCard from '../components/SectionCard'
import { reportsApi, formatMoney, formatPct } from '../reports.api'
import { formatDateShort, todayISO } from '../accounting/dates'
import { printProfitLoss } from '../reports.print'

const now = new Date()

function variance(current, previous) {
  const prev = Number(previous) || 0
  if (prev === 0) return null
  return ((Number(current) - prev) / Math.abs(prev)) * 100
}

function Change({ value, invert = false }) {
  if (!Number.isFinite(value)) return <span className="text-[10.5px] text-slate-300">—</span>
  const positive = value >= 0
  const favourable = invert ? !positive : positive
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10.5px] font-semibold ${
        favourable ? 'text-emerald-600' : 'text-rose-500'
      }`}
    >
      {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

export default function ProfitLoss() {
  const [searchParams] = useSearchParams()
  const [range, setRange] = useState(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    return from && to
      ? { from, to }
      : { from: `${now.getFullYear()}-01-01`, to: todayISO() }
  })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await reportsApi.getProfitLoss(range.from, range.to)
      setData(response.data)
    } catch (err) {
      setError(err?.message || 'Could not build the profit & loss statement.')
    } finally {
      setLoading(false)
    }
  }, [range.from, range.to])

  useEffect(() => {
    load()
  }, [load])

  const statementRows = () => {
    if (!data) return []
    const previousRow = (rows, code) => rows.find((row) => row.code === code)?.amount || 0
    const rows = []
    rows.push({ kind: 'section', label: 'Operating revenue' })
    data.revenueRows.forEach((row) =>
      rows.push({
        kind: 'line',
        code: row.code,
        name: row.name,
        amount: row.amount,
        previous: previousRow(data.previous.revenueRows, row.code),
      })
    )
    rows.push({
      kind: 'subtotal',
      label: 'Total revenue',
      amount: data.totalRevenue,
      previous: data.previous.totalRevenue,
    })
    rows.push({ kind: 'section', label: 'Direct service costs' })
    data.cogsRows.forEach((row) =>
      rows.push({
        kind: 'line',
        code: row.code,
        name: row.name,
        amount: row.amount,
        previous: previousRow(data.previous.cogsRows, row.code),
        invert: true,
      })
    )
    rows.push({
      kind: 'subtotal',
      label: 'Total direct costs',
      amount: data.totalCogs,
      previous: data.previous.totalCogs,
      invert: true,
    })
    rows.push({
      kind: 'result',
      label: 'Gross profit',
      amount: data.grossProfit,
      previous: data.previous.grossProfit,
      meta: `Gross margin ${formatPct(data.grossMargin)}`,
    })
    rows.push({ kind: 'section', label: 'Operating expenses' })
    data.opexRows.forEach((row) =>
      rows.push({
        kind: 'line',
        code: row.code,
        name: row.name,
        amount: row.amount,
        previous: previousRow(data.previous.opexRows, row.code),
        invert: true,
      })
    )
    rows.push({
      kind: 'subtotal',
      label: 'Total operating expenses',
      amount: data.totalOpex,
      previous: data.previous.totalOpex,
      invert: true,
    })
    rows.push({
      kind: 'net',
      label: 'Net profit / (loss)',
      amount: data.netProfit,
      previous: data.previous.netProfit,
      meta: `Net margin ${formatPct(data.netMargin)}`,
    })
    return rows
  }

  const rows = statementRows()
  const ratio = (part) => (data && data.totalRevenue > 0 ? Math.min(100, (part / data.totalRevenue) * 100) : 0)
  const periodFiles = data ? data.segments.reduce((sum, segment) => sum + segment.files, 0) : 0

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profit & Loss"
        description="Revenue, direct service costs and overheads for the selected period, with comparatives."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Profit & Loss' }]}
        actions={
          <ExportButtons
            onCsv={() => reportsApi.exportProfitLoss(range.from, range.to, 'csv')}
            onExcel={() => reportsApi.exportProfitLoss(range.from, range.to, 'excel')}
            onPrint={() => data && printProfitLoss({ ...data, from: range.from, to: range.to })}
            disabled={!data}
          />
        }
      />

      <AccountingTabs />

      <PeriodFilter from={range.from} to={range.to} onChange={({ from, to }) => setRange({ from, to })} />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] font-medium text-rose-700">
          {error}
        </div>
      ) : null}

      {loading || !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
          <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Preparing profit & loss…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Revenue"
              value={formatMoney(data.totalRevenue)}
              delta={variance(data.totalRevenue, data.previous.totalRevenue)}
              hint={`vs ${formatDateShort(data.previousRange.from)}–${formatDateShort(data.previousRange.to)}`}
              icon={TrendingUp}
              tone="primary"
            />
            <MetricCard
              label="Gross profit"
              value={formatMoney(data.grossProfit)}
              delta={variance(data.grossProfit, data.previous.grossProfit)}
              hint={`Gross margin ${formatPct(data.grossMargin)}`}
              icon={Layers}
              tone="success"
            />
            <MetricCard
              label="Operating expenses"
              value={formatMoney(data.totalOpex)}
              delta={variance(data.totalOpex, data.previous.totalOpex)}
              invertDelta
              hint="Overheads for the period"
              icon={Receipt}
              tone="warning"
            />
            <MetricCard
              label="Net profit"
              value={formatMoney(data.netProfit)}
              delta={variance(data.netProfit, data.previous.netProfit)}
              hint={`Net margin ${formatPct(data.netMargin)}`}
              icon={Percent}
              tone={data.netProfit >= 0 ? 'success' : 'danger'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <SectionCard
              title="Statement of profit or loss"
              subtitle={`${formatDateShort(range.from)} — ${formatDateShort(range.to)}`}
              className="xl:col-span-2"
              flush
              bodyClassName="p-0"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2.5 font-semibold">Account</th>
                      <th className="w-32 px-4 py-2.5 text-right font-semibold">Current</th>
                      <th className="w-32 px-4 py-2.5 text-right font-semibold">Previous</th>
                      <th className="w-24 px-4 py-2.5 text-right font-semibold">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      if (row.kind === 'section') {
                        return (
                          <tr key={`section-${index}`} className="bg-slate-50/60">
                            <td colSpan={4} className="px-4 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                              {row.label}
                            </td>
                          </tr>
                        )
                      }
                      const isNet = row.kind === 'net'
                      const isResult = row.kind === 'result'
                      const isSubtotal = row.kind === 'subtotal'
                      return (
                        <tr
                          key={`${row.kind}-${row.code || row.label}`}
                          className={`border-b border-slate-100 ${
                            isNet ? 'bg-[#0F172A] text-white' : isResult ? 'bg-emerald-50/50' : 'bg-white'
                          }`}
                        >
                          <td className={`px-4 py-2 ${isNet ? 'font-bold' : isSubtotal ? 'font-bold' : ''}`}>
                            <span className={isSubtotal || isNet ? '' : 'pl-4 text-slate-600'}>
                              {row.code ? <span className="mr-1.5 font-mono text-[10px] text-slate-400">{row.code}</span> : null}
                              {row.name || row.label}
                            </span>
                            {row.meta ? (
                              <span className={`ml-2 text-[10px] ${isNet ? 'text-slate-300' : 'text-slate-400'}`}>
                                {row.meta}
                              </span>
                            ) : null}
                          </td>
                          <td
                            className={`px-4 py-2 text-right tabular-nums ${
                              isNet ? 'font-bold' : isSubtotal || isResult ? 'font-semibold' : 'text-slate-700'
                            }`}
                          >
                            {formatMoney(row.amount)}
                          </td>
                          <td className={`px-4 py-2 text-right tabular-nums ${isNet ? 'text-slate-300' : 'text-slate-500'}`}>
                            {formatMoney(row.previous)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Change value={variance(row.amount, row.previous)} invert={row.invert} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <div className="space-y-4">
              <SectionCard title="Profit bridge" subtitle="How revenue becomes net profit">
                <div className="space-y-3">
                  {[
                    { label: 'Revenue', amount: data.totalRevenue, color: 'bg-[#0879E8]' },
                    { label: 'Direct costs', amount: data.totalCogs, color: 'bg-rose-400' },
                    { label: 'Gross profit', amount: data.grossProfit, color: 'bg-emerald-500' },
                    { label: 'Operating expenses', amount: data.totalOpex, color: 'bg-amber-400' },
                    { label: 'Net profit', amount: data.netProfit, color: 'bg-slate-900' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{item.label}</span>
                        <span className="font-bold tabular-nums text-slate-800">{formatMoney(item.amount)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${Math.max(2, ratio(Math.abs(item.amount)))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Key ratios" subtitle="Period performance">
                <div className="space-y-3">
                  {[
                    { label: 'Gross margin', value: data.grossMargin, good: data.grossMargin > 0 },
                    { label: 'Net margin', value: data.netMargin, good: data.netMargin > 0 },
                    {
                      label: 'Cost ratio',
                      value: data.totalRevenue > 0 ? ((data.totalCogs + data.totalOpex) / data.totalRevenue) * 100 : 0,
                      good: false,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">{item.label}</span>
                        <span className={`font-bold tabular-nums ${item.good ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {formatPct(item.value)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${item.good ? 'bg-emerald-500' : 'bg-slate-400'}`}
                          style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-[10.5px] leading-relaxed text-slate-500">
                    Revenue per file {formatMoney(periodFiles ? data.totalRevenue / periodFiles : 0)} ·{' '}
                    {periodFiles} files in period
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>

          <SectionCard
            title="Segment profitability"
            subtitle="Visa, tours, air, hotel and transport contribution"
            icon={Layers}
            flush
            bodyClassName="p-0"
          >
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
                    <th className="w-40 px-4 py-2.5 font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.segments.map((segment) => (
                    <tr key={segment.id} className="bg-white">
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="size-2.5 rounded-sm" style={{ backgroundColor: segment.color }} />
                          <span className="font-semibold text-slate-800">{segment.name}</span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{segment.files}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-800">
                        {formatMoney(segment.revenue)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatMoney(segment.cost)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-emerald-700">
                        {formatMoney(segment.grossProfit)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            segment.margin >= 20
                              ? 'bg-emerald-50 text-emerald-700'
                              : segment.margin >= 10
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {formatPct(segment.margin)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${Math.min(100, segment.share || 0)}%`, backgroundColor: segment.color }}
                            />
                          </div>
                          <span className="w-9 text-right text-[10px] tabular-nums text-slate-400">
                            {(segment.share || 0).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <p className="text-center text-[10.5px] text-slate-400">
            Compared with {formatDateShort(data.previousRange.from)} — {formatDateShort(data.previousRange.to)} ·
            {' '}all figures derived from posted vouchers
          </p>
        </>
      )}
    </div>
  )
}
