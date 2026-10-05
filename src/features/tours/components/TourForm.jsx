import { useEffect, useState } from 'react'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { TOUR_STATUSES } from '../../../utils/constants'
import { titleCase } from '../../../utils/formatters'
import { validateRequired } from '../../../utils/validators'
import { categoriesApi, DEFAULT_CATEGORIES } from '../categories.api'
import { getApiErrorMessage } from '../../../utils/helpers'

const NEW_CATEGORY_VALUE = '__create_new__'

const CURRENCY_OPTIONS = [
  { value: 'BDT', label: 'BDT (Bangladeshi Taka)' },
  { value: 'USD', label: 'USD (US Dollar)' },
]

const EMPTY_VALUES = {
  name: '',
  segment: DEFAULT_CATEGORIES[0].name,
  country: '',
  destination: '',
  durationDays: '3',
  priceCurrency: 'BDT',
  price: '',
  b2bPrice: '',
  seats: '15',
  description: '',
  coverImage: '',
  gallery: [],
  included: [],
  excluded: [],
  hotels: [],
  itinerary: [],
  terms: '',
  status: 'draft',
}

function normalizeValues(values) {
  return {
    ...EMPTY_VALUES,
    ...values,
    price: values?.price == null ? '' : String(values.price),
    b2bPrice: values?.b2bPrice == null ? '' : String(values.b2bPrice),
    gallery: Array.isArray(values?.gallery) ? values.gallery.filter(Boolean) : [],
    included: Array.isArray(values?.included) ? values.included.filter(Boolean) : [],
    excluded: Array.isArray(values?.excluded) ? values.excluded.filter(Boolean) : [],
    hotels: Array.isArray(values?.hotels)
      ? values.hotels.map((h) => (typeof h === 'string' ? { name: h, address: '' } : h))
      : [],
    itinerary: Array.isArray(values?.itinerary)
      ? values.itinerary.map((item, index) => ({
          day: item?.day ?? index + 1,
          title: item?.title ?? '',
          description: item?.description ?? '',
        }))
      : [],
  }
}

