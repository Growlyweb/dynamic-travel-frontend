import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { vendorApi, COST_ACCOUNTS } from '../vendor.api'
import { errorMessage, fieldErrors } from '../../../utils/errors'

const today = () => new Date().toISOString().slice(0, 10)
const EMPTY = { vendorId: '', date: today(), dueDate: '', amount: '', invoiceRef: '', service: '', account: '5010', notes: '' }

// What a vendor billed us. It posts a cost to the books and raises what we owe the vendor. A bill is not edited: void it
// and enter a new one.
export default function BillModal({ open, vendors, vendorId, onClose, onSaved }) {
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

  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    const found = {}
    if (!values.vendorId) found.vendorId = 'Choose the vendor.'
    if (!(Number(values.amount) > 0)) found.amount = 'Enter the amount of the bill.'
    setErrors(found)
    if (Object.keys(found).length) return
    setSaving(true)
    setFormError(null)
    try {
      await vendorApi.createBill({
        vendorId: values.vendorId,
        date: values.date || undefined,
        dueDate: values.dueDate || undefined,
        amount: Number(values.amount),
        invoiceRef: values.invoiceRef.trim() || undefined,
        service: values.service.trim() || undefined,
        account: values.account,
        notes: values.notes.trim() || undefined,
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
      title="New vendor bill"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>Save bill</Button>
        </>
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        {formError ? <div className="alert alert--danger">{formError}</div> : null}
        <Select label="Vendor" placeholder="Choose the vendor" value={values.vendorId} error={errors.vendorId} disabled={Boolean(vendorId)} onChange={set('vendorId')} options={vendors.filter((vendor) => vendor.active).map((vendor) => ({ value: vendor.id, label: vendor.name }))} />
        <div className="grid grid--2">
          <Input label="Bill date" type="date" value={values.date} error={errors.date} onChange={set('date')} />
          <Input label="Due date" type="date" value={values.dueDate} error={errors.dueDate} onChange={set('dueDate')} hint="Blank means 15 days after the bill date." />
          <Input label="Amount" type="number" min="0" value={values.amount} error={errors.amount} onChange={set('amount')} />
          <Input label="Invoice number" value={values.invoiceRef} error={errors.invoiceRef} onChange={set('invoiceRef')} />
        </div>
        <div className="grid grid--2">
          <Select label="Cost account" value={values.account} error={errors.account} onChange={set('account')} options={COST_ACCOUNTS.map((account) => ({ value: account.value, label: `${account.value} · ${account.label}` }))} />
          <Input label="Service" value={values.service} error={errors.service} onChange={set('service')} placeholder="Embassy fees" />
        </div>
        <Input label="Notes" value={values.notes} error={errors.notes} onChange={set('notes')} />
      </form>
    </Modal>
  )
}
