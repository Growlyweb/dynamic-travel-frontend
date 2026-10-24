import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  FilePlus2,
  Plane,
  Plus,
  RefreshCw,
  Stamp,
  Trash2,
  UserRound,
} from 'lucide-react'
import ModalShell, { Field, inputClass, selectClass } from './ModalShell'
import AccountSelect from './AccountSelect'
import PartySelect from './PartySelect'
import { Button } from '@/components/ui/button'
import {
  DESTINATIONS,
  FILE_TYPES,
  FILE_TYPE_LIST,
  PAYMENT_METHODS,
  buildCostLines,
} from '../accounting/coa'
import { todayISO } from '../accounting/dates'
import { formatMoney, formatPct } from '../reports.api'

const FIELD_ICONS = { Visa: Stamp, Tour: Plane, 'Air Ticket': Plane, Hotel: Plane, Transport: Plane }

const sectionLabel = (text) => (
  <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-slate-400">{text}</p>
)

function destinationInfo(type, destination) {
  const meta = FILE_TYPES[type]
  const list = DESTINATIONS[meta.segment] || []
  return list.find((entry) => entry.name === destination) || list[0]
}

function blankForm(type = 'Visa') {
  const meta = FILE_TYPES[type]
  const first = DESTINATIONS[meta.segment][0]
  return {
    type,
    date: todayISO(),
    status: 'Processing',
    partyId: '',
    clientMode: 'existing',
    clientName: '',
    clientPhone: '',
    clientType: 'B2C',
    applicant: '',
    passportNo: '',
    destination: first.name,
    detail: first.detail,
    pax: 1,
    sale: first.b2c,
    costs: buildCostLines(type, first.name, first.cost),
    travelDate: '',
    notes: '',
    deposit: '',
    depositMethod: 'city',
  }
}

