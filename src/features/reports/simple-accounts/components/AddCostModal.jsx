import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, PlusCircle } from 'lucide-react'
import ModalShell, { Field } from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/features/reports/lib/format'
import { todayISO } from '@/features/reports/lib/dates'

const input =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-primary/20'

export default function AddCostModal({ open, onOpenChange, sale, onSave }) {
  const [form, setForm] = useState({ amount: '', date: todayISO(), note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm({ amount: '', date: todayISO(), note: '' })
    setSaving(false)
    setError('')
  }, [open, sale])

  const numbers = useMemo(() => {
    const extra = Number(form.amount) || 0
    return {
      extra,
      newCost: (Number(sale?.cost) || 0) + extra,
      newProfit: (Number(sale?.sale) || 0) - ((Number(sale?.cost) || 0) + extra),
    }
  }, [form.amount, sale])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (numbers.extra <= 0) {
      setError('Enter the extra cost amount.')
      return
    }
    setSaving(true)
    try {
      await onSave({ amount: numbers.extra, date: form.date, note: form.note })
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not add this cost.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Add Cost"
      subtitle={sale ? `${sale.fileNo} — ${sale.partyName}` : 'Add another supplier cost to this sale'}
      icon={PlusCircle}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-11 px-5 text-base">
            Cancel
          </Button>
          <Button type="submit" form="cost-form" disabled={saving} className="h-11 gap-2 bg-[#2F80ED] px-6 text-base text-white">
            <PlusCircle className="size-5" />
            {saving ? 'Saving…' : 'Add Cost'}
          </Button>
        </>
      }
    >
      <form id="cost-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500">Selling Price</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{formatMoney(sale?.sale || 0)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-500">Cost Price Now</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{formatMoney(sale?.cost || 0)}</p>
          </div>
          <div className={`rounded-xl border p-3 ${numbers.newProfit >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
            <p className="text-xs font-semibold text-slate-500">New Profit</p>
            <p className={`mt-1 text-lg font-bold tabular-nums ${numbers.newProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatMoney(numbers.newProfit)}
            </p>
          </div>
        </div>

        <Field label="Extra Cost Amount" required>
          <input
            type="number"
            min="0"
            step="1"
            required
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            placeholder="0"
            className={`${input} text-right text-lg font-semibold`}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required>
            <input
              type="date"
              required
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              className={input}
            />
          </Field>
          <Field label="What is this cost for?">
            <input
              type="text"
              value={form.note}
              onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              placeholder="e.g. extra hotel night"
              className={input}
            />
          </Field>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Cost Price will become <strong className="text-slate-900">{formatMoney(numbers.newCost)}</strong> and Profit will become{' '}
          <strong className={numbers.newProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{formatMoney(numbers.newProfit)}</strong>.
        </div>

        {error ? (
          <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </form>
    </ModalShell>
  )
}
