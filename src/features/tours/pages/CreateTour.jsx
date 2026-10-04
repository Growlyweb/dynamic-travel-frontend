import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import TourForm from '../components/TourForm'
import { toursApi } from '../tours.api'
import { APP_ROUTES } from '../../../utils/constants'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function CreateTour() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  async function handleSubmit(payload) {
    setSaving(true)
    setFormError(null)
    try {
      await toursApi.create(payload)
      navigate(APP_ROUTES.TOURS)
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="New tour package"
        breadcrumbs={[{ label: 'Tours', to: APP_ROUTES.TOURS }, { label: 'New' }]}
      />
      {formError ? <div className="alert alert--danger">{formError}</div> : null}
      <TourForm submitLabel="Create package" submitting={saving} onSubmit={handleSubmit} onCancel={() => navigate(APP_ROUTES.TOURS)} />
    </div>
  )
}