export default function FileModal({ open, onOpenChange, parties = [], accounts = [], onSave }) {
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm(blankForm())
      setError('')
      setSaving(false)
    }
  }, [open])

  const isB2B =
    form.clientMode === 'new'
      ? form.clientType === 'B2B'
      : parties.find((party) => party.id === form.partyId)?.type === 'B2B'

  const selectedParty = parties.find((party) => party.id === form.partyId)
  const info = destinationInfo(form.type, form.destination)
  const destinations = DESTINATIONS[FILE_TYPES[form.type].segment] || []

  const costsTotal = useMemo(
    () => form.costs.reduce((sum, line) => sum + (Number(line.amount) || 0), 0),
    [form.costs]
  )
  const saleValue = Number(form.sale) || 0
  const profit = saleValue - costsTotal
  const margin = saleValue > 0 ? (profit / saleValue) * 100 : 0
  const depositValue = Number(form.deposit) || 0

  const reprice = (next) => {
    const nextInfo = destinationInfo(next.type, next.destination)
    const b2b =
      next.clientMode === 'new'
        ? next.clientType === 'B2B'
        : parties.find((party) => party.id === next.partyId)?.type === 'B2B'
    const pax = Math.max(1, Number(next.pax) || 1)
    return {
      ...next,
      detail: nextInfo.detail,
      sale: (b2b ? nextInfo.b2b : nextInfo.b2c) * pax,
      costs: buildCostLines(next.type, nextInfo.name, nextInfo.cost * pax),
    }
  }

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const changeType = (type) => {
    if (type === form.type) return
    const fresh = { ...blankForm(type), date: form.date, partyId: form.partyId, clientMode: form.clientMode }
    setForm(reprice(fresh))
  }

  const changeDestination = (destination) => {
    setForm((current) => reprice({ ...current, destination }))
  }

  const changePax = (value) => {
    setForm((current) => reprice({ ...current, pax: Math.max(1, Number(value) || 1) }))
  }

  const changeParty = (partyId) => {
    const party = parties.find((row) => row.id === partyId)
    setForm((current) =>
      reprice({
        ...current,
        partyId,
        applicant: party && current.clientMode === 'existing' ? party.name : current.applicant,
      })
    )
  }

  const changeClientType = (clientType) => {
    setForm((current) => reprice({ ...current, clientType }))
  }

  const updateCost = (index, patch) => {
    setForm((current) => ({
      ...current,
      costs: current.costs.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    }))
  }

  const addCost = () => {
    setForm((current) => ({
      ...current,
      costs: [...current.costs, { account: '', label: 'Additional cost', amount: '', paidVia: 'credit' }],
    }))
  }

  const removeCost = (index) => {
    setForm((current) => ({ ...current, costs: current.costs.filter((_, i) => i !== index) }))
  }

  const resetRate = () => {
    setForm((current) => reprice(current))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.clientMode === 'existing' && !form.partyId) {
      setError('Choose the client or agent for this file.')
      return
    }
    if (form.clientMode === 'new' && !form.clientName.trim()) {
      setError('Enter the new client name.')
      return
    }
    if (saleValue <= 0) {
      setError('Enter a sale value greater than zero.')
      return
    }
    const invalidCost = form.costs.some(
      (line) => (Number(line.amount) || 0) > 0 && !line.account
    )
    if (invalidCost) {
      setError('Every cost line with an amount needs an expense account.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        type: form.type,
        date: form.date,
        status: form.status,
        partyId: form.clientMode === 'existing' ? form.partyId : null,
        clientName: form.clientMode === 'new' ? form.clientName : '',
        clientPhone: form.clientMode === 'new' ? form.clientPhone : '',
        clientType: form.clientMode === 'new' ? form.clientType : undefined,
        applicant: form.applicant || selectedParty?.name || form.clientName,
        passportNo: form.passportNo,
        destination: form.destination,
        detail: form.detail,
        pax: form.pax,
        sale: saleValue,
        costs: form.costs
          .filter((line) => Number(line.amount) > 0)
          .map((line) => ({
            account: line.account,
            label: line.label,
            amount: Number(line.amount),
            paidVia: line.paidVia,
          })),
        travelDate: form.travelDate,
        notes: form.notes,
        deposit: depositValue,
        depositMethod: form.depositMethod,
        depositDate: form.date,
      })
      onOpenChange(false)
    } catch (err) {
      setError(err?.message || 'Could not create this file.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title="Open a service file"
      subtitle="Invoice the client and book supplier costs in one double-entry posting."
      icon={FilePlus2}
      maxWidth="max-w-5xl"
      footer={
        <>
          <div className="mr-auto hidden items-center gap-2 text-[11px] text-slate-500 sm:flex">
            <span>Gross profit</span>
            <strong className={profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}>{formatMoney(profit)}</strong>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">{formatPct(margin)}</span>
          </div>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="file-form"
            disabled={saving}
            className="gap-1.5 bg-primary text-white hover:bg-primary/90"
          >
            {saving ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Posting…
              </>
            ) : (
              <>
                <FilePlus2 className="size-4" />
                Post file
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="file-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-wrap gap-1.5">
          {FILE_TYPE_LIST.map((type) => {
            const Icon = FIELD_ICONS[type]
            const active = form.type === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => changeType(type)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11.5px] font-semibold transition ${
                  active
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="size-3.5" />
                {type}
              </button>
            )
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-200 p-3.5">
            {sectionLabel('Client & applicant')}
            <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
              {[
                { value: 'existing', label: 'Existing client' },
                { value: 'new', label: 'New client' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, clientMode: option.value }))}
                  className={`flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition ${
                    form.clientMode === option.value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {form.clientMode === 'existing' ? (
              <Field label="Client / agent" required>
                <PartySelect
                  value={form.partyId}
                  onChange={changeParty}
                  parties={parties}
                  types={['B2C', 'B2B']}
                  placeholder="Select client or agent…"
                />
              </Field>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Client name" required className="sm:col-span-2">
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={set('clientName')}
                    placeholder="Full name"
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone">
                  <input type="text" value={form.clientPhone} onChange={set('clientPhone')} className={inputClass} />
                </Field>
                <Field label="Client type">
                  <select value={form.clientType} onChange={(event) => changeClientType(event.target.value)} className={selectClass}>
                    <option value="B2C">B2C — retail</option>
                    <option value="B2B">B2B — agent</option>
                  </select>
                </Field>
              </div>
            )}

            <Field label="Applicant / passenger" hint="Defaults to the client name when left blank.">
              <input
                type="text"
                value={form.applicant}
                onChange={set('applicant')}
                placeholder={selectedParty?.name || form.clientName || 'Passenger name'}
                className={inputClass}
              />
            </Field>

            {form.type === 'Visa' ? (
              <Field label="Passport number">
                <input
                  type="text"
                  value={form.passportNo}
                  onChange={set('passportNo')}
                  placeholder="e.g. BX0123456"
                  className={inputClass}
                />
              </Field>
            ) : null}
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 p-3.5">
            {sectionLabel('Service & file details')}
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="File date" required>
                <input type="date" required value={form.date} max={todayISO()} onChange={set('date')} className={inputClass} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={set('status')} className={selectClass}>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                </select>
              </Field>
            </div>

            <Field label={form.type === 'Visa' ? 'Destination / embassy' : FILE_TYPES[form.type].detailLabel}>
              <select value={form.destination} onChange={(event) => changeDestination(event.target.value)} className={selectClass}>
                {destinations.map((entry) => (
                  <option key={entry.name} value={entry.name}>
                    {entry.name} — {entry.detail}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Travellers / pax">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.pax}
                  onChange={(event) => changePax(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Travel date">
                <input type="date" value={form.travelDate} onChange={set('travelDate')} className={inputClass} />
              </Field>
            </div>

            <Field label="Internal notes">
              <input type="text" value={form.notes} onChange={set('notes')} placeholder="Optional" className={inputClass} />
            </Field>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {sectionLabel('Pricing & service costs')}
            <button
              type="button"
              onClick={resetRate}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="size-3" />
              Reset to rate card
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Sale value (BDT)" required>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.sale}
                onChange={set('sale')}
                className={`${inputClass} text-right font-semibold tabular-nums`}
              />
            </Field>
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Rate card</p>
              <p className="mt-0.5 text-[11.5px] font-semibold text-slate-700">
                {formatMoney(isB2B ? info.b2b : info.b2c)} / pax
              </p>
              <p className="text-[10px] text-slate-400">
                {isB2B ? 'Wholesale agent' : 'Retail'} · cost {formatMoney(info.cost)}
              </p>
            </div>
            <div
              className={`rounded-lg border px-3 py-2 ${
                profit >= 0 ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Gross profit</p>
              <p className={`mt-0.5 text-[13px] font-bold tabular-nums ${profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatMoney(profit)}
                <span className="ml-1 text-[10.5px] font-semibold opacity-80">{formatPct(margin)}</span>
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Supplier / direct costs</span>
              <button
                type="button"
                onClick={addCost}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-slate-300 bg-white px-2 py-1 text-[10.5px] font-semibold text-slate-600 hover:border-primary hover:text-primary"
              >
                <Plus className="size-3" />
                Add line
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {form.costs.map((line, index) => (
                <div key={index} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                  <div className="col-span-12 sm:col-span-3">
                    <AccountSelect
                      value={line.account}
                      onChange={(value) => updateCost(index, { account: value })}
                      accounts={accounts}
                      allowedTypes={['Expense']}
                      placeholder="Expense account"
                    />
                  </div>
                  <div className="col-span-7 sm:col-span-4">
                    <input
                      type="text"
                      value={line.label}
                      onChange={(event) => updateCost(index, { label: event.target.value })}
                      placeholder="Cost description"
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-5 sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={line.amount}
                      onChange={(event) => updateCost(index, { amount: event.target.value })}
                      className={`${inputClass} text-right tabular-nums`}
                    />
                  </div>
                  <div className="col-span-9 sm:col-span-2">
                    <select
                      value={line.paidVia}
                      onChange={(event) => updateCost(index, { paidVia: event.target.value })}
                      className={selectClass}
                      title="How this cost is settled"
                    >
                      <option value="credit">On credit</option>
                      <option value="bank">Bank</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                  <div className="col-span-3 flex justify-end sm:col-span-1">
                    <button
                      type="button"
                      onClick={() => removeCost(index)}
                      className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove cost line"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-3 py-2 text-[11.5px]">
              <span className="text-slate-500">Total direct cost</span>
              <strong className="tabular-nums text-slate-900">{formatMoney(costsTotal)}</strong>
            </div>
          </div>
        </div>

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 sm:grid-cols-3">
          <Field label="Advance received (BDT)">
            <input
              type="number"
              min="0"
              step="1"
              value={form.deposit}
              onChange={set('deposit')}
              placeholder="0"
              className={`${inputClass} text-right tabular-nums`}
            />
          </Field>
          <Field label="Received through">
            <select value={form.depositMethod} onChange={set('depositMethod')} className={selectClass}>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-col justify-end">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Balance due</p>
            <p className={`text-[15px] font-bold tabular-nums ${saleValue - depositValue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatMoney(Math.max(0, saleValue - depositValue))}
            </p>
          </div>
        </div>

        {error ? (
          <p className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11.5px] font-medium text-rose-700">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </p>
        ) : null}

        {!form.partyId && form.clientMode === 'existing' ? (
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <UserRound className="size-3.5" />
            Pick a client above to use their contracted B2B or retail price.
          </p>
        ) : null}
      </form>
    </ModalShell>
  )
}
