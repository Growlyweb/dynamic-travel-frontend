import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { visaApi, PASSPORT_REQUIREMENT_LABELS } from '../visa.api'
import { VISA_TYPE_OPTIONS } from '../../../utils/constants'

const EMPTY_VALUES = {
  countryId: '',
  name: '',
  description: '',
  processingTime: '',
  entries: 'single',
  currency: 'BDT',
  b2cPrice: '',
  b2bNetPrice: '',
  embassyFee: '',
  serviceFee: '',
  vat: '',
  validFrom: '',
  terms: '',
  status: 'active',
  passportRequirement: 'online_processing',
  pickupAvailable: false,
  officeSubmissionAvailable: false,
}

const PASSPORT_REQUIREMENT_OPTIONS = Object.entries(PASSPORT_REQUIREMENT_LABELS).map(([value, label]) => ({ value, label }))

function valuesFromType(type) {
  if (!type) return { ...EMPTY_VALUES }
  return {
    countryId: type.countryId ?? '',
    name: type.name ?? '',
    description: type.description ?? '',
    processingTime: type.processingTime ?? '',
    entries: type.entries ?? 'single',
    currency: type.currency ?? 'BDT',
    b2cPrice: type.b2cPrice == null ? '' : String(type.b2cPrice),
    b2bNetPrice: type.b2bNetPrice == null ? '' : String(type.b2bNetPrice),
    embassyFee: type.fees?.embassy == null ? '' : String(type.fees.embassy),
    serviceFee: type.fees?.service == null ? '' : String(type.fees.service),
    vat: type.fees?.vat == null ? '' : String(type.fees.vat),
    validFrom: type.validFrom ?? '',
    terms: type.terms ?? '',
    status: type.status ?? 'active',
    passportRequirement: type.passportRequirement ?? 'online_processing',
    pickupAvailable: Boolean(type.pickupAvailable),
    officeSubmissionAvailable: Boolean(type.officeSubmissionAvailable),
  }
}

/**
 * Create/edit dialog for a visa type, including its B2C/B2B pricing and
 * optional fee breakdown. Used by the Visa types and Pricing pages.
 */
