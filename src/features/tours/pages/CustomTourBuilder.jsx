import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { toursApi } from '../tours.api'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate } from '../../../utils/formatters'
import { isPhone } from '../../../utils/validators'
import { getApiErrorMessage } from '../../../utils/helpers'
import { downloadPdf, formatDurationNights, padDay } from '../../../utils/itineraryPdf'
import { useNotifications } from '../../../context/NotificationContext'
import { config } from '../../../app/config'

const STEPS = [
  { key: 'customer', label: 'Customer' },
  { key: 'trip', label: 'Trip & dates' },
  { key: 'preferences', label: 'Preferences' },
  { key: 'activities', label: 'Activities' },
]

const HOTEL_OPTIONS = [
  { value: 'budget', label: 'Budget / guesthouse' },
  { value: '3-star', label: '3-star hotel' },
  { value: '4-star', label: '4-star hotel' },
  { value: '5-star', label: '5-star hotel' },
  { value: 'resort', label: 'Beach resort' },
  { value: 'villa', label: 'Private villa' },
]

const TRANSPORT_OPTIONS = ['Flight', 'Private car', 'Minibus', 'Train', 'Self-drive']

const SUGGESTED_ACTIVITIES = [
  'City tour',
  'Beach day',
  'Snorkeling / diving',
  'Hiking',
  'Museum visits',
  'Food tour',
  'Shopping',
  'Wildlife safari',
]

const HOTEL_LABELS = Object.fromEntries(HOTEL_OPTIONS.map((option) => [option.value, option.label]))

const EMPTY_VALUES = {
  customer: '',
  phone: '',
  destination: '',
  startDate: '',
  endDate: '',
  travelers: '2',
  hotel: '',
  transportation: 'Private car',
  activities: [],
  otherActivities: '',
  requirements: '',
}

const MS_PER_DAY = 86400000

function tripDays(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(1, Math.min(21, Math.round((end - start) / MS_PER_DAY) + 1))
}

function describeDay(title, values) {
  if (title === 'Rest & local time') return 'A slower day for the pool, spa or optional add-ons before the next activity.'
  if (title === 'Free exploration')
    return 'A flexible day to explore the highlights at your own pace — our consultant will suggest options.'
  return `Reserved for ${title.toLowerCase()} in and around ${values.destination}, arranged at your pace.`
}

function buildItinerary(values) {
  const days = tripDays(values.startDate, values.endDate)
  const activities = [
    ...values.activities,
    ...values.otherActivities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ]
  const arrival = {
    day: 1,
    title: `Arrival in ${values.destination}`,
    description: `${values.transportation} arrival, check-in at your ${HOTEL_LABELS[values.hotel] ?? 'chosen'} property and an orientation evening.`,
  }

  if (days <= 2) {
    const single = [
      arrival,
      {
        day: days,
        title: activities[0] ?? 'Day trip & departure',
        description: activities[0] ? describeDay(activities[0], values) : 'Explore the highlights and depart in the evening.',
      },
    ]
    return single
  }

  const middleDays = days - 2
  const middle = []
  if (activities.length === 0) {
    for (let index = 0; index < middleDays; index += 1) {
      middle.push(index === 0 ? 'Free exploration' : 'Rest & local time')
    }
  } else if (activities.length >= middleDays) {
    const perDay = Math.ceil(activities.length / middleDays)
    for (let index = 0; index < middleDays; index += 1) {
      middle.push(activities.slice(index * perDay, (index + 1) * perDay).join(' & '))
    }
  } else {
    activities.forEach((activity) => middle.push(activity))
    while (middle.length < middleDays) middle.push('Rest & local time')
  }

  const plan = [arrival]
  middle.forEach((title) => {
    plan.push({ day: plan.length + 1, title, description: describeDay(title, values) })
  })
  plan.push({
    day: days,
    title: 'Departure',
    description: `Check-out and ${values.transportation.toLowerCase()} transfer for the journey home.`,
  })
  return plan
}

