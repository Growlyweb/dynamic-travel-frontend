import { ROLES } from './constants'

export const ROLE_LABELS = {
  admin: 'Administrator',
  manager: 'Operations Manager',
  agent: 'Staff Member',
  staff: 'Staff Member',
  partner: 'B2B Partner',
  viewer: 'Viewer (Read-Only)',
}

export const ROLE_CONFIG = {
  admin: {
    key: 'admin',
    label: 'Administrator',
    shortLabel: 'Admin',
    tone: 'primary',
    color: '#0879E8',
    bg: '#EBF5FF',
    border: '#BFDBFE',
    description: 'Full system control across all modules, settings & users',
    badgeText: 'Full Access',
  },
  manager: {
    key: 'manager',
    label: 'Operations Manager',
    shortLabel: 'Manager',
    tone: 'purple',
    color: '#7C3AED',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    description: 'Oversees operational pipelines, tours, visas and vendor bills',
    badgeText: 'Manager Access',
  },
  agent: {
    key: 'agent',
    label: 'Staff Member',
    shortLabel: 'Staff',
    tone: 'warning',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    description: 'Access to operational modules as configured in permission settings',
    badgeText: 'Staff Access',
  },
  partner: {
    key: 'partner',
    label: 'B2B Partner Agent',
    shortLabel: 'Partner',
    tone: 'info',
    color: '#0284C7',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    description: 'Partner agency access to submit & track client applications',
    badgeText: 'Partner Portal',
  },
  viewer: {
    key: 'viewer',
    label: 'Viewer (Read-Only)',
    shortLabel: 'Viewer',
    tone: 'neutral',
    color: '#64748B',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    description: 'Auditing and view-only permissions with no edit privileges',
    badgeText: 'View-Only',
  },
}

export const ALL_ROLES = ['admin', 'manager', 'agent', 'partner', 'viewer']

export function roleLabel(role) {
  return ROLE_LABELS[role] ?? 'Staff Member'
}

export function getUserRoles(user) {
  if (!user) return []
  if (Array.isArray(user.roles) && user.roles.length > 0) {
    return user.roles
  }
  if (user.role) {
    return [user.role]
  }
  return ['agent']
}

// What to show under a person's name: "Administrator", or the names of the roles a staff member holds.
export function roleText(user) {
  if (!user) return '—'
  if (user.isAdmin || user.role === 'admin') return ROLE_LABELS.admin
  return user.roles?.length ? user.roles.join(', ') : ROLE_LABELS.staff
}
