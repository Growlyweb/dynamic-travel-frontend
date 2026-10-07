import { apiClient, withMock, withMockList } from '../../services/apiClient'

// --- INITIAL MOCK DATA ---

const INITIAL_VENDORS = [
  {
    id: 'ven_101',
    name: 'Haji Rafiqul Islam',
    company: 'Bismillah Air & Umrah Travels',
    email: 'rafiq@bismillahair.com',
    phone: '+880 1711-234567',
    address: 'Suite 402, Nayapaltan VIP Tower, Dhaka',
    status: 'active',
    segments: ['Air Tickets', 'Umrah', 'Visas', 'Passports'],
    openingDue: 35000, // Dynamic Due will be: openingDue + bills - payments
    joinedAt: '2025-05-12',
    notes: 'Primary IATA partner for Saudia and Biman group tickets.',
  },
  {
    id: 'ven_102',
    name: 'Syed Mansoor Ali',
    company: 'Al-Haramain Hospitality & Hajj Services',
    email: 'mansoor@alharamain.org',
    phone: '+880 1819-876543',
    address: 'City Center Level 8, Motijheel, Dhaka',
    status: 'active',
    segments: ['Hajj', 'Umrah', 'Hotels', 'Passports'],
    openingDue: 0,
    joinedAt: '2025-08-20',
    notes: 'Handles Makkah and Madinah hotel blocks and moallim contracts.',
  },
  {
    id: 'ven_103',
    name: 'Tanvir Hossain Chowdhury',
    company: 'Global Visa & Consulate Concierge',
    email: 'tanvir@globalvisabd.com',
    phone: '+880 1912-334455',
    address: 'Gulshan 2, Road 45, House 12, Dhaka',
    status: 'active',
    segments: ['Visas', 'Passports'],
    openingDue: -15000, // Negative opening due = Advance paid
    joinedAt: '2026-01-10',
    notes: 'Schengen, UK, and USA consulate expedited submissions.',
  },
  {
    id: 'ven_104',
    name: 'Farhan Zaheer',
    company: 'Skyline Express Aviation & Charters',
    email: 'farhan@skylineexpress.aero',
    phone: '+880 1722-998877',
    address: 'Uttara Sector 3, Jashimuddin Ave, Dhaka',
    status: 'active',
    segments: ['Air Tickets', 'Transport'],
    openingDue: 75000,
    joinedAt: '2025-11-04',
    notes: 'Charter flight arrangements & domestic air tickets.',
  },
  {
    id: 'ven_105',
    name: 'Haji Mohammad Elias',
    company: 'Noor-E-Madinah Pilgrimage Ltd',
    email: 'elias@nooremadinah.com',
    phone: '+880 1611-554433',
    address: 'Chawkbazar Commercial Area, Chattogram',
    status: 'active',
    segments: ['Umrah', 'Hotels', 'Air Tickets'],
    openingDue: 0,
    joinedAt: '2026-03-15',
    notes: 'Chittagong division Umrah group feeder agent.',
  },
  {
    id: 'ven_106',
    name: 'Zubair Al-Mamun',
    company: 'Gulf Oasis Transport & Tourism',
    email: 'zubair@gulfoasis.ae',
    phone: '+880 1733-441122',
    address: 'Agrabad C/A, Chattogram',
    status: 'suspended',
    segments: ['Transport', 'Hotels'],
    openingDue: 22000,
    joinedAt: '2025-09-01',
    notes: 'Account on hold pending reconciliation of hotel billing.',
  },
]

