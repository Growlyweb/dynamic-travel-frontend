import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import TourCard from '../components/TourCard'
import { toursApi } from '../tours.api'
import { APP_ROUTES } from '../../../utils/constants'
import { usePermission } from '../../../hooks/usePermission'
import { errorMessage } from '../../../utils/errors'
import { useToast } from '../../../context/ToastContext'

// Derive the country from the tour's `country` field, or fallback to last part of destination
function getCountry(tour) {
  if (tour.country) return tour.country
  const dest = tour.destination ?? ''
  // "City, Country" → "Country"; if no comma, use full destination
  const parts = dest.split(',')
  return parts.length > 1 ? parts[parts.length - 1].trim() : dest.trim()
}

export default function TourPackages() {
  const { can } = usePermission()
  const toast = useToast()
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCountry, setActiveCountry] = useState('All')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // A package list is small, so the page reads up to 500 of them and groups them by country.
      const result = await toursApi.list({ pageSize: 500 })
      setTours(result.items ?? [])
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete(id) {
    try {
      await toursApi.remove(id)
      setTours((prev) => prev.filter((t) => t.id !== id))
      toast.success('Package removed.')
    } catch (failure) {
      toast.error(errorMessage(failure))
    }
  }

  // Build country list from tours
  const countries = useMemo(() => {
    const all = tours.map(getCountry)
    return ['All', ...Array.from(new Set(all)).sort()]
  }, [tours])

  // Filter tours by selected country
  const filteredTours = useMemo(() => {
    if (activeCountry === 'All') return tours
    return tours.filter((t) => getCountry(t) === activeCountry)
  }, [tours, activeCountry])

  // Group by country for the "All" view
  const grouped = useMemo(() => {
    if (activeCountry !== 'All') {
      return [{ country: activeCountry, tours: filteredTours }]
    }
    const map = {}
    tours.forEach((t) => {
      const c = getCountry(t)
      if (!map[c]) map[c] = []
      map[c].push(t)
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, items]) => ({ country, items }))
  }, [tours, activeCountry, filteredTours])

  if (loading) return <Loader fullPage label="Loading tours…" />
  if (error) return <ErrorState title="Could not load tour packages" message={errorMessage(error)} onRetry={load} />

  return (
    <div className="stack">
      <PageHeader
        title="Tour packages"
        breadcrumbs={[{ label: 'Tours' }, { label: 'Packages' }]}
        actions={
          can('TOUR_MANAGE') ? (
            <Link to={APP_ROUTES.TOUR_CREATE}>
              <Button>+ New package</Button>
            </Link>
          ) : null
        }
      />

      {tours.length === 0 ? (
        <ErrorState title="No packages yet" message="Create your first tour package to see it here." />
      ) : (
        <>
          {/* Country filter tabs */}
          <div className="tour-country-tabs" role="tablist" aria-label="Filter by country">
            {countries.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={activeCountry === c}
                className={`tour-country-tab ${activeCountry === c ? 'tour-country-tab--active' : ''}`}
                onClick={() => setActiveCountry(c)}
                id={`country-tab-${c.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {c}
                <span className="tour-country-tab__count">
                  {c === 'All' ? tours.length : tours.filter((t) => getCountry(t) === c).length}
                </span>
              </button>
            ))}
          </div>

          {/* Grouped tour cards */}
          {(activeCountry === 'All' ? grouped : [{ country: activeCountry, items: filteredTours }]).map(
            ({ country, items }) => (
              <section key={country} className="stack">
                <div className="tour-country-section-header">
                  <span className="tour-country-section-title">{country}</span>
                  <span className="tour-country-section-count">
                    {(items || []).length} package{(items || []).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="tc-grid">
                  {(items || []).map((tour) => (
                    <TourCard
                      key={tour.id}
                      tour={tour}
                      onDelete={can('TOUR_MANAGE') ? handleDelete : undefined}
                    />
                  ))}
                </div>
              </section>
            )
          )}
        </>
      )}
    </div>
  )
}
