import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, BookOpenCheck, CheckCircle2, Plus, Scale, Trash2 } from 'lucide-react'
import ModalShell, { Field, inputClass, selectClass } from './ModalShell'
import AccountSelect from './AccountSelect'
import PartySelect from './PartySelect'
import { Button } from '@/components/ui/button'
import { SEGMENTS, VOUCHER_TYPE_OPTIONS } from '../accounting/coa'
import { todayISO } from '../accounting/dates'
import { formatMoney } from '../reports.api'

const emptyLine = () => ({ account: '', memo: '', debit: '', credit: '' })

const initialState = () => ({
  date: todayISO(),
  type: 'JV',
  segment: '',
  partyId: '',
  fileId: '',
  narration: '',
  ref: '',
  lines: [emptyLine(), emptyLine()],
})

export default function VoucherModal({ open, onOpenChange, accounts = [], parties = [], files = [], onSave }) {
  const [form, setForm] = useState(initialState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(initialState())
      setError('')
      setSaving(false)
    }
  }, [open])

  const totals = useMemo(() => {
    const debit = form.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
    const credit = form.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
    return { debit, credit, difference: debit - credit, balanced: debit > 0 && debit === credit }
  }, [form.lines])

  const fileOptions = useMemo(
    () => [...files].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 300),
    [files]
  )

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const updateLine = (index, patch) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line
      ),
    }))
  }

  const addLine = () => setForm((current) => ({ ...current, lines: [...current.lines, emptyLine()] }))

  const removeLine = (index) => {
    setForm((current) => ({
      ...current,
      lines: current.lines.length > 2 ? current.lines.filter((_, i) => i !== index) : current.lines,
    }))
  }

  const balanceWith = (account) => {
    const difference = totals.debit - totals.credit
    if (difference === 0) return
    const line = {
      account,
      memo: 'Balancing amount',
      debit: difference < 0 ? Math.abs(difference) : '',
      credit: difference > 0 ? difference : '',
    }
    setForm((current) => ({ ...current, lines: [...current.lines, line] }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!totals.balanced) {
      setError('Debit and credit totals must match before posting.')
      return
    }
    const preparedLines = form.lines
      .filter((line) => line.account && (Number(line.debit) > 0 || Number(line.credit) > 0))
      .map((line) => ({
        account: line.account,
        memo: line.memo,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      }))
    if (preparedLines.length < 2) {
      setError('Add at least two lines with an account and an amount.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        date: form.date,
        type: form.type,
        segment: form.segment || null,
        partyId: form.partyId || null,
        fileId: form.fileId || null,
        narration: form.narration,
        ref: form.ref,
        lines: preparedLines,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not post this voucher.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="New journal voucher"
      subtitle="Double-entry voucher — debits and credits must agree before posting."
      icon={BookOpenCheck}
      maxWidth="max-w-5xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="voucher-form"
            disabled={saving || !totals.balanced}
            className="gap-1.5 bg-primary text-white hover:bg-primary/90"
          >
            {saving ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Posting…
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Post voucher
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="voucher-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Voucher date" required>
            <input type="date" required value={form.date} onChange={set('date')} className={inputClass} />
          </Field>
          <Field label="Voucher type">
            <select value={form.type} onChange={set('type')} className={selectClass}>
              {VOUCHER_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service segment">
            <select value={form.segment} onChange={set('segment')} className={selectClass}>
              <option value="">General / no segment</option>
              {SEGMENTS.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Narration" required>
            <input
              type="text"
              required
              placeholder="e.g. Embassy fee paid for VF-2026-0124"
              value={form.narration}
              onChange={set('narration')}
              className={inputClass}
            />
          </Field>
          <Field label="Reference / document no.">
            <input
              type="text"
              placeholder="e.g. bank slip, file no."
              value={form.ref}
              onChange={set('ref')}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Party (for receivable / payable lines)">
            <PartySelect
              value={form.partyId}
              onChange={(value) => setForm((current) => ({ ...current, partyId: value }))}
              parties={parties}
              types={['B2C', 'B2B', 'Vendor']}
              placeholder="No party — general entry"
            />
          </Field>
          <Field label="Linked service file">
            <select value={form.fileId} onChange={set('fileId')} className={selectClass}>
              <option value="">No linked file</option>
              {fileOptions.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.fileNo} — {file.applicant} ({file.type})
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Voucher lines
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => balanceWith('1020')}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Balance with bank
              </button>
              <button
                type="button"
                onClick={() => balanceWith('1010')}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cash
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {form.lines.map((line, index) => (
              <div key={index} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                <div className="col-span-12 sm:col-span-4">
                  <AccountSelect
                    value={line.account}
                    onChange={(value) => updateLine(index, { account: value })}
                    accounts={accounts}
                    placeholder={`Line ${index + 1} account`}
                  />
                </div>
                <div className="col-span-12 sm:col-span-3">
                  <input
                    type="text"
                    value={line.memo}
                    onChange={(event) => updateLine(index, { memo: event.target.value })}
                    placeholder="Particulars"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={line.debit}
                    onChange={(event) =>
                      updateLine(index, { debit: event.target.value, credit: event.target.value ? '' : line.credit })
                    }
                    placeholder="Debit"
                    className={`${inputClass} text-right tabular-nums`}
                  />
                </div>
                <div className="col-span-5 sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={line.credit}
                    onChange={(event) =>
                      updateLine(index, { credit: event.target.value, debit: event.target.value ? '' : line.debit })
                    }
                    placeholder="Credit"
                    className={`${inputClass} text-right tabular-nums`}
                  />
                </div>
                <div className="col-span-2 flex justify-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeLine(index)}
                    disabled={form.lines.length <= 2}
                    className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-primary hover:text-primary"
            >
              <Plus className="size-3.5" />
              Add line
            </button>
            <div className="flex flex-wrap items-center gap-4 text-[11.5px]">
              <span className="text-slate-500">
                Debit <strong className="ml-1 tabular-nums text-slate-900">{formatMoney(totals.debit)}</strong>
              </span>
              <span className="text-slate-500">
                Credit <strong className="ml-1 tabular-nums text-slate-900">{formatMoney(totals.credit)}</strong>
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-bold ${
                  totals.balanced
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {totals.balanced ? <CheckCircle2 className="size-3.5" /> : <Scale className="size-3.5" />}
                {totals.balanced ? 'Balanced' : `Difference ${formatMoney(Math.abs(totals.difference))}`}
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <p className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-medium text-rose-700">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}
      </form>
    </ModalShell>
  )
}
