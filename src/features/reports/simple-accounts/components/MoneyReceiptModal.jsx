import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, HandCoins } from 'lucide-react'
import ModalShell, { Field } from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/features/reports/reports.api'
import { todayISO } from '@/features/reports/accounting/dates'
import { PAY_METHODS } from '../simple.api'

const input =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2F80ED] focus:ring-2 focus:ring-primary/20'
const select = `${input} cursor-pointer`

export default function MoneyReceiptModal({ open, onOpenChange, sale, sales = [], onSave }) {
  const [form, setForm] = useState({
    invoiceId: '',
    amount: '',
    discount: '',
    method: 'cash',
    date: todayISO(),
    receiptNo: '',
    note: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm({
      invoiceId: sale?.id || '',
      amount: '',
      discount: '',
      method: 'cash',
      date: todayISO(),
      receiptNo: '',
      note: '',
    })
    setError('')
    setSaving(false)
  }, [open, sale])

  const selected = sale || sales.find((item) => item.id === form.invoiceId)
  const selling = Number(selected?.sale) || 0
  const received = Number(selected?.received) || 0
  const dueNow = Number(selected?.due) || 0
  const amount = Number(form.amount) || 0
  const discount = Number(form.discount) || 0
  const dueAfter = Math.max(0, dueNow - amount - discount)
  const over = amount + discount > dueNow + 0.5

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const options = useMemo(
    () => (sale ? [] : sales.filter((item) => item.due > 0)),
    [sale, sales]
  )

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!selected) {
      setError('Choose the sale that received the money.')
      return
    }
    if (amount + discount <= 0) {
      setError('Enter the amount received or a discount.')
      return
    }
    if (over) {
      setError(`Amount + discount cannot be more than the due of ${formatMoney(dueNow)}.`)
      return
    }
    setSaving(true)
    try {
      await onSave({
        invoiceId: selected.id,
        amount,
        discount,
        method: form.method,
        date: form.date,
        receiptNo: form.receiptNo,
        note: form.note,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not save this receipt.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Money Receipt"
      subtitle="Record money received from a client and update the due."
      icon={HandCoins}
      maxWidth="max-w-2xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-11 px-5 text-base">
            Cancel
          </Button>
          <Button
            type="submit"
            form="receipt-form"
            disabled={saving || over}
            className="h-11 gap-2 bg-[#2F80ED] px-6 text-base text-white"
          >
            <HandCoins className="size-5" />
            {saving ? 'Saving…' : 'Save Receipt'}
          </Button>
        </>
      }
    >
      <form id="receipt-form" onSubmit={submit} className="space-y-4">
        {!sale ? (
          <Field label="Which sale received the money?" required>
            <select value={form.invoiceId} onChange={set('invoiceId')} className={select}>
              <option value="">Choose a sale with due…</option>
              {options.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fileNo} — {item.partyName} — due {formatMoney(item.due)}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-500">Sale</p>
            <p className="text-lg font-bold text-slate-900">
              {sale.fileNo} — {sale.partyName}
            </p>
            <p className="text-sm text-slate-500">
              {sale.category} · {sale.date}
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold text-slate-500">Selling Price</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{formatMoney(selling)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold text-slate-500">Already Received</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-700">{formatMoney(received)}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-[#E6F2FD] p-3">
            <p className="text-xs font-semibold text-[#2F80ED]">Due Now</p>
            <p className="mt-1 text-lg font-bold tabular-nums text-[#2F80ED]">{formatMoney(dueNow)}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Money Received Now" required>
            <input
              type="number"
              min="0"
              step="1"
              value={form.amount}
              onChange={set('amount')}
              placeholder="0"
              className={`${input} text-right text-lg font-semibold`}
            />
          </Field>
          <Field label="Discount (if any)">
            <input
              type="number"
              min="0"
              step="1"
              value={form.discount}
              onChange={set('discount')}
              placeholder="0"
              className={`${input} text-right`}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setForm((current) => ({ ...current, amount: String(dueNow), discount: '' }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Pay Full Due
          </button>
          <button
            type="button"
            onClick={() => setForm((current) => ({ ...current, discount: '', amount: '' }))}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            Clear
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Put Money In" required>
            <select value={form.method} onChange={set('method')} className={select}>
              {PAY_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" required>
            <input type="date" required value={form.date} onChange={set('date')} className={input} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Receipt No." hint="Leave blank to generate automatically.">
            <input
              type="text"
              value={form.receiptNo}
              onChange={set('receiptNo')}
              placeholder="Auto"
              className={input}
            />
          </Field>
          <Field label="Note">
            <input type="text" value={form.note} onChange={set('note')} placeholder="Optional note" className={input} />
          </Field>
        </div>

        <div className={`rounded-xl border p-4 ${dueAfter === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-blue-200 bg-[#E6F2FD]'}`}>
          <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>Due now</span>
            <span>{formatMoney(dueNow)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm font-semibold text-slate-600">
            <span>This receipt</span>
            <span>{formatMoney(amount + discount)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
            <span className="text-base font-bold text-slate-800">Due after this receipt</span>
            <span className={`text-2xl font-bold tabular-nums ${dueAfter === 0 ? 'text-emerald-700' : 'text-[#2F80ED]'}`}>
              {formatMoney(dueAfter)}
            </span>
          </div>
          {dueAfter === 0 ? <p className="mt-1 text-sm font-semibold text-emerald-700">Marked as Paid</p> : null}
        </div>

        {error || over ? (
          <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error || `Amount + discount cannot be more than the due of ${formatMoney(dueNow)}.`}
          </p>
        ) : null}
      </form>
    </ModalShell>
  )
}
