/**
 * Vendor Management Module - API & Client-side Storage Layer
 * Implements full business logic according to Vendor Management Module specification.
 *
 * Formula: Due = Opening Due + Total Bills - Total Payments
 */

const STORAGE_KEYS = {
  SERVICES: 'abl_vendor_services_v1',
  VENDORS: 'abl_vendors_v1',
  BILLS: 'abl_vendor_bills_v1',
  PAYMENTS: 'abl_vendor_payments_v1',
}

// ── Default Seed Services (Section 4.3) ──────────────────────
const DEFAULT_SERVICES = [
  { id: 'srv_air', name: 'Air Ticket', code: 'AIR', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_air_re', name: 'Air Ticket (Re-Issue)', code: 'AIR-RE', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_tour', name: 'Tour Package', code: 'TOUR', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_visa', name: 'Visa', code: 'VISA', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_umrah', name: 'Umrah', code: 'UMR', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_hajj', name: 'Hajj', code: 'HAJ', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_hotel', name: 'Hotel', code: 'HTL', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_car', name: 'Car Rental', code: 'CAR', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_bus', name: 'Bus Ticket', code: 'BUS', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_rail', name: 'Rail Ticket', code: 'RAIL', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_med', name: 'Medical', code: 'MED', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_pass', name: 'Passport', code: 'PASS', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
  { id: 'srv_guide', name: 'Local Guide', code: 'GUIDE', isActive: true, createdAt: '2026-09-01T00:00:00.000Z' },
]

// ── Default Seed Vendors & Transactions (Section 15) ─────────
const DEFAULT_VENDORS = [
  {
    id: 'vnd_1',
    vendorCode: 'VND-0001',
    name: 'Flight Expert',
    email: 'info@flightexpert.com',
    mobile: { countryCode: '+88', number: '01711000001' },
    address: 'Plot 42, Road 11, Block E, Banani, Dhaka',
    services: ['srv_air', 'srv_visa'],
    openingBalance: 0,
    openingBalanceType: 'due',
    creditLimit: 500000,
    fixedAdvance: 0,
    isActive: true,
    createdAt: '2026-09-10T00:00:00.000Z',
  },
  {
    id: 'vnd_2',
    vendorCode: 'VND-0002',
    name: 'Trip Lover',
    email: 'accounts@triplover.com',
    mobile: { countryCode: '+88', number: '01711000002' },
    address: 'House 14, Road 3, Dhanmondi, Dhaka',
    services: ['srv_air', 'srv_visa'],
    openingBalance: 0,
    openingBalanceType: 'due',
    creditLimit: 300000,
    fixedAdvance: 0,
    isActive: true,
    createdAt: '2026-09-12T00:00:00.000Z',
  },
  {
    id: 'vnd_3',
    vendorCode: 'VND-0003',
    name: 'Share Trip',
    email: 'ops@sharetrip.net',
    mobile: { countryCode: '+88', number: '01711000003' },
    address: 'Level 5, Gulshan Tower, Gulshan 2, Dhaka',
    services: ['srv_umrah', 'srv_air'],
    openingBalance: 0,
    openingBalanceType: 'due',
    creditLimit: 400000,
    fixedAdvance: 0,
    isActive: true,
    createdAt: '2026-09-15T00:00:00.000Z',
  },
]

const DEFAULT_BILLS = [
  {
    id: 'bill_1',
    billNo: 'BL-00001',
    date: '2026-10-01',
    vendorId: 'vnd_1',
    serviceId: 'srv_air',
    invoiceRef: 'INV-FE-101',
    amount: 500000,
    note: 'October ticket quota bulk batch',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'bill_2',
    billNo: 'BL-00002',
    date: '2026-10-02',
    vendorId: 'vnd_2',
    serviceId: 'srv_air',
    invoiceRef: 'INV-TL-201',
    amount: 300000,
    note: 'Domestic and international flights',
    createdAt: '2026-10-02T11:00:00.000Z',
  },
  {
    id: 'bill_3',
    billNo: 'BL-00003',
    date: '2026-10-04',
    vendorId: 'vnd_2',
    serviceId: 'srv_visa',
    invoiceRef: 'INV-TL-202',
    amount: 400000,
    note: 'Dubai tourist visa processing batch',
    createdAt: '2026-10-04T09:30:00.000Z',
  },
  {
    id: 'bill_4',
    billNo: 'BL-00004',
    date: '2026-10-05',
    vendorId: 'vnd_3',
    serviceId: 'srv_umrah',
    invoiceRef: 'INV-ST-301',
    amount: 200000,
    note: 'Umrah group package accommodations',
    createdAt: '2026-10-05T14:15:00.000Z',
  },
]

const DEFAULT_PAYMENTS = [
  {
    id: 'pay_1',
    voucherNo: 'VP-00001',
    date: '2026-10-03',
    vendorId: 'vnd_1',
    serviceId: 'srv_air',
    billId: 'bill_1',
    method: 'bank',
    account: 'City Bank AC 21089',
    amount: 420000,
    note: 'Partial settlement against BL-00001',
    createdAt: '2026-10-03T16:00:00.000Z',
  },
  {
    id: 'pay_2',
    voucherNo: 'VP-00002',
    date: '2026-10-05',
    vendorId: 'vnd_2',
    serviceId: 'srv_air',
    billId: 'bill_2',
    method: 'bank',
    account: 'BRAC Bank AC 99821',
    amount: 180000,
    note: 'Partial bank transfer',
    createdAt: '2026-10-05T12:00:00.000Z',
  },
  {
    id: 'pay_3',
    voucherNo: 'VP-00003',
    date: '2026-10-06',
    vendorId: 'vnd_2',
    serviceId: 'srv_visa',
    billId: 'bill_3',
    method: 'bkash',
    account: '01711000002',
    amount: 25000,
    note: 'Direct bKash settlement',
    createdAt: '2026-10-06T15:20:00.000Z',
  },
  {
    id: 'pay_4',
    voucherNo: 'VP-00004',
    date: '2026-10-07',
    vendorId: 'vnd_3',
    serviceId: 'srv_umrah',
    billId: 'bill_4',
    method: 'bank',
    account: 'EBL AC 77123',
    amount: 200000,
    note: 'Full settlement against INV-ST-301',
    createdAt: '2026-10-07T11:45:00.000Z',
  },
]

// ── Storage Helpers ──────────────────────────────────────────
function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback))
      return fallback
    }
    return JSON.parse(raw)
  } catch (err) {
    console.warn(`Failed to read ${key} from storage:`, err)
    return fallback
  }
}

function saveStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err)
  }
}

function generateCode(prefix, existingCodes) {
  let highest = 0
  const regex = new RegExp(`^${prefix}-(\\d+)$`)
  existingCodes.forEach((code) => {
    const match = String(code).match(regex)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > highest) highest = num
    }
  })
  const next = highest + 1
  return `${prefix}-${String(next).padStart(4, '0')}`
}

function generateBillNo(existingBills) {
  let highest = 0
  existingBills.forEach((b) => {
    const match = String(b.billNo).match(/^BL-(\\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > highest) highest = num
    }
  })
  return `BL-${String(highest + 1).padStart(5, '0')}`
}

function generateVoucherNo(existingPayments) {
  let highest = 0
  existingPayments.forEach((p) => {
    const match = String(p.voucherNo).match(/^VP-(\\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (num > highest) highest = num
    }
  })
  return `VP-${String(highest + 1).padStart(5, '0')}`
}

// ── Core Business Calculations (Section 2 & 8) ───────────────
export function calculateVendorTotals(vendor, bills = [], payments = []) {
  const vBills = bills.filter((b) => b.vendorId === vendor.id)
  const vPayments = payments.filter((p) => p.vendorId === vendor.id)

  const billedSum = vBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0)
  const paidSum = vPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  // Opening balance: due adds, advance subtracts
  const opening = Number(vendor.openingBalance) || 0
  const openingDue = vendor.openingBalanceType === 'advance' ? -opening : opening

  const totalBilled = billedSum + (openingDue > 0 ? openingDue : 0)
  const totalPaid = paidSum + (openingDue < 0 ? Math.abs(openingDue) : 0)
  const totalDue = openingDue + billedSum - paidSum

  return {
    billed: billedSum,
    paid: paidSum,
    opening: openingDue,
    totalBilled,
    totalPaid,
    totalDue,
  }
}

export function calculateVendorSegmentDue(vendorId, serviceId, bills = [], payments = []) {
  const billed = bills
    .filter((b) => b.vendorId === vendorId && b.serviceId === serviceId)
    .reduce((acc, b) => acc + (Number(b.amount) || 0), 0)

  const paid = payments
    .filter((p) => p.vendorId === vendorId && p.serviceId === serviceId)
    .reduce((acc, p) => acc + (Number(p.amount) || 0), 0)

  return {
    billed,
    paid,
    due: billed - paid,
  }
}

