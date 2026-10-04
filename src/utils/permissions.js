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
  DOCUMENTS_VIEW: 'documents.view',
  DOCUMENTS_MANAGE: 'documents.manage',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_VIEW: 'settings.view',
}

// Simple role -> permissions mapping. '*' grants everything.
// Adjust to match your backend's authorization model.
export const ROLE_PERMISSIONS = {
  admin: ['*'],
  manager: [
    'users.view',
    'visa.view',
    'visa.edit',
    'tours.view',
    'tours.edit',
    'b2b.view',
    'b2b.manage',
    'b2c.view',
    'documents.view',
    'documents.manage',
    'reports.view',
  ],
  agent: ['visa.view', 'visa.edit', 'tours.view', 'b2c.view', 'documents.view'],
  partner: ['tours.view', 'b2b.view', 'documents.view'],
  viewer: ['visa.view', 'tours.view', 'b2b.view', 'b2c.view', 'documents.view', 'reports.view'],
}

export function hasPermission(user, permission) {
  if (!user || !permission) return false
  const granted = ROLE_PERMISSIONS[user.role] ?? []
  return granted.includes('*') || granted.includes(permission)
}

export function hasAnyPermission(user, permissions = []) {
  return permissions.some((permission) => hasPermission(user, permission))
}
