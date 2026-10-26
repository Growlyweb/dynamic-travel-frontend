import { useState } from 'react'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { validateNewPassword } from '../../auth/auth.validation'
import { authApi } from '../../auth/auth.api'
import { setAccessToken } from '../../../services/authStorage'
import { errorMessage, fieldErrors } from '../../../utils/errors'

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
    const found = {}
    if (!values.currentPassword) found.currentPassword = 'Enter your current password.'
    const problem = validateNewPassword(values.password, values.confirmPassword)
    if (problem) found[problem === 'Passwords do not match.' ? 'confirmPassword' : 'password'] = problem
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    setFormError(null)
    try {
      // Every other session ends with a password change. The answer carries a new access token for this one.
      const session = await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.password })
      if (session?.accessToken) setAccessToken(session.accessToken)
      setSaved(true)
      setValues({ currentPassword: '', password: '', confirmPassword: '' })
    } catch (error) {
      const fields = fieldErrors(error)
      if (fields.currentPassword || fields.newPassword) setErrors({ currentPassword: fields.currentPassword, password: fields.newPassword })
      else setFormError(errorMessage(error))
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
        hint="At least 8 characters, with upper and lower case letters, a number and a symbol."
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
