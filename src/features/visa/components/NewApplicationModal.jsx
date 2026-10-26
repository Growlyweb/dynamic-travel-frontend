import { useEffect, useMemo, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { apiClient } from '../../../services/apiClient'
import { visaApi, ENTRY_TYPES, PAYMENT_METHODS } from '../visa.api'
import { errorMessage, fieldErrors } from '../../../utils/errors'
import { formatCurrency } from '../../../utils/formatters'

const EMPTY = {
  clientType: 'b2c',
  partnerId: '',
  name: '',
  phone: '',
  email: '',
  passportNumber: '',
  passportExpiry: '',
  countryId: '',
  visaTypeId: '',
  entries: 'single',
  visaDuration: '',
  totalAmount: '',
  totalOverrideReason: '',
  discountAmount: '',
  advancePaid: '',
  paymentMethod: PAYMENT_METHODS[0],
  assignedStaff: '',
  confirmDuplicate: '',
}

const emptyLine = () => ({ key: Math.random().toString(36).slice(2), vendorId: '', name: '', price: '', reference: '' })

const number = (value) => (value === '' || value == null ? 0 : Number(value) || 0)

// A new visa file. Only visa files are made here: the server takes the price from the visa type and works out the net,
// the due amount and the payment status itself. What is typed here is the total (when it differs from the price list), the
// discount and the money received now.
export function NewApplicationModal({ open, onClose, onCreated }) {
  const [values, setValues] = useState(EMPTY)
  const [lines, setLines] = useState([])
  const [countries, setCountries] = useState([])
  const [types, setTypes] = useState([])
  const [partners, setPartners] = useState([])
  const [staff, setStaff] = useState([])
  const [vendors, setVendors] = useState([])
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [needsDuplicateNote, setNeedsDuplicateNote] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValues(EMPTY)
    setLines([])
    setErrors({})
    setFormError(null)
    setNeedsDuplicateNote(false)
    Promise.allSettled([visaApi.listCountries({ status: 'active' }), visaApi.listVisaTypes({ status: 'active' }), visaApi.listPartners(), visaApi.listStaff(), apiClient.get('/vendors', { params: { pageSize: 500 } })]).then(
      ([countryResult, typeResult, partnerResult, staffResult, vendorResult]) => {
        if (countryResult.status === 'fulfilled') setCountries(countryResult.value.items)
        if (typeResult.status === 'fulfilled') setTypes(typeResult.value.items)
        if (partnerResult.status === 'fulfilled') setPartners(partnerResult.value)
        if (staffResult.status === 'fulfilled') setStaff(staffResult.value)
        // A person without access to vendors can still type a vendor name.
        setVendors(vendorResult.status === 'fulfilled' ? vendorResult.value.items : [])
      },
    )
  }, [open])

  const countryTypes = useMemo(() => types.filter((type) => type.countryId === values.countryId), [types, values.countryId])
  const type = types.find((item) => item.id === values.visaTypeId)
  const listPrice = type ? (values.clientType === 'b2b' ? type.b2bNetPrice : type.b2cPrice) : 0
  const currency = type?.currency ?? 'BDT'

  function set(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function chooseCountry(countryId) {
    const first = types.find((item) => item.countryId === countryId)
    setValues((current) => ({ ...current, countryId, visaTypeId: first?.id ?? '', entries: first?.entries ?? 'single', totalAmount: '' }))
  }

  function chooseType(visaTypeId) {
    const next = types.find((item) => item.id === visaTypeId)
    setValues((current) => ({ ...current, visaTypeId, entries: next?.entries ?? current.entries, totalAmount: '' }))
  }

  const total = values.totalAmount === '' ? listPrice : number(values.totalAmount)
  const discount = number(values.discountAmount)
  const net = Math.max(0, total - discount)
  const advance = number(values.advancePaid)
  const due = Math.max(0, net - advance)
  const overridden = Boolean(type) && total !== listPrice
  const vendorCost = lines.reduce((sum, line) => sum + number(line.price), 0)

  function changeLine(key, patch) {
    setLines((list) =>
      list.map((line) => {
        if (line.key !== key) return line
        const next = { ...line, ...patch }
        if ('vendorId' in patch) next.name = vendors.find((vendor) => vendor.id === patch.vendorId)?.name ?? ''
        return next
      }),
    )
  }

  function validate() {
    const found = {}
    if (values.name.trim().length < 2) found.name = 'Enter the applicant’s name.'
    if (!values.phone.trim()) found.phone = 'Enter a phone number.'
    if (!values.passportNumber.trim()) found.passportNumber = 'Enter the passport number.'
    if (!values.countryId) found.countryId = 'Choose a country.'
    if (!values.visaTypeId) found.visaTypeId = 'Choose a visa type.'
    if (values.clientType === 'b2b' && !values.partnerId) found.partnerId = 'Choose the partner.'
    if (overridden && !values.totalOverrideReason.trim()) found.totalOverrideReason = 'Write why the total differs from the price list.'
    if (discount > total) found.discountAmount = 'The discount cannot be more than the total.'
    if (advance > net) found.advancePaid = 'The advance cannot be more than the amount to pay.'
    setErrors(found)
    return Object.keys(found).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    setFormError(null)
    try {
      await onCreated({
        ...values,
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        passportNumber: values.passportNumber.trim(),
        currency,
        totalAmount: total,
        discountAmount: discount,
        advancePaid: advance,
        vendorList: lines
          .filter((line) => line.name.trim() || line.vendorId)
          .map((line) => ({ vendorId: line.vendorId || undefined, name: line.name.trim() || undefined, service: 'visa', price: number(line.price), reference: line.reference.trim() || undefined })),
      })
      onClose?.()
    } catch (error) {
      setErrors(fieldErrors(error))
      setFormError(errorMessage(error))
      if (error?.code === 'DUPLICATE_RECENT_APPLICATION') setNeedsDuplicateNote(true)
    } finally {
      setSaving(false)
    }
  }

  const b2b = values.clientType === 'b2b'

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="New visa application"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>Create application</Button>
        </>
      }
    >
      <form className="stack" onSubmit={handleSubmit} noValidate>
        {formError ? <div className="alert alert--danger">{formError}</div> : null}

        <div className="row" style={{ gap: 16 }}>
          <label className="checkbox"><input type="radio" name="client-type" checked={!b2b} onChange={() => set('clientType', 'b2c')} /> Direct customer (B2C)</label>
          <label className="checkbox"><input type="radio" name="client-type" checked={b2b} onChange={() => set('clientType', 'b2b')} /> Partner agency (B2B)</label>
        </div>
        {b2b ? (
          <Select
            label="Partner"
            placeholder="Choose the partner"
            value={values.partnerId}
            error={errors.partnerId}
            onChange={(event) => set('partnerId', event.target.value)}
            options={partners.map((partner) => ({ value: partner.id ?? partner._id, label: partner.companyName ?? partner.name }))}
          />
        ) : null}

        <p className="card__title">Applicant</p>
        <div className="grid grid--2">
          <Input label="Full name" value={values.name} error={errors.name} onChange={(event) => set('name', event.target.value)} />
          <Input label="Phone" value={values.phone} error={errors.phone} onChange={(event) => set('phone', event.target.value)} placeholder="+8801712345678" />
          <Input
            label="Email"
            type="email"
            value={values.email}
            error={errors.email}
            hint={values.email ? undefined : 'Without an email the applicant cannot use the status check on the website, and gets no automatic emails.'}
            onChange={(event) => set('email', event.target.value)}
          />
          <Input label="Passport number" value={values.passportNumber} error={errors.passportNumber} onChange={(event) => set('passportNumber', event.target.value)} />
          <Input label="Passport expiry" type="date" value={values.passportExpiry} onChange={(event) => set('passportExpiry', event.target.value)} />
        </div>

        <p className="card__title">Visa</p>
        <div className="grid grid--2">
          <Select label="Country" placeholder="Choose a country" value={values.countryId} error={errors.countryId} onChange={(event) => chooseCountry(event.target.value)} options={countries.map((country) => ({ value: country.id, label: country.name }))} />
          <Select label="Visa type" placeholder="Choose a visa type" value={values.visaTypeId} error={errors.visaTypeId} disabled={!values.countryId} onChange={(event) => chooseType(event.target.value)} options={countryTypes.map((item) => ({ value: item.id, label: item.name }))} />
          <Select label="Entries" value={values.entries} onChange={(event) => set('entries', event.target.value)} options={ENTRY_TYPES} />
          <Input label="Duration of stay" value={values.visaDuration} onChange={(event) => set('visaDuration', event.target.value)} placeholder="30 days" />
        </div>

        <p className="card__title">Money ({currency})</p>
        <div className="grid grid--3">
          <Input
            label={`Total${type ? ` (price list ${formatCurrency(listPrice, currency)})` : ''}`}
            type="number"
            min="0"
            value={values.totalAmount}
            placeholder={type ? String(listPrice) : ''}
            error={errors.totalAmount}
            onChange={(event) => set('totalAmount', event.target.value)}
          />
          <Input label="Discount" type="number" min="0" value={values.discountAmount} error={errors.discountAmount} onChange={(event) => set('discountAmount', event.target.value)} />
          <Input label="Received now" type="number" min="0" value={values.advancePaid} error={errors.advancePaid} onChange={(event) => set('advancePaid', event.target.value)} />
        </div>
        {overridden ? (
          <Input label="Why is the total different from the price list?" value={values.totalOverrideReason} error={errors.totalOverrideReason} onChange={(event) => set('totalOverrideReason', event.target.value)} />
        ) : null}
        {advance > 0 ? <Select label="Payment method" value={values.paymentMethod} onChange={(event) => set('paymentMethod', event.target.value)} options={PAYMENT_METHODS.map((method) => ({ value: method, label: method }))} /> : null}
        <p className="muted small">
          To pay {formatCurrency(net, currency)}, received {formatCurrency(Math.min(advance, net), currency)}, due {formatCurrency(due, currency)}. The server works these out again when it saves.
        </p>

        <div>
          <p className="card__title">Vendor costs (optional)</p>
          <div className="stack" style={{ gap: 8 }}>
            {lines.map((line) => (
              <div key={line.key} className="grid grid--4" style={{ alignItems: 'end' }}>
                <Select label="Vendor" placeholder="Not in the list" value={line.vendorId} onChange={(event) => changeLine(line.key, { vendorId: event.target.value })} options={vendors.map((vendor) => ({ value: vendor.id, label: vendor.name }))} />
                <Input label="Name" value={line.name} onChange={(event) => changeLine(line.key, { name: event.target.value })} />
                <Input label="Cost" type="number" min="0" value={line.price} onChange={(event) => changeLine(line.key, { price: event.target.value })} />
                <Button variant="ghost" size="sm" onClick={() => setLines((list) => list.filter((item) => item.key !== line.key))}>Remove</Button>
              </div>
            ))}
            <div className="row" style={{ gap: 12 }}>
              <Button variant="ghost" size="sm" onClick={() => setLines((list) => [...list, emptyLine()])}>Add a vendor cost</Button>
              {lines.length ? <span className="muted small">Cost {formatCurrency(vendorCost, currency)} · profit {formatCurrency(net - vendorCost, currency)}</span> : null}
            </div>
          </div>
        </div>

        <Select label="Assign to staff (optional)" placeholder="Unassigned" value={values.assignedStaff} onChange={(event) => set('assignedStaff', event.target.value)} options={staff.map((person) => ({ value: person.id ?? person._id, label: person.name }))} />

        {needsDuplicateNote ? (
          <Input label="Why create another application for this passport?" value={values.confirmDuplicate} error={errors.confirmDuplicate} onChange={(event) => set('confirmDuplicate', event.target.value)} />
        ) : null}
      </form>
    </Modal>
  )
}

export default NewApplicationModal