export default function CustomTourBuilder() {
  const { push } = useNotifications()
  const [step, setStep] = useState(0)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})
  const [itinerary, setItinerary] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
  }

  function toggleActivity(activity) {
    setValues((current) => ({
      ...current,
      activities: current.activities.includes(activity)
        ? current.activities.filter((item) => item !== activity)
        : [...current.activities, activity],
    }))
  }

  function validateStep(index) {
    const key = STEPS[index].key
    const errors = {}
    if (key === 'customer') {
      if (!values.customer.trim()) errors.customer = 'Customer name is required.'
      if (!isPhone(values.phone)) errors.phone = 'Enter a valid phone number.'
    }
    if (key === 'trip') {
      if (!values.destination.trim()) errors.destination = 'Destination is required.'
      if (!values.startDate) errors.startDate = 'Pick a travel start date.'
      if (!values.endDate) errors.endDate = 'Pick a travel end date.'
      if (values.startDate && values.endDate && new Date(values.endDate) < new Date(values.startDate)) {
        errors.endDate = 'End date must be after the start date.'
      }
      if (!Number(values.travelers) || Number(values.travelers) < 1) errors.travelers = 'Enter at least 1 traveler.'
    }
    if (key === 'preferences' && !values.hotel) errors.hotel = 'Select a hotel preference.'
    return errors
  }

  function goNext() {
    const stepErrors = validateStep(step)
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors)
      return
    }
    setErrors({})
    setStep((current) => current + 1)
  }

  function goBack() {
    setErrors({})
    setStep((current) => Math.max(0, current - 1))
  }

  function handleGenerate() {
    const stepErrors = validateStep(step)
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors)
      return
    }
    setItinerary(buildItinerary(values))
  }

  function handleDownloadPdf() {
    downloadPdf({
      fileName: `custom-itinerary-${(values.destination || 'trip').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
      brand: config.appName,
      infoBar: [
        ['Destination', values.destination || '—'],
        ['Duration', formatDurationNights(itinerary.length)],
        ['Pax', `${values.travelers} pax`],
      ],
      title: 'Custom Tour Itinerary',
      subtitle: `${formatDate(values.startDate)} – ${formatDate(values.endDate)} · ${values.customer}`,
      footerLabel: 'Custom tour request',
      blocks: [
        { bar: 'Client Contact Information' },
        {
          rows: [
            ['Customer', values.customer],
            ['Phone', values.phone],
            ['Pax / travelers', values.travelers],
            ['Travel dates', `${formatDate(values.startDate)} – ${formatDate(values.endDate)}`],
            ['Hotel preference', HOTEL_LABELS[values.hotel] ?? '—'],
            ['Transportation', values.transportation],
            ['Activities', [...values.activities, values.otherActivities].filter(Boolean).join(', ') || 'Open to suggestions'],
            ['Special requirements', values.requirements || 'None'],
          ],
        },
        { bar: 'Day-by-day Itinerary' },
        ...itinerary.map((item) => ({
          day: `Day ${padDay(item.day)}: ${item.title}`,
          lines: [item.description],
        })),
        { lines: ['This is a draft plan. Our travel consultant will confirm availability and final pricing.'] },
      ],
    })
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const activities = [...values.activities, ...values.otherActivities.split(',').map((item) => item.trim()).filter(Boolean)]
      await toursApi.createCustom({
        customer: values.customer.trim(),
        phone: values.phone.trim(),
        destination: values.destination.trim(),
        travelers: Number(values.travelers) || 1,
        startDate: values.startDate,
        endDate: values.endDate,
        hotel: values.hotel,
        transportation: values.transportation,
        activities,
        requirements: values.requirements.trim(),
        itinerary,
      })
      push({
        type: 'tour',
        title: 'New custom tour request',
        body: `${values.customer.trim()} requested a custom itinerary for ${values.destination.trim()}.`,
      })
      setSubmitted(true)
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="stack">
        <PageHeader
          title="Custom tour request sent"
          breadcrumbs={[
            { label: 'Tours', to: APP_ROUTES.TOURS },
            { label: 'Custom tours', to: APP_ROUTES.TOUR_CUSTOM },
            { label: 'Builder' },
          ]}
        />
        <div className="card stack">
          <div className="alert alert--success">
            The custom itinerary request for {values.destination} was submitted. Download the PDF summary or track it
            under Custom tour requests.
          </div>
          <div className="row">
            <Button onClick={handleDownloadPdf}>Download PDF summary</Button>
            <Link to={APP_ROUTES.TOUR_CUSTOM}>
              <Button variant="ghost">View custom tour requests</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const currentKey = STEPS[step].key

  return (
    <div className="stack">
      <PageHeader
        title="Custom tour builder"
        description="Collect the client's request, generate a day-by-day itinerary and send it to the team as a PDF."
        breadcrumbs={[
          { label: 'Tours', to: APP_ROUTES.TOURS },
          { label: 'Custom tours', to: APP_ROUTES.TOUR_CUSTOM },
          { label: 'Builder' },
        ]}
      />

      <div className="card">
        <ol className="row row--wrap gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {STEPS.map((item, index) => (
            <li key={item.key}>
              <span
                className={`badge ${
                  itinerary || index < step ? 'badge--success' : index === step ? 'badge--primary' : 'badge--neutral'
                }`}
              >
                {index + 1}. {item.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {itinerary ? (
        <div className="grid grid--2" style={{ alignItems: 'start' }}>
          <section className="card stack">
            <h2 className="card__title">Request summary</h2>
            <dl className="detail-list">
              <div>
                <dt>Customer</dt>
                <dd>{values.customer}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{values.phone}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>{values.destination}</dd>
              </div>
              <div>
                <dt>Pax / travelers</dt>
                <dd>{values.travelers}</dd>
              </div>
              <div>
                <dt>Travel dates</dt>
                <dd>
                  {formatDate(values.startDate)} – {formatDate(values.endDate)}
                </dd>
              </div>
              <div>
                <dt>Hotel preference</dt>
                <dd>{HOTEL_LABELS[values.hotel]}</dd>
              </div>
              <div>
                <dt>Transportation</dt>
                <dd>{values.transportation}</dd>
              </div>
            </dl>
            {values.activities.length || values.otherActivities ? (
              <p className="muted small">
                Activities: {[...values.activities, values.otherActivities].filter(Boolean).join(', ')}
              </p>
            ) : null}
            {values.requirements ? <p className="muted small">Special requirements: {values.requirements}</p> : null}
            <div className="row row--wrap">
              <Button onClick={handleDownloadPdf}>Download PDF summary</Button>
              <Button loading={submitting} onClick={handleSubmit}>
                Submit request
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setItinerary(null)
                  setStep(STEPS.length - 1)
                }}
              >
                Edit answers
              </Button>
            </div>
            {submitError ? <div className="alert alert--danger">{submitError}</div> : null}
          </section>

          <section className="card stack">
            <h2 className="card__title">Generated custom itinerary</h2>
            <ol className="timeline">
              {itinerary.map((item) => (
                <li key={item.day} className="timeline__item">
                  <span className="timeline__dot" aria-hidden />
                  <p className="timeline__label">
                    Day {item.day}: {item.title}
                  </p>
                  <p className="muted small">{item.description}</p>
                </li>
              ))}
            </ol>
            <p className="muted small">Draft plan — our travel consultant will confirm availability and final pricing.</p>
          </section>
        </div>
      ) : (
        <form
          className="card stack"
          style={{ maxWidth: 620 }}
          onSubmit={(event) => {
            event.preventDefault()
            if (step === STEPS.length - 1) handleGenerate()
            else goNext()
          }}
          noValidate
        >
          <p className="strong">
            Step {step + 1} of {STEPS.length}: {STEPS[step].label}
          </p>

          {currentKey === 'customer' ? (
            <>
              <Input
                label="Customer name"
                value={values.customer}
                error={errors.customer}
                placeholder="e.g. Jane & Mark Doyle"
                onChange={(event) => update('customer', event.target.value)}
              />
              <Input
                label="Phone number"
                type="tel"
                value={values.phone}
                error={errors.phone}
                placeholder="+880 1XXX XXX XXX"
                onChange={(event) => update('phone', event.target.value)}
              />
            </>
          ) : null}
          {currentKey === 'trip' ? (
            <>
              <Input
                label="Destination"
                value={values.destination}
                error={errors.destination}
                placeholder="e.g. Bali, Indonesia"
                onChange={(event) => update('destination', event.target.value)}
              />
              <div className="grid grid--2" style={{ gap: 12 }}>
                <Input
                  label="Travel start date"
                  type="date"
                  value={values.startDate}
                  error={errors.startDate}
                  onChange={(event) => update('startDate', event.target.value)}
                />
                <Input
                  label="Travel end date"
                  type="date"
                  value={values.endDate}
                  error={errors.endDate}
                  onChange={(event) => update('endDate', event.target.value)}
                />
              </div>
              <Input
                label="Pax / travelers"
                type="number"
                min="1"
                value={values.travelers}
                error={errors.travelers}
                onChange={(event) => update('travelers', event.target.value)}
              />
            </>
          ) : null}
          {currentKey === 'preferences' ? (
            <>
              <Select
                label="Hotel preference"
                value={values.hotel}
                error={errors.hotel}
                placeholder="Select preference"
                options={HOTEL_OPTIONS}
                onChange={(event) => update('hotel', event.target.value)}
              />
              <div className="stack stack--sm">
                <p className="field__label" style={{ marginBottom: 0 }}>
                  Transportation
                </p>
                {TRANSPORT_OPTIONS.map((option) => (
                  <label key={option} className="row gap-2" style={{ cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="transportation"
                      value={option}
                      checked={values.transportation === option}
                      onChange={(event) => update('transportation', event.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </>
          ) : null}
          {currentKey === 'activities' ? (
            <>
              <div className="stack stack--sm">
                <p className="field__label" style={{ marginBottom: 0 }}>
                  Activities
                </p>
                <div className="row row--wrap gap-2">
                  {SUGGESTED_ACTIVITIES.map((activity) => (
                    <label key={activity} className="badge badge--neutral" style={{ cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={values.activities.includes(activity)}
                        onChange={() => toggleActivity(activity)}
                        style={{ marginRight: 6 }}
                      />
                      {activity}
                    </label>
                  ))}
                </div>
                <Input
                  label="Other activities (comma separated)"
                  value={values.otherActivities}
                  placeholder="e.g. Hot air balloon, cooking class"
                  onChange={(event) => update('otherActivities', event.target.value)}
                />
              </div>
              <div className="field">
                <label className="field__label" htmlFor="custom-requirements">
                  Special requirements
                </label>
                <textarea
                  id="custom-requirements"
                  className="field__control"
                  rows={4}
                  value={values.requirements}
                  placeholder="Dietary needs, accessibility, celebrations, room preferences…"
                  onChange={(event) => update('requirements', event.target.value)}
                />
              </div>
            </>
          ) : null}

          <div className="row">
            {step > 0 ? (
              <Button type="button" variant="ghost" onClick={goBack}>
                Back
              </Button>
            ) : null}
            {step === STEPS.length - 1 ? (
              <Button type="submit">Generate custom itinerary</Button>
            ) : (
              <Button type="submit">Next</Button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