const INITIAL_BILLS = [
  {
    id: 'bil_1001',
    vendorId: 'ven_101',
    vendorName: 'Bismillah Air & Umrah Travels',
    billNumber: 'BIL-2026-081',
    segment: 'Air Tickets',
    amount: 145000,
    reference: 'DAC-JED 12 Pax Saudia Group PNR #SV981K',
    billDate: '2026-09-25',
    dueDate: '2026-10-10',
    status: 'billed',
    notes: 'Group ticket confirmation for Umrah batch #4',
  },
  {
    id: 'bil_1002',
    vendorId: 'ven_101',
    vendorName: 'Bismillah Air & Umrah Travels',
    billNumber: 'BIL-2026-092',
    segment: 'Visas',
    amount: 48000,
    reference: 'Saudi 1-Yr Multiple Entry Visa fee (8 Pax)',
    billDate: '2026-10-01',
    dueDate: '2026-10-15',
    status: 'billed',
    notes: 'Ministry fee + insurance included',
  },
  {
    id: 'bil_1003',
    vendorId: 'ven_102',
    vendorName: 'Al-Haramain Hospitality & Hajj Services',
    billNumber: 'BIL-2026-074',
    segment: 'Hotels',
    amount: 210000,
    reference: 'Swissotel Makkah 4 Quad Rooms - 5 Nights',
    billDate: '2026-09-18',
    dueDate: '2026-10-05',
    status: 'settled',
    notes: 'Voucher #SW-8812 confirmed',
  },
  {
    id: 'bil_1004',
    vendorId: 'ven_102',
    vendorName: 'Al-Haramain Hospitality & Hajj Services',
    billNumber: 'BIL-2026-098',
    segment: 'Umrah',
    amount: 85000,
    reference: 'Ground handling & Mazarat bus charter in Madinah',
    billDate: '2026-10-02',
    dueDate: '2026-10-20',
    status: 'billed',
    notes: 'Batch 5 transport service',
  },
  {
    id: 'bil_1005',
    vendorId: 'ven_103',
    vendorName: 'Global Visa & Consulate Concierge',
    billNumber: 'BIL-2026-061',
    segment: 'Visas',
    amount: 32000,
    reference: 'Schengen appointment & premium lounge slot',
    billDate: '2026-09-20',
    dueDate: '2026-10-04',
    status: 'settled',
    notes: 'French embassy submission for client group',
  },
  {
    id: 'bil_1006',
    vendorId: 'ven_104',
    vendorName: 'Skyline Express Aviation & Charters',
    billNumber: 'BIL-2026-088',
    segment: 'Air Tickets',
    amount: 95000,
    reference: 'Domestic Sylhet & Cox Bazar charter sectors',
    billDate: '2026-09-28',
    dueDate: '2026-10-14',
    status: 'billed',
    notes: 'Corporate client charter tickets',
  },
  {
    id: 'bil_1007',
    vendorId: 'ven_105',
    vendorName: 'Noor-E-Madinah Pilgrimage Ltd',
    billNumber: 'BIL-2026-104',
    segment: 'Hotels',
    amount: 60000,
    reference: 'Anwar Al Madinah Mövenpick 2 Triple Rooms',
    billDate: '2026-10-03',
    dueDate: '2026-10-18',
    status: 'billed',
    notes: 'Complimentary breakfast package',
  },
]

const INITIAL_PAYMENTS = [
  {
    id: 'pay_2001',
    vendorId: 'ven_101',
    vendorName: 'Bismillah Air & Umrah Travels',
    voucherNumber: 'VCH-2026-041',
    amount: 100000,
    paymentDate: '2026-09-29',
    method: 'Bank Transfer',
    account: 'City Bank - ABL Ops (A/C: 11029381)',
    reference: 'TrxID #CTY9928172 - Part pay BIL-2026-081',
    notes: 'Paid via corporate online banking portal',
  },
  {
    id: 'pay_2002',
    vendorId: 'ven_102',
    vendorName: 'Al-Haramain Hospitality & Hajj Services',
    voucherNumber: 'VCH-2026-039',
    amount: 210000,
    paymentDate: '2026-09-22',
    method: 'Bank Transfer',
    account: 'Brac Bank - ABL Hajj (A/C: 22091823)',
    reference: 'Cheque #449210 Cleared',
    notes: 'Full settlement of bill BIL-2026-074',
  },
  {
    id: 'pay_2003',
    vendorId: 'ven_103',
    vendorName: 'Global Visa & Consulate Concierge',
    voucherNumber: 'VCH-2026-045',
    amount: 50000,
    paymentDate: '2026-09-22',
    method: 'Cheque',
    account: 'Eastern Bank Ltd (A/C: 33019283)',
    reference: 'Cheque #882019 Issued (32k Bill + 18k Advance)',
    notes: 'Includes advance deposit for upcoming October consulate slots',
  },
  {
    id: 'pay_2004',
    vendorId: 'ven_105',
    vendorName: 'Noor-E-Madinah Pilgrimage Ltd',
    voucherNumber: 'VCH-2026-052',
    amount: 60000,
    paymentDate: '2026-10-04',
    method: 'MFS (bKash Corporate)',
    account: 'bKash Merchant #01700998811',
    reference: 'Trx #BK99120488',
    notes: 'Immediate settlement of Madinah hotel bill',
  },
]

