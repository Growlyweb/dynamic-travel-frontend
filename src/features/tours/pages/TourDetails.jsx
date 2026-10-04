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

export default function TourDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
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
            <Link to={APP_ROUTES.TOUR_EDIT(tour.id)}>
              <Button>Edit</Button>
            </Link>
          </>
        }
      />

      <div className="card">
        <div className="row between row--wrap">
          <span style={{ fontSize: 40 }} aria-hidden>
            {tour.cover ?? '🧳'}
          </span>
          <TourStatusBadge status={tour.status} />
        </div>
        <dl className="detail-list mt-4">
          <div>
            <dt>Price per person</dt>
            <dd>{formatCurrency(tour.price)}</dd>
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
      </div>
    </div>
  )
}
