import { useState } from 'react'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { TOUR_STATUSES } from '../../../utils/constants'
import { titleCase } from '../../../utils/formatters'
import { validateRequired } from '../../../utils/validators'

const EMPTY_VALUES = {
  name: '',
  destination: '',
  durationDays: '',
  price: '',
  seats: '',
  description: '',
  status: 'draft',
}

export default function TourForm({ initialValues, submitLabel = 'Save tour', submitting, onSubmit, onCancel }) {
  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateRequired(values, [
      { name: 'name', label: 'Name' },
      { name: 'destination', label: 'Destination' },
      { name: 'price', label: 'Price' },
    ])
    setErrors(validation.errors)
    if (!validation.valid) return

    await onSubmit?.({
      ...values,
      durationDays: Number(values.durationDays) || 1,
      price: Number(values.price) || 0,
      seats: Number(values.seats) || 0,
    })
  }

  return (
    <form className="card stack" onSubmit={handleSubmit} noValidate style={{ maxWidth: 640 }}>
      <Input label="Tour name" value={values.name} error={errors.name} onChange={(event) => update('name', event.target.value)} />
      <Input
        label="Destination"
        value={values.destination}
        error={errors.destination}
        onChange={(event) => update('destination', event.target.value)}
      />
      <div className="grid grid--3" style={{ gap: 12 }}>
        <Input
          label="Duration (days)"
          type="number"
          min="1"
          value={values.durationDays}
          onChange={(event) => update('durationDays', event.target.value)}
        />
        <Input
          label="Price per person"
          type="number"
          min="0"
          value={values.price}
          error={errors.price}
          onChange={(event) => update('price', event.target.value)}
        />
        <Input
          label="Seats"
          type="number"
          min="0"
          value={values.seats}
          onChange={(event) => update('seats', event.target.value)}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="tour-description">
          Description
        </label>
        <textarea
          id="tour-description"
          className="field__control"
          value={values.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder="Itinerary highlights, inclusions, notes…"
        />
      </div>
      <Select
        label="Status"
        value={values.status}
        onChange={(event) => update('status', event.target.value)}
        options={TOUR_STATUSES.map((status) => ({ value: status, label: titleCase(status) }))}
      />
      <div className="row">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  )
}
