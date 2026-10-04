import { ROLES } from './constants'

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.AGENT]: 'Agent',
  [ROLES.PARTNER]: 'Partner',
  [ROLES.VIEWER]: 'Viewer',
}

export const ALL_ROLES = Object.values(ROLES)

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? 'Unknown role'
}