/* ── Minimal List Editor ─────────────────────────────────── */
function StringListEditor({ label, placeholder, items, onChange, emptyHint }) {
  function update(index, value) {
    onChange(items.map((item, i) => (i === index ? value : item)))
  }

  return (
    <div className="stack stack--sm">
      <div className="row between align-center">
        <label className="field__label" style={{ marginBottom: 0, fontSize: 13, fontWeight: 600 }}>
          {label}
        </label>
      </div>
      {items.length === 0 ? <p className="muted small" style={{ margin: 0 }}>{emptyHint}</p> : null}
      {items.map((item, index) => (
        <div key={index} className="row" style={{ alignItems: 'center', gap: 8 }}>
          <Input
            className="flex-1"
            value={item}
            placeholder={placeholder}
            aria-label={`${label} ${index + 1}`}
            onChange={(event) => update(index, event.target.value)}
          />
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            style={{ color: 'var(--color-text-muted)', fontSize: 12 }}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <div>
        <Button variant="subtle" size="sm" type="button" onClick={() => onChange([...items, ''])}>
          + Add item
        </Button>
      </div>
    </div>
  )
}

/* ── Minimal Hotel Editor ───────────────────────────────── */
function HotelsEditor({ hotels, onChange }) {
  function update(index, field, value) {
    onChange(hotels.map((h, i) => (i === index ? { ...h, [field]: value } : h)))
  }

  return (
    <div className="stack stack--sm">
      <label className="field__label" style={{ marginBottom: 0, fontSize: 13, fontWeight: 600 }}>
        Hotels &amp; Accommodations
      </label>
      {hotels.length === 0 ? (
        <p className="muted small" style={{ margin: 0 }}>
          No hotel details added yet.
        </p>
      ) : null}

      {hotels.map((hotel, index) => (
        <div
          key={index}
          style={{
            padding: 14,
            background: '#fafbfc',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div className="row between align-center">
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Hotel {index + 1}
            </span>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              style={{ color: 'var(--color-text-muted)', fontSize: 12, padding: '2px 6px' }}
              onClick={() => onChange(hotels.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>

          <div className="grid grid--2" style={{ gap: 10 }}>
            <Input
              label="Hotel Name"
              placeholder="e.g. Ocean Paradise Resort"
              value={hotel.name || ''}
              onChange={(e) => update(index, 'name', e.target.value)}
            />
            <Input
              label="Address / Location"
              placeholder="e.g. Kolatoli Road, Cox's Bazar"
              value={hotel.address || ''}
              onChange={(e) => update(index, 'address', e.target.value)}
            />
          </div>
        </div>
      ))}

      <div>
        <Button
          variant="subtle"
          size="sm"
          type="button"
          onClick={() => onChange([...hotels, { name: '', address: '' }])}
        >
          + Add hotel
        </Button>
      </div>
    </div>
  )
}

/* ── Minimal Itinerary Editor ───────────────────────────── */
function ItineraryEditor({ items, onChange }) {
  function update(index, patch) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  return (
    <div className="stack stack--sm">
      <div className="row between align-center">
        <label className="field__label" style={{ marginBottom: 0, fontSize: 13, fontWeight: 600 }}>
          Day-by-Day Itinerary
        </label>
        <span className="muted small">{items.length} Day(s)</span>
      </div>

      {items.length === 0 ? (
        <p className="muted small" style={{ margin: 0 }}>
          No days added yet.
        </p>
      ) : null}

      {items.map((item, index) => (
        <div
          key={index}
          style={{
            padding: 16,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div className="row between align-center">
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--color-text)',
                background: 'var(--color-bg)',
                padding: '2px 8px',
                borderRadius: 4,
              }}
            >
              Day {index + 1}
            </span>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              style={{ color: 'var(--color-text-muted)', fontSize: 12, padding: '2px 6px' }}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>

          <Input
            label="Title"
            value={item.title}
            placeholder="e.g. Arrival & Sunset Beach Walk"
            onChange={(event) => update(index, { title: event.target.value })}
          />

          <div className="field">
            <label className="field__label" htmlFor={`itinerary-desc-${index}`} style={{ fontSize: 12 }}>
              Plan &amp; Activities
            </label>
            <textarea
              id={`itinerary-desc-${index}`}
              className="field__control"
              rows={2}
              value={item.description}
              placeholder="Detail the day's schedule and highlights..."
              onChange={(event) => update(index, { description: event.target.value })}
            />
          </div>
        </div>
      ))}

      <div>
        <Button
          variant="subtle"
          size="sm"
          type="button"
          onClick={() =>
            onChange([...items, { day: items.length + 1, title: '', description: '' }])
          }
        >
          + Add day
        </Button>
      </div>
    </div>
  )
}

/* ── Minimal, Elegant Tour Form ─────────────────────────── */
export default function TourForm({ initialValues, submitLabel = 'Save tour package', submitting, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => normalizeValues(initialValues))
  const [errors, setErrors] = useState({})

  // Dynamic categories — seeded with defaults, replaced by whatever the
  // API returns so the admin's own categories show up in the dropdown.
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [newCategory, setNewCategory] = useState('')
  const [categoryError, setCategoryError] = useState(null)
  const [addingCategory, setAddingCategory] = useState(false)
  const [segmentBackup, setSegmentBackup] = useState('')

  useEffect(() => {
    let active = true
    categoriesApi
      .list({ pageSize: 100 })
      .then((result) => {
        if (active && Array.isArray(result?.items) && result.items.length) {
          setCategories(result.items.map((item) => ({ id: item.id, name: item.name })))
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSegmentChange(event) {
    const value = event.target.value
    if (value === NEW_CATEGORY_VALUE) {
      setSegmentBackup(values.segment)
      setCategoryError(null)
      update('segment', NEW_CATEGORY_VALUE)
      return
    }
    update('segment', value)
  }

  async function handleAddCategory() {
    const name = newCategory.trim()
    if (!name) {
      setCategoryError('Category name is required.')
      return
    }
    if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      setCategoryError('This category already exists.')
      return
    }
    setAddingCategory(true)
    setCategoryError(null)
    try {
      const record = await categoriesApi.create({ name })
      setCategories((current) =>
        current.some((category) => category.id === record.id)
          ? current
          : [...current, { id: record.id, name: record.name }],
      )
      update('segment', record.name)
      setNewCategory('')
    } catch (error) {
      setCategoryError(getApiErrorMessage(error))
    } finally {
      setAddingCategory(false)
    }
  }

  function handleCancelCategory() {
    update('segment', segmentBackup || categories[0]?.name || '')
    setNewCategory('')
    setCategoryError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const b2bPriceNum = values.b2bPrice === '' ? null : Number(values.b2bPrice)
    const validation = validateRequired(values, [
      { name: 'name', label: 'Package title' },
      { name: 'destination', label: 'Destination' },
      { name: 'price', label: 'Price' },
    ])
    if (b2bPriceNum != null && b2bPriceNum > Number(values.price)) {
      validation.errors.b2bPrice = 'B2B price cannot be higher than the B2C price.'
      validation.valid = false
    }
    setErrors(validation.errors)
    if (!validation.valid) return

    const formattedHotels = values.hotels
      .filter((h) => h.name?.trim())
      .map((h) => (h.address?.trim() ? `${h.name.trim()} (${h.address.trim()})` : h.name.trim()))

    await onSubmit?.({
      name: values.name,
      segment: values.segment,
      country: values.country,
      destination: values.destination,
      description: values.description,
      coverImage: values.coverImage.trim(),
      gallery: values.gallery.map((url) => url.trim()).filter(Boolean),
      included: values.included.map((item) => item.trim()).filter(Boolean),
      excluded: values.excluded.map((item) => item.trim()).filter(Boolean),
      hotels: formattedHotels,
      itinerary: values.itinerary
        .filter((item) => item.title.trim() || item.description.trim())
        .map((item, index) => ({
          day: index + 1,
          title: item.title.trim() || `Day ${index + 1}`,
          description: item.description.trim(),
        })),
      terms: values.terms,
      durationDays: Number(values.durationDays) || 1,
      priceCurrency: values.priceCurrency,
      price: Number(values.price) || 0,
      b2bPrice: b2bPriceNum === null ? null : Number(values.b2bPrice) || 0,
      seats: Number(values.seats) || 0,
      status: values.status,
    })
  }

  // Keep legacy/renamed segment values visible in the dropdown.
  const categoryOptions = categories.map((category) => ({ value: category.name, label: category.name }))
  if (
    values.segment &&
    values.segment !== NEW_CATEGORY_VALUE &&
    !categories.some((category) => category.name === values.segment)
  ) {
    categoryOptions.unshift({ value: values.segment, label: values.segment })
  }
  const currencySymbol = values.priceCurrency === 'USD' ? '$' : 'BDT'

  const durationNum = Number(values.durationDays) || 1
  const nightsNum = durationNum > 1 ? durationNum - 1 : 0

  return (
    <form className="card stack" onSubmit={handleSubmit} noValidate style={{ maxWidth: 800, padding: 28, margin: '0 auto' }}>

      {/* Basic Overview */}
      <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>
          Tour Package Details
        </h3>
        <p className="muted small" style={{ margin: '3px 0 0' }}>
          Fill in the package information, pricing, itinerary, and accommodation.
        </p>
      </div>

      <Input
        label="Package Title"
        value={values.name}
        error={errors.name}
        placeholder="e.g. Cox's Bazar Luxury Beach Escape"
        onChange={(event) => update('name', event.target.value)}
      />

      <div className="grid grid--3" style={{ gap: 12 }}>
        <Select
          label="Segment / Category"
          value={values.segment}
          options={[...categoryOptions, { value: NEW_CATEGORY_VALUE, label: '+ Create new category…' }]}
          onChange={handleSegmentChange}
        />

        <Input
          label="Country"
          value={values.country}
          placeholder="e.g. Bangladesh"
          onChange={(event) => update('country', event.target.value)}
        />

        <Input
          label="Destination"
          value={values.destination}
          error={errors.destination}
          placeholder="e.g. Cox's Bazar, Bangladesh"
          onChange={(event) => update('destination', event.target.value)}
        />
      </div>

      {values.segment === NEW_CATEGORY_VALUE ? (
        <div
          style={{
            padding: 14,
            background: 'var(--color-bg)',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label className="field__label" style={{ marginBottom: 0, fontSize: 13, fontWeight: 600 }}>
            New category
          </label>
          <div className="row" style={{ alignItems: 'center', gap: 8 }}>
            <Input
              className="flex-1"
              value={newCategory}
              error={categoryError}
              autoFocus
              placeholder="e.g. Safari & Wildlife"
              aria-label="New category name"
              onChange={(event) => setNewCategory(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAddCategory()
                }
              }}
            />
            <Button size="sm" type="button" loading={addingCategory} onClick={handleAddCategory}>
              Add
            </Button>
            <Button variant="ghost" size="sm" type="button" onClick={handleCancelCategory}>
              Cancel
            </Button>
          </div>
          <p className="muted small" style={{ margin: 0 }}>
            Saved to your category list and reusable for every package.
          </p>
        </div>
      ) : null}

      {/* Pricing & Duration */}
      <div className="grid grid--3" style={{ gap: 12 }}>
        <div>
          <Input
            label="Duration (Days)"
            type="number"
            min="1"
            value={values.durationDays}
            onChange={(event) => update('durationDays', event.target.value)}
          />
          <span className="muted small" style={{ fontSize: 11, marginTop: 3, display: 'block' }}>
            {durationNum} Days / {nightsNum} Night{nightsNum !== 1 ? 's' : ''}
          </span>
        </div>

        <Select
          label="Price Currency"
          value={values.priceCurrency}
          options={CURRENCY_OPTIONS}
          onChange={(event) => update('priceCurrency', event.target.value)}
        />

        <Input
          label="Available Seats"
          type="number"
          min="0"
          value={values.seats}
          onChange={(event) => update('seats', event.target.value)}
        />
      </div>

      <div className="grid grid--3" style={{ gap: 12 }}>
        <Input
          label={`B2C Price / Person (${currencySymbol})`}
          type="number"
          min="0"
          value={values.price}
          error={errors.price}
          hint="Public price shown to retail customers."
          placeholder={currencySymbol === 'USD' ? '120' : '12500'}
          onChange={(event) => update('price', event.target.value)}
        />

        <Input
          label={`B2B Price / Person (${currencySymbol})`}
          type="number"
          min="0"
          value={values.b2bPrice}
          error={errors.b2bPrice}
          hint="Agent & partner price. Leave empty to use the B2C price."
          placeholder={currencySymbol === 'USD' ? '95' : '10000'}
          onChange={(event) => update('b2bPrice', event.target.value)}
        />

        <Select
          label="Publication Status"
          value={values.status}
          onChange={(event) => update('status', event.target.value)}
          options={TOUR_STATUSES.map((status) => ({ value: status, label: titleCase(status) }))}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="tour-description">
          Overview &amp; Description
        </label>
        <textarea
          id="tour-description"
          className="field__control"
          rows={3}
          value={values.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder="A short, engaging description of this tour..."
        />
      </div>

      {/* Media */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
        <Input
          label="Cover Image URL"
          value={values.coverImage}
          placeholder="https://images.unsplash.com/…"
          onChange={(event) => update('coverImage', event.target.value)}
        />
      </div>

      <StringListEditor
        label="Gallery Photo URLs"
        placeholder="https://…"
        emptyHint="Add photo URLs for the gallery."
        items={values.gallery}
        onChange={(items) => update('gallery', items)}
      />

      {/* Hotels */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
        <HotelsEditor
          hotels={values.hotels}
          onChange={(hotels) => update('hotels', hotels)}
        />
      </div>

      {/* Itinerary */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
        <ItineraryEditor
          items={values.itinerary}
          onChange={(items) => update('itinerary', items)}
        />
      </div>

      {/* Services & Terms */}
      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }} className="grid grid--2">
        <StringListEditor
          label="Included Services"
          placeholder="e.g. Daily breakfast"
          emptyHint="List included services."
          items={values.included}
          onChange={(items) => update('included', items)}
        />

        <StringListEditor
          label="Excluded Services"
          placeholder="e.g. Personal shopping"
          emptyHint="List excluded services."
          items={values.excluded}
          onChange={(items) => update('excluded', items)}
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="tour-terms">
          Terms &amp; Cancellation Policy
        </label>
        <textarea
          id="tour-terms"
          className="field__control"
          rows={3}
          value={values.terms}
          onChange={(event) => update('terms', event.target.value)}
          placeholder="Cancellation policy, payment deposit terms..."
        />
      </div>

      {/* Submit Controls */}
      <div className="row end" style={{ gap: 10, borderTop: '1px solid var(--color-border)', paddingTop: 18 }}>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>

    </form>
  )
}
