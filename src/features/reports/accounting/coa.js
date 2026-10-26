/**
 * Chart of Accounts, business segments and travel-service catalogue.
 *
 * This module is the single source of truth for the accounting structure:
 * account codes, normal balances, statement grouping, and the travel/visa
 * service rate card used by the operating (job costing) layer.
 */

export const ACCOUNT_TYPES = ['Asset', 'Liability', 'Equity', 'Income', 'Expense']

export const TYPE_ORDER = {
  Asset: 1,
  Liability: 2,
  Equity: 3,
  Income: 4,
  Expense: 5,
}

export const GROUP_ORDER = [
  'Current Assets',
  'Non-current Assets',
  'Current Liabilities',
  'Non-current Liabilities',
  'Capital & Partners',
  'Operating Revenue',
  'Direct Costs',
  'Operating Expenses',
]

/** Debit-normal account types. Used for display signs and validation. */
export const DEBIT_TYPES = ['Asset', 'Expense']

/**
 * Master chart of accounts. `control` marks the two control accounts that
 * carry party sub-ledgers (receivables / payables).
 */
export const ACCOUNTS = [
  /* ── Assets ─────────────────────────────────────────────── */
  { code: '1010', name: 'Cash in Hand', type: 'Asset', group: 'Current Assets', cash: true },
  { code: '1020', name: 'City Bank — Current Account', type: 'Asset', group: 'Current Assets', bank: true },
  { code: '1030', name: 'BRAC Bank — Current Account', type: 'Asset', group: 'Current Assets', bank: true },
  { code: '1040', name: 'bKash — Mobile Wallet', type: 'Asset', group: 'Current Assets', cash: true },
  { code: '1100', name: 'Accounts Receivable — Customers & Agents', type: 'Asset', group: 'Current Assets', control: 'AR' },
  { code: '1200', name: 'Advances to Suppliers', type: 'Asset', group: 'Current Assets' },
  { code: '1300', name: 'Prepaid Office Rent', type: 'Asset', group: 'Current Assets' },
  { code: '1500', name: 'Office Equipment', type: 'Asset', group: 'Non-current Assets' },
  { code: '1510', name: 'Furniture & Fixtures', type: 'Asset', group: 'Non-current Assets' },
  { code: '1590', name: 'Less: Accumulated Depreciation', type: 'Asset', group: 'Non-current Assets', contra: true },

  /* ── Liabilities ────────────────────────────────────────── */
  { code: '2010', name: 'Accounts Payable — Suppliers', type: 'Liability', group: 'Current Liabilities', control: 'AP' },
  { code: '2020', name: 'Customer Advances', type: 'Liability', group: 'Current Liabilities' },
  { code: '2030', name: 'Salary & Allowance Payable', type: 'Liability', group: 'Current Liabilities' },
  { code: '2040', name: 'Agent Commission Payable', type: 'Liability', group: 'Current Liabilities' },

  /* ── Equity ─────────────────────────────────────────────── */
  { code: '3010', name: 'Partner A — Capital', type: 'Equity', group: 'Capital & Partners' },
  { code: '3020', name: 'Partner B — Capital', type: 'Equity', group: 'Capital & Partners' },
  { code: '3030', name: 'Partner A — Drawings', type: 'Equity', group: 'Capital & Partners', contra: true },
  { code: '3040', name: 'Partner B — Drawings', type: 'Equity', group: 'Capital & Partners', contra: true },
  { code: '3050', name: 'Retained Earnings — Brought Forward', type: 'Equity', group: 'Capital & Partners' },

  /* ── Income ─────────────────────────────────────────────── */
  { code: '4010', name: 'Visa Processing Revenue', type: 'Income', group: 'Operating Revenue', segment: 'visa' },
  { code: '4020', name: 'Tour Package Revenue', type: 'Income', group: 'Operating Revenue', segment: 'tour' },
  { code: '4030', name: 'Air Ticketing Revenue', type: 'Income', group: 'Operating Revenue', segment: 'air' },
  { code: '4040', name: 'Hotel Booking Revenue', type: 'Income', group: 'Operating Revenue', segment: 'hotel' },
  { code: '4050', name: 'Transport & Transfer Revenue', type: 'Income', group: 'Operating Revenue', segment: 'transport' },
  { code: '4060', name: 'Other Service Revenue', type: 'Income', group: 'Operating Revenue', segment: 'other' },
  { code: '4090', name: 'Discounts & Adjustments', type: 'Income', group: 'Operating Revenue', contra: true },

  /* ── Direct costs (cost of service) ─────────────────────── */
  { code: '5010', name: 'Embassy & Consular Fees', type: 'Expense', group: 'Direct Costs', segment: 'visa' },
  { code: '5020', name: 'Visa Processing & Courier', type: 'Expense', group: 'Direct Costs', segment: 'visa' },
  { code: '5030', name: 'Land Package / DMC Cost', type: 'Expense', group: 'Direct Costs', segment: 'tour' },
  { code: '5040', name: 'Airline Fare Cost', type: 'Expense', group: 'Direct Costs', segment: 'air' },
  { code: '5050', name: 'Hotel Supplier Cost', type: 'Expense', group: 'Direct Costs', segment: 'hotel' },
  { code: '5060', name: 'Transport Supplier Cost', type: 'Expense', group: 'Direct Costs', segment: 'transport' },
  { code: '5070', name: 'Agent Commission', type: 'Expense', group: 'Direct Costs' },
  { code: '5080', name: 'Tour Operations & Guide Cost', type: 'Expense', group: 'Direct Costs', segment: 'tour' },
  { code: '5090', name: 'Other Service Cost', type: 'Expense', group: 'Direct Costs', segment: 'other' },

  /* ── Operating expenses ─────────────────────────────────── */
  { code: '6010', name: 'Salaries & Allowances', type: 'Expense', group: 'Operating Expenses' },
  { code: '6020', name: 'Office Rent', type: 'Expense', group: 'Operating Expenses' },
  { code: '6030', name: 'Utilities & Internet', type: 'Expense', group: 'Operating Expenses' },
  { code: '6040', name: 'Marketing & Promotion', type: 'Expense', group: 'Operating Expenses' },
  { code: '6050', name: 'Travel & Conveyance', type: 'Expense', group: 'Operating Expenses' },
  { code: '6060', name: 'Professional & Legal Fees', type: 'Expense', group: 'Operating Expenses' },
  { code: '6070', name: 'Bank Charges & Fees', type: 'Expense', group: 'Operating Expenses' },
  { code: '6080', name: 'Printing & Office Supplies', type: 'Expense', group: 'Operating Expenses' },
  { code: '6090', name: 'Depreciation', type: 'Expense', group: 'Operating Expenses' },
  { code: '6100', name: 'Miscellaneous Expenses', type: 'Expense', group: 'Operating Expenses' },
]

