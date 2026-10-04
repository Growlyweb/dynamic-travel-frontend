import { useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TourStatusBadge from './TourStatusBadge'
import { APP_ROUTES } from '../../../utils/constants'
import { useCurrency } from '../../../context/CurrencyContext'
import { usePermission } from '../../../hooks/usePermission'

const COUNTRY_FLAGS = {
  Indonesia: '🇮🇩',
  Switzerland: '🇨🇭',
  UAE: '🇦🇪',
  Thailand: '🇹🇭',
  Nepal: '🇳🇵',
  Maldives: '🇲🇻',
  India: '🇮🇳',
  Japan: '🇯🇵',
  France: '🇫🇷',
  Italy: '🇮🇹',
  Bangladesh: '🇧🇩',
  Malaysia: '🇲🇾',
  Singapore: '🇸🇬',
  Vietnam: '🇻🇳',
  Turkey: '🇹🇷',
}

function getFlag(country) {
  if (!country) return '🌍'
  const entry = Object.entries(COUNTRY_FLAGS).find(([key]) =>
    country.toLowerCase().includes(key.toLowerCase())
  )
  return entry ? entry[1] : '🌍'
}

function formatNights(days) {
  const d = Number(days) || 1
  const n = d - 1
  return n > 0 ? `${d} Days · ${n} Night${n > 1 ? 's' : ''}` : `${d} Day`
}

/* ── Kebab menu ─────────────────────────────────────────── */
function KebabMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div
      className="tc-kebab"
      ref={ref}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="tc-kebab__trigger"
        aria-label="More actions"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        ⋮
      </button>
      {open && (
        <div className="tc-kebab__menu" role="menu" onClick={(e) => e.stopPropagation()}>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`tc-kebab__item${item.danger ? ' tc-kebab__item--danger' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                item.onClick()
              }}
              disabled={item.disabled}
            >
              <span className="tc-kebab__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main Card ──────────────────────────────────────────── */
export default function TourCard({ tour, onDelete }) {
  const { formatTourPrice } = useCurrency()
  const { can } = usePermission()
  const navigate = useNavigate()

  const [coverFailed, setCoverFailed] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const showCover = tour.coverImage && !coverFailed
  const flag = getFlag(tour.country || tour.destination)
  const canEdit = can('tours.edit')

  async function doDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try { await onDelete?.(tour.id) }
    finally { setDeleting(false); setConfirmDelete(false) }
  }

  const menuItems = [
    {
      label: 'View details',
      icon: '👁',
      onClick: () => navigate(APP_ROUTES.TOUR_DETAILS(tour.id)),
    },
    ...(canEdit ? [{
      label: 'Edit',
      icon: '✏️',
      onClick: () => navigate(APP_ROUTES.TOUR_EDIT(tour.id)),
    }] : []),
    ...(canEdit && onDelete ? [{
      label: deleting ? 'Deleting…' : confirmDelete ? 'Confirm delete' : 'Delete',
      icon: deleting ? '⏳' : '🗑',
      danger: true,
      disabled: deleting,
      onClick: doDelete,
    }] : []),
  ]

  return (
    <div
      className={`tc${confirmDelete ? ' tc--confirm' : ''}`}
      id={`tour-card-${tour.id}`}
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(APP_ROUTES.TOUR_DETAILS(tour.id))}
    >

      {/* ── LEFT: image thumbnail ── */}
      <div className="tc__thumb">
        {showCover ? (
          <img
            src={tour.coverImage}
            alt={tour.name}
            className="tc__thumb-img"
            onError={() => setCoverFailed(true)}
          />
        ) : (
          <div className="tc__thumb-placeholder" aria-hidden>🧳</div>
        )}
        <span className="tc__flag" title={tour.country || tour.destination}>{flag}</span>
      </div>

      {/* ── RIGHT: info ── */}
      <div className="tc__body">

        {/* Row 1 — title + kebab */}
        <div className="tc__top">
          <Link
            to={APP_ROUTES.TOUR_DETAILS(tour.id)}
            className="tc__title-link"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="tc__title">{tour.name}</h3>
          </Link>
          <KebabMenu items={menuItems} />
        </div>

        {/* Row 2 — destination */}
        <p className="tc__destination">📍 {tour.destination}</p>

        {/* Row 3 — duration · rating */}
        <div className="tc__stats">
          <span className="tc__stat">🗓 {formatNights(tour.durationDays)}</span>
          <span className="tc__dot" aria-hidden>·</span>
          <span className="tc__stat">⭐ {tour.rating ?? '—'}</span>
          {tour.seats != null && (
            <>
              <span className="tc__dot" aria-hidden>·</span>
              <span className="tc__stat">💺 {tour.seats} seats</span>
            </>
          )}
        </div>

        {/* Row 4 — price + status */}
        <div className="tc__footer">
          <div className="tc__price-block">
            <span className="tc__price">{formatTourPrice(tour)}</span>
            <span className="tc__per">/ Person</span>
          </div>
          <TourStatusBadge status={tour.status} />
        </div>

        {/* Confirm-delete banner */}
        {confirmDelete && (
          <div className="tc__confirm-banner" onClick={(e) => e.stopPropagation()}>
            <span>Delete this package?</span>
            <div className="tc__confirm-actions">
              <button
                type="button"
                className="btn btn--sm btn--danger"
                onClick={(e) => {
                  e.stopPropagation()
                  doDelete()
                }}
                disabled={deleting}
                id={`tour-confirm-delete-${tour.id}`}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  setConfirmDelete(false)
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
