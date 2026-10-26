import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { AlertCircle, Landmark, ListTree, PlusCircle, Search } from 'lucide-react'
import { exportToCsv, exportToExcel } from '@/utils/exportEngine'

import AccountingTabs from '../components/AccountingTabs'
import ExportButtons from '../components/ExportButtons'
import ModalShell, { Field, inputClass, selectClass } from '../components/ModalShell'
import SectionCard from '../components/SectionCard'
import { reportsApi, formatMoney } from '../reports.api'
import { formatDateShort, todayISO } from '../accounting/dates'
import { ACCOUNT_TYPES, GROUP_ORDER } from '../accounting/coa'

const GROUPS_BY_TYPE = {
  Asset: ['Current Assets', 'Non-current Assets'],
  Liability: ['Current Liabilities', 'Non-current Liabilities'],
  Equity: ['Capital & Partners'],
  Income: ['Operating Revenue'],
  Expense: ['Direct Costs', 'Operating Expenses'],
}

const TYPE_STYLE = {
  Asset: 'bg-[#E6F2FD] text-primary',
  Liability: 'bg-violet-50 text-violet-700',
  Equity: 'bg-amber-50 text-amber-700',
  Income: 'bg-emerald-50 text-emerald-700',
  Expense: 'bg-rose-50 text-rose-700',
}

const emptyForm = { code: '', name: '', type: 'Asset', group: 'Current Assets' }