const INITIAL_PASSPORTS = [
  {
    id: 'psp_501',
    passportNumber: 'A04928172',
    holderName: 'Mohammed Kabir Hossain',
    vendorId: 'ven_101',
    vendorName: 'Bismillah Air & Umrah Travels',
    serviceSegment: 'Umrah',
    country: 'Saudi Arabia',
    submissionDate: '2026-10-01',
    deliveryExpected: '2026-10-12',
    status: 'in_embassy',
    acknowledgementSlipId: 'ack_8001',
    notes: 'Umrah Visa bio stamped; awaiting return from VFS Tasheel',
  },
  {
    id: 'psp_502',
    passportNumber: 'A09384721',
    holderName: 'Rokeya Begum',
    vendorId: 'ven_101',
    vendorName: 'Bismillah Air & Umrah Travels',
    serviceSegment: 'Umrah',
    country: 'Saudi Arabia',
    submissionDate: '2026-10-01',
    deliveryExpected: '2026-10-12',
    status: 'in_embassy',
    acknowledgementSlipId: 'ack_8001',
    notes: 'Traveling with husband Mohammed Kabir Hossain',
  },
  {
    id: 'psp_503',
    passportNumber: 'B01928374',
    holderName: 'Tanvir Hossain',
    vendorId: 'ven_101',
    vendorName: 'Bismillah Air & Umrah Travels',
    serviceSegment: 'Passports',
    country: 'Bangladesh (Renewal)',
    submissionDate: '2026-09-28',
    deliveryExpected: '2026-10-08',
    status: 'ready_for_pickup',
    acknowledgementSlipId: 'ack_8001',
    notes: 'Agargaon passport office renewal completed',
  },
  {
    id: 'psp_504',
    passportNumber: 'B03847192',
    holderName: 'Sumaiya Hossain',
    vendorId: 'ven_101',
    vendorName: 'Bismillah Air & Umrah Travels',
    serviceSegment: 'Visas',
    country: 'UAE',
    submissionDate: '2026-10-02',
    deliveryExpected: '2026-10-06',
    status: 'ready_for_pickup',
    acknowledgementSlipId: 'ack_8001',
    notes: '60 days tourist e-visa approved',
  },
  {
    id: 'psp_505',
    passportNumber: 'C09281723',
    holderName: 'Dr. Shahinur Alam',
    vendorId: 'ven_103',
    vendorName: 'Global Visa & Consulate Concierge',
    serviceSegment: 'Visas',
    country: 'France (Schengen)',
    submissionDate: '2026-09-26',
    deliveryExpected: '2026-10-15',
    status: 'in_embassy',
    acknowledgementSlipId: 'ack_8002',
    notes: 'Submitted at VFS Global Delta Life Tower',
  },
  {
    id: 'psp_506',
    passportNumber: 'D01827364',
    holderName: 'Abdul Gafur Mia',
    vendorId: 'ven_102',
    vendorName: 'Al-Haramain Hospitality & Hajj Services',
    serviceSegment: 'Hajj',
    country: 'Saudi Arabia',
    submissionDate: '2026-09-15',
    deliveryExpected: '2026-10-05',
    status: 'delivered',
    acknowledgementSlipId: 'ack_8003',
    notes: 'Pre-registration biometric verification stamped & returned',
  },
]

const INITIAL_ACKNOWLEDGEMENT_SLIPS = [
  {
    id: 'ack_8001',
    slipNumber: 'ACK-2026-0038',
    receivedDate: '2026-10-01T11:30:00',
    receivedFrom: 'Bismillah Air & Umrah Travels',
    vendorId: 'ven_101',
    contactPerson: 'Haji Rafiqul Islam',
    phone: '+880 1711-234567',
    serviceType: 'Umrah Visa & Passport Renewal',
    documents: [
      { docType: 'Original Passport', count: 4, identifiers: 'A04928172, A09384721, B01928374, B03847192' },
      { docType: 'White Background Photos (35x45mm)', count: 8, identifiers: '2 per applicant' },
      { docType: 'Vaccination Certificates', count: 4, identifiers: 'Meningococcal & COVID ACWY' },
    ],
    passengers: [
      { name: 'Mohammed Kabir Hossain', passportNumber: 'A04928172', relation: 'Self' },
      { name: 'Rokeya Begum', passportNumber: 'A09384721', relation: 'Spouse' },
      { name: 'Tanvir Hossain', passportNumber: 'B01928374', relation: 'Son' },
      { name: 'Sumaiya Hossain', passportNumber: 'B03847192', relation: 'Daughter' },
    ],
    receivingOfficer: 'Kamrul Hasan (Senior Operations Desk #2)',
    status: 'Active',
    remarks: 'Target departure date: 24th October 2026. Urgent processing requested for family package.',
  },
  {
    id: 'ack_8002',
    slipNumber: 'ACK-2026-0039',
    receivedDate: '2026-09-26T15:10:00',
    receivedFrom: 'Global Visa & Consulate Concierge',
    vendorId: 'ven_103',
    contactPerson: 'Tanvir Hossain Chowdhury',
    phone: '+880 1912-334455',
    serviceType: 'Schengen Business Visa Processing',
    documents: [
      { docType: 'Original Passport', count: 1, identifiers: 'C09281723' },
      { docType: 'Company Invitation Letter', count: 1, identifiers: 'Paris MedTech Expo 2026' },
      { docType: '6 Months Bank Statement', count: 1, identifiers: 'Verified & Bank Stamped' },
    ],
    passengers: [
      { name: 'Dr. Shahinur Alam', passportNumber: 'C09281723', relation: 'Primary Applicant' },
    ],
    receivingOfficer: 'Nazmul Abedin (Visa Officer)',
    status: 'In Processing',
    remarks: 'Biometric appointment booked for Oct 4 at 10:30 AM.',
  },
  {
    id: 'ack_8003',
    slipNumber: 'ACK-2026-0035',
    receivedDate: '2026-09-15T09:45:00',
    receivedFrom: 'Al-Haramain Hospitality & Hajj Services',
    vendorId: 'ven_102',
    contactPerson: 'Syed Mansoor Ali',
    phone: '+880 1819-876543',
    serviceType: 'Hajj 2026 Document Verification',
    documents: [
      { docType: 'Original Passport', count: 1, identifiers: 'D01827364' },
      { docType: 'Government Hajj Tracking Serial', count: 1, identifiers: 'SER-HAJJ-8891' },
    ],
    passengers: [
      { name: 'Abdul Gafur Mia', passportNumber: 'D01827364', relation: 'Pilgrim' },
    ],
    receivingOfficer: 'Kamrul Hasan (Senior Operations Desk #2)',
    status: 'Completed & Delivered',
    remarks: 'Documents safely verified, stamped, and handed back on 2026-10-05.',
  },
]

