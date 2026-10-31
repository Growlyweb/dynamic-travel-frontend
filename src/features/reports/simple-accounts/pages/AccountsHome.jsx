import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  HandCoins,
  PlusCircle,
  ReceiptText,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import BigCard from '../components/BigCard'
import SectionCard from '@/features/reports/components/SectionCard'
import MonthNavigator from '@/features/reports/components/MonthNavigator'
import PerformanceChart from '@/features/reports/components/PerformanceChart'
import ReportDonutChart from '@/features/reports/components/ReportDonutChart'
import AgingBars from '@/features/reports/components/AgingBars'
import SaleModal from '../components/SaleModal'
import MoneyReceiptModal from '../components/MoneyReceiptModal'
import { simpleApi } from '../simple.api'
import { formatMoney, formatPct } from '@/features/reports/lib/format'
import { FEATURE_CATEGORIES_ENABLED } from '@/utils/constants'

export default function AccountsHome() {
  const now = new Date()
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [priceList, setPriceList] = useState([])
  const [sales, setSales] = useState([])
  const [saleOpen, setSaleOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [home, categoryRows, prices, saleRows] = await Promise.all([
        simpleApi.getHome(period),
        simpleApi.getCategories(),
        simpleApi.getPriceList(),
        simpleApi.listDue({ pageSize: 500 }),
      ])
      setData(home)
      setCategories(categoryRows)
      setPriceList(prices)
      setSales(saleRows.rows)
    } catch (err) {
      setError(err?.message || 'Could not load accounts.')
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

  const refresh = async (message) => {
    if (message) setNotice({ type: 'success', text: message })
    await load()
  }

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <PageHeader title="Accounts Home" breadcrumbs={[{ label: 'Accounts' }]} />
        <SimpleTabs />
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-5">
        <PageHeader title="Accounts Home" breadcrumbs={[{ label: 'Accounts' }]} />
        <SimpleTabs />
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
          <AlertTriangle className="mx-auto mb-2 size-7 text-rose-500" />
          <p className="text-base font-semibold text-rose-700">{error || 'Could not load accounts.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Accounts Home"
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Home' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              size="lg"
              onClick={() => setReceiptOpen(true)}
              className="h-11 gap-2 bg-[#2F80ED] px-4 text-base text-white hover:bg-[#1d6fd0]"
            >
              <HandCoins className="size-5" /> Money Receipt
            </Button>
            <Button size="lg" onClick={() => setSaleOpen(true)} className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white">
              <PlusCircle className="size-5" /> New Sale
            </Button>
          </div>
        }
      />

      <SimpleTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-5 text-[#2F80ED]" />
          <span className="text-base font-semibold text-slate-700">This Month</span>
          <MonthNavigator year={period.year} month={period.month} onChange={setPeriod} />
        </div>
        <p className="text-base font-semibold text-slate-800">{data.monthName}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <BigCard
          label="Selling Price"
          value={formatMoney(data.sale)}
          hint={`${data.counts.sales} sales this month`}
          icon={TrendingUp}
          tone="blue"
        />
        <BigCard
          label="Cost Price"
          value={formatMoney(data.cost)}
          hint={data.unallocatedCost > 0 ? `Includes ${formatMoney(data.unallocatedCost)} not tied to a sale` : undefined}
          icon={ReceiptText}
          tone="amber"
        />
        <BigCard
          label="Profit"
          value={formatMoney(data.profit)}
          hint={`After ${formatMoney(data.officeExpenses)} office expenses · ${formatPct(data.margin)} margin`}
          icon={Banknote}
          tone={data.profit >= 0 ? 'green' : 'red'}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Cash', value: data.money.cash, icon: Wallet },
          { label: 'Bank', value: data.money.bank, icon: Banknote },
          { label: 'bKash', value: data.money.bkash, icon: Wallet },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold text-slate-600">{item.label}</p>
              <span className="grid size-10 place-items-center rounded-xl bg-[#E6F2FD] text-[#2F80ED]">
                <item.icon className="size-5" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{formatMoney(item.value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-600">B2B Agents</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{formatMoney(data.b2b)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-600">B2C Customers</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{formatMoney(data.b2c)}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-[#E6F2FD] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-[#2F80ED]">Total Client Due</p>
            <Users className="size-6 text-[#2F80ED]" />
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums text-[#2F80ED]">{formatMoney(data.totalDue)}</p>
          <Link to="/accounts/dues" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#2F80ED] hover:underline">
            See all dues <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/accounts/payables" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#2F80ED]/40">
          <p className="text-base font-semibold text-slate-600">Vendor Payable</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-rose-600">{formatMoney(data.vendorDue)}</p>
        </Link>
        <Link to="/accounts/partners" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#2F80ED]/40">
          <p className="text-base font-semibold text-slate-600">Partner Capital</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{formatMoney(data.partnerCapital)}</p>
        </Link>
        <Link to="/accounts/dues" className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm transition hover:border-rose-300">
          <p className="text-base font-semibold text-rose-800">Overdue Client Due</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-rose-700">{formatMoney(data.overdue)}</p>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Selling Price vs Cost" subtitle="Last 6 months, including office expenses" className="lg:col-span-2">
          <PerformanceChart
            data={data.series}
            height={230}
            revenueLabel="Selling Price"
            costLabel="Cost + Office"
            profitLabel="Profit"
          />
        </SectionCard>
        <SectionCard title="B2B and B2C" subtitle="Selling Price this month">
          <ReportDonutChart
            bare
            title=""
            segments={[
              { label: 'B2B Agents', value: data.b2b, color: '#0879E8' },
              { label: 'B2C Customers', value: data.b2c, color: '#16A34A' },
            ]}
            centerSub="Selling Price"
          />
        </SectionCard>
      </div>

      <SectionCard title="How Old Client Dues Are" subtitle="Red money needs a reminder today.">
        <AgingBars aging={data.aging} total={data.totalDue} columns={5} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {FEATURE_CATEGORIES_ENABLED && (
          <SectionCard title="Money by Category" subtitle="Selling Price this month" className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {data.categories.map((category) => (
                <div key={category.label} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <p className="text-base font-semibold text-slate-800">{category.label}</p>
                    </div>
                    <span className="text-sm text-slate-500">{category.count} sales</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">{formatMoney(category.sale)}</p>
                  <div className="mt-1 flex justify-between text-sm">
                    <span className="text-slate-500">Cost {formatMoney(category.cost)}</span>
                    <span className="font-semibold text-emerald-700">Profit {formatMoney(category.profit)}</span>
                  </div>
                </div>
              ))}
              {!data.categories.length ? (
                <p className="py-6 text-center text-sm text-slate-400">No sales this month yet.</p>
              ) : null}
            </div>
          </SectionCard>
        )}

        <SectionCard
          title="Top 10 Clients Who Owe Us"
          subtitle="Highest due first"
          className={FEATURE_CATEGORIES_ENABLED ? '' : 'lg:col-span-3'}
        >
          <div className="space-y-2">
            {data.topClients.map((client, index) => (
              <div key={`${client.name}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{client.name}</p>
                    <p className="text-xs text-slate-400">{client.type} · {client.invoices} sales</p>
                  </div>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-rose-600">{formatMoney(client.due)}</span>
              </div>
            ))}
            {!data.topClients.length ? (
              <p className="py-6 text-center text-sm text-slate-400">Nobody owes us money. Good.</p>
            ) : null}
          </div>
        </SectionCard>
      </div>

      <SaleModal
        open={saleOpen}
        onOpenChange={setSaleOpen}
        categories={categories}
        priceList={priceList}
        onSave={async (payload) => {
          await simpleApi.createSale(payload)
          await refresh('Sale saved.')
        }}
      />
      <MoneyReceiptModal
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        sales={sales}
        onSave={async (payload) => {
          await simpleApi.addReceipt(payload)
          await refresh('Money receipt saved. Due updated.')
        }}
      />

      {notice ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg">
          {notice.text}
        </div>
      ) : null}
    </div>
  )
}
