import { useState } from 'react'
import { authApi } from '../auth.api'
import { validateForgotPassword } from '../auth.validation'
import { getApiErrorMessage } from '../../../utils/helpers'
import Input from '../../../components/common/Input'
import Button from '../../../components/common/Button'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const validation = validateForgotPassword({ email })
    setError(validation.errors.email)
    if (!validation.valid) return

    setSubmitting(true)
    setFormError(null)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return <div className="alert alert--success">If an account exists for {email}, a reset link is on its way.</div>
  }

  return (
    <form className="auth-screen__form" onSubmit={handleSubmit} noValidate>
      {formError ? <div className="alert alert--danger">{formError}</div> : null}
      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        value={email}
        error={error}
        onChange={(event) => setEmail(event.target.value)}
      />
      <Button type="submit" block loading={submitting}>
        Send reset link
      </Button>
    </form>
  )
}
