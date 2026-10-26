import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, HandCoins, ReceiptText, Wallet } from 'lucide-react'
import ModalShell, { Field, inputClass, selectClass } from './ModalShell'
import PartySelect from './PartySelect'
import { Button } from '@/components/ui/button'
import { PAYMENT_METHODS } from '../accounting/coa'
import { todayISO } from '../accounting/dates'
import { formatMoney } from '../reports.api'

export default function PaymentModal({
  open,
  onOpenChange,
  mode = 'receipt',
  parties = [],
  files = [],
  balances = {},
  defaultPartyId = '',
  defaultFileId = '',
  onSave,
}) {
  const isReceipt = mode === 'receipt'
  const [form, setForm] = useState({
    date: todayISO(),
    partyId: '',
    fileId: '',
    amount: '',
    method: 'city',
    ref: '',
    narration: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({
        date: todayISO(),
        partyId: defaultPartyId || '',
        fileId: defaultFileId || '',
        amount: '',
        method: 'city',
        ref: '',
        narration: '',
      })
      setError('')
      setSaving(false)
    }
  }, [open, defaultPartyId, defaultFileId])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const partyFiles = useMemo(() => {
    if (!isReceipt || !form.partyId) return []
    return files.filter((file) => file.partyId === form.partyId && file.due > 0)
  }, [files, form.partyId, isReceipt])

  const selectedFile = files.find((file) => file.id === form.fileId)

  const balance = useMemo(() => {
    if (!form.partyId) return 0
    if (Number.isFinite(balances[form.partyId])) return balances[form.partyId]
    return files
      .filter((file) => file.partyId === form.partyId)
      .reduce((sum, file) => sum + (Number(file.due) || 0), 0)
  }, [balances, files, form.partyId])

  const remaining = Math.max(0, balance - (Number(form.amount) || 0))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    const amount = Math.round(Number(form.amount) || 0)
    if (!form.partyId) {
      setError(isReceipt ? 'Choose the client or agent.' : 'Choose the supplier.')
      return
    }
    if (amount <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    setSaving(true)
    try {
      await onSave({
        date: form.date,
        partyId: isReceipt ? form.partyId : undefined,
        vendorId: isReceipt ? undefined : form.partyId,
        fileId: isReceipt ? form.fileId || null : null,
        amount,
        method: form.method,
        ref: form.ref,
        narration: form.narration,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not save this payment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={isReceipt ? 'Receive payment' : 'Pay supplier'}
      subtitle={
        isReceipt
          ? 'Post a money receipt against a client or agent balance.'
          : 'Settle a supplier bill from cash or bank.'
      }
      icon={isReceipt ? ReceiptText : Wallet}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="payment-form"
            disabled={saving}
            className={`gap-1.5 text-white ${isReceipt ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary/90'}`}
          >
            {saving ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Posting…
              </>
            ) : (
              <>
                <HandCoins className="size-4" />
                {isReceipt ? 'Post receipt' : 'Post payment'}
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date" required>
            <input type="date" required value={form.date} onChange={set('date')} className={inputClass} />
          </Field>
          <Field label="Pay through">
            <select value={form.method} onChange={set('method')} className={selectClass}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={isReceipt ? 'Received from' : 'Paid to'} required>
          <PartySelect
            value={form.partyId}
            onChange={(value) => setForm((current) => ({ ...current, partyId: value, fileId: '' }))}
            parties={parties}
            types={isReceipt ? ['B2C', 'B2B'] : ['Vendor']}
            placeholder={isReceipt ? 'Select client or agent…' : 'Select supplier…'}
          />
        </Field>

        {isReceipt ? (
          <Field label="Apply to file (optional)" hint="Leave blank to keep the receipt on account.">
            <select value={form.fileId} onChange={set('fileId')} className={selectClass} disabled={!form.partyId}>
              <option value="">On account</option>
              {partyFiles.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.fileNo} · {file.destination} · due {formatMoney(file.due)}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount (BDT)" required>
            <input
              type="number"
              min="0"
              step="1"
              required
              value={form.amount}
              onChange={set('amount')}
              placeholder="0"
              className={`${inputClass} text-right tabular-nums`}
            />
          </Field>
          <Field label="Reference">
            <input
              type="text"
              value={form.ref}
              onChange={set('ref')}
              placeholder="Bank slip / cheque no."
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          {balance > 0 ? (
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, amount: String(balance) }))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            >
              Settle full {formatMoney(balance)}
            </button>
          ) : null}
          {selectedFile ? (
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, amount: String(selectedFile.due) }))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            >
              File due {formatMoney(selectedFile.due)}
            </button>
          ) : null}
        </div>

        <Field label="Narration">
          <input
            type="text"
            value={form.narration}
            onChange={set('narration')}
            placeholder={isReceipt ? 'e.g. Final payment for visa file' : 'e.g. Monthly airline settlement'}
            className={inputClass}
          />
        </Field>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="text-slate-500">Outstanding balance</span>
            <span className="font-bold tabular-nums text-slate-900">{formatMoney(balance)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11.5px]">
            <span className="text-slate-500">This payment</span>
            <span className="font-bold tabular-nums text-emerald-700">{formatMoney(form.amount || 0)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5 text-[11.5px]">
            <span className="text-slate-500">Balance after</span>
            <span className={`font-bold tabular-nums ${remaining > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatMoney(remaining)}
            </span>
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
