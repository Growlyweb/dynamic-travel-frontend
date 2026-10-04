import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import TourForm from '../components/TourForm'
import { toursApi } from '../tours.api'
import { APP_ROUTES } from '../../../utils/constants'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function EditTour() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tour, setTour] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

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

  async function handleSubmit(payload) {
    setSaving(true)
    setFormError(null)
    try {
      await toursApi.update(id, payload)
      navigate(APP_ROUTES.TOUR_DETAILS(id))
    } catch (updateError) {
      setFormError(getApiErrorMessage(updateError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader fullPage label="Loading tour…" />
  if (error) return <ErrorState title="Could not load this tour" message={getApiErrorMessage(error)} />

  return (
    <div className="stack">
      <PageHeader
        title="Edit tour package"
        breadcrumbs={[
          { label: 'Tours', to: APP_ROUTES.TOURS },
          { label: tour?.name ?? id, to: APP_ROUTES.TOUR_DETAILS(id) },
          { label: 'Edit' },
        ]}
      />
      {formError ? <div className="alert alert--danger">{formError}</div> : null}
      <TourForm
        initialValues={tour}
        submitLabel="Save changes"
        submitting={saving}
        onSubmit={handleSubmit}
        onCancel={() => navigate(APP_ROUTES.TOUR_DETAILS(id))}
      />
    </div>
  )
}
