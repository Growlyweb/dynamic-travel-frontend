import { Link } from 'react-router-dom'
import TourStatusBadge from './TourStatusBadge'
import { APP_ROUTES } from '../../../utils/constants'
import { formatCurrency } from '../../../utils/formatters'

export default function TourCard({ tour }) {
  return (
    <div className="card tour-card">
      <div className="tour-card__cover" aria-hidden>
        {tour.cover ?? '🧳'}
      </div>
      <div className="tour-card__body">
        <div className="row between">
          <p className="strong">{tour.name}</p>
          <TourStatusBadge status={tour.status} />
        </div>
        <p className="muted small">
          {tour.destination} · {tour.durationDays} days · ★ {tour.rating ?? '—'}
        </p>
        <div className="tour-card__meta">
          <span className="tour-card__price">{formatCurrency(tour.price)}</span>
          <Link to={APP_ROUTES.TOUR_DETAILS(tour.id)}>View details</Link>
        </div>
      </div>
    </div>
  )
}
