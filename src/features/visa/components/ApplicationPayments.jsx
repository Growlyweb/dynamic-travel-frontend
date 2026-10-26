import { useState } from 'react'
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
  const account = application.account
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

  return (
    <div className="card">
      <div className="row between row--wrap">
        <p className="card__title" style={{ marginBottom: 0 }}>
          Money <Badge tone={PAYMENT_STATUS_TONES[account.paymentStatus] ?? 'neutral'}>{account.paymentStatus}</Badge>
        </p>
        <div className="row" style={{ gap: 8 }}>
          {can(PERMISSIONS.VISA_EDIT) && account.dueAmount > 0 ? <Button size="sm" onClick={openReceive}>Receive payment</Button> : null}
          {can(PERMISSIONS.REPORTS_VIEW) ? <Button size="sm" variant="subtle" onClick={onOpenAccounts}>Open in Accounts</Button> : null}
        </div>
      </div>

      <dl className="detail-list mt-2">
        <div><dt>Price list</dt><dd>{formatCurrency(account.totalAmount, currency)}</dd></div>
        <div><dt>Discount</dt><dd>{formatCurrency(account.discountAmount, currency)}</dd></div>
        <div><dt>To pay</dt><dd className="strong">{formatCurrency(account.netAmount, currency)}</dd></div>
        <div><dt>Received</dt><dd>{formatCurrency(account.advancePaid, currency)}</dd></div>
        <div>
          <dt>Due</dt>
          <dd className="strong" style={{ color: account.dueAmount > 0 ? '#c62828' : '#0f8a4f' }}>{formatCurrency(account.dueAmount, currency)}</dd>
        </div>
        {account.totalOverrideReason ? <div><dt>Why the total differs</dt><dd>{account.totalOverrideReason}</dd></div> : null}
      </dl>

      <ul className="stack stack--sm mt-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {payments.map((payment) => (
          <li key={payment.id} className="row between row--wrap" style={{ gap: 8, opacity: payment.voided ? 0.6 : 1 }}>
            <div>
              <p className="strong" style={{ margin: 0, textDecoration: payment.voided ? 'line-through' : 'none' }}>
                {formatCurrency(payment.amount, currency)} · {payment.method}
              </p>
              <p className="muted small" style={{ margin: 0 }}>
                {formatDate(payment.date)} · {payment.enteredByName || 'System'}
                {payment.note ? ` · ${payment.note}` : ''}
                {payment.voided ? ` · voided by ${payment.voidedByName}: ${payment.voidReason}` : ''}
              </p>
            </div>
            {!payment.voided && can(PERMISSIONS.VISA_PAYMENT_VOID) ? (
              <Button size="sm" variant="ghost" onClick={() => { setVoiding(payment); setReason(''); setError(null) }}>Void</Button>
            ) : null}
          </li>
        ))}
        {!payments.length ? <p className="muted small">No payments yet.</p> : null}
      </ul>

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