const INITIAL_MARKETING_CONTACTS = [
  {
    id: 'cnt_701',
    name: 'Haji Rafiqul Islam',
    company: 'Bismillah Air & Umrah Travels',
    phone: '+880 1711-234567',
    email: 'rafiq@bismillahair.com',
    source: 'Vendor Sync',
    sourceId: 'ven_101',
    segments: ['Air Tickets', 'Umrah', 'Visas'],
    tags: ['High Volume', 'VIP Agency', 'Regular'],
    status: 'active',
    syncedAt: '2025-05-12',
  },
  {
    id: 'cnt_702',
    name: 'Syed Mansoor Ali',
    company: 'Al-Haramain Hospitality & Hajj Services',
    phone: '+880 1819-876543',
    email: 'mansoor@alharamain.org',
    source: 'Vendor Sync',
    sourceId: 'ven_102',
    segments: ['Hajj', 'Umrah', 'Hotels'],
    tags: ['Pilgrimage Partner', 'Hotel Contractor'],
    status: 'active',
    syncedAt: '2025-08-20',
  },
  {
    id: 'cnt_703',
    name: 'Tanvir Hossain Chowdhury',
    company: 'Global Visa & Consulate Concierge',
    phone: '+880 1912-334455',
    email: 'tanvir@globalvisabd.com',
    source: 'Vendor Sync',
    sourceId: 'ven_103',
    segments: ['Visas', 'Passports'],
    tags: ['Consulate Specialist', 'Advance Payer'],
    status: 'active',
    syncedAt: '2026-01-10',
  },
  {
    id: 'cnt_704',
    name: 'Mohammed Kabir Hossain',
    company: 'Private Pilgrim (Client)',
    phone: '+880 1817-665544',
    email: 'kabir.hossain@gmail.test',
    source: 'Passport Slip Sync',
    sourceId: 'psp_501',
    segments: ['Umrah'],
    tags: ['Family Group', 'Direct Traveler'],
    status: 'active',
    syncedAt: '2026-10-01',
  },
  {
    id: 'cnt_705',
    name: 'Salimullah Bepari',
    company: 'Old Dhaka Travel Associates',
    phone: '+880 1715-001122',
    email: 'salimullah@olddhakatravel.com',
    source: 'Manual',
    sourceId: null,
    segments: ['Air Tickets', 'Umrah'],
    tags: ['Lead', 'Seasonal'],
    status: 'active',
    syncedAt: '2026-09-14',
  },
]

