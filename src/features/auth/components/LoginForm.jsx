import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth'
import { validateLoginForm } from '../auth.validation'
import { APP_ROUTES } from '../../../utils/constants'
import { getApiErrorMessage } from '../../../utils/helpers'
import { cn } from '../../../utils/helpers'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'

// Two login roles (spec: Admin + Staff). Each card signs the demo user in
// with the matching role so the dashboard shows the right permissions.
const LOGIN_ROLES = [
  {
    value: 'admin',
    icon: '🛡️',
    label: 'Admin',
    hint: 'Full access — users, roles, everything',
    email: 'admin@traveldashboard.test',
    password: 'password123',
  },
  {
    value: 'staff',
    icon: '🧑‍💼',
    label: 'Staff',
    hint: 'Visa processing — assigned applications',
    email: 'staff@traveldashboard.test',
    password: 'password123',
  },
]

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ role: 'admin', email: '', password: '', remember: true })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function update(name, value) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function selectRole(role) {
    const option = LOGIN_ROLES.find((item) => item.value === role)
    if (!option) return
    // Demo convenience: picking a role pre-fills its credentials.
    setValues((current) => ({ ...current, role, email: option.email, password: option.password }))
    setErrors({})
    setFormError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateLoginForm(values)
    setErrors(validation.errors)
    if (!validation.valid) return

    setSubmitting(true)
    setFormError(null)
    try {
      await login({ email: values.email.trim(), password: values.password, role: values.role })
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

      <div className="login-roles" role="group" aria-label="Sign in as">
        {LOGIN_ROLES.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn('login-role', values.role === option.value && 'is-active')}
            aria-pressed={values.role === option.value}
            onClick={() => selectRole(option.value)}
          >
            <span className="login-role__icon" aria-hidden>{option.icon}</span>
            <span>
              <span className="login-role__title">{option.label}</span>
              <span className="login-role__hint">{option.hint}</span>
            </span>
          </button>
        ))}
      </div>

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
        Sign in as {values.role === 'staff' ? 'Staff' : 'Admin'}
      </Button>

      <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>
        Demo mode — picking a role fills its credentials (password: password123).
      </p>
    </form>
  )
}
