import { useEffect, useState } from 'react'
import { AlertCircle, Handshake } from 'lucide-react'
import ModalShell, { Field } from '@/features/reports/components/ModalShell'
import { Button } from '@/components/ui/button'
import { todayISO } from '@/features/reports/lib/dates'
import { PAY_METHODS } from '../simple.api'

const input =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-[#2F80ED] focus:ring-2 focus:ring-primary/20'
const select = `${input} cursor-pointer`

export default function PartnerModal({ open, onOpenChange, partner = 'A', direction = 'in', onSave }) {
  const [form, setForm] = useState({
    partner: 'A',
    direction: 'in',
    amount: '',
    date: todayISO(),
    method: 'city',
    note: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm({ partner, direction, amount: '', date: todayISO(), method: 'city', note: '' })
    setSaving(false)
    setError('')
  }, [open, partner, direction])

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if ((Number(form.amount) || 0) <= 0) {
      setError('Enter the amount.')
      return
    }
    setSaving(true)
    try {
      await onSave({ ...form, amount: Number(form.amount) })
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not save this partner entry.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={form.direction === 'out' ? 'Money Out for Partner' : 'Money In from Partner'}
      subtitle="Track capital put in or money taken out by a partner."
      icon={Handshake}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving} className="h-11 px-5 text-base">
            Cancel
          </Button>
          <Button type="submit" form="partner-form" disabled={saving} className="h-11 gap-2 bg-[#2F80ED] px-6 text-base text-white">
            <Handshake className="size-5" />
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </>
      }
    >
      <form id="partner-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Partner" required>
            <select
              value={form.partner}
              onChange={(event) => setForm((current) => ({ ...current, partner: event.target.value }))}
              className={select}
            >
              <option value="A">Partner A</option>
              <option value="B">Partner B</option>
            </select>
          </Field>
          <Field label="Type" required>
            <select
              value={form.direction}
              onChange={(event) => setForm((current) => ({ ...current, direction: event.target.value }))}
              className={select}
            >
              <option value="in">Money In</option>
              <option value="out">Money Out</option>
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Amount" required>
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
          <Field label="Date" required>
            <input
              type="date"
              required
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              className={input}
            />
          </Field>
        </div>
        <Field label={form.direction === 'out' ? 'Paid From' : 'Money In To'} required>
          <select
            value={form.method}
            onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
            className={select}
          >
            {PAY_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Note">
          <input
            type="text"
            value={form.note}
            onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
            placeholder="e.g. additional capital"
            className={input}
          />
        </Field>
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
