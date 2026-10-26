import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { vendorApi } from '../vendor.api'
import { errorMessage, fieldErrors } from '../../../utils/errors'

const EMPTY = { name: '', contactPerson: '', phone: '', email: '', address: '', creditLimit: '', notes: '', openingBalance: '', openingBalanceType: 'due' }

const number = (value) => (value === '' || value == null ? undefined : Number(value))

// Adds a vendor, or changes one. The opening balance can only be set when the vendor is created: it is what the vendor was
// already owed (due) or what we had already paid ahead (advance), before this system.
export default function VendorFormModal({ open, vendor, onClose, onSaved }) {
  const editing = Boolean(vendor)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(vendor ? { ...EMPTY, name: vendor.name, contactPerson: vendor.contactPerson ?? '', phone: vendor.phone ?? '', email: vendor.email ?? '', address: vendor.address ?? '', creditLimit: vendor.creditLimit ? String(vendor.creditLimit) : '', notes: vendor.notes ?? '' } : EMPTY)
    setErrors({})
    setFormError(null)
  }, [open, vendor])

  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    if (!values.name.trim()) return setErrors({ name: 'Enter the vendor name.' })
    setSaving(true)
    setErrors({})
    setFormError(null)
    const body = {
      name: values.name.trim(),
      contactPerson: values.contactPerson.trim(),
      phone: values.phone.trim() || undefined,
      email: values.email.trim() || undefined,
      address: values.address.trim(),
      creditLimit: number(values.creditLimit),
      notes: values.notes.trim(),
    }
    try {
      const saved = editing
        ? await vendorApi.updateVendor(vendor.id, body)
        : await vendorApi.createVendor({ ...body, ...(number(values.openingBalance) ? { openingBalance: number(values.openingBalance), openingBalanceType: values.openingBalanceType } : {}) })
      onSaved?.(saved)
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
      title={editing ? `Edit ${vendor.name}` : 'New vendor'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{editing ? 'Save changes' : 'Add vendor'}</Button>
        </>
      }
    >
      <form className="stack" onSubmit={submit} noValidate>
        {formError ? <div className="alert alert--danger">{formError}</div> : null}
        <div className="grid grid--2">
          <Input label="Name" value={values.name} error={errors.name} onChange={set('name')} />
          <Input label="Contact person" value={values.contactPerson} error={errors.contactPerson} onChange={set('contactPerson')} />
          <Input label="Phone" value={values.phone} error={errors.phone} onChange={set('phone')} />
          <Input label="Email" type="email" value={values.email} error={errors.email} onChange={set('email')} />
        </div>
        <Input label="Address" value={values.address} error={errors.address} onChange={set('address')} />
        <div className="grid grid--3">
          <Input label="Credit limit" type="number" min="0" value={values.creditLimit} error={errors.creditLimit} onChange={set('creditLimit')} hint="The most we may owe this vendor. Blank means no limit set." />
          {!editing ? (
            <>
              <Input label="Opening balance" type="number" min="0" value={values.openingBalance} error={errors.openingBalance} onChange={set('openingBalance')} />
              <Select label="The opening balance is" value={values.openingBalanceType} onChange={set('openingBalanceType')} options={[{ value: 'due', label: 'Owed to the vendor' }, { value: 'advance', label: 'Paid ahead to the vendor' }]} />
            </>
          ) : null}
        </div>
        <Input label="Notes" value={values.notes} error={errors.notes} onChange={set('notes')} />
      </form>
    </Modal>
  )
}
