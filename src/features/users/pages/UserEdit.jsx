import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { usersApi } from '../users.api'
import { useToast } from '../../../context/ToastContext'
import { APP_ROUTES } from '../../../utils/constants'
import { errorMessage, fieldErrors } from '../../../utils/errors'

// An admin can change a person's name and phone. The email, roles and status have their own actions.
export default function UserEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [values, setValues] = useState(null)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    usersApi
      .get(id)
      .then((user) => active && setValues({ name: user.name ?? '', phone: user.phone ?? '', email: user.email ?? '' }))
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  async function handleSubmit(event) {
    event.preventDefault()
    if (values.name.trim().length < 2) {
      setErrors({ name: 'Enter the name.' })
      return
    }
    setSaving(true)
    setFormError(null)
    setErrors({})
    try {
      await usersApi.updateProfile(id, { name: values.name.trim(), phone: values.phone.trim() || undefined })
      toast.success('Details saved.')
      navigate(APP_ROUTES.USER_DETAILS(id))
    } catch (saveError) {
      setErrors(fieldErrors(saveError))
      setFormError(errorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader fullPage label="Loading user…" />
  if (error) return <ErrorState title="Could not load this user" message={errorMessage(error)} />
  if (!values) return null

  return (
    <div className="stack">
      <PageHeader
        title="Edit details"
        breadcrumbs={[{ label: 'Users', to: APP_ROUTES.USERS }, { label: values.name, to: APP_ROUTES.USER_DETAILS(id) }, { label: 'Edit' }]}
        actions={
          <Link to={APP_ROUTES.USER_DETAILS(id)}>
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      <form className="card stack" onSubmit={handleSubmit} noValidate style={{ maxWidth: 560 }}>
        {formError ? <div className="alert alert--danger">{formError}</div> : null}
        <Input label="Name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
        <Input label="Phone" value={values.phone} error={errors.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
        <Input label="Email" value={values.email} disabled hint="The email cannot be changed here." />
        <div>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}
