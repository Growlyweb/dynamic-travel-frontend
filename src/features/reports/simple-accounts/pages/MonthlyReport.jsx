import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { CalendarDays, Download, PlusCircle, Printer } from 'lucide-react'
import { exportToCsv } from '@/utils/exportEngine'
import { printReportDocument } from '@/utils/exportEngine'

import SimpleTabs from '../components/SimpleTabs'
import BigCard from '../components/BigCard'
import MonthNavigator from '@/features/reports/components/MonthNavigator'
import ExpenseModal from '../components/ExpenseModal'
import SaleModal from '../components/SaleModal'
import { simpleApi } from '../simple.api'
import { formatMoney, formatPct } from '@/features/reports/lib/format'
import { formatDateShort } from '@/features/reports/lib/dates'
import { FEATURE_CATEGORIES_ENABLED } from '@/utils/constants'

export default function MonthlyReport() {
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expenseAccounts, setExpenseAccounts] = useState([])
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [saleOpen, setSaleOpen] = useState(false)
  const [categories, setCategories] = useState([])
  const [priceList, setPriceList] = useState([])
  const [yearly, setYearly] = useState([])
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [report, accounts, categoryRows, prices, yearRows] = await Promise.all([
        simpleApi.getMonthly(period.year, period.month),
        simpleApi.getExpenseAccounts(),
        simpleApi.getCategories(),
        simpleApi.getPriceList(),
        simpleApi.getYearly(period.year),
      ])
      setData(report)
      setExpenseAccounts(accounts)
      setCategories(categoryRows)
      setPriceList(prices)
      setYearly(yearRows.rows)
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load the monthly report.' })
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

  const yearTotals = yearly.reduce(
    (acc, row) => ({
      sale: acc.sale + row.sale,
      cost: acc.cost + row.cost,
      officeExpenses: acc.officeExpenses + row.officeExpenses,
      profit: acc.profit + row.profit,
      count: acc.count + row.count,
    }),
    { sale: 0, cost: 0, officeExpenses: 0, profit: 0, count: 0 }
  )

  const downloadMonthly = () => {
    if (!data) return
    exportToCsv(
      `Sales-${data.monthName}`,
      [
        { key: 'date', label: 'Date' },
        { key: 'count', label: 'Sales' },
        { key: 'sale', label: 'Selling Price (BDT)' },
        { key: 'cost', label: 'Cost Price (BDT)' },
        { key: 'profit', label: 'Profit (BDT)' },
      ],
      data.days
    )
    setNotice({ type: 'success', text: 'Monthly CSV downloaded.' })
  }

  const downloadYearly = async () => {
    const yearly = await simpleApi.getYearly(period.year)
    exportToCsv(
      `Sales-${period.year}`,
      [
        { key: 'monthName', label: 'Month' },
        { key: 'count', label: 'Sales' },
        { key: 'sale', label: 'Selling Price (BDT)' },
        { key: 'cost', label: 'Cost Price (BDT)' },
        { key: 'officeExpenses', label: 'Office Expenses (BDT)' },
        { key: 'profit', label: 'Profit (BDT)' },
      ],
      yearly.rows
    )
    setNotice({ type: 'success', text: 'Yearly CSV downloaded.' })
  }

  const printReport = () => {
    if (!data) return
    printReportDocument({
      title: `Monthly Report — ${data.monthName}`,
      subtitle: 'Selling Price, Cost Price, Profit and Office Expenses',
      dateRange: `${formatDateShort(data.from)} — ${formatDateShort(data.to)}`,
      headers: [
        { key: 'date', label: 'Date' },
        { key: 'count', label: 'Sales', align: 'right' },
        { key: 'sale', label: 'Selling Price', align: 'right', isCurrency: true },
        { key: 'cost', label: 'Cost Price', align: 'right', isCurrency: true },
        { key: 'profit', label: 'Profit', align: 'right', isCurrency: true },
      ],
      rows: data.days.map((day) => ({
        date: formatDateShort(day.date),
        count: day.count,
        sale: formatMoney(day.sale),
        cost: formatMoney(day.cost),
        profit: formatMoney(day.profit),
      })),
      summaryTotals: [
        { value: 'Month total', colspan: 2 },
        { value: formatMoney(data.sale), align: 'right' },
        { value: formatMoney(data.cost), align: 'right' },
        { value: formatMoney(data.sale - data.cost), align: 'right' },
      ],
      metadata: {
        'Office expenses': formatMoney(data.officeExpenses),
        'Profit after office expenses': formatMoney(data.profit),
      },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Monthly Report"
        description="The month starts from zero automatically. Old months stay available."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Monthly Report' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={downloadMonthly} className="h-11 gap-2 px-4 text-base">
              <Download className="size-5 text-[#2F80ED]" /> Monthly CSV
            </Button>
            <Button variant="outline" onClick={downloadYearly} className="h-11 gap-2 px-4 text-base">
              <Download className="size-5 text-[#2F80ED]" /> Yearly CSV
            </Button>
            <Button onClick={printReport} className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white">
              <Printer className="size-5" /> Print / PDF
            </Button>
          </div>
        }
      />

      <SimpleTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-[#2F80ED]" />
          <span className="text-base font-semibold text-slate-700">Report Month</span>
          <MonthNavigator
            year={period.year}
            month={period.month}
            years={data?.availableYears || []}
            onChange={setPeriod}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 text-base font-semibold text-slate-800">{data?.monthName || ''}</p>
          <Button onClick={() => setSaleOpen(true)} className="h-10 gap-1.5 bg-[#2F80ED] px-3 text-sm text-white">
            <PlusCircle className="size-4" /> New Sale
          </Button>
          <Button variant="outline" onClick={() => setExpenseOpen(true)} className="h-10 gap-1.5 px-3 text-sm">
            <PlusCircle className="size-4 text-[#2F80ED]" /> Add Expense
          </Button>
        </div>
      </div>

      {loading || !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-base text-slate-500">
          Loading monthly report…
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-4">
            <BigCard label="Selling Price" value={formatMoney(data.sale)} hint={`${data.counts.sales} sales`} tone="blue" />
            <BigCard label="Cost Price" value={formatMoney(data.cost)} hint="Supplier cost" tone="amber" />
            <BigCard label="Office Expenses" value={formatMoney(data.officeExpenses)} hint={`${data.counts.expenses} expenses`} tone="slate" />
            <BigCard
              label="Profit"
              value={formatMoney(data.profit)}
              hint={`Selling − Cost − Office · ${formatPct(data.sale ? (data.profit / data.sale) * 100 : 0)}`}
              tone={data.profit >= 0 ? 'green' : 'red'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900">Day by Day</h2>
                <p className="text-sm text-slate-500">Every day starts at zero. Future days stay empty.</p>
              </div>
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#2F80ED] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-right font-semibold">Sales</th>
                      <th className="px-4 py-3 text-right font-semibold">Selling</th>
                      <th className="px-4 py-3 text-right font-semibold">Cost</th>
                      <th className="px-4 py-3 text-right font-semibold">Profit Before Office</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.days.map((day) => (
                      <tr key={day.date} className={day.count ? 'bg-white' : 'bg-slate-50/40'}>
                        <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{formatDateShort(day.date)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{day.count}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">{formatMoney(day.sale)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatMoney(day.cost)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${day.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatMoney(day.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#2F80ED] font-bold text-white">
                      <td className="px-4 py-3">Total</td>
                      <td className="px-4 py-3 text-right tabular-nums">{data.counts.sales}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(data.sale)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(data.cost)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMoney(data.sale - data.cost)}</td>
                    </tr>
                    <tr className="bg-slate-700 font-semibold text-white">
                      <td colSpan={4} className="px-4 py-2.5 text-right">Less: Office Expenses</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">−{formatMoney(data.officeExpenses)}</td>
                    </tr>
                    <tr className="bg-[#0F172A] font-bold text-white">
                      <td colSpan={4} className="px-4 py-3 text-right">Profit After Office</td>
                      <td className="px-4 py-3 text-right text-base tabular-nums text-emerald-300">{formatMoney(data.profit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Office Expenses</h2>
                  <p className="text-sm text-slate-500">Salary, rent, marketing…</p>
                </div>
                <Button onClick={() => setExpenseOpen(true)} className="h-10 gap-1.5 bg-[#2F80ED] px-3 text-sm text-white">
                  <PlusCircle className="size-4" /> Add
                </Button>
              </div>
              <div className="max-h-[440px] divide-y divide-slate-100 overflow-auto">
                {data.expenses.map((expense) => (
                  <div key={expense.id} className="flex items-start justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">{expense.note}</p>
                      <p className="text-xs text-slate-400">{formatDateShort(expense.date)}</p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-rose-600">{formatMoney(expense.amount)}</p>
                  </div>
                ))}
                {!data.expenses.length ? (
                  <p className="px-5 py-8 text-center text-sm text-slate-400">No office expenses this month.</p>
                ) : null}
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
                <span className="text-sm font-semibold text-slate-600">Total Office Expenses</span>
                <span className="text-base font-bold tabular-nums text-rose-600">{formatMoney(data.officeExpenses)}</span>
              </div>
            </section>
          </div>

          {FEATURE_CATEGORIES_ENABLED && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.categories.map((category) => (
                <div key={category.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ backgroundColor: category.color }} />
                    <p className="text-base font-semibold text-slate-800">{category.label}</p>
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatMoney(category.sale)}</p>
                  <p className="text-sm text-slate-500">
                    {category.count} sales · cost {formatMoney(category.cost)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Yearly Report · {period.year}</h2>
                <p className="text-sm text-slate-500">Every month, from January to December. Old months stay saved.</p>
              </div>
              <Button variant="outline" onClick={downloadYearly} className="h-10 gap-2 px-4 text-sm">
                <Download className="size-4 text-[#2F80ED]" /> Download Yearly CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#2F80ED] text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Month</th>
                    <th className="px-4 py-3 text-right font-semibold">Sales</th>
                    <th className="px-4 py-3 text-right font-semibold">Selling Price</th>
                    <th className="px-4 py-3 text-right font-semibold">Cost Price</th>
                    <th className="px-4 py-3 text-right font-semibold">Office Expenses</th>
                    <th className="px-4 py-3 text-right font-semibold">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {yearly.map((row) => (
                    <tr key={row.month} className={row.month === period.month ? 'bg-blue-50/50' : ''}>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{row.monthName}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{row.count}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-800">{formatMoney(row.sale)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatMoney(row.cost)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{formatMoney(row.officeExpenses)}</td>
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${row.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {formatMoney(row.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#2F80ED] font-bold text-white">
                    <td className="px-4 py-3">Year total</td>
                    <td className="px-4 py-3 text-right tabular-nums">{yearTotals.count}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(yearTotals.sale)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(yearTotals.cost)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(yearTotals.officeExpenses)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatMoney(yearTotals.profit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}

      <SaleModal
        open={saleOpen}
        onOpenChange={setSaleOpen}
        categories={categories}
        priceList={priceList}
        onSave={async (payload) => {
          await simpleApi.createSale(payload)
          await load()
          setNotice({ type: 'success', text: 'Sale saved.' })
        }}
      />

      <ExpenseModal
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        accounts={expenseAccounts}
        onSave={async (payload) => {
          await simpleApi.addExpense(payload)
          await load()
          setNotice({ type: 'success', text: 'Office expense saved.' })
        }}
      />

      {notice ? (
        <div
          className={`fixed right-4 top-4 z-50 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            notice.type === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {notice.text}
        </div>
      ) : null}
    </div>
  )
}
