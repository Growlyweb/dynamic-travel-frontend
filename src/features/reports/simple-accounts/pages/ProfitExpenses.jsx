import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { PlusCircle, Wallet } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import BigCard from '../components/BigCard'
import MonthNavigator from '@/features/reports/components/MonthNavigator'
import ExpenseModal from '../components/ExpenseModal'
import { simpleApi } from '../simple.api'
import { formatMoney, formatPct } from '@/features/reports/reports.api'
import { formatDateShort } from '@/features/reports/accounting/dates'

export default function ProfitExpenses() {
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [data, setData] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [report, expenseAccounts] = await Promise.all([
        simpleApi.getMonthly(period.year, period.month),
        simpleApi.getExpenseAccounts(),
      ])
      setData(report)
      setAccounts(expenseAccounts)
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load profit and expenses.' })
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profit & Expenses"
        description="Selling Price − Cost Price − Office Expenses. One page for the month."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Profit & Expenses' }]}
        actions={
          <Button onClick={() => setExpenseOpen(true)} className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white">
            <PlusCircle className="size-5" /> Add Office Expense
          </Button>
        }
      />

      <SimpleTabs />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Wallet className="size-5 text-[#2F80ED]" />
        <span className="text-base font-semibold text-slate-700">Month</span>
        <MonthNavigator
          year={period.year}
          month={period.month}
          years={data?.availableYears || []}
          onChange={setPeriod}
        />
        <span className="ml-auto text-base font-bold text-slate-900">{data?.monthName || ''}</span>
      </div>

      {loading || !data ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-base text-slate-500">
          Loading profit and expenses…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BigCard label="Selling Price" value={formatMoney(data.sale)} hint={`${data.counts.sales} sales`} tone="blue" />
            <BigCard label="Cost Price" value={formatMoney(data.cost)} hint="Supplier cost" tone="amber" />
            <BigCard label="Office Expenses" value={formatMoney(data.officeExpenses)} hint={`${data.counts.expenses} expenses`} tone="slate" />
            <BigCard
              label="Net Profit"
              value={formatMoney(data.profit)}
              hint={`Margin ${formatPct(data.sale ? (data.profit / data.sale) * 100 : 0)}`}
              tone={data.profit >= 0 ? 'green' : 'red'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-lg font-bold text-slate-900">Profit by Category</h2>
                <p className="text-sm text-slate-500">Selling Price minus Cost Price for each service.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#2F80ED] text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Category</th>
                      <th className="px-4 py-3 text-right font-semibold">Sales</th>
                      <th className="px-4 py-3 text-right font-semibold">Selling Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Cost Price</th>
                      <th className="px-4 py-3 text-right font-semibold">Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.categories.map((category) => (
                      <tr key={category.label}>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          <span className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                          {category.label}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-500">{category.count}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-800">{formatMoney(category.sale)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-600">{formatMoney(category.cost)}</td>
                        <td className={`px-4 py-3 text-right font-semibold tabular-nums ${category.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {formatMoney(category.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 font-bold text-white">
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
                      <td colSpan={4} className="px-4 py-3 text-right">Net Profit</td>
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
                <span className="text-sm font-semibold text-slate-600">Total</span>
                <span className="text-base font-bold tabular-nums text-rose-600">{formatMoney(data.officeExpenses)}</span>
              </div>
            </section>
          </div>
        </>
      )}

      <ExpenseModal
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        accounts={accounts}
        onSave={async (payload) => {
          await simpleApi.addExpense(payload)
          await load()
          setNotice({ type: 'success', text: 'Office expense saved.' })
        }}
      />

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
