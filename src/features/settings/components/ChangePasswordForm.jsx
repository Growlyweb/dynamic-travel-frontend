import { useState } from 'react'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { validateResetPassword } from '../../auth/auth.validation'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function ChangePasswordForm() {
  const [values, setValues] = useState({ currentPassword: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  function update(name, value) {
    setSaved(false)
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateResetPassword(values)
    setErrors(validation.errors)
    if (!validation.valid) return

    setSaving(true)
    setFormError(null)
    try {
      // Replace with your change-password API.
      await new Promise((resolve) => setTimeout(resolve, 400))
      setSaved(true)
      setValues({ currentPassword: '', password: '', confirmPassword: '' })
    } catch (error) {
      setFormError(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="card stack" onSubmit={handleSubmit} noValidate style={{ maxWidth: 560 }}>
      <p className="card__title">Change password</p>
      {formError ? <div className="alert alert--danger">{formError}</div> : null}
      {saved ? <div className="alert alert--success">Password updated.</div> : null}
      <Input
        label="Current password"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        error={errors.currentPassword}
        onChange={(event) => update('currentPassword', event.target.value)}
      />
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        value={values.password}
        error={errors.password}
        hint="At least 8 characters, with letters and numbers."
        onChange={(event) => update('password', event.target.value)}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        onChange={(event) => update('confirmPassword', event.target.value)}
      />
      <div>
        <Button type="submit" loading={saving}>
          Update password
        </Button>
      </div>
    </form>
  )
}
