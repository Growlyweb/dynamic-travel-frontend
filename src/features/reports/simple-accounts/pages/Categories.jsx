import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { PlusCircle, Tags, Trash2 } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import MonthNavigator from '@/features/reports/components/MonthNavigator'
import { simpleApi } from '../simple.api'
import { formatMoney } from '@/features/reports/reports.api'
import { monthWindow } from '@/features/reports/accounting/dates'
import { Table } from '@/components/re-table'

export default function Categories() {  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')
  const [color, setColor] = useState('#0879E8')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const window = monthWindow(period.year, period.month)
      setRows(await simpleApi.getCategoryReport(window.from, window.to))
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load categories.' })
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const add = async (event) => {
    event.preventDefault()
    try {
      await simpleApi.addCategory(name, color)
      setName('')
      await load()
      setNotice({ type: 'success', text: 'Category added.' })
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not add category.' })
    }
  }

  const remove = async (label) => {
    if (!window.confirm(`Delete the category "${label}"?`)) return
    try {
      await simpleApi.deleteCategory(label)
      await load()
      setNotice({ type: 'success', text: 'Category deleted.' })
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not delete category.' })
    }
  }

  const columns = [
    {
      key: 'label',
      header: 'Category',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="size-3 rounded-full" style={{ backgroundColor: row.color }} />
          <span className="text-sm font-semibold text-slate-900">{row.label}</span>
        </div>
      ),
    },
    {
      key: 'sales',
      header: 'Sales',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-600">{row.count}</span>,
    },
    {
      key: 'sale',
      header: 'Selling Price',
      align: 'right',
      render: (row) => <span className="text-sm font-semibold tabular-nums text-slate-900">{formatMoney(row.sale)}</span>,
    },
    {
      key: 'cost',
      header: 'Cost Price',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-600">{formatMoney(row.cost)}</span>,
    },
    {
      key: 'profit',
      header: 'Profit',
      align: 'right',
      render: (row) => (
        <span className={`text-sm font-bold tabular-nums ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          {formatMoney(row.profit)}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      render: (row) =>
        row.removable ? (
          <button
            type="button"
            onClick={() => remove(row.label)}
            className="inline-flex items-center gap-1 rounded-lg bg-[#DC2626] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#b91c1c]"
          >
            <Trash2 className="size-3.5" /> Delete
          </button>
        ) : (
          <span className="text-xs text-slate-400">{row.isUsed ? 'In use' : 'Default'}</span>
        ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Categories"
        description="Visa, Tour, Hotel and any service you add. Create one here or type it on a sale."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Categories' }]}
      />

      <SimpleTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Tags className="size-5 text-[#2F80ED]" />
          <span className="text-base font-semibold text-slate-700">Month</span>
          <MonthNavigator
            year={period.year}
            month={period.month}
            years={[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]}
            onChange={setPeriod}
          />
        </div>
      </div>

      <form onSubmit={add} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <label className="flex-1 text-sm font-semibold text-slate-700">
          New category
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Example: Umrah Package"
            className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-base font-normal outline-none focus:border-[#2F80ED]"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Colour
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="mt-1.5 h-11 w-20 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 outline-none focus:border-[#2F80ED]"
          />
        </label>
        <Button type="submit" className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white">
          <PlusCircle className="size-5" /> Add Category
        </Button>
      </form>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-base text-slate-500">
          Loading categories…
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          headerClassName="bg-[#2F80ED] text-white"
          emptyText="No categories yet"
          emptyDescription="Add Visa, Tour, Hotel or your own service."
        />
      )}

      {notice ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            notice.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.text}
        </div>
      ) : null}
    </div>
  )
}
