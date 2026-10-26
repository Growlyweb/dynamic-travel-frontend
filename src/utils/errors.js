// What a person reads when the server answers with an error code. Codes the server adds later fall back to its message.
const MESSAGES = {
  AUTH_REQUIRED: 'Please sign in to continue.',
  SESSION_EXPIRED: 'Your session has ended. Please sign in again.',
  TOKEN_INVALID: 'Your session has ended. Please sign in again.',
  FORBIDDEN: 'You do not have permission to do this.',
  ACCOUNT_NOT_ACTIVE: 'This account is not active. Ask an administrator to activate it.',
  ROLE_IN_USE: 'People still have this role. Move them to another role first.',
  ROLE_LOCKED: 'This role is built in and cannot be changed.',
  SELF_CHANGE: 'You cannot change your own account this way.',
  LAST_ADMIN: 'This is the last active admin. Create or activate another admin first.',
  VALIDATION_ERROR: 'Please check the highlighted fields.',
}

// The seconds a person has to wait, from a 429 answer.
const waitText = (seconds) => {
  if (!seconds) return 'Too many attempts. Please wait a moment and try again.'
  const minutes = Math.ceil(seconds / 60)
  return seconds > 90 ? `Too many attempts. Try again in ${minutes} minutes.` : `Too many attempts. Try again in ${seconds} seconds.`
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback
  if (error.status === 429) return waitText(error.retryAfter)
  if (error.status === 403 && (!error.code || error.code === 'FORBIDDEN')) return MESSAGES.FORBIDDEN
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]
  if (error.status === 0) return 'Cannot reach the server. Check your connection and try again.'
  return error.message || fallback
}

// { email: 'Enter a valid email address.' } for a form, from the server's field errors.
export function fieldErrors(error) {
  return error?.fields ?? {}
}
