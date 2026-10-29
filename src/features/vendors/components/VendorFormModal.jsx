import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { vendorApi } from '../vendor.api'
import { SERVICE_OPTIONS } from '../../visa/api/constants'
import { errorMessage, fieldErrors } from '../../../utils/errors'

const EMPTY = { name: '', contactPerson: '', phone: '', email: '', address: '', creditLimit: '', notes: '', openingBalance: '', openingBalanceType: 'due' }

const number = (value) => (value === '' || value == null ? undefined : Number(value))

const emptyPrice = () => ({ key: Math.random().toString(36).slice(2), service: 'visa', country: '', price: '' })

// A price is typed in taka. A row without a price is left out when the vendor is saved.
const pricesOf = (vendor) => (vendor?.priceList ?? []).map((entry) => ({ key: Math.random().toString(36).slice(2), service: entry.service, country: entry.country ?? '', price: String(entry.price) }))

// Adds a vendor, or changes one. The opening balance can only be set when the vendor is created: it is what the vendor was
// already owed (due) or what we had already paid ahead (advance), before this system.
export default function VendorFormModal({ open, vendor, onClose, onSaved }) {
  const editing = Boolean(vendor)
  const [values, setValues] = useState(EMPTY)
  const [prices, setPrices] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(vendor ? { ...EMPTY, name: vendor.name, contactPerson: vendor.contactPerson ?? '', phone: vendor.phone ?? '', email: vendor.email ?? '', address: vendor.address ?? '', creditLimit: vendor.creditLimit ? String(vendor.creditLimit) : '', notes: vendor.notes ?? '' } : EMPTY)
    setPrices(pricesOf(vendor))
    setErrors({})
    setFormError(null)
  }, [open, vendor])

  const set = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))
  const setPrice = (key, patch) => setPrices((list) => list.map((entry) => (entry.key === key ? { ...entry, ...patch } : entry)))

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
      priceList: prices
        .filter((entry) => entry.price !== '')
        .map((entry) => ({ service: entry.service, country: entry.service === 'visa' ? entry.country.trim() || undefined : undefined, price: Number(entry.price) })),
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

        <div className="stack stack--sm">
          <div className="row between">
            <p className="card__title" style={{ margin: 0 }}>Price list (BDT)</p>
            <Button size="sm" variant="subtle" type="button" onClick={() => setPrices((list) => [...list, emptyPrice()])}>+ Add price</Button>
          </div>
          <p className="field__hint" style={{ margin: 0 }}>What this vendor charges. A new application starts from it. A visa price can be set for one country; a visa price with no country is used for any other country.</p>
          {prices.map((entry, index) => (
            <div key={entry.key} className="grid grid--3" style={{ alignItems: 'end' }}>
              <Select label={index === 0 ? 'Service' : undefined} aria-label={`Service of price ${index + 1}`} value={entry.service} onChange={(event) => setPrice(entry.key, { service: event.target.value })} options={SERVICE_OPTIONS} />
              {entry.service === 'visa' ? (
                <Input label={index === 0 ? 'Country' : undefined} aria-label={`Country of price ${index + 1}`} value={entry.country} placeholder="Any country" onChange={(event) => setPrice(entry.key, { country: event.target.value })} />
              ) : (
                <div />
              )}
              <div className="row" style={{ gap: 8, alignItems: 'end' }}>
                <Input label={index === 0 ? 'Price' : undefined} aria-label={`Price ${index + 1}`} type="number" min="0" value={entry.price} onChange={(event) => setPrice(entry.key, { price: event.target.value })} />
                <Button size="sm" variant="ghost" type="button" aria-label={`Remove price ${index + 1}`} onClick={() => setPrices((list) => list.filter((item) => item.key !== entry.key))}>Remove</Button>
              </div>
            </div>
          ))}
          {errors.priceList ? <p className="field__error">{errors.priceList}</p> : null}
        </div>
      </form>
    </Modal>
  )
}