export const ACCOUNT_BY_CODE = ACCOUNTS.reduce((map, account) => {
  map[account.code] = account
  return map
}, {})

export const AR_ACCOUNT = '1100'
export const AP_ACCOUNT = '2010'

export const CASH_ACCOUNTS = ['1010', '1020', '1030', '1040']

export const PAYMENT_METHODS = [
  { value: 'city', label: 'Bank — City Bank', account: '1020', icon: 'bank' },
  { value: 'brac', label: 'Bank — BRAC Bank', account: '1030', icon: 'bank' },
  { value: 'cash', label: 'Cash in Hand', account: '1010', icon: 'cash' },
  { value: 'bkash', label: 'bKash', account: '1040', icon: 'wallet' },
]

export const PAYMENT_METHOD_BY_VALUE = PAYMENT_METHODS.reduce((map, method) => {
  map[method.value] = method
  return map
}, {})

/** Cash/bank account code for a payment method value. */
export function methodAccount(method) {
  return PAYMENT_METHOD_BY_VALUE[method]?.account ?? '1020'
}

/* ── Business segments (service lines) ─────────────────────── */

export const SEGMENTS = [
  {
    id: 'visa',
    name: 'Visa Processing',
    short: 'Visa',
    color: '#0879E8',
    soft: '#E6F2FD',
    revenue: '4010',
    cost: ['5010', '5020'],
    description: 'Tourist, business, family, Umrah and student visa files',
  },
  {
    id: 'tour',
    name: 'Tour Packages',
    short: 'Tour',
    color: '#16A34A',
    soft: '#ECFDF3',
    revenue: '4020',
    cost: ['5030', '5080'],
    description: 'Domestic and outbound holiday, honeymoon and group tours',
  },
  {
    id: 'air',
    name: 'Air Ticketing',
    short: 'Air',
    color: '#7C3AED',
    soft: '#F3E8FF',
    revenue: '4030',
    cost: ['5040'],
    description: 'Domestic and international air ticket issuance',
  },
  {
    id: 'hotel',
    name: 'Hotel Booking',
    short: 'Hotel',
    color: '#D97706',
    soft: '#FFF7E6',
    revenue: '4040',
    cost: ['5050'],
    description: 'Hotel and resort reservations worldwide',
  },
  {
    id: 'transport',
    name: 'Transport & Transfer',
    short: 'Transport',
    color: '#0D9488',
    soft: '#E6FFFA',
    revenue: '4050',
    cost: ['5060'],
    description: 'Airport pickups, city transfers and ground transport',
  },
  {
    id: 'other',
    name: 'Other Services',
    short: 'Other',
    color: '#64748B',
    soft: '#F1F5F9',
    revenue: '4060',
    cost: ['5090'],
    description: 'Documentation, insurance and ancillary services',
  },
]

