import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { validateLoginForm } from '../auth.validation'
import { APP_ROUTES } from '../../../utils/constants'
import { getApiErrorMessage } from '../../../utils/helpers'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateLoginForm(values)
    setErrors(validation.errors)
    if (!validation.valid) return

    setSubmitting(true)
    setFormError(null)
    try {
      await login({ email: values.email.trim(), password: values.password })
      navigate(location.state?.from ?? APP_ROUTES.DASHBOARD, { replace: true })
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Unable to sign in. Check your credentials.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="auth-screen__form" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--danger">{formError}</div> : null}

      <Input
        label="Email"
        type="email"
        name="email"
        placeholder="you@company.com"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        onChange={(event) => update('email', event.target.value)}
      />

      <Input
        label="Password"
        type="password"
        name="password"
        placeholder="••••••••"
        autoComplete="current-password"
        value={values.password}
        error={errors.password}
        onChange={(event) => update('password', event.target.value)}
      />

      <label className="checkbox">
        <input
          type="checkbox"
          checked={values.remember}
          onChange={(event) => update('remember', event.target.checked)}
        />
        Remember me
      </label>

      <Button type="submit" block loading={submitting}>
        Sign in
      </Button>

      {/* Demo convenience: prefill helper while mocks are enabled. */}
      <Button
        variant="ghost"
        size="sm"
        type="button"
        disabled={submitting}
        onClick={() => setValues({ email: 'admin@traveldashboard.test', password: 'password123', remember: true })}
      >
        Use demo credentials
      </Button>
    </form>
  )
}
