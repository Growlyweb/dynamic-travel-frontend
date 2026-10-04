export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}

export function isPhone(value) {
  return /^\+?[\d\s-]{7,18}$/.test(String(value ?? '').trim())
}

export function isStrongPassword(value) {
  const password = String(value ?? '')
  return password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
}

function result(errors) {
  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateRequired(values, fields) {
  const errors = {}
  fields.forEach(({ name, label }) => {
    if (!String(values[name] ?? '').trim()) errors[name] = `${label} is required.`
  })
  return result(errors)
}

export function validateLoginForm(values) {
  const errors = {}
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'
  if (!values.password) errors.password = 'Password is required.'
  return result(errors)
}

export function validateForgotPassword(values) {
  const errors = {}
  if (!isEmail(values.email)) errors.email = 'Enter a valid email address.'
  return result(errors)
}

export function validateResetPassword(values) {
  const errors = {}
  if (!isStrongPassword(values.password)) {
    errors.password = 'Use at least 8 characters with letters and numbers.'
  }
  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return result(errors)
}
