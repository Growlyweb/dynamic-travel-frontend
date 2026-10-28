import { useEffect, useState } from 'react'
import PageHeader from '../../../components/layout/PageHeader'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'
import Loader from '../../../components/common/Loader'
import { settingsApi } from '../settings.api'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../context/ToastContext'
import { roleText } from '../../../utils/roles'
import { errorMessage, fieldErrors } from '../../../utils/errors'

export default function Profile() {
  const { user, reload } = useAuth()
  const toast = useToast()
  const [values, setValues] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsApi
      .getProfile()
      .then((result) => setValues({ name: result.user.name ?? '', phone: result.user.phone ?? '', email: result.user.email ?? '' }))
      .catch((error) => {
        toast.error(errorMessage(error))
        setValues({ name: user?.name ?? '', phone: '', email: user?.email ?? '' })
      })
  }, [toast, user])

  async function handleSubmit(event) {
    event.preventDefault()
    if (values.name.trim().length < 2) return setErrors({ name: 'Enter your name.' })
    setSaving(true)
    setErrors({})
    try {
      await settingsApi.updateProfile({ name: values.name.trim(), phone: values.phone.trim() || undefined })
      await reload()
      toast.success('Profile updated.')
    } catch (error) {
      setErrors(fieldErrors(error))
      toast.error(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (!values) return <Loader fullPage label="Loading profile…" />

  return (
    <div className="stack">
      <PageHeader title="Profile" description="Your name and phone number." breadcrumbs={[{ label: 'Settings' }, { label: 'Profile' }]} />

      <form className="card stack" onSubmit={handleSubmit} noValidate style={{ maxWidth: 560 }}>
        <Input label="Full name" value={values.name} error={errors.name} onChange={(event) => setValues({ ...values, name: event.target.value })} />
        <Input label="Phone" type="tel" placeholder="+8801712345678" value={values.phone} error={errors.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
        <Input label="Email" type="email" value={values.email} disabled hint="Ask an administrator to change your email." />
        <Input label="Access" value={roleText(user)} disabled />
        <div>
          <Button type="submit" loading={saving}>Save changes</Button>
        </div>
      </form>
    </div>
  )
}
