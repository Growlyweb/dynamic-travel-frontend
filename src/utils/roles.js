import { ROLES } from './constants'

export const ROLE_LABELS = {
  admin: 'Administrator',
  agent: 'Staff Member',
  staff: 'Staff Member',
}

export const ALL_ROLES = ['admin', 'agent']

export function roleLabel(role) {
  if (role === 'admin') return 'Administrator'
  return 'Staff Member'
}
