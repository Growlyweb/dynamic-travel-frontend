import { todayISO } from '../reports/lib/dates'

/**
 * B2B partner onboarding + portal data layer.
 *
 * Public registration creates a partner with status "pending" and uploads
 * documents. Admin verifies the documents, then approves the partner and only
 * then can the partner log in to the portal.
 */

const PARTNERS_KEY = 'abl_b2b_partners_v2'
const DOCUMENTS_KEY = 'abl_b2b_partner_documents_v2'

const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`

const clone = (value) => JSON.parse(JSON.stringify(value))

const DEMO_PICKUPS = [
  { id: 'pk_1', partner: 'Skyline Travels', location: 'Dubai International Airport T3', pickupAt: '2026-10-04T14:30:00Z', travelers: 4, status: 'scheduled' },
  { id: 'pk_2', partner: 'Wanderlust Agency', location: 'Heathrow Airport T5', pickupAt: '2026-10-06T09:00:00Z', travelers: 2, status: 'requested' },
]

const DEMO_COMMISSIONS = [
  { id: 'cm_1', partner: 'Skyline Travels', booking: 'BK-88121', amount: 320, rate: '8%', month: 'September 2026', status: 'earned' },
  { id: 'cm_2', partner: 'Skyline Travels', booking: 'BK-88094', amount: 210, rate: '8%', month: 'September 2026', status: 'paid' },
  { id: 'cm_3', partner: 'Wanderlust Agency', booking: 'BK-88071', amount: 145, rate: '6%', month: 'September 2026', status: 'earned' },
  { id: 'cm_4', partner: 'Pacific Voyages', booking: 'BK-88012', amount: 96, rate: '6%', month: 'August 2026', status: 'paid' },
]

const DEMO_WITHDRAWALS = [
  { id: 'wd_1', partner: 'Skyline Travels', amount: 1250, method: 'Bank transfer', requestedAt: '2026-10-01', status: 'pending' },
  { id: 'wd_2', partner: 'Wanderlust Agency', amount: 640, method: 'Wise', requestedAt: '2026-09-24', status: 'paid' },
  { id: 'wd_3', partner: 'Pacific Voyages', amount: 210, method: 'PayPal', requestedAt: '2026-09-18', status: 'approved' },
]

let withdrawalsStore = clone(DEMO_WITHDRAWALS)

const DEMO_PARTNERS = [
  {
    id: 'pt_301',
    name: 'Amina Khan',
    company: 'Skyline Travels',
    email: 'amina@skylinetravels.test',
    phone: '01711000101',
    country: 'UAE',
    address: 'Deira, Dubai',
    password: 'partner123',
    tier: 'gold',
    status: 'approved',
    isActive: true,
    commissionDue: 1250,
    joinedAt: '2025-11-03',
    approvedAt: '2025-11-04',
  },
  {
    id: 'pt_302',
    name: 'James Walker',
    company: 'Wanderlust Agency',
    email: 'james@wanderlust.test',
    phone: '01711000102',
    country: 'United Kingdom',
    address: 'London',
    password: 'partner123',
    tier: 'silver',
    status: 'approved',
    isActive: true,
    commissionDue: 640,
    joinedAt: '2026-02-18',
    approvedAt: '2026-02-20',
  },
  {
    id: 'pt_303',
    name: 'Rahul Mehta',
    company: 'Sunrise Holidays',
    email: 'rahul@sunriseholidays.test',
    phone: '01711000103',
    country: 'India',
    address: 'New Delhi',
    password: 'partner123',
    tier: 'bronze',
    status: 'pending',
    isActive: false,
    commissionDue: 0,
    joinedAt: '2026-09-12',
  },
  {
    id: 'pt_304',
    name: 'Mei Lin',
    company: 'Pacific Voyages',
    email: 'mei@pacificvoyages.test',
    phone: '01711000104',
    country: 'Singapore',
    address: 'Singapore',
    password: 'partner123',
    tier: 'silver',
    status: 'suspended',
    isActive: false,
    commissionDue: 210,
    joinedAt: '2025-06-25',
    approvedAt: '2025-06-27',
  },
]

const DEMO_DOCUMENTS = [
  {
    id: 'pd_1',
    partnerId: 'pt_301',
    partner: 'Skyline Travels',
    name: 'Trade license 2026.pdf',
    fileName: 'Trade license 2026.pdf',
    type: 'trade_license',
    uploadedAt: '2026-08-02',
    status: 'verified',
  },
  {
    id: 'pd_2',
    partnerId: 'pt_303',
    partner: 'Sunrise Holidays',
    name: 'Trade license.pdf',
    fileName: 'Trade license.pdf',
    type: 'trade_license',
    uploadedAt: '2026-09-13',
    status: 'pending',
  },
  {
    id: 'pd_3',
    partnerId: 'pt_304',
    partner: 'Pacific Voyages',
    name: 'Insurance policy.pdf',
    fileName: 'Insurance policy.pdf',
    type: 'other',
    uploadedAt: '2026-07-19',
    status: 'rejected',
  },
]

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return clone(fallback)
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : clone(fallback)
  } catch {
    return clone(fallback)
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Keep the in-memory flow usable when storage is unavailable.
  }
}

let partnersStore = read(PARTNERS_KEY, DEMO_PARTNERS)
let documentsStore = read(DOCUMENTS_KEY, DEMO_DOCUMENTS)

function savePartners() {
  write(PARTNERS_KEY, partnersStore)
}

function saveDocuments() {
  write(DOCUMENTS_KEY, documentsStore)
}

function paginate(items, params = {}) {
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || 10)
  const start = (page - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  }
}

function searchable(partner) {
  return `${partner.company || ''} ${partner.name || ''} ${partner.email || ''} ${partner.country || ''}`.toLowerCase()
}

function partnerDocuments(partnerId) {
  return documentsStore.filter((document) => document.partnerId === partnerId)
}

function syncDocumentStatus(partnerId) {
  const partner = partnersStore.find((item) => item.id === partnerId)
  if (!partner) return
  const docs = partnerDocuments(partnerId)
  if (!docs.length) return
  const allVerified = docs.every((document) => document.status === 'verified')
  const anyRejected = docs.some((document) => document.status === 'rejected')
  if (allVerified && partner.status === 'pending') {
    partner.status = 'documents_verified'
  } else if (anyRejected && partner.status === 'documents_verified') {
    partner.status = 'pending'
  }
  savePartners()
}

function publicPartner(partner) {
  const safe = { ...partner }
  delete safe.password
  return safe
}

function normalizeDocument(partner, document) {
  return {
    id: document.id || uid('pd'),
    partnerId: partner.id,
    partner: partner.company,
    name: document.name || document.fileName || 'Partner document',
    fileName: document.fileName || document.name || 'Partner document',
    type: document.type || 'other',
    dataUrl: document.dataUrl || '',
    size: Number(document.size) || 0,
    uploadedAt: document.uploadedAt || todayISO(),
    status: document.status || 'pending',
  }
}

export const b2bApi = {
  async listPickups(params = {}) {
    return paginate(clone(DEMO_PICKUPS), params)
  },

  async listCommissions(params = {}) {
    return paginate(clone(DEMO_COMMISSIONS), params)
  },

  async listWithdrawals(params = {}) {
    return paginate(clone(withdrawalsStore), params)
  },

  async setWithdrawalStatus(id, status) {
    const withdrawal = withdrawalsStore.find((item) => item.id === id)
    if (withdrawal) withdrawal.status = status
    return withdrawal
  },

  async listPartners(params = {}) {
    let items = partnersStore
    if (params.status) items = items.filter((partner) => partner.status === params.status)
    if (params.search) {
      const query = String(params.search).toLowerCase().trim()
      items = items.filter((partner) => searchable(partner).includes(query))
    }
    const sorted = [...items].sort((a, b) => String(b.joinedAt || '').localeCompare(String(a.joinedAt || '')))
    return paginate(sorted.map(publicPartner), params)
  },

  async getPartner(id) {
    const partner = partnersStore.find((item) => item.id === id)
    if (!partner) return null
    return {
      ...publicPartner(partner),
      documents: partnerDocuments(id),
      documentCount: partnerDocuments(id).length,
      verifiedDocumentCount: partnerDocuments(id).filter((document) => document.status === 'verified').length,
    }
  },

  async setPartnerStatus(id, status) {
    const partner = partnersStore.find((item) => item.id === id)
    if (!partner) return null
    partner.status = status
    partner.isActive = status === 'approved'
    if (status === 'approved') partner.approvedAt = todayISO()
    savePartners()
    return publicPartner(partner)
  },

  async createPartnerPortal(data) {
    const email = String(data.email || '').trim().toLowerCase()
    if (!data.company?.trim()) throw new Error('Company name is required.')
    if (!data.name?.trim()) throw new Error('Contact name is required.')
    if (!email) throw new Error('Login email is required.')
    if (!data.password || data.password.length < 6) throw new Error('Password must be at least 6 characters.')
    if (partnersStore.some((partner) => partner.email.toLowerCase() === email)) {
      throw new Error('A partner portal already exists for this email.')
    }
    const partner = {
      id: uid('pt'),
      name: data.name.trim(),
      company: data.company.trim(),
      email,
      phone: data.phone?.trim() || '',
      country: data.country?.trim() || 'Bangladesh',
      address: data.address?.trim() || '',
      password: data.password,
      tier: data.tier || 'bronze',
      status: 'approved',
      isActive: true,
      commissionDue: 0,
      joinedAt: todayISO(),
      approvedAt: todayISO(),
      createdByAdmin: true,
    }
    partnersStore.unshift(partner)
    savePartners()
    return publicPartner(partner)
  },

  async registerPartner(data) {
    const email = String(data.email || '').trim().toLowerCase()
    if (!data.company?.trim()) throw new Error('Company name is required.')
    if (!data.name?.trim()) throw new Error('Contact person is required.')
    if (!email) throw new Error('Email is required.')
    if (!data.phone?.trim()) throw new Error('Phone number is required.')
    if (!data.country?.trim()) throw new Error('Country is required.')
    if (!data.password || data.password.length < 6) throw new Error('Password must be at least 6 characters.')
    if (partnersStore.some((partner) => partner.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists. Please log in.')
    }
    const documents = Array.isArray(data.documents) ? data.documents : []
    if (!documents.length) throw new Error('Upload your Trade License, Business Card or another business document.')

    const partner = {
      id: uid('pt'),
      name: data.name.trim(),
      company: data.company.trim(),
      email,
      phone: data.phone.trim(),
      country: data.country.trim(),
      address: data.address?.trim() || '',
      password: data.password,
      tier: 'bronze',
      status: 'pending',
      isActive: false,
      commissionDue: 0,
      joinedAt: todayISO(),
      submittedAt: todayISO(),
    }
    partnersStore.unshift(partner)
    for (const document of documents) {
      documentsStore.unshift(normalizeDocument(partner, document))
    }
    savePartners()
    saveDocuments()
    return publicPartner(partner)
  },

  async loginPartner(email, password) {
    const normalized = String(email || '').trim().toLowerCase()
    const partner = partnersStore.find((item) => item.email.toLowerCase() === normalized)
    if (!partner || partner.password !== password) {
      throw new Error('Email or password is incorrect.')
    }
    if (partner.status === 'pending') {
      throw new Error('Your account is waiting for admin document verification.')
    }
    if (partner.status === 'documents_verified') {
      throw new Error('Your documents are verified. Waiting for final admin approval.')
    }
    if (partner.status === 'rejected') {
      throw new Error('Your partner application was rejected. Please contact support.')
    }
    if (partner.status === 'suspended' || !partner.isActive) {
      throw new Error('This partner account is suspended. Please contact support.')
    }
    return publicPartner(partner)
  },

  async listApplications(params = {}) {
    const items = partnersStore
      .filter((partner) => ['pending', 'documents_verified', 'rejected'].includes(partner.status))
      .map((partner) => {
        const docs = partnerDocuments(partner.id)
        return {
          ...publicPartner(partner),
          contact: partner.name,
          submittedAt: partner.submittedAt || partner.joinedAt,
          documents: docs.length,
          verifiedDocuments: docs.filter((document) => document.status === 'verified').length,
          pendingDocuments: docs.filter((document) => document.status === 'pending').length,
        }
      })
      .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')))
    return paginate(items, params)
  },

  async setApplicationStatus(id, status) {
    if (status === 'approved') return this.approvePartner(id)
    if (status === 'rejected') return this.rejectPartner(id)
    return this.setPartnerStatus(id, status)
  },

  async approvePartner(id) {
    const partner = partnersStore.find((item) => item.id === id)
    if (!partner) throw new Error('Partner not found.')
    const docs = partnerDocuments(id)
    if (!docs.length) throw new Error('This partner has no uploaded documents to verify.')
    if (docs.some((document) => document.status !== 'verified')) {
      throw new Error('Verify all uploaded documents before approving this partner.')
    }
    partner.status = 'approved'
    partner.isActive = true
    partner.approvedAt = todayISO()
    savePartners()
    return publicPartner(partner)
  },

  async rejectPartner(id) {
    const partner = partnersStore.find((item) => item.id === id)
    if (!partner) throw new Error('Partner not found.')
    partner.status = 'rejected'
    partner.isActive = false
    savePartners()
    return publicPartner(partner)
  },

  async listDocuments(params = {}) {
    let items = [...documentsStore]
    if (params.partnerId) items = items.filter((document) => document.partnerId === params.partnerId)
    if (params.status) items = items.filter((document) => document.status === params.status)
    if (params.search) {
      const query = String(params.search).toLowerCase()
      items = items.filter((document) => `${document.partner} ${document.name}`.toLowerCase().includes(query))
    }
    items.sort((a, b) => String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || '')))
    return paginate(items, params)
  },

  async getPartnerDocuments(partnerId) {
    return partnerDocuments(partnerId)
  },

  async uploadPartnerDocument(partnerId, document) {
    const partner = partnersStore.find((item) => item.id === partnerId)
    if (!partner) throw new Error('Partner not found.')
    const record = normalizeDocument(partner, document)
    documentsStore.unshift(record)
    saveDocuments()
    return record
  },

  async verifyDocument(id) {
    const document = documentsStore.find((item) => item.id === id)
    if (!document) throw new Error('Document not found.')
    document.status = 'verified'
    document.verifiedAt = todayISO()
    saveDocuments()
    syncDocumentStatus(document.partnerId)
    return document
  },

  async rejectDocument(id) {
    const document = documentsStore.find((item) => item.id === id)
    if (!document) throw new Error('Document not found.')
    document.status = 'rejected'
    document.verifiedAt = todayISO()
    saveDocuments()
    syncDocumentStatus(document.partnerId)
    return document
  },

  async deleteDocument(id) {
    const document = documentsStore.find((item) => item.id === id)
    if (!document) throw new Error('Document not found.')
    if (document.status === 'verified') throw new Error('Verified documents cannot be deleted.')
    documentsStore = documentsStore.filter((item) => item.id !== id)
    saveDocuments()
    return { success: true }
  },

  async updatePartnerProfile(id, patch) {
    const partner = partnersStore.find((item) => item.id === id)
    if (!partner) throw new Error('Partner not found.')
    const allowed = ['name', 'company', 'phone', 'country', 'address']
    for (const key of allowed) {
      if (patch[key] !== undefined) partner[key] = String(patch[key]).trim()
    }
    savePartners()
    return publicPartner(partner)
  },

  async resetToSeedData() {
    partnersStore = clone(DEMO_PARTNERS)
    documentsStore = clone(DEMO_DOCUMENTS)
    savePartners()
    saveDocuments()
    return { success: true }
  },
}
