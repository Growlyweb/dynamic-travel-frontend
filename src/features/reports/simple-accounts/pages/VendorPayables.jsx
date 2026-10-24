import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Building2 } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import BigCard from '../components/BigCard'
import AgingBars from '@/features/reports/components/AgingBars'
import { simpleApi } from '../simple.api'
import { formatMoney } from '@/features/reports/reports.api'
import { formatDateShort } from '@/features/reports/accounting/dates'
import { Table } from '@/components/re-table'

export default function VendorPayables() {
  const [data, setData] = useState({ rows: [], totals: {}, aging: [] })
  const [advances, setAdvances] = useState({ rows: [], total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    simpleApi
      .getVendorPayables()
      .then(async (result) => {
        if (!active) return
        setData(result)
        const advanceResult = await simpleApi.getVendorAdvances()
        if (active) setAdvances(advanceResult)
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const columns = [
    {
      key: 'name',
      header: 'Vendor',
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'invoices',
      header: 'Bills',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-600">{row.invoices}</span>,
    },
    {
      key: 'invoiced',
      header: 'Billed',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-700">{formatMoney(row.invoiced)}</span>,
    },
    {
      key: 'collected',
      header: 'Paid',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-emerald-700">{formatMoney(row.collected)}</span>,
    },
    {
      key: 'due',
      header: 'Payable',
      align: 'right',
      render: (row) => (
        <span className={`text-sm font-bold tabular-nums ${row.due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {formatMoney(row.due)}
        </span>
      ),
    },
    {
      key: 'oldest',
      header: 'Oldest Bill',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-600">{row.oldestDays || 0} days</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            row.status === 'Paid'
              ? 'bg-emerald-50 text-emerald-700'
              : row.status === 'Overdue'
                ? 'bg-rose-50 text-rose-700'
                : 'bg-amber-50 text-amber-700'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'last',
      header: 'Last Payment',
      align: 'right',
      render: (row) => (
        <span className="text-xs text-slate-500">{row.lastPaymentDate ? formatDateShort(row.lastPaymentDate) : '—'}</span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendor Payables"
        description="What we still owe suppliers and service vendors."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Vendor Payables' }]}
      />

      <SimpleTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigCard label="Total Payable" value={formatMoney(data.totals.due || 0)} hint={`${data.totals.count || 0} vendors`} tone="red" />
        <BigCard label="Overdue" value={formatMoney(data.totals.overdue || 0)} hint="Needs attention" tone="amber" />
        <BigCard label="Billed" value={formatMoney(data.totals.invoiced || 0)} hint="All vendor bills" tone="slate" />
        <BigCard label="Paid" value={formatMoney(data.totals.collected || 0)} hint="Already settled" tone="green" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="size-5 text-[#2F80ED]" />
          <h2 className="text-lg font-bold text-slate-900">How old the payables are</h2>
        </div>
        <AgingBars aging={data.aging} total={data.totals.due || 0} columns={4} />
      </div>

      {advances.rows.length ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900">Available Vendor Advances</h2>
            <p className="text-sm text-slate-500">Money already paid to vendors that can still be used against future bills.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#2F80ED] text-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Vendor</th>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-right font-semibold">Available Advance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advances.rows.map((row) => (
                  <tr key={row.partyId}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-4 py-3 text-slate-500">{row.code}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[#2F80ED]">{formatMoney(row.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#0F172A] font-bold text-white">
                  <td colSpan={2} className="px-4 py-3">Total advances</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMoney(advances.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-base text-slate-500">
          Loading vendor payables…
        </div>
      ) : (
        <Table
          columns={columns}
          data={data.rows}
          dense
          headerClassName="bg-[#2F80ED] text-white"
          emptyText="No vendor payables"
          emptyDescription="Every supplier has been paid."
        />
      )}
    </div>
  )
}
