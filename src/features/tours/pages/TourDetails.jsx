import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import TourStatusBadge from '../components/TourStatusBadge'
import { toursApi } from '../tours.api'
import { APP_ROUTES } from '../../../utils/constants'
import { formatCurrency } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'
import { config } from '../../../app/config'
import { useCurrency } from '../../../context/CurrencyContext'

function CoverImage({ tour }) {
  const [failed, setFailed] = useState(false)
  if (tour.coverImage && !failed) {
    return (
      <img
        src={tour.coverImage}
        alt={tour.name}
        style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 10 }}
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div
      className="tour-card__cover"
      aria-hidden
      style={{ height: 200, fontSize: 56, borderRadius: 10 }}
    >
      {tour.cover ?? '🧳'}
    </div>
  )
}

function Gallery({ tour }) {
  const [failed, setFailed] = useState([])
  if (!tour.gallery?.length) return null
  return (
    <section className="card stack">
      <h2 className="card__title">Gallery</h2>
      <div className="grid grid--3" style={{ gap: 10 }}>
        {tour.gallery.map((url, index) =>
          failed.includes(index) ? (
            <div key={url} className="tour-card__cover" aria-hidden style={{ height: 120 }}>
              🖼️
            </div>
          ) : (
            <img
              key={url}
              src={url}
              alt={`${tour.name} gallery photo ${index + 1}`}
              style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
              onError={() => setFailed((current) => [...current, index])}
            />
          ),
        )}
      </div>
    </section>
  )
}

function Itinerary({ tour }) {
  if (!tour.itinerary?.length) return null
  return (
    <section className="card stack">
      <h2 className="card__title">Itinerary</h2>
      <ol className="timeline">
        {tour.itinerary.map((item) => (
          <li key={item.day} className="timeline__item">
            <span className="timeline__dot" aria-hidden />
            <p className="timeline__label">
              Day {item.day}: {item.title}
            </p>
            {item.description ? <p className="muted small">{item.description}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  )
}

function Services({ tour }) {
  if (!tour.included?.length && !tour.excluded?.length) return null
  return (
    <section className="grid grid--2">
      {tour.included?.length ? (
        <div className="card stack stack--sm">
          <h2 className="card__title">Included services</h2>
          <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tour.included.map((item) => (
              <li key={item} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                <span aria-hidden style={{ color: 'var(--color-success, #16a34a)' }}>
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {tour.excluded?.length ? (
        <div className="card stack stack--sm">
          <h2 className="card__title">Excluded services</h2>
          <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tour.excluded.map((item) => (
              <li key={item} className="row gap-2" style={{ alignItems: 'flex-start' }}>
                <span aria-hidden style={{ color: 'var(--color-danger, #ef4444)' }}>
                  ✕
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

export default function TourDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { formatTourPrice } = useCurrency()
  const [tour, setTour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    toursApi
      .get(id)
      .then((result) => active && setTour(result))
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  if (loading) return <Loader fullPage label="Loading tour…" />
  if (error) return <ErrorState title="Could not load this tour" message={getApiErrorMessage(error)} />

  function handleDownloadPdf() {
    downloadPdf({
      fileName: `${tour.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-itinerary.pdf`,
      brand: config.appName,
      infoBar: [
        ['Country', tour.destination],
        ['Duration', formatDurationNights(tour.durationDays)],
        ['Price', formatCurrency(tour.price)],
      ],
      title: tour.name,
      footerLabel: `${tour.name} — tour package`,
      blocks: [
        { bar: 'Tour Details' },
        ...(tour.description ? [{ lines: [tour.description] }] : []),
        ...(tour.itinerary ?? []).map((item) => ({
          day: `Day ${padDay(item.day)}: ${item.title}`,
          lines: item.description ? [item.description] : [],
        })),
        ...(tour.included?.length ? [{ bar: 'Includes' }, { bullets: tour.included }] : []),
        ...(tour.excluded?.length ? [{ bar: 'Excludes' }, { bullets: tour.excluded }] : []),
        ...(tour.hotels?.length ? [{ bar: 'Hotel' }, { lines: tour.hotels }] : []),
        ...(tour.terms ? [{ bar: 'Terms & Conditions' }, { lines: tour.terms.split('\n') }] : []),
      ],
    })
  }

  return (
    <div className="stack">
      <PageHeader
        title={tour.name}
        description={tour.destination}
        breadcrumbs={[{ label: 'Tours', to: APP_ROUTES.TOURS }, { label: tour.name }]}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate(APP_ROUTES.TOURS)}>
              Back
            </Button>
            <Button variant="subtle" onClick={handleDownloadPdf}>
              Download itinerary PDF
            </Button>
            <Link to={APP_ROUTES.TOUR_EDIT(tour.id)}>
              <Button>Edit</Button>
            </Link>
          </>
        }
      />

      <section className="card stack">
        <div className="row between row--wrap">
          <span className="badge badge--primary">{tour.destination}</span>
          <TourStatusBadge status={tour.status} />
        </div>
        <CoverImage tour={tour} />
        <dl className="detail-list mt-4">
          <div>
            <dt>Price per person</dt>
            <dd>{formatTourPrice(tour)}</dd>
          </div>
          <div>
            <dt>Duration</dt>
            <dd>{tour.durationDays} days</dd>
          </div>
          <div>
            <dt>Seats</dt>
            <dd>{tour.seats}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>★ {tour.rating ?? '—'}</dd>
          </div>
        </dl>
        {tour.description ? <p className="muted mt-4">{tour.description}</p> : null}
      </section>

      <Itinerary tour={tour} />
      <Services tour={tour} />

      {tour.hotels?.length ? (
        <section className="card stack">
          <h2 className="card__title">Hotels</h2>
          <ul className="stack stack--sm" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {tour.hotels.map((hotel) => (
              <li key={hotel}>🏨 {hotel}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <Gallery tour={tour} />

      {tour.terms ? (
        <section className="card stack">
          <h2 className="card__title">Terms &amp; conditions</h2>
          <p className="muted" style={{ whiteSpace: 'pre-line' }}>
            {tour.terms}
          </p>
        </section>
      ) : null}
    </div>
  )
}
