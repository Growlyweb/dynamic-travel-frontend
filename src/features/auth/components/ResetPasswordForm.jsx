import { useState } from 'react'
import { authApi } from '../auth.api'
import { validateResetPassword } from '../auth.validation'
import { getApiErrorMessage } from '../../../utils/helpers'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'

export default function ResetPasswordForm({ token }) {
  const [values, setValues] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateResetPassword(values)
    setErrors(validation.errors)
    if (!validation.valid) return

    setSubmitting(true)
    setFormError(null)
    try {
      await authApi.resetPassword({ token, password: values.password })
      setDone(true)
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return <div className="alert alert--success">Your password has been reset. You can now sign in.</div>
  }

  return (
    <form className="auth-screen__form" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--danger">{formError}</div> : null}
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
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        onChange={(event) => update('confirmPassword', event.target.value)}
      />
      <Button type="submit" block loading={submitting}>
        Reset password
      </Button>
    </form>
  )
}