// ── API Implementation ───────────────────────────────────────
export const vendorApi = {
  // ── Services (Segments) CRUD ────────────────────────────────
  async getServices(params = {}) {
    let services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    if (params.isActive !== undefined) {
      services = services.filter((s) => s.isActive === Boolean(params.isActive))
    }
    // Also include vendor counts
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    const mapped = services.map((s) => {
      const vendorCount = vendors.filter((v) => v.services?.includes(s.id)).length
      const isUsed = bills.some((b) => b.serviceId === s.id) || payments.some((p) => p.serviceId === s.id)
      return {
        ...s,
        vendorsCount: vendorCount,
        isUsed,
      }
    })
    return { success: true, data: mapped }
  },

  async createService(data) {
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const trimmedName = (data.name || '').trim()
    if (!trimmedName) throw new Error('Service name is required.')

    const exists = services.some((s) => s.name.trim().toLowerCase() === trimmedName.toLowerCase())
    if (exists) throw new Error(`A service named "${trimmedName}" already exists.`)

    const newService = {
      id: `srv_${Date.now().toString(36)}`,
      name: trimmedName,
      code: (data.code || '').trim().toUpperCase() || trimmedName.slice(0, 3).toUpperCase(),
      isActive: data.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    services.push(newService)
    saveStorage(STORAGE_KEYS.SERVICES, services)
    return { success: true, data: newService }
  },

  async updateService(id, data) {
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const index = services.findIndex((s) => s.id === id)
    if (index === -1) throw new Error('Service not found.')

    if (data.name) {
      const trimmedName = data.name.trim()
      const duplicate = services.some(
        (s) => s.id !== id && s.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
      if (duplicate) throw new Error(`Another service named "${trimmedName}" already exists.`)
      services[index].name = trimmedName
    }

    if (data.code !== undefined) {
      services[index].code = (data.code || '').trim().toUpperCase()
    }
    if (data.isActive !== undefined) {
      services[index].isActive = Boolean(data.isActive)
    }
    services[index].updatedAt = new Date().toISOString()

    saveStorage(STORAGE_KEYS.SERVICES, services)
    return { success: true, data: services[index] }
  },

  async toggleServiceStatus(id) {
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const index = services.findIndex((s) => s.id === id)
    if (index === -1) throw new Error('Service not found.')
    services[index].isActive = !services[index].isActive
    services[index].updatedAt = new Date().toISOString()
    saveStorage(STORAGE_KEYS.SERVICES, services)
    return { success: true, data: services[index] }
  },

  async deleteService(id) {
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    const isUsed = bills.some((b) => b.serviceId === id) || payments.some((p) => p.serviceId === id)
    if (isUsed) {
      throw new Error('This service has existing bills or payments and cannot be deleted. You can deactivate it instead.')
    }

    const filtered = services.filter((s) => s.id !== id)
    saveStorage(STORAGE_KEYS.SERVICES, filtered)
    return { success: true, message: 'Service deleted successfully.' }
  },

  // ── Vendors CRUD ─────────────────────────────────────────────
  async getVendors(params = {}) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    let results = vendors.map((v) => {
      const totals = calculateVendorTotals(v, bills, payments)
      const serviceObjects = (v.services || [])
        .map((sId) => services.find((s) => s.id === sId))
        .filter(Boolean)

      const hasTransactions =
        bills.some((b) => b.vendorId === v.id) || payments.some((p) => p.vendorId === v.id)

      return {
        ...v,
        serviceObjects,
        serviceNames: serviceObjects.map((s) => s.name),
        ...totals,
        hasTransactions,
      }
    })

    // Filter by search (name, vendor code, mobile)
    if (params.search) {
      const q = params.search.trim().toLowerCase()
      results = results.filter((v) => {
        const fullPhone = `${v.mobile?.countryCode || ''} ${v.mobile?.number || ''}`.toLowerCase()
        return (
          v.name.toLowerCase().includes(q) ||
          v.vendorCode.toLowerCase().includes(q) ||
          fullPhone.includes(q) ||
          (v.email && v.email.toLowerCase().includes(q))
        )
      })
    }

    // Filter by status
    if (params.status && params.status !== 'all') {
      const isAct = params.status === 'active'
      results = results.filter((v) => v.isActive === isAct)
    }

    // Filter by service
    if (params.serviceId && params.serviceId !== 'all') {
      results = results.filter((v) => v.services?.includes(params.serviceId))
    }

    // Sort by Due descending or custom
    if (params.sort === 'due_desc') {
      results.sort((a, b) => b.totalDue - a.totalDue)
    } else if (params.sort === 'name_asc') {
      results.sort((a, b) => a.name.localeCompare(b.name))
    } else {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return {
      success: true,
      data: results,
      total: results.length,
    }
  },

  async getVendor(id) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    const vendor = vendors.find((v) => v.id === id)
    if (!vendor) throw new Error('Vendor not found.')

    const totals = calculateVendorTotals(vendor, bills, payments)
    const serviceObjects = (vendor.services || [])
      .map((sId) => services.find((s) => s.id === sId))
      .filter(Boolean)

    const hasTransactions =
      bills.some((b) => b.vendorId === vendor.id) || payments.some((p) => p.vendorId === vendor.id)

    return {
      success: true,
      data: {
        ...vendor,
        serviceObjects,
        serviceNames: serviceObjects.map((s) => s.name),
        ...totals,
        hasTransactions,
      },
    }
  },

  async createVendor(data) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const trimmedName = (data.name || '').trim()
    if (!trimmedName) throw new Error('Vendor name is required.')

    // Unique case-insensitive check (Section 4.2 & 11)
    const duplicate = vendors.some((v) => v.name.trim().toLowerCase() === trimmedName.toLowerCase())
    if (duplicate) throw new Error(`A vendor named "${trimmedName}" already exists. Duplicate names are not allowed.`)

    // Min 1 service required (Section 11)
    if (!Array.isArray(data.services) || data.services.length === 0) {
      throw new Error('A vendor must be linked to at least one service/segment.')
    }

    // Auto-generate VND-XXXX if empty
    let code = (data.vendorCode || '').trim().toUpperCase()
    if (!code) {
      code = generateCode('VND', vendors.map((v) => v.vendorCode))
    }

    const newVendor = {
      id: `vnd_${Date.now().toString(36)}`,
      vendorCode: code,
      name: trimmedName,
      email: (data.email || '').trim(),
      mobile: {
        countryCode: data.mobile?.countryCode || '+88',
        number: (data.mobile?.number || '').trim(),
      },
      address: (data.address || '').trim(),
      services: data.services,
      openingBalance: Math.max(0, Number(data.openingBalance) || 0),
      openingBalanceType: data.openingBalanceType === 'advance' ? 'advance' : 'due',
      creditLimit: Math.max(0, Number(data.creditLimit) || 0),
      fixedAdvance: Math.max(0, Number(data.fixedAdvance) || 0),
      isActive: data.isActive !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    vendors.push(newVendor)
    saveStorage(STORAGE_KEYS.VENDORS, vendors)
    return { success: true, data: newVendor }
  },

  async updateVendor(id, data) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const index = vendors.findIndex((v) => v.id === id)
    if (index === -1) throw new Error('Vendor not found.')

    if (data.name) {
      const trimmedName = data.name.trim()
      const duplicate = vendors.some(
        (v) => v.id !== id && v.name.trim().toLowerCase() === trimmedName.toLowerCase()
      )
      if (duplicate) throw new Error(`Another vendor named "${trimmedName}" already exists.`)
      vendors[index].name = trimmedName
    }

    if (data.services !== undefined) {
      if (!Array.isArray(data.services) || data.services.length === 0) {
        throw new Error('A vendor must have at least one service.')
      }
      vendors[index].services = data.services
    }

    if (data.vendorCode !== undefined) {
      vendors[index].vendorCode = data.vendorCode.trim().toUpperCase()
    }
    if (data.email !== undefined) vendors[index].email = data.email.trim()
    if (data.mobile !== undefined) {
      vendors[index].mobile = {
        countryCode: data.mobile.countryCode || '+88',
        number: (data.mobile.number || '').trim(),
      }
    }
    if (data.address !== undefined) vendors[index].address = data.address.trim()
    if (data.openingBalance !== undefined) vendors[index].openingBalance = Math.max(0, Number(data.openingBalance) || 0)
    if (data.openingBalanceType !== undefined) vendors[index].openingBalanceType = data.openingBalanceType
    if (data.creditLimit !== undefined) vendors[index].creditLimit = Math.max(0, Number(data.creditLimit) || 0)
    if (data.fixedAdvance !== undefined) vendors[index].fixedAdvance = Math.max(0, Number(data.fixedAdvance) || 0)
    if (data.isActive !== undefined) vendors[index].isActive = Boolean(data.isActive)

    vendors[index].updatedAt = new Date().toISOString()
    saveStorage(STORAGE_KEYS.VENDORS, vendors)
    return { success: true, data: vendors[index] }
  },

  async toggleVendorStatus(id) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const index = vendors.findIndex((v) => v.id === id)
    if (index === -1) throw new Error('Vendor not found.')
    vendors[index].isActive = !vendors[index].isActive
    vendors[index].updatedAt = new Date().toISOString()
    saveStorage(STORAGE_KEYS.VENDORS, vendors)
    return { success: true, data: vendors[index] }
  },

  async deleteVendor(id) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    const hasBills = bills.some((b) => b.vendorId === id)
    const hasPayments = payments.some((p) => p.vendorId === id)

    // Strict Rule (Section 4.1 & 11): Cannot delete if vendor has bills or payments
    if (hasBills || hasPayments) {
      throw new Error(
        'Vendor has recorded bills or payments and cannot be deleted. You can set the vendor to Inactive instead.'
      )
    }

    const filtered = vendors.filter((v) => v.id !== id)
    saveStorage(STORAGE_KEYS.VENDORS, filtered)
    return { success: true, message: 'Vendor deleted successfully.' }
  },

  // ── Vendor Bills CRUD ────────────────────────────────────────
  async getBills(params = {}) {
    let bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    if (params.vendorId && params.vendorId !== 'all') {
      bills = bills.filter((b) => b.vendorId === params.vendorId)
    }
    if (params.serviceId && params.serviceId !== 'all') {
      bills = bills.filter((b) => b.serviceId === params.serviceId)
    }
    if (params.from) {
      bills = bills.filter((b) => b.date >= params.from)
    }
    if (params.to) {
      bills = bills.filter((b) => b.date <= params.to)
    }

    const enriched = bills.map((b) => {
      const vendor = vendors.find((v) => v.id === b.vendorId)
      const service = services.find((s) => s.id === b.serviceId)
      // Linked payments for this specific bill (if any)
      const linkedPaid = payments
        .filter((p) => p.billId === b.id)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
      const due = (Number(b.amount) || 0) - linkedPaid

      return {
        ...b,
        vendorName: vendor ? vendor.name : 'Unknown Vendor',
        vendorCode: vendor ? vendor.vendorCode : '',
        serviceName: service ? service.name : 'Unknown Service',
        paid: linkedPaid,
        due,
      }
    })

    enriched.sort((a, b) => new Date(b.date) - new Date(a.date))
    return { success: true, data: enriched, total: enriched.length }
  },

  async createBill(data) {
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)

    if (!data.vendorId) throw new Error('Vendor is required.')
    if (!data.serviceId) throw new Error('Service/Segment is required.')

    const vendor = vendors.find((v) => v.id === data.vendorId)
    if (!vendor) throw new Error('Selected vendor not found.')

    // Rule: Service must be linked to vendor
    if (!vendor.services?.includes(data.serviceId)) {
      throw new Error('The selected service is not linked to this vendor.')
    }

    const amount = Number(data.amount)
    if (!amount || amount <= 0) throw new Error('Amount must be greater than 0.')

    const newBill = {
      id: `bill_${Date.now().toString(36)}`,
      billNo: generateBillNo(bills),
      date: data.date || new Date().toISOString().slice(0, 10),
      vendorId: data.vendorId,
      serviceId: data.serviceId,
      invoiceRef: (data.invoiceRef || '').trim(),
      amount,
      note: (data.note || '').trim(),
      attachment: data.attachment || '',
      createdAt: new Date().toISOString(),
    }

    bills.push(newBill)
    saveStorage(STORAGE_KEYS.BILLS, bills)
    return { success: true, data: newBill }
  },

  async updateBill(id, data) {
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const index = bills.findIndex((b) => b.id === id)
    if (index === -1) throw new Error('Bill not found.')

    const bill = bills[index]
    const vendorId = data.vendorId || bill.vendorId
    const serviceId = data.serviceId || bill.serviceId

    const vendor = vendors.find((v) => v.id === vendorId)
    if (vendor && !vendor.services?.includes(serviceId)) {
      throw new Error('The selected service is not linked to this vendor.')
    }

    if (data.amount !== undefined) {
      const amount = Number(data.amount)
      if (!amount || amount <= 0) throw new Error('Amount must be greater than 0.')
      bills[index].amount = amount
    }

    if (data.date) bills[index].date = data.date
    if (data.invoiceRef !== undefined) bills[index].invoiceRef = data.invoiceRef.trim()
    if (data.note !== undefined) bills[index].note = data.note.trim()
    if (data.vendorId) bills[index].vendorId = data.vendorId
    if (data.serviceId) bills[index].serviceId = data.serviceId

    saveStorage(STORAGE_KEYS.BILLS, bills)
    return { success: true, data: bills[index] }
  },

  async deleteBill(id) {
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const filtered = bills.filter((b) => b.id !== id)
    saveStorage(STORAGE_KEYS.BILLS, filtered)
    return { success: true, message: 'Bill deleted.' }
  },

  // ── Vendor Payments CRUD ─────────────────────────────────────
  async getPayments(params = {}) {
    let payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)

    if (params.vendorId && params.vendorId !== 'all') {
      payments = payments.filter((p) => p.vendorId === params.vendorId)
    }
    if (params.serviceId && params.serviceId !== 'all') {
      payments = payments.filter((p) => p.serviceId === params.serviceId)
    }
    if (params.from) {
      payments = payments.filter((p) => p.date >= params.from)
    }
    if (params.to) {
      payments = payments.filter((p) => p.date <= params.to)
    }

    const enriched = payments.map((p) => {
      const vendor = vendors.find((v) => v.id === p.vendorId)
      const service = services.find((s) => s.id === p.serviceId)
      return {
        ...p,
        vendorName: vendor ? vendor.name : 'Unknown Vendor',
        vendorCode: vendor ? vendor.vendorCode : '',
        serviceName: service ? service.name : 'Unknown Service',
      }
    })

    enriched.sort((a, b) => new Date(b.date) - new Date(a.date))
    return { success: true, data: enriched, total: enriched.length }
  },

  async createPayment(data) {
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)

    if (!data.vendorId) throw new Error('Vendor is required.')
    if (!data.serviceId) throw new Error('Service/Segment is required.')

    const vendor = vendors.find((v) => v.id === data.vendorId)
    if (!vendor) throw new Error('Selected vendor not found.')

    if (!vendor.services?.includes(data.serviceId)) {
      throw new Error('The selected service is not linked to this vendor.')
    }

    const amount = Number(data.amount)
    if (!amount || amount <= 0) throw new Error('Amount must be greater than 0.')

    // Check current due for that vendor and segment for warning validation
    const { due: currentDue } = calculateVendorSegmentDue(data.vendorId, data.serviceId, bills, payments)
    const isAdvance = amount > currentDue

    const newPayment = {
      id: `pay_${Date.now().toString(36)}`,
      voucherNo: generateVoucherNo(payments),
      date: data.date || new Date().toISOString().slice(0, 10),
      vendorId: data.vendorId,
      serviceId: data.serviceId,
      billId: data.billId || null,
      method: data.method || 'bank',
      account: (data.account || '').trim(),
      amount,
      document: data.document || '',
      note: (data.note || '').trim(),
      createdAt: new Date().toISOString(),
    }

    payments.push(newPayment)
    saveStorage(STORAGE_KEYS.PAYMENTS, payments)
    return {
      success: true,
      data: newPayment,
      warning: isAdvance
        ? `Payment amount exceeds current due of ৳${currentDue.toLocaleString()}. The excess of ৳${(amount - currentDue).toLocaleString()} is recorded as an Advance.`
        : null,
    }
  },

  async updatePayment(id, data) {
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const index = payments.findIndex((p) => p.id === id)
    if (index === -1) throw new Error('Payment not found.')

    const pay = payments[index]
    const vendorId = data.vendorId || pay.vendorId
    const serviceId = data.serviceId || pay.serviceId

    const vendor = vendors.find((v) => v.id === vendorId)
    if (vendor && !vendor.services?.includes(serviceId)) {
      throw new Error('The selected service is not linked to this vendor.')
    }

    if (data.amount !== undefined) {
      const amount = Number(data.amount)
      if (!amount || amount <= 0) throw new Error('Amount must be greater than 0.')
      payments[index].amount = amount
    }

    if (data.date) payments[index].date = data.date
    if (data.method) payments[index].method = data.method
    if (data.account !== undefined) payments[index].account = data.account.trim()
    if (data.note !== undefined) payments[index].note = data.note.trim()
    if (data.vendorId) payments[index].vendorId = data.vendorId
    if (data.serviceId) payments[index].serviceId = data.serviceId
    if (data.billId !== undefined) payments[index].billId = data.billId

    saveStorage(STORAGE_KEYS.PAYMENTS, payments)
    return { success: true, data: payments[index] }
  },

  async deletePayment(id) {
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)
    const filtered = payments.filter((p) => p.id !== id)
    saveStorage(STORAGE_KEYS.PAYMENTS, filtered)
    return { success: true, message: 'Payment deleted.' }
  },

  // ── Vendor Ledger (Section 4.6 Tab 2) ────────────────────────
  async getVendorLedger(vendorId) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    const vendor = vendors.find((v) => v.id === vendorId)
    if (!vendor) throw new Error('Vendor not found.')

    const ledgerEntries = []

    // 1. Opening Balance entry
    const openingBal = Number(vendor.openingBalance) || 0
    if (openingBal > 0) {
      const isDue = vendor.openingBalanceType === 'due'
      ledgerEntries.push({
        id: 'opening_bal',
        date: vendor.createdAt ? vendor.createdAt.slice(0, 10) : '2026-01-01',
        type: 'opening',
        ref: 'OPENING',
        serviceName: 'General / Opening',
        description: isDue ? 'Opening Due balance' : 'Opening Advance balance',
        billed: isDue ? openingBal : 0,
        paid: !isDue ? openingBal : 0,
      })
    }

    // 2. Bills
    const vBills = bills.filter((b) => b.vendorId === vendorId)
    vBills.forEach((b) => {
      const srv = services.find((s) => s.id === b.serviceId)
      ledgerEntries.push({
        id: b.id,
        date: b.date,
        type: 'bill',
        ref: b.billNo,
        invoiceRef: b.invoiceRef,
        serviceName: srv ? srv.name : 'Unknown Service',
        description: b.note || `Bill for ${srv?.name || 'Service'}`,
        billed: Number(b.amount) || 0,
        paid: 0,
      })
    })

    // 3. Payments
    const vPayments = payments.filter((p) => p.vendorId === vendorId)
    vPayments.forEach((p) => {
      const srv = services.find((s) => s.id === p.serviceId)
      ledgerEntries.push({
        id: p.id,
        date: p.date,
        type: 'payment',
        ref: p.voucherNo,
        serviceName: srv ? srv.name : 'Unknown Service',
        description: p.note || `Payment via ${p.method} (${p.account || '—'})`,
        billed: 0,
        paid: Number(p.amount) || 0,
      })
    })

    // Sort chronologically
    ledgerEntries.sort((a, b) => {
      if (a.date === b.date) {
        if (a.type === 'opening') return -1
        if (b.type === 'opening') return 1
        if (a.type === 'bill' && b.type === 'payment') return -1
        if (a.type === 'payment' && b.type === 'bill') return 1
      }
      return new Date(a.date) - new Date(b.date)
    })

    // Calculate running balance
    let runningBalance = 0
    const calculatedRows = ledgerEntries.map((entry) => {
      runningBalance = runningBalance + entry.billed - entry.paid
      return {
        ...entry,
        balance: runningBalance,
      }
    })

    return {
      success: true,
      data: calculatedRows,
      finalBalance: runningBalance,
    }
  },

  // ── Vendor Segment Breakdown (Section 4.6 Tab 1) ─────────────
  async getVendorSegmentDue(vendorId) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    const bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    const payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    const vendor = vendors.find((v) => v.id === vendorId)
    if (!vendor) throw new Error('Vendor not found.')

    const result = (vendor.services || []).map((srvId) => {
      const srv = services.find((s) => s.id === srvId)
      const { billed, paid, due } = calculateVendorSegmentDue(vendorId, srvId, bills, payments)
      return {
        serviceId: srvId,
        serviceName: srv ? srv.name : 'Unknown Service',
        serviceCode: srv ? srv.code : '',
        billed,
        paid,
        due,
      }
    })

    return { success: true, data: result }
  },

  // ── Dashboard Aggregation (Section 5, 7.4 & 8) ───────────────
  async getDashboardData(filters = {}) {
    const vendors = loadStorage(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS)
    const services = loadStorage(STORAGE_KEYS.SERVICES, DEFAULT_SERVICES)
    let bills = loadStorage(STORAGE_KEYS.BILLS, DEFAULT_BILLS)
    let payments = loadStorage(STORAGE_KEYS.PAYMENTS, DEFAULT_PAYMENTS)

    // Apply Date Range filters
    if (filters.from) {
      bills = bills.filter((b) => b.date >= filters.from)
      payments = payments.filter((p) => p.date >= filters.from)
    }
    if (filters.to) {
      bills = bills.filter((b) => b.date <= filters.to)
      payments = payments.filter((p) => p.date <= filters.to)
    }

    // Filter by specific vendor
    let targetVendors = vendors
    if (filters.vendorId && filters.vendorId !== 'all') {
      targetVendors = vendors.filter((v) => v.id === filters.vendorId)
      bills = bills.filter((b) => b.vendorId === filters.vendorId)
      payments = payments.filter((p) => p.vendorId === filters.vendorId)
    }

    // Filter by specific segment
    let targetServices = services
    if (filters.serviceId && filters.serviceId !== 'all') {
      targetServices = services.filter((s) => s.id === filters.serviceId)
      bills = bills.filter((b) => b.serviceId === filters.serviceId)
      payments = payments.filter((p) => p.serviceId === filters.serviceId)
    }

    // ── 5.1 Summary Cards ──
    const activeVendorsCount = targetVendors.filter((v) => v.isActive).length
    let totalBilledSum = 0
    let totalPaidSum = 0

    // Table A: Due by Vendor
    let tableA = targetVendors.map((v, idx) => {
      const totals = calculateVendorTotals(v, bills, payments)
      totalBilledSum += totals.totalBilled
      totalPaidSum += totals.totalPaid

      const vendorServices = (v.services || [])
        .map((sId) => services.find((s) => s.id === sId))
        .filter(Boolean)

      return {
        sl: idx + 1,
        vendorId: v.id,
        vendor: v.name,
        vendorCode: v.vendorCode,
        services: vendorServices.map((s) => s.name),
        opening: totals.opening,
        billed: totals.billed,
        paid: totals.paid,
        due: totals.totalDue,
        isActive: v.isActive,
      }
    })

    // "Show only vendors with due" toggle
    if (filters.onlyDue) {
      tableA = tableA.filter((row) => row.due > 0)
    }

    // Table A: Sorted by Due descending (Section 5.2)
    tableA.sort((a, b) => b.due - a.due)
    tableA.forEach((row, i) => {
      row.sl = i + 1
    })

    const summaryTotals = {
      totalVendors: activeVendorsCount,
      totalBilled: totalBilledSum,
      totalPaid: totalPaidSum,
      totalDue: totalBilledSum - totalPaidSum,
    }

    // ── 5.3 Table B: Due by Segment ──
    let tableB = targetServices
      .map((srv, idx) => {
        const srvBills = bills.filter((b) => b.serviceId === srv.id)
        const srvPayments = payments.filter((p) => p.serviceId === srv.id)

        const billed = srvBills.reduce((acc, b) => acc + (Number(b.amount) || 0), 0)
        const paid = srvPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
        const due = billed - paid

        // Count active vendors assigned to this service
        const vendorCount = targetVendors.filter((v) => v.isActive && v.services?.includes(srv.id)).length

        return {
          sl: idx + 1,
          segmentId: srv.id,
          segment: srv.name,
          vendorsCount: vendorCount,
          billed,
          paid,
          due,
        }
      })
      .filter((row) => row.billed > 0 || row.paid > 0 || row.vendorsCount > 0)

    if (filters.onlyDue) {
      tableB = tableB.filter((row) => row.due > 0)
    }

    tableB.sort((a, b) => b.due - a.due)
    tableB.forEach((row, i) => {
      row.sl = i + 1
    })

    // ── 5.4 Table C: Vendor × Segment Matrix ──
    // Only include services that have active bills/payments or are assigned to targetVendors
    const activeSegmentIds = new Set()
    targetVendors.forEach((v) => (v.services || []).forEach((sId) => activeSegmentIds.add(sId)))
    bills.forEach((b) => activeSegmentIds.add(b.serviceId))
    payments.forEach((p) => activeSegmentIds.add(p.serviceId))

    const matrixSegments = targetServices
      .filter((s) => activeSegmentIds.has(s.id))
      .map((s) => ({ id: s.id, name: s.name, code: s.code }))

    const matrixRows = []
    const columnTotals = {}
    matrixSegments.forEach((s) => {
      columnTotals[s.id] = 0
    })
    let grandTotal = 0

    targetVendors.forEach((vendor) => {
      const rowDues = {}
      let rowTotalDue = 0

      matrixSegments.forEach((srv) => {
        const { due } = calculateVendorSegmentDue(vendor.id, srv.id, bills, payments)
        rowDues[srv.id] = due
        rowTotalDue += due
        columnTotals[srv.id] = (columnTotals[srv.id] || 0) + due
      })

      // Add opening balance to vendor's row total
      const opening = Number(vendor.openingBalance) || 0
      const openingDue = vendor.openingBalanceType === 'advance' ? -opening : opening
      rowTotalDue += openingDue

      if (!filters.onlyDue || rowTotalDue > 0) {
        matrixRows.push({
          vendorId: vendor.id,
          vendor: vendor.name,
          vendorCode: vendor.vendorCode,
          dues: rowDues,
          opening: openingDue,
          totalDue: rowTotalDue,
        })
        grandTotal += rowTotalDue
      }
    })

    // Sort matrix rows by totalDue descending
    matrixRows.sort((a, b) => b.totalDue - a.totalDue)

    return {
      success: true,
      summary: summaryTotals,
      byVendor: tableA,
      bySegment: tableB,
      matrix: {
        segments: matrixSegments,
        rows: matrixRows,
        columnTotals,
        grandTotal,
      },
    }
  },

  // Reset to initial test dataset
  async resetToSeedData() {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(DEFAULT_SERVICES))
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(DEFAULT_VENDORS))
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(DEFAULT_BILLS))
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(DEFAULT_PAYMENTS))
    return { success: true }
  },
}

// ── CSV / Excel Export Utility (Section 4.1, 5.5, 13) ─────────
export function exportToCsv(filename, headers, rows) {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""'
    const stringVal = String(val).replace(/"/g, '""')
    return `"${stringVal}"`
  }

  const headerRow = headers.map((h) => escapeCsv(h.label)).join(',')
  const dataRows = rows.map((row) =>
    headers
      .map((h) => {
        const val = typeof h.key === 'function' ? h.key(row) : row[h.key]
        return escapeCsv(val)
      })
      .join(',')
  )

  const csvContent = [headerRow, ...dataRows].join('\r\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
