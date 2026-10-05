export const PERMISSIONS = {
  USERS_VIEW: 'users.view',
  USERS_EDIT: 'users.edit',
  VISA_VIEW: 'visa.view',
  VISA_EDIT: 'visa.edit',
  TOURS_VIEW: 'tours.view',
  TOURS_EDIT: 'tours.edit',
  B2B_VIEW: 'b2b.view',
  B2B_MANAGE: 'b2b.manage',
  B2C_VIEW: 'b2c.view',
  MEMBERSHIPS_VIEW: 'memberships.view',
  MEMBERSHIPS_EDIT: 'memberships.edit',
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_MANAGE: 'documents.manage',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_VIEW: 'settings.view',
}

export const MODULE_PERMISSION_GROUPS = [
  {
    module: 'Visa Operations',
    description: 'Access to visa dashboard, applications, checklists, types & pricing',
    permissions: [
      { key: 'visa.view', label: 'View Visa Operations' },
      { key: 'visa.edit', label: 'Edit & Process Visas' },
    ],
  },
  {
    module: 'Tour Packages',
    description: 'Access to tour packages, custom tour builder & itineraries',
    permissions: [
      { key: 'tours.view', label: 'View Tour Packages' },
      { key: 'tours.edit', label: 'Create & Edit Packages' },
    ],
  },
  {
    module: 'Partners (B2B)',
    description: 'Access to agency partner network, applications & commissions',
    permissions: [
      { key: 'b2b.view', label: 'View B2B Partners' },
      { key: 'b2b.manage', label: 'Manage Partner Requests' },
    ],
  },
  {
    module: 'Customers (B2C)',
    description: 'Access to individual customer directory & booking details',
    permissions: [{ key: 'b2c.view', label: 'View Customers' }],
  },
  {
    module: 'Memberships',
    description: 'Access to membership plans, active members & reports',
    permissions: [
      { key: 'memberships.view', label: 'View Memberships' },
      { key: 'memberships.edit', label: 'Manage Plans & Members' },
    ],
  },
  {
    module: 'Documents',
    description: 'Access to document vault and uploaded files',
    permissions: [
      { key: 'documents.view', label: 'View Documents' },
      { key: 'documents.manage', label: 'Upload & Delete Documents' },
    ],
  },
  {
    module: 'Reports & Analytics',
    description: 'Access to financial, operational & performance reports',
    permissions: [{ key: 'reports.view', label: 'View Reports' }],
  },
  {
    module: 'User Administration',
    description: 'Access to user team list and role assignments',
    permissions: [
      { key: 'users.view', label: 'View User Directory' },
      { key: 'users.edit', label: 'Manage Users & Roles' },
    ],
  },
]

export const DEFAULT_STAFF_PERMISSIONS = [
  'visa.view',
  'visa.edit',
  'tours.view',
  'tours.edit',
  'b2b.view',
  'b2c.view',
  'memberships.view',
  'documents.view',
  'reports.view',
]

const STORAGE_KEY = 'abl_staff_permissions'

export function getStaffPermissions() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error('Error reading staff permissions from localStorage', e)
  }
  return DEFAULT_STAFF_PERMISSIONS
}

export function saveStaffPermissions(permissionsList) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(permissionsList))
    window.dispatchEvent(new CustomEvent('staff-permissions-updated', { detail: permissionsList }))
  } catch (e) {
    console.error('Error saving staff permissions to localStorage', e)
  }
}

export function hasPermission(user, permission) {
  if (!user) return false
  if (!permission) return true

  // Admin role has full access to everything
  if (user.role === 'admin') return true

  // Staff / Agent role uses dynamic staff permissions controlled from admin panel
  const staffPermissions = getStaffPermissions()
  return staffPermissions.includes(permission)
}

export function hasAnyPermission(user, permissions = []) {
  if (!permissions.length) return true
  return permissions.some((permission) => hasPermission(user, permission))
}