export const SEGMENT_BY_ID = SEGMENTS.reduce((map, segment) => {
  map[segment.id] = segment
  return map
}, {})

/* ── Operating file types (job costing) ────────────────────── */

export const FILE_TYPES = {
  Visa: {
    segment: 'visa',
    prefix: 'VF',
    label: 'Visa File',
    revenue: '4010',
    dueDays: 7,
    detailLabel: 'Visa type',
  },
  Tour: {
    segment: 'tour',
    prefix: 'TF',
    label: 'Tour Booking',
    revenue: '4020',
    dueDays: 15,
    detailLabel: 'Package',
  },
  'Air Ticket': {
    segment: 'air',
    prefix: 'AF',
    label: 'Air Ticket',
    revenue: '4030',
    dueDays: 3,
    detailLabel: 'Route',
  },
  Hotel: {
    segment: 'hotel',
    prefix: 'HF',
    label: 'Hotel Booking',
    revenue: '4040',
    dueDays: 7,
    detailLabel: 'Property',
  },
  Transport: {
    segment: 'transport',
    prefix: 'XF',
    label: 'Transport Service',
    revenue: '4050',
    dueDays: 3,
    detailLabel: 'Service',
  },
}

export const FILE_TYPE_LIST = Object.keys(FILE_TYPES)

export const FILE_STATUSES = ['Processing', 'Completed', 'Cancelled']

/* ── Travel service rate card ──────────────────────────────── */

/**
 * Every entry is a saleable service. `cost` is the payable supplier/embassy
 * value, `b2c` the retail price and `b2b` the wholesale agent price.
 */
