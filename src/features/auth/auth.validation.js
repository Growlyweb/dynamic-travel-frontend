export { validateResetPassword } from '../../utils/validators'

export const PASSWORD_HINT = '8+ characters, upper and lower case, a number and a symbol'

// The server's password rules, so a person hears about a weak password before the request leaves.
export function validateNewPassword(password, confirmPassword) {
  if (!password) return 'Please enter a new password.'
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[a-z]/.test(password)) return 'Password needs a lowercase letter.'
  if (!/[A-Z]/.test(password)) return 'Password needs an uppercase letter.'
  if (!/[0-9]/.test(password)) return 'Password needs a number.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password needs a special character.'
  if (password !== confirmPassword) return 'Passwords do not match.'
  return ''
}
