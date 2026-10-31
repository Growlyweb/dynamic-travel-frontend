import { useState } from 'react'
import { ArrowUpRight, Ban, PlusCircle, Receipt, Wallet } from 'lucide-react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import Badge from '../../../components/common/Badge'
import { visaApi, PAYMENT_METHODS, PAYMENT_STATUS_TONES } from '../visa.api'
import { usePermission } from '../../../hooks/usePermission'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage, fieldErrors } from '../../../utils/errors'
import { formatCurrency, formatDate } from '../../../utils/formatters'

const today = () => new Date().toISOString().slice(0, 10)

// The money of one file: what it costs, what was received, what is due, and every payment. A payment is never deleted,
// it is voided with a reason, so the history stays.
export default function ApplicationPayments({ application, onChanged, onOpenAccounts }) {
  const { can } = usePermission()
  const account = application.account || {}
  const currency = application.price?.currency ?? 'BDT'
  const payments = [...(application.payments ?? [])].sort((a, b) => new Date(b.date) - new Date(a.date))

  const [receiving, setReceiving] = useState(false)
  const [voiding, setVoiding] = useState(null)
  const [form, setForm] = useState({ amount: '', method: PAYMENT_METHODS[0], date: today(), note: '' })
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [errors, setErrors] = useState({})

  function openReceive() {
    setForm({ amount: account.dueAmount > 0 ? String(account.dueAmount) : '', method: account.paymentMethod || PAYMENT_METHODS[0], date: today(), note: '' })
    setError(null)
    setErrors({})
    setReceiving(true)
  }

  async function receive() {
    const amount = Number(form.amount)
    if (!(amount > 0)) {
      setErrors({ amount: 'Enter the amount received.' })
      return
    }
    setSaving(true)
    setError(null)
    try {
      await visaApi.addPayment(application.id, { amount, method: form.method, date: form.date || undefined, note: form.note.trim() })
      setReceiving(false)
      await onChanged('Payment recorded.')
    } catch (failure) {
      setErrors(fieldErrors(failure))
      setError(errorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  async function voidIt() {
    if (!reason.trim()) {
      setError('Write the reason.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await visaApi.voidPayment(application.id, voiding.id, reason.trim())
      setVoiding(null)
      setReason('')
      await onChanged('Payment voided.')
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  const activePayments = payments.filter((p) => !p.voided)

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Wallet className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">Payment & Invoicing</h3>
              <Badge tone={PAYMENT_STATUS_TONES[account.paymentStatus] ?? 'neutral'}>
                {account.paymentStatus}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">Track total charges, advance received, and dues</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {can(PERMISSIONS.VISA_EDIT) && account.dueAmount > 0 ? (
            <Button size="sm" onClick={openReceive} className="h-9 gap-1.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs">
              <PlusCircle className="size-4" />
              Receive payment
            </Button>
          ) : null}
          {can(PERMISSIONS.REPORTS_VIEW) ? (
            <Button size="sm" variant="ghost" onClick={onOpenAccounts} className="h-9 gap-1.5 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50">
              <ArrowUpRight className="size-4" />
              Open in Accounts
            </Button>
          ) : null}
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {application.serviceType === 'visa' ? 'Price list' : 'Total'}
          </p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">
            {formatCurrency(account.totalAmount, currency)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">Agreed price</p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Discount</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-slate-700">
            {formatCurrency(account.discountAmount, currency)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {account.discountAmount > 0 ? 'Applied rebate' : 'No discount'}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">To pay (Net)</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-blue-950">
            {formatCurrency(account.netAmount, currency)}
          </p>
          <p className="mt-0.5 text-[11px] text-blue-600/80">Total payable</p>
        </div>

        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Received</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-emerald-800">
            {formatCurrency(account.advancePaid, currency)}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-600/80">
            {activePayments.length} payment{activePayments.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className={`rounded-xl border p-3.5 ${
          account.dueAmount > 0
            ? 'border-rose-200/90 bg-rose-50/50'
            : 'border-emerald-200/80 bg-emerald-50/40'
        }`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${
            account.dueAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {account.dueAmount > 0 ? 'Due' : 'Due'}
          </p>
          <p className={`mt-1 text-lg font-bold tabular-nums ${
            account.dueAmount > 0 ? 'text-rose-700' : 'text-emerald-800'
          }`}>
            {formatCurrency(account.dueAmount, currency)}
          </p>
          <p className={`mt-0.5 text-[11px] font-medium ${
            account.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}>
            {account.dueAmount > 0 ? 'Outstanding balance' : 'Cleared in full'}
          </p>
        </div>
      </div>

      {account.totalOverrideReason ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3.5 py-2 text-xs text-amber-900">
          <strong>Why the total differs:</strong> {account.totalOverrideReason}
        </div>
      ) : null}

      {/* Payment Transactions List */}
      <div className="pt-1">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Payment Transactions</h4>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {payments.length}
            </span>
          </div>
        </div>

        {payments.length > 0 ? (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/30 overflow-hidden">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors ${
                  payment.voided ? 'bg-slate-50/70 opacity-60' : 'hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    payment.voided ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {payment.voided ? <Ban className="size-4" /> : <Receipt className="size-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-base font-bold tabular-nums ${payment.voided ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {formatCurrency(payment.amount, currency)}
                      </span>
                      <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium uppercase text-slate-600">
                        {payment.method}
                      </span>
                      {payment.voided && (
                        <span className="rounded-md bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                          Voided
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span>{formatDate(payment.date)}</span>
                      <span className="mx-1.5 text-slate-300">·</span>
                      <span>Collected by {payment.enteredByName || 'System'}</span>
                      {payment.note && (
                        <>
                          <span className="mx-1.5 text-slate-300">·</span>
                          <span className="italic text-slate-600">"{payment.note}"</span>
                        </>
                      )}
                    </p>
                    {payment.voided && (
                      <p className="mt-1 text-xs text-rose-600">
                        Voided by {payment.voidedByName}: "{payment.voidReason}"
                      </p>
                    )}
                  </div>
                </div>
                {!payment.voided && can(PERMISSIONS.VISA_PAYMENT_VOID) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setVoiding(payment); setReason(''); setError(null) }}
                    className="self-end sm:self-center h-7.5 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 border border-rose-200/60 hover:border-rose-300"
                  >
                    Void
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
            No payments recorded yet.
          </div>
        )}
      </div>

      <Modal
        open={receiving}
        onClose={saving ? undefined : () => setReceiving(false)}
        title="Receive payment"
        description={`${application.number} · due ${formatCurrency(account.dueAmount, currency)}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReceiving(false)} disabled={saving}>Cancel</Button>
            <Button onClick={receive} loading={saving}>Record payment</Button>
          </>
        }
      >
        <div className="stack">
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <Input label={`Amount (${currency})`} type="number" min="0" value={form.amount} error={errors.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          <Select label="Method" value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })} options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))} />
          <Input label="Date" type="date" value={form.date} error={errors.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          <Input label="Note (optional)" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
        </div>
      </Modal>

      <Modal
        open={Boolean(voiding)}
        onClose={saving ? undefined : () => setVoiding(null)}
        title="Void payment"
        description={voiding ? `${formatCurrency(voiding.amount, currency)} · ${voiding.method}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setVoiding(null)} disabled={saving}>Cancel</Button>
            <Button variant="danger" onClick={voidIt} loading={saving}>Void payment</Button>
          </>
        }
      >
        <div className="stack">
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <p className="muted small">The payment stays in the history, marked as voided. The books are corrected too.</p>
          <Input label="Reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
