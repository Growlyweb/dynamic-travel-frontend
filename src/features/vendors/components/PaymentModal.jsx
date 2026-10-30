import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { vendorApi, PAYMENT_METHODS } from '../vendor.api'
import { errorMessage, fieldErrors } from '../../../utils/errors'
import { formatCurrency } from '../../../utils/formatters'

const today = () => new Date().toISOString().slice(0, 10)
const EMPTY = { vendorId: '', amount: '', method: 'cash', date: today(), isAdvance: false, note: '' }

// What we paid a vendor. A payment settles what we owe. Money paid before any bill is an advance, kept apart until a bill
// uses it. The server refuses a payment above what is owed unless it is marked as an advance.
export default function PaymentModal({ open, vendors, vendorId, onClose, onSaved }) {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setValues({ ...EMPTY, vendorId: vendorId ?? '', date: today() })
      setErrors({})
      setFormError(null)
    }
  }, [open, vendorId])

  const vendor = vendors.find((item) => item.id === values.vendorId)
  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    const found = {}
    if (!values.vendorId) found.vendorId = 'Choose the vendor.'
    if (!(Number(values.amount) > 0)) found.amount = 'Enter the amount paid.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setFormError(null)
    try {
      await vendorApi.createPayment({
        vendorId: values.vendorId,
        amount: Number(values.amount),
        method: values.method,
        date: values.date || undefined,
        isAdvance: values.isAdvance,
        note: values.note.trim() || undefined,
      })
      onSaved?.()
    } catch (error) {
      setErrors(fieldErrors(error))
      setFormError(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="New vendor payment"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save payment</Button>
        </>
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        {formError ? <div className="alert alert--danger">{formError}</div> : null}
        <Select label="Vendor" placeholder="Choose the vendor" value={values.vendorId} error={errors.vendorId} disabled={Boolean(vendorId)} onChange={set('vendorId')} options={vendors.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} />
        {vendor ? <p className="muted small">We owe {formatCurrency(vendor.due, 'BDT')}{vendor.advance > 0 ? `, and we have ${formatCurrency(vendor.advance, 'BDT')} paid ahead` : ''}.</p> : null}
        <div className="grid grid--2">
          <Input label="Amount" type="number" min="0" value={values.amount} error={errors.amount} onChange={set('amount')} />
          <Input label="Date" type="date" value={values.date} error={errors.date} onChange={set('date')} />
          <Select label="Paid from" value={values.method} error={errors.method} onChange={set('method')} options={PAYMENT_METHODS} />
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={values.isAdvance} onChange={(event) => setValues({ ...values, isAdvance: event.target.checked })} />
          This is an advance (paid before a bill)
        </label>
        <Input label="Note" value={values.note} error={errors.note} onChange={set('note')} />
      </form>
    </Modal>
  )
}
