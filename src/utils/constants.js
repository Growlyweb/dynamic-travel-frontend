import {
  BadgePercent,
  Bell,
  Building2,
  ChartColumnBig,
  ChartLine,
  CircleUser,
  CreditCard,
  Megaphone,
  Files,
  FileText,
  Gauge,
  HandCoins,
  Handshake,
  Home,
  Inbox,
  Landmark,
  LayoutDashboard,
  ListChecks,
  ListTree,
  Luggage,
  PenLine,
  Percent,
  ReceiptText,
  Settings,
  ShieldCheck,
  Stamp,
  Tags,
  Bus,
  UserCog,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'

export const APP_ROUTES = {
  LOGIN: '/login',
  LOGIN_ADMIN: '/dashboard/login/admin',
  LOGIN_STAFF: '/dashboard/login/staff',
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
  VISA_STATUS: '/visa/status-board',
  VISA_QUOTATIONS: '/visa/quotations',
  VISA_PASSPORT_OPERATIONS: '/visa/passports',
  VISA_SMS_TEMPLATES: '/visa/sms/templates',
  VISA_SMS_LOGS: '/visa/sms/logs',

  TOURS: '/tours/packages',
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

  VENDORS_DASHBOARD: '/vendors/dashboard',
  VENDORS: '/vendors',
  VENDOR_CREATE: '/vendors/new',
  VENDOR_SERVICES: '/vendors/services',
  VENDOR_BILLS: '/vendors/bills',
  VENDOR_PAYMENTS: '/vendors/payments',
  VENDOR_DETAILS: (id) => `/vendors/${id}`,
  VENDOR_EDIT: (id) => `/vendors/${id}/edit`,

  DOCUMENTS: '/documents',
  DOCUMENT_DETAILS: (id) => `/documents/${id}`,

  NOTIFICATIONS: '/notifications',
  ACCOUNTS_HOME: '/accounts',
  ACCOUNTS_SALES: '/accounts/sales',
  ACCOUNTS_DUES: '/accounts/dues',
  ACCOUNTS_RECEIPTS: '/accounts/receipts',
  ACCOUNTS_MONTHLY: '/accounts/monthly',
  ACCOUNTS_PROFIT: '/accounts/profit',
  ACCOUNTS_CATEGORIES: '/accounts/categories',
  ACCOUNTS_PRICE_LIST: '/accounts/price-list',
  ACCOUNTS_AGENTS: '/accounts/agents',
  ACCOUNTS_CLIENTS: '/accounts/clients',
  ACCOUNTS_PAYABLES: '/accounts/payables',
  ACCOUNTS_PARTNERS: '/accounts/partners',
  REPORTS: '/reports',
  REPORTS_OVERVIEW: '/reports/overview',
  REPORTS_JOURNAL: '/reports/journal',
  REPORTS_ACCOUNTS: '/reports/accounts',
  REPORTS_LEDGER: '/reports/ledger',
  REPORTS_TRIAL_BALANCE: '/reports/trial-balance',
  REPORTS_PROFIT_LOSS: '/reports/profit-loss',
  REPORTS_BALANCE_SHEET: '/reports/balance-sheet',
  REPORTS_B2B_AGENTS: '/reports/b2b-agents',
  REPORTS_B2C_CLIENTS: '/reports/b2c-clients',
  REPORTS_PAYABLES: '/reports/payables',
  REPORTS_VISA_FILES: '/reports/visa-files',
  REPORTS_CATEGORIES: '/reports/categories',
  REPORTS_MONTHLY: '/reports/monthly',
  REPORT_MARKETING: '/reports/marketing',


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
      { to: APP_ROUTES.VISA_OVERVIEW, label: 'Overview', icon: Gauge, permission: 'VISA_VIEW', end: true },
      { to: APP_ROUTES.VISA_APPLICATIONS, label: 'Applications', icon: Stamp, permission: 'VISA_VIEW' },
      // { to: APP_ROUTES.VISA_COUNTRIES, label: 'Countries', icon: Globe, permission: 'VISA_VIEW' },
      // { to: APP_ROUTES.VISA_TYPES, label: 'Visa types', icon: Layers, permission: 'VISA_VIEW' },
      { to: APP_ROUTES.VISA_PRICING, label: 'Pricing', icon: Tags, permission: 'VISA_VIEW' },
      { to: APP_ROUTES.VISA_CHECKLIST, label: 'Checklists', icon: ListChecks, permission: 'VISA_VIEW' },
      // { to: APP_ROUTES.VISA_STATUSES, label: 'Application statuses', icon: Milestone, permission: 'VISA_VIEW' },
      // { to: APP_ROUTES.VISA_STATUS, label: 'Status board', icon: Kanban, permission: 'VISA_VIEW' },
      // { to: APP_ROUTES.VISA_QUOTATIONS, label: 'Quotations', icon: ReceiptText, permission: 'VISA_VIEW' },
      // { to: APP_ROUTES.VISA_PASSPORT_OPERATIONS, label: 'Passport operations', icon: KeyRound, permission: 'VISA_VIEW' },
      // { to: APP_ROUTES.VISA_SMS_TEMPLATES, label: 'SMS templates', icon: MessageSquareText, permission: 'VISA_VIEW' },
      // { to: APP_ROUTES.VISA_SMS_LOGS, label: 'SMS logs', icon: ScrollText, permission: 'VISA_VIEW' },
    ],
  },
  {
    label: 'Tours',
    items: [
      { to: APP_ROUTES.TOURS, label: 'Packages', icon: Luggage, permission: 'TOURS_VIEW' },
      { to: APP_ROUTES.TOUR_CUSTOM, label: 'Custom tours', icon: PenLine, permission: 'TOURS_VIEW' },
    ],
  },
  {
    label: 'Partners · B2B',
    items: [
      { to: APP_ROUTES.B2B_PARTNERS, label: 'Partners', icon: Handshake, permission: 'B2B_VIEW' },
      { to: APP_ROUTES.B2B_APPLICATIONS, label: 'Applications', icon: Inbox, permission: 'B2B_VIEW' },
      { to: APP_ROUTES.B2B_PICKUPS, label: 'Pickup requests', icon: Bus, permission: 'B2B_VIEW' },
      { to: APP_ROUTES.B2B_COMMISSIONS, label: 'Commissions', icon: Percent, permission: 'B2B_VIEW' },
      { to: APP_ROUTES.B2B_WITHDRAWALS, label: 'Withdrawals', icon: Landmark, permission: 'B2B_VIEW' },
      { to: APP_ROUTES.B2B_DOCUMENTS, label: 'Documents', icon: FileText, permission: 'B2B_VIEW' },
    ],
  },
  {
    label: 'Customers · B2C',
    items: [{ to: APP_ROUTES.B2C_CUSTOMERS, label: 'Customers', icon: UserRound, permission: 'B2C_VIEW' }],
  },
  {
    label: 'Membership',
    items: [
      { to: APP_ROUTES.MEMBERSHIP_PLANS, label: 'Plans', icon: CreditCard, permission: 'MEMBERSHIP_MANAGE' },
      { to: APP_ROUTES.MEMBERSHIP_MEMBERS, label: 'Members', icon: BadgePercent, permission: 'MEMBERSHIP_MANAGE' },
      { to: APP_ROUTES.MEMBERSHIP_REPORTS, label: 'Reports', icon: ChartLine, permission: 'MEMBERSHIP_MANAGE' },
    ],
  },
  {
    label: 'Vendors',
    items: [
      { to: APP_ROUTES.VENDORS, label: 'Vendors', icon: Building2, end: true },
      { to: APP_ROUTES.VENDOR_CREATE, label: 'Add Vendor', icon: PenLine },
      { to: APP_ROUTES.VENDOR_SERVICES, label: 'Vendor Services', icon: ListTree },
      { to: APP_ROUTES.VENDOR_BILLS, label: 'Vendor Bills', icon: FileText },
      { to: APP_ROUTES.VENDOR_PAYMENTS, label: 'Payments & Advances', icon: Wallet },
    ],
  },
  {
    label: 'Accounts',
    items: [
      { to: APP_ROUTES.ACCOUNTS_HOME, label: 'Home', icon: Home, permission: 'REPORTS_VIEW', end: true },
      { to: APP_ROUTES.ACCOUNTS_SALES, label: 'Sales', icon: ReceiptText, permission: 'REPORTS_VIEW' },
      { to: APP_ROUTES.ACCOUNTS_DUES, label: 'Client Dues', icon: Wallet, permission: 'REPORTS_VIEW' },
      { to: APP_ROUTES.ACCOUNTS_RECEIPTS, label: 'Money Receipts', icon: HandCoins, permission: 'REPORTS_VIEW' },
      { to: APP_ROUTES.ACCOUNTS_MONTHLY, label: 'Monthly Report', icon: ChartColumnBig, permission: 'REPORTS_VIEW' },
      { to: APP_ROUTES.ACCOUNTS_PROFIT, label: 'Profit & Expenses', icon: ChartLine, permission: 'REPORTS_VIEW' },
      { to: APP_ROUTES.ACCOUNTS_PAYABLES, label: 'Vendor Payables', icon: Wallet, permission: 'REPORTS_VIEW' },
    ],
  },
  {
    label: 'Clients & Partners',
    items: [
      { to: APP_ROUTES.ACCOUNTS_AGENTS, label: 'B2B Agents', icon: Building2, permission: 'REPORTS_VIEW' },
      { to: APP_ROUTES.ACCOUNTS_CLIENTS, label: 'B2C Clients', icon: UserRound, permission: 'REPORTS_VIEW' },
      { to: APP_ROUTES.ACCOUNTS_PARTNERS, label: 'Partners', icon: Handshake, permission: 'REPORTS_VIEW' },
    ],
  },

   {
    label: 'Marketing',
    items: [{ to: APP_ROUTES.REPORT_MARKETING, label: 'Email & SMS', icon: Megaphone, permission: 'REPORTS_VIEW' },],
  },
  
  {
    label: 'Setup',
    items: [
      { to: APP_ROUTES.ACCOUNTS_CATEGORIES, label: 'Categories', icon: Tags, permission: 'REPORTS_VIEW' },
      { to: APP_ROUTES.ACCOUNTS_PRICE_LIST, label: 'Price List', icon: ListTree, permission: 'REPORTS_VIEW' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: APP_ROUTES.USERS, label: 'Users', icon: Users, permission: 'ADMIN_ONLY' },
      { to: APP_ROUTES.ROLES, label: 'Roles & permissions', icon: UserCog, permission: 'ADMIN_ONLY' },
      { to: APP_ROUTES.DOCUMENTS, label: 'All documents', icon: Files, permission: 'DOCUMENT_VIEW' },
      { to: APP_ROUTES.NOTIFICATIONS, label: 'Notifications', icon: Bell },
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

export const USER_STATUSES = ['active', 'invited', 'suspended', 'blocked', 'inactive']
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
export const PARTNER_STATUSES = ['pending', 'documents_verified', 'approved', 'suspended', 'rejected']
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

export const PAGINATION_PAGE_SIZES = [50, 100, 200, 300, 400, 500]
export const DEFAULT_PAGE_SIZE = 50

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
