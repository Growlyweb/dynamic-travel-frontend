import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowDownLeft, ArrowUpRight, Handshake } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import PartnerModal from '../components/PartnerModal'
import BigCard from '../components/BigCard'
import { simpleApi } from '../simple.api'
import { formatMoney, formatPct } from '@/features/reports/lib/format'
import { formatDateShort } from '@/features/reports/lib/dates'
import { usePermission } from '@/hooks/usePermission'

export default function Partners() {
  // Partner capital is an administrator's job.
  const { isAdmin } = usePermission()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState({ open: false, partner: 'A', direction: 'in' })
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await simpleApi.getPartners())
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load partners.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const openModal = (partner, direction) => setModal({ open: true, partner, direction })

  if (loading || !data) {
    return (
      <div className="space-y-5">
        <PageHeader title="Partners" breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Partners' }]} />
        <SimpleTabs />
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-base text-slate-500">
          Loading partners…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Partners"
        description="Two partners. Money in, money out, share of capital and share of this month's profit."
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: 'Partners' }]}
        actions={
          isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => openModal('A', 'in')} className="h-11 gap-2 px-4 text-base">
              <ArrowDownLeft className="size-5 text-emerald-600" /> Partner A Money In
            </Button>
            <Button onClick={() => openModal('A', 'out')} className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white">
              <ArrowUpRight className="size-5" /> Partner A Money Out
            </Button>
          </div>
          ) : null
        }
      />

      <SimpleTabs />

      <div className="grid gap-4 lg:grid-cols-2">
        {data.partners.map((partner) => (
          <div key={partner.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-slate-900">{partner.name}</p>
                <p className="text-sm text-slate-500">Share by net capital</p>
              </div>
              <span className="grid size-12 place-items-center rounded-xl bg-[#E6F2FD] text-[#2F80ED]">
                <Handshake className="size-6" />
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Money in the business</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{formatMoney(partner.net)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Share</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[#2F80ED]">{formatPct(partner.share)}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm">
              <div>
                <p className="text-slate-500">Invested</p>
                <p className="font-semibold tabular-nums text-slate-800">{formatMoney(partner.invested || 0)}</p>
              </div>
              <div>
                <p className="text-slate-500">Taken out</p>
                <p className="font-semibold tabular-nums text-slate-800">{formatMoney(partner.withdrawn || 0)}</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">Share of {data.monthName} Profit</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">
                {formatMoney((data.monthProfit * partner.share) / 100)}
              </p>
            </div>
            {isAdmin ? (
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => openModal(partner.id, 'in')}
                className="flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                Money In
              </button>
              <button
                type="button"
                onClick={() => openModal(partner.id, 'out')}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Money Out
              </button>
            </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <BigCard label="This Month Profit" value={formatMoney(data.monthProfit)} hint={data.monthName} tone={data.monthProfit >= 0 ? 'green' : 'red'} />
        <BigCard
          label="Partner A Share"
          value={formatMoney((data.monthProfit * data.partners[0].share) / 100)}
          hint={formatPct(data.partners[0].share)}
          tone="blue"
        />
        <BigCard
          label="Partner B Share"
          value={formatMoney((data.monthProfit * data.partners[1].share) / 100)}
          hint={formatPct(data.partners[1].share)}
          tone="blue"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Partner Money History</h2>
          <p className="text-sm text-slate-500">Money in and money out, newest first.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#2F80ED] text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Partner</th>
                <th className="px-4 py-3 text-left font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.transactions.map((transaction) => (
                <tr key={`${transaction.id}-${transaction.partner}-${transaction.amount}`} className="bg-white">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateShort(transaction.date)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">Partner {transaction.partner}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        transaction.type === 'in' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {transaction.type === 'in' ? 'Money In' : 'Money Out'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">{formatMoney(transaction.amount)}</td>
                  <td className="px-4 py-3 text-slate-500">{transaction.note}</td>
                </tr>
              ))}
              {!data.transactions.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    No partner money movement yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <PartnerModal
        open={modal.open}
        onOpenChange={(open) => setModal((current) => ({ ...current, open }))}
        partner={modal.partner}
        direction={modal.direction}
        onSave={async (payload) => {
          await simpleApi.addPartnerTransaction(payload)
          await load()
          setNotice({ type: 'success', text: 'Partner entry saved.' })
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
