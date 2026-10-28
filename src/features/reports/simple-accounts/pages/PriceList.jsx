import { useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { BadgePercent } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import { simpleApi } from '../simple.api'
import { formatMoney, formatPct } from '@/features/reports/lib/format'
import { Table } from '@/components/re-table'

const margin = (price, cost) => (price > 0 ? ((price - cost) / price) * 100 : 0)

export default function PriceList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    simpleApi
      .getPriceList()
      .then((data) => active && setRows(data))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const columns = [
    {
      key: 'label',
      header: 'Service',
      render: (row) => <span className="text-sm font-bold text-slate-900">{row.label}</span>,
    },
    {
      key: 'cost',
      header: 'Cost Price',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-600">{formatMoney(row.cost)}</span>,
    },
    {
      key: 'b2b',
      header: 'B2B Selling Price',
      align: 'right',
      render: (row) => <span className="text-sm font-semibold tabular-nums text-slate-900">{formatMoney(row.b2b)}</span>,
    },
    {
      key: 'b2bMargin',
      header: 'B2B Profit',
      align: 'right',
      render: (row) => (
        <span className={`text-sm font-semibold tabular-nums ${margin(row.b2b, row.cost) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          {formatMoney(row.b2b - row.cost)} · {formatPct(margin(row.b2b, row.cost))}
        </span>
      ),
    },
    {
      key: 'b2c',
      header: 'B2C Selling Price',
      align: 'right',
      render: (row) => <span className="text-sm font-semibold tabular-nums text-slate-900">{formatMoney(row.b2c)}</span>,
    },
    {
      key: 'b2cMargin',
      header: 'B2C Profit',
      align: 'right',
      render: (row) => (
        <span className={`text-sm font-semibold tabular-nums ${margin(row.b2c, row.cost) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          {formatMoney(row.b2c - row.cost)} · {formatPct(margin(row.b2c, row.cost))}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Price List"
        description="A quick guide for the team. New Sale fills these prices when you choose a service."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Price List' }]}
      />

      <SimpleTabs />

      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-[#EAF3FE] p-4 text-sm font-medium text-blue-900">
        <BadgePercent className="mt-0.5 size-5 shrink-0" />
        <p>
          Prices are based on recent sales. On the sale form, press <strong>Use Price List</strong> after choosing the
          service and B2B/B2C. You can still change any price for that sale.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-base text-slate-500">
          Loading price list…
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          dense
          headerClassName="bg-[#2F80ED] text-white"
          emptyText="No price list yet"
          emptyDescription="Create a sale and the prices will appear here."
        />
      )}

    </div>
  )
}