const INITIAL_CAMPAIGNS = [
  {
    id: 'cmp_101',
    title: 'Ramadan 2026 Umrah Group Flight & Clock Tower Hotel Block Fares',
    channel: 'SMS & Email',
    audience: 'Vendors (Umrah & Air Tickets)',
    recipientCount: 148,
    messageContent:
      'Dear Partner, Exclusive 5-star Swissotel & Fairmont Clock Tower packages and direct Saudia Airlines block fares are open for Ramadan 2026. Book by 15th Oct for special 8% agency commission! Team ABL Travel. Hotline: +880 9610-888999.',
    scheduledAt: '2026-10-10 10:00 AM',
    status: 'sent',
    metrics: { sent: 148, delivered: 144, opened: 98, clicked: 46 },
  },
  {
    id: 'cmp_102',
    title: 'Winter Dubai & Turkey Group Tour Special Agency Margins',
    channel: 'WhatsApp & Email',
    audience: 'All Active Vendors',
    recipientCount: 215,
    messageContent:
      'Greetings! Our winter holiday packages for Dubai (5D/4N) and Istanbul/Cappadocia (7D/6N) are live with instant visa approvals. Download our agent tariff rate card now. Contact ABL B2B Desk.',
    scheduledAt: '2026-10-15 03:00 PM',
    status: 'scheduled',
    metrics: { sent: 0, delivered: 0, opened: 0, clicked: 0 },
  },
]

const INITIAL_AUTOMATIONS = [
  {
    id: 'aut_1',
    name: 'Passport Intake Auto Acknowledgement Slip',
    trigger: 'When a new passport or document is received from vendor/client',
    action: 'Dispatch SMS with Slip Ref & generate printable invoice receipt',
    channel: 'SMS & PDF Slip',
    enabled: true,
    executions: 42,
  },
  {
    id: 'aut_2',
    name: 'Visa Embassy Submission Alert',
    trigger: 'When passport status changes to "in_embassy"',
    action: 'Send automated email notification with tracking number',
    channel: 'Email',
    enabled: true,
    executions: 28,
  },
  {
    id: 'aut_3',
    name: 'Passport Ready for Pickup Notice',
    trigger: 'When passport status changes to "ready_for_pickup"',
    action: 'Instant SMS & WhatsApp alert to vendor for collection',
    channel: 'SMS & WhatsApp',
    enabled: true,
    executions: 35,
  },
  {
    id: 'aut_4',
    name: 'Monthly Dynamic Due Ledger Statement',
    trigger: '1st of every month at 09:00 AM if Dynamic Due > 0',
    action: 'Send running financial balance summary & invoice links',
    channel: 'Email & SMS',
    enabled: true,
    executions: 12,
  },
  {
    id: 'aut_5',
    name: 'Pre-Departure Flight Reconfirmation Warning',
    trigger: '48 hours before passenger scheduled flight date',
    action: 'Send flight reconfirmation and airport check-in instructions',
    channel: 'SMS',
    enabled: false,
    executions: 8,
  },
]

// In-memory data store for the session
let storeVendors = [...INITIAL_VENDORS]
let storeBills = [...INITIAL_BILLS]
let storePayments = [...INITIAL_PAYMENTS]
let storePassports = [...INITIAL_PASSPORTS]
let storeSlips = [...INITIAL_ACKNOWLEDGEMENT_SLIPS]
let storeContacts = [...INITIAL_MARKETING_CONTACTS]
let storeCampaigns = [...INITIAL_CAMPAIGNS]
let storeAutomations = [...INITIAL_AUTOMATIONS]

// =========================================================================
// CRITICAL FINANCIAL LOGIC: DYNAMIC DUE CALCULATION
// Real-time tracking: Due = Opening Due + Total Bills - Total Payments.
// Due is NEVER stored as a static typed field; it is computed dynamically.
// =========================================================================

export function calculateVendorFinancials(vendor, bills = storeBills, payments = storePayments) {
  if (!vendor) {
    return {
      openingDue: 0,
      totalBills: 0,
      totalPayments: 0,
      dynamicDue: 0,
      dueStatus: 'settled',
      billCount: 0,
      paymentCount: 0,
      bills: [],
      payments: [],
    }
  }

  const openingDue = Number(vendor.openingDue || 0)
  const vendorBills = bills.filter((b) => b.vendorId === vendor.id)
  const vendorPayments = payments.filter((p) => p.vendorId === vendor.id)

  const totalBills = vendorBills.reduce((acc, b) => acc + Number(b.amount || 0), 0)
  const totalPayments = vendorPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0)

  // Real-time formula: Due = Opening Due + Total Bills - Total Payments
  const dynamicDue = openingDue + totalBills - totalPayments

  let dueStatus = 'settled'
  if (dynamicDue > 0) dueStatus = 'positive' // Red badge
  else if (dynamicDue < 0) dueStatus = 'advance' // Blue badge

  return {
    openingDue,
    totalBills,
    totalPayments,
    dynamicDue,
    dueStatus,
    billCount: vendorBills.length,
    paymentCount: vendorPayments.length,
    bills: vendorBills,
    payments: vendorPayments,
  }
}

