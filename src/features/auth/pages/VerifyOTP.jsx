import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../auth.api'
import { validateOtp } from '../auth.validation'
import { getApiErrorMessage } from '../../../utils/helpers'
import { APP_ROUTES } from '../../../utils/constants'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'

export default function VerifyOTP() {
  const [values, setValues] = useState({ email: '', code: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [verified, setVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateOtp(values)
    setErrors(validation.errors)
    if (!validation.valid) return

    setSubmitting(true)
    setFormError(null)
    try {
      await authApi.verifyOtp({ email: values.email.trim(), code: values.code.trim() })
      setVerified(true)
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Verification failed. Check the code and try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-screen__card card">
        <div className="auth-screen__brand">
          <h1>Verify code</h1>
          <p className="muted">Enter the 6-digit code sent to your email.</p>
        </div>
        <form className="auth-screen__form" onSubmit={handleSubmit} noValidate>
          {formError ? <div className="alert alert--danger">{formError}</div> : null}
          {verified ? (
            <div className="alert alert--success">Code verified. Continue to reset your password.</div>
          ) : null}
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          />
          <Input
            label="Verification code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={values.code}
            error={errors.code}
            onChange={(event) =>
              setValues((current) => ({ ...current, code: event.target.value.replace(/\D/g, '') }))
            }
          />
          <Button type="submit" block loading={submitting}>
            Verify
          </Button>
        </form>
        <div className="auth-screen__links">
          <Link to={APP_ROUTES.LOGIN}>Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
