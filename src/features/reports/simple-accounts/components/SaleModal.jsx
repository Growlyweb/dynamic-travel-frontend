import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Save } from 'lucide-react'
import ModalShell, { Field } from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/features/reports/lib/format'
import { todayISO } from '@/features/reports/lib/dates'
import { PAY_METHODS } from '../simple.api'

const input =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2F80ED] focus:ring-2 focus:ring-primary/20'
const select = `${input} cursor-pointer`

const blank = () => ({
  date: todayISO(),
  clientType: 'B2C',
  agencyName: '',
  clientName: '',
  phone: '',
  category: 'Visa',
  selling: '',
  discount: '',
  cost: '',
  received: '',
  method: 'cash',
  note: '',
})

export default function SaleModal({ open, onOpenChange, sale, categories = [], priceList = [], onSave }) {
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isEdit = Boolean(sale?.id)

  useEffect(() => {
    if (!open) return
    setError('')
    setSaving(false)
    if (sale?.id) {
      setForm({
        date: sale.date,
        clientType: sale.partyType === 'B2B' ? 'B2B' : 'B2C',
        agencyName: sale.partyType === 'B2B' ? sale.partyName || '' : '',
        clientName: sale.applicant || sale.partyName || '',
        phone: sale.partyPhone || '',
        category: sale.category || 'Visa',
        selling: String(sale.sale || ''),
        discount: String(sale.discount || ''),
        cost: String(sale.cost || ''),
        received: String(sale.received || ''),
        method: 'cash',
        note: sale.notes || '',
      })
    } else {
      setForm(blank())
    }
  }, [open, sale])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const numbers = useMemo(() => {
    const selling = Number(form.selling) || 0
    const discount = Number(form.discount) || 0
    const cost = Number(form.cost) || 0
    const received = isEdit ? Number(sale?.received) || 0 : Number(form.received) || 0
    return {
      selling,
      discount,
      cost,
      profit: selling - discount - cost,
      received,
      due: Math.max(0, selling - discount - received),
    }
  }, [form.selling, form.discount, form.cost, form.received, isEdit, sale])

  const suggested = priceList.find((item) => item.label === form.category)

  const usePriceList = () => {
    if (!suggested) return
    const price = form.clientType === 'B2B' ? suggested.b2b : suggested.b2c
    setForm((current) => ({
      ...current,
      selling: String(price || ''),
      cost: String(suggested.cost || ''),
    }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.clientName.trim() && !form.agencyName.trim()) {
      setError(form.clientType === 'B2B' ? 'Enter the agency name.' : 'Enter the client name.')
      return
    }
    if (!form.category.trim()) {
      setError('Choose or type a category.')
      return
    }
    if (numbers.selling <= 0) {
      setError('Selling price must be greater than zero.')
      return
    }
    if (numbers.discount > numbers.selling) {
      setError('The discount cannot be more than the selling price.')
      return
    }
    if (!isEdit && numbers.received > numbers.selling - numbers.discount) {
      setError('Received cannot be more than the amount to pay.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        ...form,
        selling: numbers.selling,
        discount: numbers.discount,
        cost: numbers.cost,
        received: isEdit ? undefined : numbers.received,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not save this sale.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit Sale ${sale?.fileNo || ''}` : 'New Sale'}
      subtitle="Only the money details your client understands."
      icon={Save}
      maxWidth="max-w-3xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-11 px-5 text-base">
            Cancel
          </Button>
          <Button type="submit" form="sale-form" disabled={saving} className="h-11 gap-2 bg-[#2F80ED] px-6 text-base text-white">
            <Save className="size-5" />
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Sale'}
          </Button>
        </>
      }
    >
      <form id="sale-form" onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required>
            <input type="date" required value={form.date} onChange={set('date')} className={input} />
          </Field>
          <Field label="Client Type" required>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'B2C', label: 'B2C Customer' },
                { value: 'B2B', label: 'B2B Agent' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, clientType: option.value }))}
                  className={`h-11 rounded-lg border text-sm font-semibold transition ${
                    form.clientType === option.value
                      ? 'border-[#2F80ED] bg-[#2F80ED] text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {form.clientType === 'B2B' ? (
            <Field label="Agency Name" required>
              <input
                type="text"
                value={form.agencyName}
                onChange={set('agencyName')}
                placeholder="e.g. ABC Travels"
                className={input}
              />
            </Field>
          ) : null}
          <Field label={form.clientType === 'B2B' ? 'Client / Passenger Name' : 'Client Name'} required>
            <input
              type="text"
              value={form.clientName}
              onChange={set('clientName')}
              placeholder="Full name"
              className={input}
            />
          </Field>
          <Field label="Phone">
            <input type="text" value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" className={input} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" required hint="Type a new name to create a new category.">
            <input
              type="text"
              list="sale-categories"
              value={form.category}
              onChange={set('category')}
              placeholder="Visa, Tour Package…"
              className={input}
            />
            <datalist id="sale-categories">
              {[...new Set(categories.map((item) => item.label))].map(
                (label) => (
                  <option key={label} value={label} />
                )
              )}
            </datalist>
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={usePriceList}
              disabled={!suggested}
              className="h-11 w-full rounded-lg border border-[#2F80ED]/30 bg-[#E6F2FD] px-4 text-sm font-semibold text-[#2F80ED] transition hover:bg-[#dbeafc] disabled:opacity-40"
            >
              Use Price List {suggested ? `(${form.clientType === 'B2B' ? 'B2B' : 'B2C'})` : ''}
            </button>
          </div>
        </div>

        {suggested ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Price List for <strong>{form.category}</strong> — B2B {formatMoney(suggested.b2b)} · B2C{' '}
            {formatMoney(suggested.b2c)} · Cost {formatMoney(suggested.cost)}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Selling Price (what client pays)" required>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={form.selling}
              onChange={set('selling')}
              placeholder="0"
              className={`${input} text-right text-lg font-semibold`}
            />
          </Field>
          <Field label="Discount (optional)">
            <input
              type="number"
              min="0"
              step="1"
              value={form.discount}
              onChange={set('discount')}
              placeholder="0"
              className={`${input} text-right text-lg font-semibold`}
            />
          </Field>
          <Field label="Cost Price (what we pay supplier)" required>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={form.cost}
              onChange={set('cost')}
              placeholder="0"
              className={`${input} text-right text-lg font-semibold`}
            />
          </Field>
        </div>

        {!isEdit ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Money Received Now">
              <input
                type="number"
                min="0"
                step="1"
                value={form.received}
                onChange={set('received')}
                placeholder="0"
                className={`${input} text-right`}
              />
            </Field>
            <Field label="Put Money In">
              <select value={form.method} onChange={set('method')} className={select}>
                {PAY_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Received so far: <strong className="text-slate-900">{formatMoney(numbers.received)}</strong>. Use{' '}
            <strong>Money Receipt</strong> from the Sales list to add money later.
          </div>
        )}

        <Field label="Note">
          <input type="text" value={form.note} onChange={set('note')} placeholder="Optional note" className={input} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Profit</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{formatMoney(numbers.profit)}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-[#E6F2FD] p-4">
            <p className="text-sm font-semibold text-[#2F80ED]">Due</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-[#2F80ED]">{formatMoney(numbers.due)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-600">Received</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{formatMoney(numbers.received)}</p>
          </div>
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