export const DESTINATIONS = {
  visa: [
    { name: 'Thailand', detail: 'Tourist Visa', cost: 4800, b2c: 9800, b2b: 8500 },
    { name: 'Malaysia', detail: 'Tourist Visa', cost: 3600, b2c: 8500, b2b: 7200 },
    { name: 'Singapore', detail: 'Tourist Visa', cost: 4500, b2c: 10500, b2b: 9000 },
    { name: 'Dubai, UAE', detail: 'Tourist Visa', cost: 7200, b2c: 12500, b2b: 10800 },
    { name: 'Saudi Arabia', detail: 'Umrah Visa', cost: 9500, b2c: 15500, b2b: 13500 },
    { name: 'Qatar', detail: 'Tourist Visa', cost: 7000, b2c: 12000, b2b: 10500 },
    { name: 'Oman', detail: 'Business Visa', cost: 6800, b2c: 11800, b2b: 10200 },
    { name: 'India', detail: 'Tourist Visa', cost: 1900, b2c: 6500, b2b: 5500 },
    { name: 'Turkey', detail: 'Tourist Visa', cost: 6900, b2c: 13500, b2b: 11500 },
    { name: 'Vietnam', detail: 'Tourist Visa', cost: 5200, b2c: 11500, b2b: 9800 },
    { name: 'Indonesia', detail: 'Tourist Visa', cost: 4900, b2c: 11000, b2b: 9500 },
    { name: 'Japan', detail: 'Student Visa', cost: 5500, b2c: 14500, b2b: 12500 },
    { name: 'South Korea', detail: 'Business Visa', cost: 5800, b2c: 15000, b2b: 13000 },
    { name: 'United Kingdom', detail: 'Family Visit', cost: 21000, b2c: 34000, b2b: 30000 },
    { name: 'Canada', detail: 'Family Visit', cost: 19000, b2c: 32000, b2b: 28000 },
    { name: 'Australia', detail: 'Student Visa', cost: 17500, b2c: 30000, b2b: 26000 },
  ],
  tour: [
    { name: "Cox's Bazar", detail: '3 Days / 2 Nights', cost: 9500, b2c: 16500, b2b: 14000 },
    { name: 'Sundarbans', detail: '2 Days / 1 Night', cost: 8000, b2c: 14500, b2b: 12500 },
    { name: 'Bangkok & Pattaya', detail: '4 Nights / 5 Days', cost: 48000, b2c: 72000, b2b: 64000 },
    { name: 'Kuala Lumpur', detail: '3 Nights / 4 Days', cost: 42000, b2c: 65000, b2b: 58000 },
    { name: 'Dubai City', detail: '4 Nights / 5 Days', cost: 62000, b2c: 92000, b2b: 84000 },
    { name: 'Turkey Grand Tour', detail: '7 Nights / 8 Days', cost: 148000, b2c: 210000, b2b: 192000 },
    { name: 'Maldives Honeymoon', detail: '3 Nights / 4 Days', cost: 95000, b2c: 138000, b2b: 125000 },
    { name: 'Singapore & Malaysia', detail: '5 Nights / 6 Days', cost: 78000, b2c: 115000, b2b: 104000 },
    { name: 'Kathmandu', detail: '3 Nights / 4 Days', cost: 24000, b2c: 38000, b2b: 34000 },
    { name: 'Kashmir Valley', detail: '5 Nights / 6 Days', cost: 36000, b2c: 58000, b2b: 52000 },
    { name: 'Sri Lanka', detail: '4 Nights / 5 Days', cost: 38000, b2c: 60000, b2b: 54000 },
  ],
  air: [
    { name: 'DAC — DXB', detail: 'Dubai · Economy', cost: 48000, b2c: 51000, b2b: 50000 },
    { name: 'DAC — JED', detail: 'Jeddah · Economy', cost: 72000, b2c: 76000, b2b: 74500 },
    { name: 'DAC — BKK', detail: 'Bangkok · Economy', cost: 36000, b2c: 38500, b2b: 37700 },
    { name: 'DAC — KUL', detail: 'Kuala Lumpur · Economy', cost: 34000, b2c: 36500, b2b: 35700 },
    { name: 'DAC — SIN', detail: 'Singapore · Economy', cost: 42000, b2c: 45000, b2b: 44000 },
    { name: 'DAC — IST', detail: 'Istanbul · Economy', cost: 58000, b2c: 61500, b2b: 60300 },
    { name: 'DAC — LHR', detail: 'London · Economy', cost: 95000, b2c: 100000, b2b: 98000 },
    { name: 'DAC — YYZ', detail: 'Toronto · Economy', cost: 118000, b2c: 123500, b2b: 121000 },
    { name: 'DAC — DEL', detail: 'Delhi · Economy', cost: 18000, b2c: 20000, b2b: 19400 },
    { name: 'DAC — CDG', detail: 'Paris · Economy', cost: 92000, b2c: 96500, b2b: 95000 },
  ],
  hotel: [
    { name: 'Bangkok', detail: 'Grand Sukhumvit · 4★', cost: 24000, b2c: 30000, b2b: 27500 },
    { name: 'Dubai', detail: 'Marina View · 4★', cost: 38000, b2c: 47500, b2b: 44000 },
    { name: 'Makkah', detail: 'Haram View · 5★', cost: 42000, b2c: 52000, b2b: 48000 },
    { name: 'Madinah', detail: 'Central District · 4★', cost: 35000, b2c: 43000, b2b: 40000 },
    { name: 'Kuala Lumpur', detail: 'Bukit Bintang · 4★', cost: 20000, b2c: 25500, b2b: 23500 },
    { name: 'Singapore', detail: 'Orchard Road · 4★', cost: 32000, b2c: 40000, b2b: 37000 },
    { name: 'Cox\u2019s Bazar', detail: 'Sea Beach Resort · 4★', cost: 9000, b2c: 13500, b2b: 11500 },
  ],
  transport: [
    { name: 'Airport Pickup — Dhaka', detail: 'Sedan · One way', cost: 2200, b2c: 3500, b2b: 3000 },
    { name: 'City Transfer — Dhaka', detail: 'Hiace · Half day', cost: 3500, b2c: 5500, b2b: 4800 },
    { name: "Cox's Bazar Drop", detail: 'Chander Gari · Day trip', cost: 6500, b2c: 9500, b2b: 8500 },
    { name: 'Bangkok Transfer', detail: 'Van · Airport to hotel', cost: 4500, b2c: 7000, b2b: 6000 },
    { name: 'Dubai Transfer', detail: 'Sedan · Airport to hotel', cost: 5500, b2c: 8500, b2b: 7200 },
  ],
}

