export const APP_ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_OTP: '/verify-otp',

  DASHBOARD: '/dashboard',

  USERS: '/users',
  USER_DETAILS: (id) => `/users/${id}`,
  USER_EDIT: (id) => `/users/${id}/edit`,

  VISA_APPLICATIONS: '/visa/applications',
  VISA_APPLICATION_DETAILS: (id) => `/visa/applications/${id}`,
  VISA_CHECKLIST: '/visa/checklist',
  VISA_COUNTRIES: '/visa/countries',
  VISA_STATUS: '/visa/status',

  TOURS: '/tours',
  TOUR_CREATE: '/tours/new',
  TOUR_CUSTOM: '/tours/custom',
  TOUR_DETAILS: (id) => `/tours/${id}`,
  TOUR_EDIT: (id) => `/tours/${id}/edit`,

  B2B_PARTNERS: '/b2b/partners',
  B2B_PARTNER_DETAILS: (id) => `/b2b/partners/${id}`,
  B2B_APPLICATIONS: '/b2b/applications',
  B2B_PICKUPS: '/b2b/pickups',
  B2B_COMMISSIONS: '/b2b/commissions',
  B2B_WITHDRAWALS: '/b2b/withdrawals',
  B2B_DOCUMENTS: '/b2b/documents',

  B2C_CUSTOMERS: '/b2c/customers',
  B2C_CUSTOMER_DETAILS: (id) => `/b2c/customers/${id}`,

  DOCUMENTS: '/documents',
  DOCUMENT_DETAILS: (id) => `/documents/${id}`,

  NOTIFICATIONS: '/notifications',
  REPORTS: '/reports',

  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_GENERAL: '/settings',
  SETTINGS_SECURITY: '/settings/security',
}

export const USER_STATUSES = ['active', 'invited', 'suspended']
export const VISA_STATUSES = ['submitted', 'in_review', 'action_required', 'approved', 'rejected']
export const TOUR_STATUSES = ['draft', 'published', 'archived']
export const PARTNER_STATUSES = ['pending', 'approved', 'suspended', 'rejected']
export const DOCUMENT_STATUSES = ['pending', 'verified', 'rejected']
export const PICKUP_STATUSES = ['requested', 'scheduled', 'completed', 'cancelled']
export const WITHDRAWAL_STATUSES = ['pending', 'approved', 'paid', 'rejected']
export const CUSTOM_TOUR_STATUSES = ['pending', 'quoted', 'booked', 'closed']

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  AGENT: 'agent',
  PARTNER: 'partner',
  VIEWER: 'viewer',
}

export const PAGINATION_PAGE_SIZES = [10, 25, 50]

export const CHART_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#16a34a',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
]

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'INR']