export default function VisaTypeDialog({ open, onClose, visaType, countries, defaultCountryId, onSaved }) {
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      setValues({ ...valuesFromType(visaType), countryId: visaType?.countryId ?? defaultCountryId ?? '' })
      setErrors({})
      setError(null)
    }
  }, [open, visaType, defaultCountryId])

  function setValue(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!values.countryId) next.countryId = 'Select a country.'
    if (!values.name.trim()) next.name = 'Visa type name is required.'
    if (values.b2cPrice === '' || Number.isNaN(Number(values.b2cPrice))) next.b2cPrice = 'B2C price is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...(visaType ?? {}),
        countryId: values.countryId,
        name: values.name.trim(),
        description: values.description.trim(),
        processingTime: values.processingTime.trim(),
        entries: values.entries,
        currency: values.currency,
        b2cPrice: Number(values.b2cPrice),
        b2bNetPrice: values.b2bNetPrice === '' ? null : Number(values.b2bNetPrice),
        fees: {
          embassy: values.embassyFee === '' ? 0 : Number(values.embassyFee),
          service: values.serviceFee === '' ? 0 : Number(values.serviceFee),
          vat: values.vat === '' ? 0 : Number(values.vat),
        },
        validFrom: values.validFrom || null,
        terms: values.terms.trim(),
        status: values.status,
        passportRequirement: values.passportRequirement,
        pickupAvailable: values.pickupAvailable,
        officeSubmissionAvailable: values.officeSubmissionAvailable,
      }
      const saved = await visaApi.saveVisaType(payload)
      onSaved?.(saved)
      onClose()
    } catch (saveError) {
      setError(saveError?.message ?? 'Could not save the visa type.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={visaType ? `Edit ${visaType.name}` : 'Add visa type'}
      description="Prices entered here are what B2C customers and B2B partners see. The backend recalculates the final price by role — never trust the frontend."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={saving}>
            {visaType ? 'Save changes' : 'Add visa type'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="stack">
        <div className="grid grid--2">
          <Select
            label="Country"
            value={values.countryId}
            error={errors.countryId}
            onChange={(event) => setValue('countryId', event.target.value)}
            placeholder="Select country"
            options={(countries ?? []).map((country) => ({ value: country.id, label: `${country.flag} ${country.name}` }))}
          />
          <Select
            label="Visa type"
            value={values.name}
            error={errors.name}
            onChange={(event) => setValue('name', event.target.value)}
            placeholder="Select visa type"
            options={VISA_TYPE_OPTIONS}
          />
        </div>
        <Input
          label="Description"
          value={values.description}
          onChange={(event) => setValue('description', event.target.value)}
          placeholder="Short description of this visa service"
        />
        <div className="grid grid--2">
          <Input
            label="Processing time"
            value={values.processingTime}
            onChange={(event) => setValue('processingTime', event.target.value)}
            placeholder="5–7 working days"
          />
          <Select
            label="Entries"
            value={values.entries}
            onChange={(event) => setValue('entries', event.target.value)}
            options={[
              { value: 'single', label: 'Single entry' },
              { value: 'multiple', label: 'Multiple entry' },
            ]}
          />
        </div>
        <div className="grid grid--2">
          <Input
            label="B2C price *"
            type="number"
            min="0"
            value={values.b2cPrice}
            error={errors.b2cPrice}
            onChange={(event) => setValue('b2cPrice', event.target.value)}
            placeholder="12000"
          />
          <Input
            label="B2B net price"
            type="number"
            min="0"
            value={values.b2bNetPrice}
            onChange={(event) => setValue('b2bNetPrice', event.target.value)}
            placeholder="10000"
          />
        </div>
        <div className="grid grid--3">
          <Input
            label="Embassy fee"
            type="number"
            min="0"
            value={values.embassyFee}
            onChange={(event) => setValue('embassyFee', event.target.value)}
            placeholder="0"
          />
          <Input
            label="Service fee"
            type="number"
            min="0"
            value={values.serviceFee}
            onChange={(event) => setValue('serviceFee', event.target.value)}
            placeholder="0"
          />
          <Input
            label="VAT"
            type="number"
            min="0"
            value={values.vat}
            onChange={(event) => setValue('vat', event.target.value)}
            placeholder="0"
          />
        </div>
        <div className="grid grid--3">
          <Select
            label="Currency"
            value={values.currency}
            onChange={(event) => setValue('currency', event.target.value)}
            options={[
              { value: 'BDT', label: 'BDT (৳)' },
              { value: 'USD', label: 'USD ($)' },
            ]}
          />
          <Input
            label="Effective from"
            type="date"
            value={values.validFrom}
            onChange={(event) => setValue('validFrom', event.target.value)}
          />
          <Select
            label="Status"
            value={values.status}
            onChange={(event) => setValue('status', event.target.value)}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'paused', label: 'Paused — unavailable' },
            ]}
          />
        </div>

        <p className="card__title" style={{ marginBottom: 0 }}>Passport processing</p>
        <div className="grid grid--3">
          <Select
            label="Passport requirement"
            value={values.passportRequirement}
            onChange={(event) => setValue('passportRequirement', event.target.value)}
            options={PASSPORT_REQUIREMENT_OPTIONS}
            hint="Controls whether applicants must hand in the original passport."
          />
          <div className="field">
            <span className="field__label">Pickup service</span>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={values.pickupAvailable}
                onChange={(event) => setValue('pickupAvailable', event.target.checked)}
              />
              Pickup available for this visa
            </label>
          </div>
          <div className="field">
            <span className="field__label">Office submission</span>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={values.officeSubmissionAvailable}
                onChange={(event) => setValue('officeSubmissionAvailable', event.target.checked)}
              />
              Office submission available
            </label>
          </div>
        </div>
        <div className="field">
          <label className="field__label" htmlFor="visa-type-terms">Terms & conditions</label>
          <textarea
            id="visa-type-terms"
            className="field__control"
            rows={3}
            value={values.terms}
            onChange={(event) => setValue('terms', event.target.value)}
            placeholder="Cancellation rules, passport validity requirements…"
          />
        </div>
        {error ? <p className="alert alert--danger" role="alert">{error}</p> : null}
      </form>
    </Modal>
  )
}
