import { useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Input from '../../../components/common/Input'
import Select from '../../../components/common/Select'
import Button from '../../../components/common/Button'
import { useAuth } from '../../../hooks/useAuth'
import { CURRENCIES } from '../../../utils/constants'

const TIMEZONES = ['UTC', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'America/New_York']

export default function Profile() {
  const { user } = useAuth()
  const [values, setValues] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '',
    timezone: 'UTC',
  })
  const [saved, setSaved] = useState(false)

  function update(name, value) {
    setSaved(false)
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    // Replace with your profile update API.
    setSaved(true)
  }

  return (
    <div className="stack">
      <PageHeader
        title="Profile"
        description="Your personal information."
        breadcrumbs={[{ label: 'Settings' }, { label: 'Profile' }]}
      />

      <form className="card stack" onSubmit={handleSubmit} noValidate style={{ maxWidth: 560 }}>
        {saved ? <div className="alert alert--success">Profile updated.</div> : null}
        <Input label="Full name" value={values.name} onChange={(event) => update('name', event.target.value)} />
        <Input
          label="Email"
          type="email"
          value={values.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <Input
          label="Phone"
          type="tel"
          placeholder="+971 50 123 4567"
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
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  )
}
