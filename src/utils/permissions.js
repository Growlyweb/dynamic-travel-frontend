// The permission keys are the server's, spelled the same. A menu item or a button uses the key the server checks for that
// action (see INTEGRATION_PLAN.md, 5.8), so a person never sees something that answers 403.
export const PERMISSIONS = {
  // Pages the server keeps for administrators. No permission opens them.
  ADMIN_ONLY: 'ADMIN_ONLY',
  VISA_VIEW: 'VISA_VIEW',
  VISA_EDIT: 'VISA_EDIT',
  VISA_UPDATE: 'VISA_UPDATE',
  VISA_PAYMENT_VOID: 'VISA_PAYMENT_VOID',
  TOURS_VIEW: 'TOURS_VIEW',
  TOUR_MANAGE: 'TOUR_MANAGE',
  B2B_VIEW: 'B2B_VIEW',
  B2B_MANAGE: 'B2B_MANAGE',
  B2C_VIEW: 'B2C_VIEW',
  MEMBERSHIP_MANAGE: 'MEMBERSHIP_MANAGE',
  DOCUMENT_VIEW: 'DOCUMENT_VIEW',
  DOCUMENT_VERIFY: 'DOCUMENT_VERIFY',
  PASSPORT_VIEW: 'PASSPORT_VIEW',
  PASSPORT_UPDATE: 'PASSPORT_UPDATE',
  REPORTS_VIEW: 'REPORTS_VIEW',
  ACCOUNTS_EDIT: 'ACCOUNTS_EDIT',
  ACCOUNTS_VOID: 'ACCOUNTS_VOID',
  VENDOR_VIEW: 'VENDOR_VIEW',
  VENDOR_MANAGE: 'VENDOR_MANAGE',
  SETTINGS_VIEW: 'SETTINGS_VIEW',
}

// `user.permissions` is what the server resolved from the person's roles. An admin passes every check.
export function hasPermission(user, permission) {
  if (!user) return false
  if (!permission) return true
  if (user.isAdmin) return true
  if (permission === PERMISSIONS.ADMIN_ONLY) return false
  return Array.isArray(user.permissions) && user.permissions.includes(permission)
}

export function hasAnyPermission(user, permissions = []) {
  if (!permissions.length) return true
  return permissions.some((permission) => hasPermission(user, permission))
}
