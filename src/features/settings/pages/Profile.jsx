import { useState, useEffect } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import Button from '../../../components/common/Button'
import { useAuth } from '../../../hooks/useAuth'
import { CURRENCIES } from '../../../utils/constants'
import { apiClient } from '../../../services/apiClient'
import { getApiErrorMessage } from '../../../utils/helpers'

const TIMEZONES = ['UTC', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'America/New_York']

export default function Profile() {
  const { user } = useAuth()
  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    timezone: 'UTC',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) {
      setValues((v) => ({
        ...v,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }))
    }
  }, [user])

  function update(name, value) {
    setSaved(false)
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await apiClient.patch('/admin/profile', {
        name: values.name,
        phone: values.phone || undefined
      })
      setSaved(true)
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title="Profile"
        description="Your personal information."
        breadcrumbs={[{ label: 'Settings' }, { label: 'Profile' }]}
      />

      <form className="card stack" onSubmit={handleSubmit} noValidate style={{ maxWidth: 560 }}>
        {error ? <div className="alert alert--danger">{error}</div> : null}
        {saved ? <div className="alert alert--success">Profile updated.</div> : null}
        <Input label="Full name" value={values.name} onChange={(event) => update('name', event.target.value)} />
        <Input
          label="Email"
          type="email"
          value={values.email}
          disabled
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+880 171 000 0000"
          value={values.phone}
          onChange={(event) => update('phone', event.target.value)}
        />
        <Select
          label="Timezone"
          value={values.timezone}
          onChange={(event) => update('timezone', event.target.value)}
          options={TIMEZONES.map((zone) => ({ value: zone, label: zone }))}
        />
        <Select
          label="Default currency"
          defaultValue="USD"
          options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
        />
        <div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  )
}
