import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import { usersApi } from '../users.api'
import { APP_ROUTES, USER_STATUSES } from '../../../utils/constants'
import { ALL_ROLES, ROLE_LABELS } from '../../../utils/roles'
import { titleCase } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'
import { validateRequired } from '../../../utils/validators'

export default function UserEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
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
      .then((user) => {
        if (active) setValues({ name: user.name ?? '', email: user.email ?? '', role: user.role ?? 'viewer', status: user.status ?? 'active' })
      })
      .catch((loadError) => active && setError(loadError))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id])

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateRequired(values, [
      { name: 'name', label: 'Name' },
      { name: 'email', label: 'Email' },
    ])
    setErrors(validation.errors)
    if (!validation.valid) return

    setSaving(true)
    setFormError(null)
    try {
      await usersApi.update(id, values)
      navigate(APP_ROUTES.USER_DETAILS(id))
    } catch (saveError) {
      setFormError(getApiErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader fullPage label="Loading user…" />
  if (error) return <ErrorState title="Could not load this user" message={getApiErrorMessage(error)} />
  if (!values) return null

  return (
    <div className="stack">
      <PageHeader
        title="Edit user"
        breadcrumbs={[{ label: 'Users', to: APP_ROUTES.USERS }, { label: values.name, to: APP_ROUTES.USER_DETAILS(id) }, { label: 'Edit' }]}
        actions={
          <Link to={APP_ROUTES.USER_DETAILS(id)}>
            <Button variant="ghost">Cancel</Button>
          </Link>
        }
      />

      <form className="card stack" onSubmit={handleSubmit} noValidate style={{ maxWidth: 560 }}>
        {formError ? <div className="alert alert--danger">{formError}</div> : null}
        <Input label="Name" value={values.name} error={errors.name} onChange={(event) => update('name', event.target.value)} />
        <Input
          label="Email"
          type="email"
          value={values.email}
          error={errors.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <Select
          label="Role"
          value={values.role}
          onChange={(event) => update('role', event.target.value)}
          options={ALL_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
        />
        <Select
          label="Status"
          value={values.status}
          onChange={(event) => update('status', event.target.value)}
          options={USER_STATUSES.map((status) => ({ value: status, label: titleCase(status) }))}
        />
        <div>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </div>
  )
}