export default function ChartOfAccounts() {
  const [asOf, setAsOf] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await reportsApi.getChartOfAccounts(asOf)
      if (response.success) setData(response.data)
    } catch (err) {
      console.error(err)
      setNotice({ type: 'error', text: err?.message || 'Could not load the chart of accounts.' })
    } finally {
      setLoading(false)
    }
  }, [asOf])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3000)
    return () => clearTimeout(timer)
  }, [notice])

  const filtered = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLowerCase()
    return data.byType
      .filter((group) => typeFilter === 'all' || group.type === typeFilter)
      .map((group) => ({
        ...group,
        rows: group.rows.filter(
          (row) =>
            !query ||
            row.name.toLowerCase().includes(query) ||
            row.code.includes(query) ||
            row.group.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.rows.length > 0)
  }, [data, search, typeFilter])

  const totals = data?.totals || { assets: 0, liabilities: 0, equity: 0, income: 0, expenses: 0 }

  const openAdd = () => {
    setForm(emptyForm)
    setError('')
    setAddOpen(true)
  }

  const handleAdd = async (event) => {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await reportsApi.addAccount(form)
      setAddOpen(false)
      setNotice({ type: 'success', text: 'Account added to the chart.' })
      await load()
    } catch (err) {
      setError(err?.message || 'Could not add the account.')
    } finally {
      setSaving(false)
    }
  }

  const exportRows = () =>
    (data?.rows || []).map((row) => ({
      code: row.code,
      name: row.name,
      type: row.type,
      group: row.group,
      debit: row.debit,
      credit: row.credit,
      balance: row.balance,
      entries: row.entries,
    }))

  const exportHeaders = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Account' },
    { key: 'type', label: 'Type' },
    { key: 'group', label: 'Group' },
    { key: 'debit', label: 'Debit (BDT)' },
    { key: 'credit', label: 'Credit (BDT)' },
    { key: 'balance', label: 'Balance (BDT)' },
    { key: 'entries', label: 'Entries' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader
        title="Chart of Accounts"
        description="The account structure behind every report — grouped by type with live balances."
        breadcrumbs={[{ label: 'Accounts', to: '/reports/overview' }, { label: 'Chart of Accounts' }]}
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            <ExportButtons
              onCsv={() => exportToCsv(`Chart-of-Accounts-${asOf}`, exportHeaders, exportRows())}
              onExcel={() =>
                exportToExcel(`Chart-of-Accounts-${asOf}`, {
                  title: 'Chart of Accounts',
                  subtitle: `As at ${formatDateShort(asOf)}`,
                  headers: exportHeaders.map((header) => ({
                    ...header,
                    isCurrency: ['debit', 'credit', 'balance'].includes(header.key),
                  })),
                  rows: exportRows(),
                  summaryTotals: [
                    { label: 'Total Assets', value: formatMoney(totals.assets) },
                    { label: 'Total Liabilities', value: formatMoney(totals.liabilities) },
                    { label: 'Total Equity', value: formatMoney(totals.equity) },
                  ],
                })
              }
            />
            <Button size="sm" onClick={openAdd} className="gap-1.5 bg-primary text-white">
              <PlusCircle className="size-3.5" /> Add account
            </Button>
          </div>
        }
      />

      <AccountingTabs />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_4px_24px_rgba(15,23,42,0.03)] lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Balances as at</span>
          <input
            type="date"
            value={asOf}
            onChange={(event) => setAsOf(event.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11.5px] font-semibold text-slate-700 outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => setAsOf(todayISO())}
            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-primary hover:bg-[#E6F2FD]"
          >
            Today
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
          <span className="text-slate-500">
            Assets <strong className="ml-1 tabular-nums text-slate-900">{formatMoney(totals.assets)}</strong>
          </span>
          <span className="text-slate-500">
            Liabilities <strong className="ml-1 tabular-nums text-slate-900">{formatMoney(totals.liabilities)}</strong>
          </span>
          <span className="text-slate-500">
            Posted equity <strong className="ml-1 tabular-nums text-slate-900">{formatMoney(totals.equity)}</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-[0_4px_24px_rgba(15,23,42,0.03)] lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center">
        <div className="flex flex-wrap items-center gap-1">
          {['all', ...ACCOUNT_TYPES].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`whitespace-nowrap rounded-lg px-2 py-1.5 text-[10.5px] font-semibold transition ${
                typeFilter === type ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {type === 'all' ? 'All accounts' : type}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search code, name or group…"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm text-slate-500">
          Loading chart of accounts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center">
          <ListTree className="mx-auto mb-2 size-6 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No accounts match your filters</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.035)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-[#0F172A] text-left text-[10px] uppercase tracking-wider text-white">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Account</th>
                  <th className="px-4 py-3 font-semibold">Statement group</th>
                  <th className="px-4 py-3 text-right font-semibold">Debit</th>
                  <th className="px-4 py-3 text-right font-semibold">Credit</th>
                  <th className="px-4 py-3 text-right font-semibold">Balance</th>
                  <th className="px-4 py-3 text-center font-semibold">Entries</th>
                </tr>
              </thead>
              {filtered.map((group) => {
                const groupTotal = group.rows.reduce((sum, row) => sum + row.balance, 0)
                return (
                  <tbody key={group.type} className="divide-y divide-slate-100">
                    <tr className="bg-slate-50/80">
                      <td colSpan={7} className="px-4 py-2">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-2">
                            <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_STYLE[group.type]}`}>
                              {group.type}
                            </span>
                            <span className="text-[10.5px] font-medium text-slate-400">
                              {group.rows.length} {group.rows.length === 1 ? 'account' : 'accounts'}
                            </span>
                          </span>
                          <span className="text-[11px] font-bold tabular-nums text-slate-700">{formatMoney(groupTotal)}</span>
                        </div>
                      </td>
                    </tr>
                    {group.rows.map((row) => (
                      <tr key={row.code} className="bg-white transition hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] font-semibold text-slate-500">
                          {row.code}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-semibold text-slate-800">{row.name}</span>
                          {row.custom ? (
                            <span className="ml-1.5 rounded bg-amber-50 px-1 py-0.5 text-[9px] font-bold text-amber-700">
                              custom
                            </span>
                          ) : null}
                          {row.control ? (
                            <span className="ml-1.5 rounded bg-[#E6F2FD] px-1 py-0.5 text-[9px] font-bold text-primary">
                              control
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">{row.group}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                          {row.debit ? formatMoney(row.debit) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                          {row.credit ? formatMoney(row.credit) : '—'}
                        </td>
                        <td
                          className={`px-4 py-2.5 text-right font-bold tabular-nums ${
                            row.balance < 0 ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {formatMoney(row.balance)}
                        </td>
                        <td className="px-4 py-2.5 text-center tabular-nums text-slate-400">{row.entries}</td>
                      </tr>
                    ))}
                  </tbody>
                )
              })}
            </table>
          </div>
        </div>
      )}

      <SectionCard title="How the books are organised" icon={Landmark}>
        <div className="grid gap-3 text-[11.5px] text-slate-600 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { type: 'Assets', text: 'Cash, bank, receivables and fixed assets. Debit balances.' },
            { type: 'Liabilities', text: 'Supplier payables, advances and statutory dues. Credit balances.' },
            { type: 'Equity', text: 'Partner capital, drawings and retained earnings.' },
            { type: 'Income', text: 'Service revenue by segment: visa, tour, air, hotel and transport.' },
            { type: 'Expenses', text: 'Direct service costs and operating overheads.' },
          ].map((item) => (
            <div key={item.type} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
              <p className="font-bold text-slate-700">{item.type}</p>
              <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">{item.text}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <ModalShell
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add a ledger account"
        subtitle="Extend the chart of accounts. New codes are immediately available in vouchers."
        icon={ListTree}
        maxWidth="max-w-lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="account-form"
              disabled={saving}
              className="gap-1.5 bg-primary text-white hover:bg-primary/90"
            >
              <PlusCircle className="size-4" />
              Add account
            </Button>
          </>
        }
      >
        <form id="account-form" onSubmit={handleAdd} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Account code" required hint="3–5 digits, e.g. 6110">
              <input
                type="text"
                required
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                className={inputClass}
                placeholder="6110"
              />
            </Field>
            <Field label="Account type" required>
              <select
                value={form.type}
                onChange={(event) => {
                  const type = event.target.value
                  setForm((current) => ({ ...current, type, group: GROUPS_BY_TYPE[type][0] }))
                }}
                className={selectClass}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Account name" required>
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className={inputClass}
              placeholder="e.g. Courier & postage"
            />
          </Field>
          <Field label="Statement group" required>
            <select
              value={form.group}
              onChange={(event) => setForm((current) => ({ ...current, group: event.target.value }))}
              className={selectClass}
            >
              {(GROUPS_BY_TYPE[form.type] || GROUP_ORDER).map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </Field>
          {error ? (
            <p className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-medium text-rose-700">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </form>
      </ModalShell>

      {notice ? (
        <div
          role="status"
          className={`fixed right-4 top-4 z-50 rounded-xl border px-3.5 py-2.5 text-[12px] font-semibold shadow-lg ${
            notice.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {notice.text}
        </div>
      ) : null}
    </div>
  )
}