// Service breakdown helper per vendor
export function calculateVendorServiceBreakdown(vendorId, bills = storeBills, passports = storePassports) {
  const segments = ['Air Tickets', 'Visas', 'Passports', 'Umrah', 'Hajj', 'Hotels', 'Transport']
  const vendorBills = bills.filter((b) => b.vendorId === vendorId)
  const vendorPassports = passports.filter((p) => p.vendorId === vendorId)

  return segments.map((segment) => {
    const segmentBills = vendorBills.filter((b) => b.segment === segment)
    const billedAmount = segmentBills.reduce((sum, b) => sum + Number(b.amount || 0), 0)
    const passportCount = vendorPassports.filter((p) => p.serviceSegment === segment).length

    return {
      segment,
      billedAmount,
      billCount: segmentBills.length,
      passportCount,
    }
  })
}

// =========================================================================
// API OBJECT
// =========================================================================

export const vendorApi = {
  // --- VENDORS ---
  listVendors: async (params = {}) => {
    return withMockList(
      storeVendors.map((vendor) => {
        const fin = calculateVendorFinancials(vendor, storeBills, storePayments)
        const vPassports = storePassports.filter((p) => p.vendorId === vendor.id)
        return {
          ...vendor,
          // Attaching dynamically computed fields for table rendering
          _calculated: fin,
          dynamicDue: fin.dynamicDue,
          dueStatus: fin.dueStatus,
          totalBills: fin.totalBills,
          totalPayments: fin.totalPayments,
          passportCount: vPassports.length,
        }
      }),
      params,
      { searchKeys: ['name', 'company', 'email', 'phone'] }
    )
  },

  getVendor: async (id) => {
    return withMock(() => {
      const vendor = storeVendors.find((v) => v.id === id) || storeVendors[0]
      const financials = calculateVendorFinancials(vendor, storeBills, storePayments)
      const serviceBreakdown = calculateVendorServiceBreakdown(vendor.id, storeBills, storePassports)
      const vendorPassports = storePassports.filter((p) => p.vendorId === vendor.id)
      return {
        ...vendor,
        financials,
        serviceBreakdown,
        passports: vendorPassports,
      }
    }, () => apiClient.get(`/vendors/${id}`))
  },

  createVendor: async (data) => {
    return withMock(() => {
      const id = `ven_${Date.now()}`
      const newVendor = {
        id,
        name: data.name || '',
        company: data.company || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        status: data.status || 'active',
        segments: data.segments || ['Air Tickets'],
        openingDue: Number(data.openingDue || 0),
        joinedAt: new Date().toISOString().split('T')[0],
        notes: data.notes || '',
      }
      storeVendors.unshift(newVendor)

      // AUTO-SYNC: Sync contact into marketing database automatically
      const newContact = {
        id: `cnt_${Date.now()}`,
        name: newVendor.name,
        company: newVendor.company,
        phone: newVendor.phone,
        email: newVendor.email,
        source: 'Vendor Sync',
        sourceId: newVendor.id,
        segments: newVendor.segments,
        tags: ['New Vendor', 'Auto-Synced'],
        status: 'active',
        syncedAt: newVendor.joinedAt,
      }
      storeContacts.unshift(newContact)

      return newVendor
    }, () => apiClient.post('/vendors', data))
  },

  updateVendor: async (id, data) => {
    return withMock(() => {
      const index = storeVendors.findIndex((v) => v.id === id)
      if (index !== -1) {
        storeVendors[index] = {
          ...storeVendors[index],
          ...data,
          openingDue: data.openingDue !== undefined ? Number(data.openingDue) : storeVendors[index].openingDue,
        }
        // Sync updated details in marketing if exists
        const contactIndex = storeContacts.findIndex((c) => c.sourceId === id)
        if (contactIndex !== -1) {
          storeContacts[contactIndex] = {
            ...storeContacts[contactIndex],
            name: data.name || storeContacts[contactIndex].name,
            company: data.company || storeContacts[contactIndex].company,
            phone: data.phone || storeContacts[contactIndex].phone,
            email: data.email || storeContacts[contactIndex].email,
            segments: data.segments || storeContacts[contactIndex].segments,
          }
        }
        return storeVendors[index]
      }
      return null
    }, () => apiClient.put(`/vendors/${id}`, data))
  },

  // --- BILLS ---
  listBills: async (params = {}) => {
    return withMockList(storeBills, params, {
      searchKeys: ['billNumber', 'vendorName', 'reference', 'segment'],
    })
  },

  createBill: async (data) => {
    return withMock(() => {
      const vendor = storeVendors.find((v) => v.id === data.vendorId)
      const newBill = {
        id: `bil_${Date.now()}`,
        vendorId: data.vendorId,
        vendorName: vendor?.company || vendor?.name || 'Unknown Vendor',
        billNumber: `BIL-2026-${Math.floor(100 + Math.random() * 900)}`,
        segment: data.segment || 'Air Tickets',
        amount: Number(data.amount || 0),
        reference: data.reference || '',
        billDate: data.billDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'billed',
        notes: data.notes || '',
      }
      storeBills.unshift(newBill)
      return newBill
    }, () => apiClient.post('/vendors/bills', data))
  },

  // --- PAYMENTS ---
  listPayments: async (params = {}) => {
    return withMockList(storePayments, params, {
      searchKeys: ['voucherNumber', 'vendorName', 'reference', 'method'],
    })
  },

  createPayment: async (data) => {
    return withMock(() => {
      const vendor = storeVendors.find((v) => v.id === data.vendorId)
      const newPayment = {
        id: `pay_${Date.now()}`,
        vendorId: data.vendorId,
        vendorName: vendor?.company || vendor?.name || 'Unknown Vendor',
        voucherNumber: `VCH-2026-${Math.floor(100 + Math.random() * 900)}`,
        amount: Number(data.amount || 0),
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        method: data.method || 'Bank Transfer',
        account: data.account || 'City Bank - ABL Ops',
        reference: data.reference || '',
        notes: data.notes || '',
      }
      storePayments.unshift(newPayment)
      return newPayment
    }, () => apiClient.post('/vendors/payments', data))
  },

  // --- PASSPORTS & INTAKE ---
  listPassports: async (params = {}) => {
    return withMockList(storePassports, params, {
      searchKeys: ['passportNumber', 'holderName', 'vendorName', 'country'],
    })
  },

  createPassportIntake: async (data) => {
    return withMock(() => {
      const slipNumber = `ACK-2026-${String(storeSlips.length + 40).padStart(4, '0')}`
      const slipId = `ack_${Date.now()}`

      const vendor = storeVendors.find((v) => v.id === data.vendorId)
      const vendorName = vendor?.company || data.receivedFrom || 'Client Direct'

      // 1. Create Acknowledgement Slip
      const newSlip = {
        id: slipId,
        slipNumber,
        receivedDate: new Date().toISOString(),
        receivedFrom: vendorName,
        vendorId: data.vendorId || null,
        contactPerson: data.contactPerson || vendor?.name || '',
        phone: data.phone || vendor?.phone || '',
        serviceType: data.serviceType || 'Visa & Passport Processing',
        documents: data.documents || [
          { docType: 'Original Passport', count: data.passengers?.length || 1, identifiers: data.passengers?.map((p) => p.passportNumber).join(', ') || '' },
        ],
        passengers: data.passengers || [
          { name: data.holderName, passportNumber: data.passportNumber, relation: 'Self' },
        ],
        receivingOfficer: data.receivingOfficer || 'Kamrul Hasan (Senior Operations Desk #2)',
        status: 'Active',
        remarks: data.remarks || 'Standard document intake',
      }
      storeSlips.unshift(newSlip)

      // 2. Insert individual passport records
      const createdPassports = (data.passengers || []).map((p, idx) => {
        const passportRecord = {
          id: `psp_${Date.now()}_${idx}`,
          passportNumber: p.passportNumber,
          holderName: p.name,
          vendorId: data.vendorId || null,
          vendorName,
          serviceSegment: data.serviceSegment || 'Visas',
          country: data.country || 'Saudi Arabia',
          submissionDate: new Date().toISOString().split('T')[0],
          deliveryExpected: data.deliveryExpected || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
          status: 'received',
          acknowledgementSlipId: slipId,
          notes: data.remarks || 'Received via Acknowledgement Slip',
        }
        storePassports.unshift(passportRecord)
        return passportRecord
      })

      // 3. Auto-sync traveler mobile to marketing database if provided
      if (data.phone) {
        storeContacts.unshift({
          id: `cnt_${Date.now()}`,
          name: data.contactPerson || data.holderName || vendorName,
          company: vendorName,
          phone: data.phone,
          email: data.email || '',
          source: 'Passport Slip Sync',
          sourceId: slipId,
          segments: [data.serviceSegment || 'Visas'],
          tags: ['Passport Intake', 'Client Sync'],
          status: 'active',
          syncedAt: new Date().toISOString().split('T')[0],
        })
      }

      return { slip: newSlip, passports: createdPassports }
    }, () => apiClient.post('/vendors/passports/intake', data))
  },

  updatePassportStatus: async (id, status) => {
    return withMock(() => {
      const passport = storePassports.find((p) => p.id === id)
      if (passport) {
        passport.status = status
      }
      return passport
    }, () => apiClient.patch(`/vendors/passports/${id}`, { status }))
  },

  // --- ACKNOWLEDGEMENT SLIPS ---
  listAcknowledgementSlips: async (params = {}) => {
    return withMockList(storeSlips, params, {
      searchKeys: ['slipNumber', 'receivedFrom', 'contactPerson', 'phone', 'serviceType'],
    })
  },

  getAcknowledgementSlip: async (id) => {
    return withMock(() => {
      return storeSlips.find((s) => s.id === id) || storeSlips[0]
    }, () => apiClient.get(`/vendors/acknowledgement-slips/${id}`))
  },

  // --- MARKETING CONTACTS ---
  listMarketingContacts: async (params = {}) => {
    return withMockList(storeContacts, params, {
      searchKeys: ['name', 'company', 'phone', 'email', 'source'],
    })
  },

  createMarketingContact: async (data) => {
    return withMock(() => {
      const newContact = {
        id: `cnt_${Date.now()}`,
        name: data.name,
        company: data.company || '',
        phone: data.phone,
        email: data.email || '',
        source: 'Manual',
        sourceId: null,
        segments: data.segments || ['General'],
        tags: data.tags || ['Manual Entry'],
        status: 'active',
        syncedAt: new Date().toISOString().split('T')[0],
      }
      storeContacts.unshift(newContact)
      return newContact
    }, () => apiClient.post('/marketing/contacts', data))
  },

  // --- CAMPAIGNS & AUTOMATION ---
  listCampaigns: async (params = {}) => {
    return withMockList(storeCampaigns, params, {
      searchKeys: ['title', 'channel', 'audience'],
    })
  },

  createCampaign: async (data) => {
    return withMock(() => {
      const newCampaign = {
        id: `cmp_${Date.now()}`,
        title: data.title,
        channel: data.channel || 'SMS',
        audience: data.audience || 'All Vendors',
        recipientCount: Number(data.recipientCount || storeContacts.length),
        messageContent: data.messageContent || '',
        scheduledAt: data.scheduledAt || new Date().toLocaleString(),
        status: data.sendImmediately ? 'sent' : 'scheduled',
        metrics: data.sendImmediately
          ? {
              sent: storeContacts.length,
              delivered: Math.floor(storeContacts.length * 0.96),
              opened: Math.floor(storeContacts.length * 0.65),
              clicked: Math.floor(storeContacts.length * 0.28),
            }
          : { sent: 0, delivered: 0, opened: 0, clicked: 0 },
      }
      storeCampaigns.unshift(newCampaign)
      return newCampaign
    }, () => apiClient.post('/marketing/campaigns', data))
  },

  listAutomations: async () => {
    return withMock(() => [...storeAutomations], () => apiClient.get('/marketing/automations'))
  },

  toggleAutomation: async (id) => {
    return withMock(() => {
      const auto = storeAutomations.find((a) => a.id === id)
      if (auto) {
        auto.enabled = !auto.enabled
      }
      return auto
    }, () => apiClient.patch(`/marketing/automations/${id}/toggle`))
  },

  // --- DASHBOARD METRICS ---
  getDashboardMetrics: async () => {
    return withMock(() => {
      let totalOpeningDue = 0
      let totalBillsAmount = 0
      let totalPaymentsAmount = 0

      storeVendors.forEach((vendor) => {
        const fin = calculateVendorFinancials(vendor, storeBills, storePayments)
        totalOpeningDue += fin.openingDue
        totalBillsAmount += fin.totalBills
        totalPaymentsAmount += fin.totalPayments
      })

      // Overall Dynamic Due = Opening Due + Total Bills - Total Payments
      const overallDynamicDue = totalOpeningDue + totalBillsAmount - totalPaymentsAmount

      // Breakdown by status
      let positiveDueCount = 0
      let settledCount = 0
      let advanceCount = 0

      storeVendors.forEach((v) => {
        const fin = calculateVendorFinancials(v, storeBills, storePayments)
        if (fin.dynamicDue > 0) positiveDueCount++
        else if (fin.dynamicDue === 0) settledCount++
        else advanceCount++
      })

      const totalPassports = storePassports.length
      const inEmbassyPassports = storePassports.filter((p) => p.status === 'in_embassy').length
      const readyPassports = storePassports.filter((p) => p.status === 'ready_for_pickup').length
      const deliveredPassports = storePassports.filter((p) => p.status === 'delivered').length

      return {
        vendorCount: storeVendors.length,
        totalOpeningDue,
        totalBillsAmount,
        totalPaymentsAmount,
        overallDynamicDue,
        positiveDueCount,
        settledCount,
        advanceCount,
        totalPassports,
        inEmbassyPassports,
        readyPassports,
        deliveredPassports,
        contactsCount: storeContacts.length,
        campaignsCount: storeCampaigns.length,
        activeWorkflowsCount: storeAutomations.filter((a) => a.enabled).length,
      }
    }, () => apiClient.get('/vendors/dashboard-metrics'))
  },
}
