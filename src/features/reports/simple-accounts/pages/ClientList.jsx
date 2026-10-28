import { useCallback, useEffect, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { PlusCircle, UserRound } from 'lucide-react'

import SimpleTabs from '../components/SimpleTabs'
import BigCard from '../components/BigCard'
import { simpleApi } from '../simple.api'
import { formatMoney, formatPct } from '@/features/reports/lib/format'
import { Table } from '@/components/re-table'

export default function ClientList({ kind = 'B2C' }) {
  const isB2B = kind === 'B2B'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', creditLimit: 100000 })
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await simpleApi.listParties(kind))
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not load the list.' })
    } finally {
      setLoading(false)
    }
  }, [kind])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const totals = rows.reduce(
    (acc, row) => ({
      invoiced: acc.invoiced + row.invoiced,
      received: acc.received + row.received,
      due: acc.due + row.due,
    }),
    { invoiced: 0, received: 0, due: 0 }
  )

  const add = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      await simpleApi.addClient({ type: kind, ...form })
      setForm({ name: '', phone: '', creditLimit: 100000 })
      setShowForm(false)
      await load()
      setNotice({ type: 'success', text: isB2B ? 'Agent added.' : 'Client added.' })
    } catch (err) {
      setNotice({ type: 'error', text: err?.message || 'Could not add.' })
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    {
      key: 'name',
      header: isB2B ? 'Agency' : 'Client',
      render: (row) => (
        <div>
          <p className="text-sm font-bold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-400">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => <span className="text-sm text-slate-600">{row.phone || '—'}</span>,
    },
    {
      key: 'invoices',
      header: 'Sales',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-slate-600">{row.invoices}</span>,
    },
    {
      key: 'invoiced',
      header: 'Selling Price',
      align: 'right',
      render: (row) => <span className="text-sm font-semibold tabular-nums text-slate-900">{formatMoney(row.invoiced)}</span>,
    },
    {
      key: 'received',
      header: 'Received',
      align: 'right',
      render: (row) => <span className="text-sm tabular-nums text-emerald-700">{formatMoney(row.received)}</span>,
    },
    {
      key: 'due',
      header: 'Due',
      align: 'right',
      render: (row) => (
        <span className={`text-sm font-bold tabular-nums ${row.due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
          {formatMoney(row.due)}
        </span>
      ),
    },
    {
      key: 'progress',
      header: 'Received %',
      render: (row) => {
        const percent = row.invoiced > 0 ? (row.received / row.invoiced) * 100 : 0
        return (
          <div className="w-28">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, percent)}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{formatPct(percent)}</p>
          </div>
        )
      },
    },
    ...(isB2B
      ? [
          {
            key: 'credit',
            header: 'Credit Used',
            align: 'right',
            render: (row) => (
              <div>
                <p className={`text-sm font-semibold tabular-nums ${row.creditUsed > 80 ? 'text-rose-600' : 'text-slate-700'}`}>
                  {formatPct(Math.min(100, row.creditUsed))}
                </p>
                <p className="text-[11px] text-slate-400">Limit {formatMoney(row.creditLimit)}</p>
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            row.due > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {row.due > 0 ? 'Due' : row.invoices ? 'Paid' : 'New'}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title={isB2B ? 'B2B Agents' : 'B2C Clients'}
        description={
          isB2B
            ? 'Travel agencies that sell for us. See their sales, money received, due and credit limit.'
            : 'Direct customers. See their sales, money received and due.'
        }
        breadcrumbs={[{ label: 'Accounts', to: '/accounts' }, { label: isB2B ? 'B2B Agents' : 'B2C Clients' }]}
        actions={
          <Button
            onClick={() => setShowForm((value) => !value)}
            className="h-11 gap-2 bg-[#2F80ED] px-5 text-base text-white"
          >
            <PlusCircle className="size-5" /> Add {isB2B ? 'Agent' : 'Client'}
          </Button>
        }
      />

      <SimpleTabs />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigCard label={isB2B ? 'Agents' : 'Clients'} value={String(rows.length)} hint="In the list" tone="blue" />
        <BigCard label="Selling Price" value={formatMoney(totals.invoiced)} hint="All time" tone="slate" />
        <BigCard label="Received" value={formatMoney(totals.received)} hint="Money collected" tone="green" />
        <BigCard label="Due" value={formatMoney(totals.due)} hint="Still to collect" tone="red" />
      </div>

      {showForm ? (
        <form onSubmit={add} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <UserRound className="size-5 text-[#2F80ED]" />
            <h2 className="text-lg font-bold text-slate-900">Add {isB2B ? 'B2B agent' : 'B2C client'}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-semibold text-slate-700">
              {isB2B ? 'Agency name' : 'Client name'}
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-base font-normal outline-none focus:border-[#2F80ED]"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Phone
              <input
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="01XXXXXXXXX"
                className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-base font-normal outline-none focus:border-[#2F80ED]"
              />
            </label>
            {isB2B ? (
              <label className="text-sm font-semibold text-slate-700">
                Credit limit
                <input
                  type="number"
                  min="0"
                  value={form.creditLimit}
                  onChange={(event) => setForm((current) => ({ ...current, creditLimit: event.target.value }))}
                  className="mt-1.5 h-11 w-full rounded-lg border border-slate-300 px-3 text-base font-normal outline-none focus:border-[#2F80ED]"
                />
              </label>
            ) : null}
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" disabled={saving} className="h-11 bg-[#2F80ED] px-5 text-base text-white">
              {saving ? 'Saving…' : `Save ${isB2B ? 'Agent' : 'Client'}`}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="h-11 px-5 text-base">
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-base text-slate-500">
          Loading {isB2B ? 'agents' : 'clients'}…
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          dense
          headerClassName="bg-[#2F80ED] text-white"
          emptyText={isB2B ? 'No B2B agents yet' : 'No B2C clients yet'}
          emptyDescription={`Add your first ${isB2B ? 'agent' : 'client'} to start.`}
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