/** Destination catalogue for a file type. */
export function destinationList(fileType) {
  const segment = FILE_TYPES[fileType]?.segment
  return DESTINATIONS[segment] ?? []
}

/**
 * Suggested cost lines for a service, split across the segment's cost
 * accounts. Returns rounded integer amounts.
 */
export function buildCostLines(fileType, destination, costValue) {
  const cost = Math.max(0, Math.round(Number(costValue) || 0))
  if (fileType === 'Visa') {
    const embassy = Math.round(cost * 0.72)
    return [
      { account: '5010', label: 'Embassy / consular fee', amount: embassy, paidVia: 'bank' },
      { account: '5020', label: 'Processing, courier & documentation', amount: cost - embassy, paidVia: 'credit' },
    ]
  }
  if (fileType === 'Tour') {
    const land = Math.round(cost * 0.82)
    return [
      { account: '5030', label: `Land package — ${destination || 'DMC'}`, amount: land, paidVia: 'credit' },
      { account: '5080', label: 'Tour operations, guide & transfers', amount: cost - land, paidVia: 'bank' },
    ]
  }
  if (fileType === 'Air Ticket') {
    return [{ account: '5040', label: 'Airline fare (net of commission)', amount: cost, paidVia: 'credit' }]
  }
  if (fileType === 'Hotel') {
    return [{ account: '5050', label: `Hotel supplier — ${destination || 'property'}`, amount: cost, paidVia: 'credit' }]
  }
  return [{ account: '5060', label: 'Ground transport supplier', amount: cost, paidVia: 'credit' }]
}

/* ── Company profile used on printed documents ─────────────── */

export const COMPANY = {
  name: 'ABL Travel & Tours',
  legalName: 'ABL Travel & Tours Ltd.',
  tagline: 'Visa · Tour Packages · Air Ticketing',
  address: 'House 12, Road 7, Banani, Dhaka 1213, Bangladesh',
  phone: '+880 1711-000000',
  email: 'accounts@abltravel.com.bd',
  web: 'www.abltravel.com.bd',
  bin: 'BIN 003214567-0102',
  bank: 'City Bank — A/C 1402 5566 7890 (Banani Branch)',
  currency: 'BDT',
}

export const VOUCHER_TYPES = {
  OB: { label: 'Opening Balance', tone: 'slate', prefix: 'OB' },
  SV: { label: 'Sales Invoice', tone: 'blue', prefix: 'SV' },
  RV: { label: 'Money Receipt', tone: 'green', prefix: 'RV' },
  PV: { label: 'Payment', tone: 'rose', prefix: 'PV' },
  JV: { label: 'Journal Voucher', tone: 'purple', prefix: 'JV' },
  CV: { label: 'Contra Voucher', tone: 'amber', prefix: 'CV' },
}

export const VOUCHER_TYPE_OPTIONS = [
  { value: 'JV', label: 'Journal Voucher' },
  { value: 'SV', label: 'Sales Invoice' },
  { value: 'RV', label: 'Money Receipt' },
  { value: 'PV', label: 'Payment Voucher' },
  { value: 'CV', label: 'Contra Voucher' },
]

export const AGING_BUCKETS = [
  { key: 'current', label: 'Not due', color: '#16A34A' },
  { key: 'd1_30', label: '1–30 days', color: '#0879E8' },
  { key: 'd31_60', label: '31–60 days', color: '#D97706' },
  { key: 'd61_90', label: '61–90 days', color: '#EA580C' },
  { key: 'd90_plus', label: '90+ days', color: '#DC2626' },
]
