import { isEmail, validateResetPassword } from '../../utils/validators'

export { validateResetPassword }

export function validateLoginForm(values) {
  const errors = {}
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Password is required.'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateForgotPassword(values) {
  const errors = {}
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateOtp(values) {
  const errors = {}
  if (!/^\d{6}$/.test(String(values.code ?? '').trim())) errors.code = 'Enter the 6-digit code.'
  return { valid: Object.keys(errors).length === 0, errors }
}
