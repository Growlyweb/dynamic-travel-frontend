import {
  BadgePercent,
  Bell,
  Building2,
  ChartLine,
  CircleUser,
  CreditCard,
  Files,
  FileText,
  Gauge,
  Globe,
  Handshake,
  Inbox,
  Kanban,
  KeyRound,
  Landmark,
  Layers,
  LayoutDashboard,
  ListChecks,
  Luggage,
  MessageSquareText,
  Milestone,
  PenLine,
  Percent,
  ReceiptText,
  ScrollText,
  Settings,
  ShieldCheck,
  Stamp,
  Tags,
  Bus,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react'

export const APP_ROUTES = {
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_OTP: '/verify-otp',

  DASHBOARD: '/dashboard',

  USERS: '/users',
  USER_DETAILS: (id) => `/users/${id}`,
  USER_EDIT: (id) => `/users/${id}/edit`,
  ROLES: '/roles',

  VISA_OVERVIEW: '/visa',
  VISA_APPLICATIONS: '/visa/applications',
  VISA_APPLICATION_DETAILS: (id) => `/visa/applications/${id}`,
  VISA_COUNTRIES: '/visa/countries',
  VISA_TYPES: '/visa/types',
  VISA_PRICING: '/visa/pricing',
  VISA_CHECKLIST: '/visa/checklist',
  VISA_STATUSES: '/visa/statuses',
  VISA_STATUS: '/visa/status',
  VISA_QUOTATIONS: '/visa/quotations',
  VISA_PASSPORT_OPERATIONS: '/visa/passports',
  VISA_SMS_TEMPLATES: '/visa/sms/templates',
  VISA_SMS_LOGS: '/visa/sms/logs',

  TOURS: '/tours',
  TOUR_CREATE: '/tours/new',
  TOUR_CUSTOM: '/tours/custom',
  TOUR_CUSTOM_BUILDER: '/tours/custom/builder',
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

  MEMBERSHIP_PLANS: '/membership/plans',
  MEMBERSHIP_MEMBERS: '/membership/members',
  MEMBERSHIP_REPORTS: '/membership/reports',

  DOCUMENTS: '/documents',
  DOCUMENT_DETAILS: (id) => `/documents/${id}`,

  NOTIFICATIONS: '/notifications',
  REPORTS: '/reports',

  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_GENERAL: '/settings',
  SETTINGS_SECURITY: '/settings/security',
}

export const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [{ to: APP_ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Visa',
    items: [
      { to: APP_ROUTES.VISA_OVERVIEW, label: 'Overview', icon: Gauge, permission: 'visa.view', end: true },
      { to: APP_ROUTES.VISA_APPLICATIONS, label: 'Applications', icon: Stamp, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_COUNTRIES, label: 'Countries', icon: Globe, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_TYPES, label: 'Visa types', icon: Layers, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_PRICING, label: 'Pricing', icon: Tags, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_CHECKLIST, label: 'Checklists', icon: ListChecks, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_STATUSES, label: 'Application statuses', icon: Milestone, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_STATUS, label: 'Status board', icon: Kanban, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_QUOTATIONS, label: 'Quotations', icon: ReceiptText, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_PASSPORT_OPERATIONS, label: 'Passport operations', icon: KeyRound, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_SMS_TEMPLATES, label: 'SMS templates', icon: MessageSquareText, permission: 'visa.view' },
      { to: APP_ROUTES.VISA_SMS_LOGS, label: 'SMS logs', icon: ScrollText, permission: 'visa.view' },
    ],
  },
  {
    label: 'Tours',
    items: [
      { to: APP_ROUTES.TOURS, label: 'Packages', icon: Luggage, permission: 'tours.view' },
      { to: APP_ROUTES.TOUR_CUSTOM, label: 'Custom tours', icon: PenLine, permission: 'tours.view' },
    ],
  },
  {
    label: 'Partners · B2B',
    items: [
      { to: APP_ROUTES.B2B_PARTNERS, label: 'Partners', icon: Handshake, permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_APPLICATIONS, label: 'Applications', icon: Inbox, permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_PICKUPS, label: 'Pickup requests', icon: Bus, permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_COMMISSIONS, label: 'Commissions', icon: Percent, permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_WITHDRAWALS, label: 'Withdrawals', icon: Landmark, permission: 'b2b.view' },
      { to: APP_ROUTES.B2B_DOCUMENTS, label: 'Documents', icon: FileText, permission: 'b2b.view' },
    ],
  },
  {
    label: 'Customers · B2C',
    items: [{ to: APP_ROUTES.B2C_CUSTOMERS, label: 'Customers', icon: UserRound, permission: 'b2c.view' }],
  },
  {
    label: 'Membership',
    items: [
      { to: APP_ROUTES.MEMBERSHIP_PLANS, label: 'Plans', icon: CreditCard, permission: 'memberships.view' },
      { to: APP_ROUTES.MEMBERSHIP_MEMBERS, label: 'Members', icon: BadgePercent, permission: 'memberships.view' },
      { to: APP_ROUTES.MEMBERSHIP_REPORTS, label: 'Reports', icon: ChartLine, permission: 'memberships.view' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: APP_ROUTES.USERS, label: 'Users', icon: Users, permission: 'users.view' },
      { to: APP_ROUTES.ROLES, label: 'Roles & permissions', icon: UserCog, permission: 'users.view' },
      { to: APP_ROUTES.DOCUMENTS, label: 'All documents', icon: Files, permission: 'documents.view' },
      { to: APP_ROUTES.NOTIFICATIONS, label: 'Notifications', icon: Bell },
      { to: APP_ROUTES.REPORTS, label: 'Reports', icon: ChartLine, permission: 'reports.view' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: APP_ROUTES.SETTINGS_PROFILE, label: 'Profile', icon: CircleUser, end: true },
      { to: APP_ROUTES.SETTINGS_GENERAL, label: 'Settings', icon: Settings, end: true },
      { to: APP_ROUTES.SETTINGS_SECURITY, label: 'Security', icon: ShieldCheck, end: true },
    ],
  },
]

export const USER_STATUSES = ['active', 'invited', 'suspended']
// Default workflow keys (spec #14). Labels/messages for these are configurable
// from Visa → Application statuses; the list below is the fallback order.
export const VISA_STATUSES = [
  'submitted',
  'under_review',
  'action_required',
  'documents_completed',
  'processing',
  'submitted_to_embassy',
  'approved',
  'passport_ready',
  'completed',
  'rejected',
  'cancelled',
]
export const VISA_STATUS_TONES = {
  submitted: 'info',
  under_review: 'warning',
  action_required: 'danger',
  documents_completed: 'info',
  processing: 'warning',
  submitted_to_embassy: 'info',
  approved: 'success',
  passport_ready: 'success',
  completed: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
}
export const VISA_TYPE_OPTIONS = [
  { value: 'Tourist Visa', label: 'Tourist Visa' },
  { value: 'Business Visa', label: 'Business Visa' },
]
export const VISA_APPLICATION_CHANNELS = ['b2c', 'b2b']
export const VISA_APPLICANT_TYPES = ['individual', 'business', 'student', 'employee', 'sponsored']
export const VISA_STATUS_CATEGORIES = ['in_progress', 'action_required', 'success', 'failed', 'cancelled']
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

export const CURRENCIES = ['BDT', 'USD', 'EUR', 'GBP', 'AED', 'INR']
