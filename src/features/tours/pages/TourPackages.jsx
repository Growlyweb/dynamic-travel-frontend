import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import TourCard from '../components/TourCard'
import { toursApi } from '../tours.api'
import { APP_ROUTES } from '../../../utils/constants'
import { usePermission } from '../../../hooks/usePermission'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function TourPackages() {
  const { can } = usePermission()
  const [tours, setTours] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await toursApi.list()
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

  if (loading) return <Loader fullPage label="Loading tours…" />
  if (error) return <ErrorState title="Could not load tour packages" message={getApiErrorMessage(error)} onRetry={load} />

  return (
    <div className="stack">
      <PageHeader
        title="Tour packages"
        description="Packages sold directly and through partners."
        breadcrumbs={[{ label: 'Tours' }, { label: 'Packages' }]}
        actions={
          can('tours.edit') ? (
            <Link to={APP_ROUTES.TOUR_CREATE}>
              <Button>New package</Button>
            </Link>
          ) : null
        }
      />
      {tours.length === 0 ? (
        <ErrorState title="No packages yet" message="Create your first tour package to see it here." />
      ) : (
        <div className="grid grid--3">
          {tours.map((tour) => (
            <TourCard key={tour.id} tour={tour} />
          ))}
        </div>
      )}
    </div>
  )
}
