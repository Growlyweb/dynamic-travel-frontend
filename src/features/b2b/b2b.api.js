import { todayISO } from '../reports/accounting/dates'
import { SAMPLE_IMAGE_DATA_URL } from './sampleImage'
import { apiClient } from '../../services/apiClient'
import { config } from '../../app/config'

/**
 * B2B partner onboarding + portal data layer.
 *
 * Public registration creates a partner with status "pending" and uploads
 * documents. Admin verifies the documents, then approves the partner and only
 * then can the partner log in to the portal.
 */

const PARTNERS_KEY = 'abl_b2b_partners_v7'
const DOCUMENTS_KEY = 'abl_b2b_partner_documents_v7'

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
    address: 'Connaught Place, New Delhi',
    password: 'partner123',
    tier: 'bronze',
    status: 'pending',
    isActive: false,
    commissionDue: 0,
    joinedAt: '2026-09-12',
    submittedAt: '2026-09-12',
  },
  {
    id: 'pt_305',
    name: 'Tariq Al-Mansoor',
    company: 'Gulf Horizon Tours',
    email: 'tariq@gulfhorizon.test',
    phone: '+971501234567',
    country: 'UAE',
    address: 'Sheikh Zayed Road, Dubai',
    password: 'partner123',
    tier: 'silver',
    status: 'pending',
    isActive: false,
    commissionDue: 0,
    joinedAt: '2026-10-02',
    submittedAt: '2026-10-02',
  },
  {
    id: 'pt_306',
    name: 'Jamil Test Partner',
    company: 'Apex Global Tours',
    email: 'jamil_test_partner_upload@demo.dynamictravel.test',
    phone: '+8801712999888',
    country: 'Bangladesh',
    address: 'House 42, Road 11, Banani, Dhaka',
    password: 'Password@123',
    tier: 'gold',
    status: 'pending',
    isActive: false,
    commissionDue: 0,
    joinedAt: '2026-10-30',
    submittedAt: '2026-10-30',
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
    size: 2457600,
  },
  // Sunrise Holidays (pt_303) - 5 documents including image.png
  {
    id: 'pd_200_img',
    partnerId: 'pt_303',
    partner: 'Sunrise Holidays',
    name: 'image.png',
    fileName: 'image.png',
    type: 'trade_license',
    dataUrl: SAMPLE_IMAGE_DATA_URL,
    url: SAMPLE_IMAGE_DATA_URL,
    uploadedAt: '2026-10-30',
    status: 'pending',
    size: 14614,
  },
  {
    id: 'pd_201',
    partnerId: 'pt_303',
    partner: 'Sunrise Holidays',
    name: 'Trade license 2026-2027.pdf',
    fileName: 'Trade license 2026-2027.pdf',
    type: 'trade_license',
    uploadedAt: '2026-09-13',
    status: 'pending',
    size: 2140000,
  },
  {
    id: 'pd_202',
    partnerId: 'pt_303',
    partner: 'Sunrise Holidays',
    name: 'Business Card - Rahul Mehta (MD).png',
    fileName: 'Business Card - Rahul Mehta (MD).png',
    type: 'business_card',
    dataUrl: SAMPLE_IMAGE_DATA_URL,
    url: SAMPLE_IMAGE_DATA_URL,
    uploadedAt: '2026-09-13',
    status: 'pending',
    size: 14614,
  },
  {
    id: 'pd_203',
    partnerId: 'pt_303',
    partner: 'Sunrise Holidays',
    name: 'Certificate of Incorporation.pdf',
    fileName: 'Certificate of Incorporation.pdf',
    type: 'other',
    uploadedAt: '2026-09-13',
    status: 'pending',
    size: 1840000,
  },
  {
    id: 'pd_204',
    partnerId: 'pt_303',
    partner: 'Sunrise Holidays',
    name: 'Tax Identification (TIN) Certificate.pdf',
    fileName: 'Tax Identification (TIN) Certificate.pdf',
    type: 'other',
    uploadedAt: '2026-09-13',
    status: 'pending',
    size: 940000,
  },
  // Gulf Horizon Tours (pt_305) - 3 documents showing verified, rejected with note, and pending
  {
    id: 'pd_301',
    partnerId: 'pt_305',
    partner: 'Gulf Horizon Tours',
    name: 'Dubai Municipality Trade License.pdf',
    fileName: 'Dubai Municipality Trade License.pdf',
    type: 'trade_license',
    uploadedAt: '2026-10-02',
    status: 'verified',
    size: 3200000,
  },
  {
    id: 'pd_302',
    partnerId: 'pt_305',
    partner: 'Gulf Horizon Tours',
    name: 'Civil Defense Fire & Safety Certificate.pdf',
    fileName: 'Civil Defense Fire & Safety Certificate.pdf',
    type: 'other',
    uploadedAt: '2026-10-02',
    status: 'rejected',
    size: 1450000,
    rejectionReason: 'Certificate expired on 30 June 2026. Please upload current renewed copy.',
    reviewNote: 'Certificate expired on 30 June 2026. Please upload current renewed copy.',
  },
  {
    id: 'pd_303',
    partnerId: 'pt_305',
    partner: 'Gulf Horizon Tours',
    name: 'Managing Director Passport & Visa.pdf',
    fileName: 'Managing Director Passport & Visa.pdf',
    type: 'other',
    uploadedAt: '2026-10-02',
    status: 'pending',
    size: 2800000,
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
    size: 1200000,
    rejectionReason: 'Policy coverage does not include outbound passenger liability.',
    reviewNote: 'Policy coverage does not include outbound passenger liability.',
  },
  // Apex Global Tours (pt_306) - uploaded image.png from contents/
  {
    id: 'pd_601',
    partnerId: 'pt_306',
    partner: 'Apex Global Tours',
    name: 'image.png',
    fileName: 'image.png',
    type: 'trade_license',
    dataUrl: SAMPLE_IMAGE_DATA_URL,
    url: SAMPLE_IMAGE_DATA_URL,
    uploadedAt: todayISO(),
    status: 'pending',
    size: 14614,
  },
  {
    id: 'pd_602',
    partnerId: 'pt_306',
    partner: 'Apex Global Tours',
    name: 'Official Partner ID Card.png',
    fileName: 'Official Partner ID Card.png',
    type: 'business_card',
    dataUrl: SAMPLE_IMAGE_DATA_URL,
    url: SAMPLE_IMAGE_DATA_URL,
    uploadedAt: todayISO(),
    status: 'pending',
    size: 14614,
  },
  {
    id: 'pd_603',
    partnerId: 'pt_306',
    partner: 'Apex Global Tours',
    name: 'Tax Compliance & Incorporation.pdf',
    fileName: 'Tax Compliance & Incorporation.pdf',
    type: 'other',
    uploadedAt: todayISO(),
    status: 'pending',
    size: 1840000,
  },
]

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) {
      write(key, fallback)
      return clone(fallback)
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      write(key, fallback)
      return clone(fallback)
    }
    // Automatically merge any fallback items not present in stored
    const existingIds = new Set(parsed.map((item) => item.id))
    const missing = fallback.filter((item) => !existingIds.has(item.id))
    if (missing.length > 0) {
      const merged = [...missing, ...parsed]
      write(key, merged)
      return merged
    }
    return parsed
  } catch {
    return clone(fallback)
  }
}

function readDocuments(key, fallback) {
  const docs = read(key, fallback)
  const fallbackMap = new Map(fallback.map((d) => [d.id, d]))
  let updated = false
  for (const doc of docs) {
    const fb = fallbackMap.get(doc.id)
    if (fb?.dataUrl && doc.dataUrl !== fb.dataUrl) {
      doc.dataUrl = fb.dataUrl
      doc.url = fb.url
      updated = true
    }
  }
  if (updated) {
    write(key, docs)
  }
  return docs
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Keep the in-memory flow usable when storage is unavailable.
  }
}

let partnersStore = read(PARTNERS_KEY, DEMO_PARTNERS)
let documentsStore = readDocuments(DOCUMENTS_KEY, DEMO_DOCUMENTS)

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
    rejectionReason: document.rejectionReason || document.reviewNote || '',
    reviewNote: document.reviewNote || document.rejectionReason || '',
  }
}

export const b2bApi = {
  async listPickups(params = {}) {
    if (!config.enableMocks) {
      const res = await apiClient.get('/admin/b2b/pickups', { params })
      const rawItems = res?.data ?? res?.items ?? (Array.isArray(res) ? res : [])
      const items = rawItems.map((p) => ({
        id: String(p._id || p.id),
        partner: p.partner?.companyName || p.partnerName || 'Partner',
        location: p.pickupAddress || p.location || 'Central Office',
        pickupAt: p.scheduledAt || p.pickupAt || p.createdAt,
        travelers: p.passportCount || p.travelers || 1,
        status: p.status || 'requested',
        contactPerson: p.contactPerson || '',
        contactPhone: p.contactPhone || '',
      }))
      return { items, total: res?.meta?.total ?? items.length, page: res?.meta?.page ?? 1, pageSize: res?.meta?.limit ?? 10 }
    }
    return paginate(clone(DEMO_PICKUPS), params)
  },

  async listCommissions(params = {}) {
    if (!config.enableMocks) {
      const res = await apiClient.get('/admin/b2b/commissions', { params })
      const payload = res?.data ?? res ?? {}
      const items = Array.isArray(payload?.items) ? payload.items : (Array.isArray(res) ? res : [])
      return {
        items,
        total: items.length,
        page: 1,
        pageSize: items.length || 10,
        totalEarned: payload.totalEarned || 0,
        totalWithdrawn: payload.totalWithdrawn || 0,
        availableBalance: payload.availableBalance || 0,
      }
    }
    return paginate(clone(DEMO_COMMISSIONS), params)
  },

  async listWithdrawals(params = {}) {
    if (!config.enableMocks) {
      const res = await apiClient.get('/admin/b2b/withdrawals', { params })
      const rawItems = res?.data ?? res?.items ?? (Array.isArray(res) ? res : [])
      const items = rawItems.map((w) => ({
        id: String(w._id || w.id),
        partner: w.partner?.companyName || w.partnerName || 'Partner',
        amount: w.amount,
        method: w.payoutMethod || w.method || 'Bank transfer',
        requestedAt: w.createdAt || w.requestedAt,
        status: w.status || 'pending',
        reviewNote: w.reviewNote || '',
      }))
      return { items, total: res?.meta?.total ?? items.length, page: res?.meta?.page ?? 1, pageSize: res?.meta?.limit ?? 10 }
    }
    return paginate(clone(withdrawalsStore), params)
  },

  async setWithdrawalStatus(id, status, reviewNote = '') {
    if (!config.enableMocks) {
      const res = await apiClient.patch(`/admin/b2b/withdrawals/${id}/review`, { status, reviewNote })
      return res?.data ?? res
    }
    const withdrawal = withdrawalsStore.find((item) => item.id === id)
    if (withdrawal) withdrawal.status = status
    return withdrawal
  },

  async listPartners(params = {}) {
    if (!config.enableMocks) {
      const res = await apiClient.get('/admin/b2b', { params })
      const rawItems = res?.data ?? res?.items ?? (Array.isArray(res) ? res : [])
      const items = rawItems.map((p) => ({
        id: String(p._id || p.id),
        name: p.user?.name || p.contactPerson || p.name || 'Partner Contact',
        company: p.companyName || p.company,
        email: p.user?.email || p.email,
        phone: p.phone || p.user?.phone || '',
        country: p.address?.country || p.country || 'Bangladesh',
        status: (p.approvalStatus || p.status || 'pending').toLowerCase(),
        isActive: p.status === 'approved',
        joinedAt: p.createdAt || p.joinedAt,
        commissionDue: p.commissionDue || 0,
      }))
      return { items, total: res?.meta?.total ?? items.length, page: res?.meta?.page ?? 1, pageSize: res?.meta?.limit ?? 10 }
    }
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
    if (!config.enableMocks) {
      const res = await apiClient.get(`/admin/b2b/${id}`)
      const p = res?.data ?? res
      if (!p) return null
      const docs = (p.documents || []).map((d) => ({
        id: String(d._id || d.id),
        partnerId: String(p._id || p.id),
        partner: p.companyName || p.company,
        name: d.originalName || d.name || 'Document',
        type: d.type || 'Business Document',
        status: d.status || 'pending',
        uploadedAt: d.uploadedAt || p.createdAt,
        url: d.path ? `/api/documents/partners/${p._id}/${d._id}` : SAMPLE_IMAGE_DATA_URL,
      }))
      return {
        id: String(p._id || p.id),
        name: p.user?.name || p.contactPerson || p.name,
        company: p.companyName || p.company,
        email: p.user?.email || p.email,
        phone: p.phone,
        country: p.address?.country || p.country,
        address: typeof p.address === 'string' ? p.address : p.address?.street || '',
        status: (p.approvalStatus || p.status || 'pending').toLowerCase(),
        documents: docs,
        documentCount: docs.length,
        verifiedDocumentCount: docs.filter((d) => d.status === 'verified').length,
      }
    }
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
    if (!config.enableMocks) {
      const query = { ...params }
      if (query.status === 'all') delete query.status
      const res = await apiClient.get('/admin/b2b', { params: query })
      const rawItems = res?.data ?? res?.items ?? (Array.isArray(res) ? res : [])
      const items = rawItems.map((p) => {
        const docs = p.documents || []
        return {
          id: String(p._id || p.id),
          name: p.user?.name || p.contactPerson || p.name || 'Partner',
          contact: p.user?.name || p.contactPerson || p.name || 'Partner',
          company: p.companyName || p.company,
          email: p.user?.email || p.email,
          phone: p.phone || p.user?.phone || '',
          country: p.address?.country || p.country || 'Bangladesh',
          status: (p.approvalStatus || p.status || 'pending').toLowerCase(),
          isActive: String(p.approvalStatus || p.status).toLowerCase() === 'approved',
          submittedAt: p.createdAt || p.submittedAt,
          joinedAt: p.createdAt || p.joinedAt,
          documents: docs.length,
          verifiedDocuments: docs.filter((document) => String(document.status).toLowerCase() === 'verified').length,
          pendingDocuments: docs.filter((document) => String(document.status).toLowerCase() === 'pending').length,
        }
      })
      return { items, total: res?.meta?.total ?? items.length, page: res?.meta?.page ?? 1, pageSize: res?.meta?.limit ?? 10 }
    }
    let list = partnersStore
    if (params.status === 'pending') {
      list = partnersStore.filter((partner) => partner.status === 'pending')
    } else if (params.status === 'documents_verified') {
      list = partnersStore.filter((partner) => partner.status === 'documents_verified')
    } else if (params.status === 'approved') {
      list = partnersStore.filter((partner) => partner.status === 'approved')
    } else if (params.status === 'rejected') {
      list = partnersStore.filter((partner) => partner.status === 'rejected')
    } else if (params.status === 'all') {
      list = partnersStore.filter((partner) => ['pending', 'documents_verified', 'approved', 'rejected'].includes(partner.status))
    } else {
      list = partnersStore.filter((partner) => ['pending', 'documents_verified', 'rejected'].includes(partner.status))
    }

    const items = list
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
    if (!config.enableMocks) {
      const res = await apiClient.patch(`/admin/b2b/${id}/approval`, { decision: 'APPROVED' })
      return res?.data ?? res
    }
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

  async rejectPartner(id, note = '') {
    if (!config.enableMocks) {
      const res = await apiClient.patch(`/admin/b2b/${id}/approval`, {
        decision: 'REJECTED',
        note: note || 'Partner application rejected by administrator.'
      })
      return res?.data ?? res
    }
    const partner = partnersStore.find((item) => item.id === id)
    if (!partner) throw new Error('Partner not found.')
    partner.status = 'rejected'
    partner.isActive = false
    savePartners()
    return publicPartner(partner)
  },

  async listDocuments(params = {}) {
    if (!config.enableMocks) {
      const res = await apiClient.get('/documents', { params })
      const raw = res?.data ?? res?.items ?? (Array.isArray(res) ? res : [])
      const items = raw.map((document) => ({
        id: String(document._id || document.id),
        partnerId: String(document.ownerId || document.partnerId || ''),
        partner: document.ownerName || document.partner || 'B2B Partner',
        name: document.title || document.name || document.fileName || 'Document',
        fileName: document.fileName || document.name || 'document.pdf',
        type: document.type || 'trade_license',
        uploadedAt: document.createdAt || document.uploadedAt,
        status: (document.status || 'pending').toLowerCase(),
        size: document.size || 0,
        url: document.fileUrl || document.url || ''
      }))
      return { items, total: res?.meta?.total ?? items.length, page: res?.meta?.page ?? 1, pageSize: res?.meta?.limit ?? 10 }
    }
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
    if (!config.enableMocks) {
      try {
        const res = await apiClient.get(`/admin/b2b/${partnerId}`)
        const partner = res?.data ?? res
        const rawDocs = partner?.documents || []
        if (rawDocs.length > 0) {
          return rawDocs.map((doc) => ({
            id: String(doc._id || doc.id),
            docId: String(doc._id || doc.id),
            partnerId: String(partner._id || partner.id || partnerId),
            partner: partner.companyName || partner.company || 'B2B Partner',
            name: doc.originalName || doc.name || doc.fileName || 'Document',
            fileName: doc.originalName || doc.fileName || doc.name || 'document.pdf',
            type: (doc.type || 'TRADE_LICENSE').toLowerCase(),
            mimeType: doc.mimeType || 'application/pdf',
            size: doc.size || 0,
            status: (doc.status || 'PENDING').toLowerCase(),
            reviewNote: doc.reviewNote || '',
            uploadedAt: doc.uploadedAt,
            url: `/api/documents/partners/${partner._id || partnerId}/${doc._id || doc.id}`
          }))
        }
      } catch (err) {
        console.warn('Could not fetch partner documents from /admin/b2b/:id, falling back to /documents', err)
      }
      const res = await this.listDocuments({ partnerId })
      return Array.isArray(res) ? res : (res?.items || [])
    }
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

  async verifyDocument(id, partnerId) {
    if (!config.enableMocks) {
      if (partnerId) {
        try {
          const res = await apiClient.patch(`/admin/b2b/${partnerId}/documents/${id}`, { status: 'VERIFIED' })
          return res?.data ?? res
        } catch {
          // fallback to /documents
        }
      }
      const res = await apiClient.patch(`/documents/${id}/status`, { status: 'verified' })
      return res?.data ?? res
    }
    const document = documentsStore.find((item) => item.id === id)
    if (!document) throw new Error('Document not found.')
    document.status = 'verified'
    document.verifiedAt = todayISO()
    document.rejectionReason = ''
    document.reviewNote = ''
    saveDocuments()
    syncDocumentStatus(document.partnerId)
    return document
  },

  async rejectDocument(id, reason = '', partnerId) {
    if (!config.enableMocks) {
      if (partnerId) {
        try {
          const res = await apiClient.patch(`/admin/b2b/${partnerId}/documents/${id}`, {
            status: 'REJECTED',
            note: reason || 'Document rejected during compliance review.'
          })
          return res?.data ?? res
        } catch {
          // fallback to /documents
        }
      }
      const res = await apiClient.patch(`/documents/${id}/status`, {
        status: 'rejected',
        reason: reason || 'Document rejected during compliance review.'
      })
      return res?.data ?? res
    }
    const document = documentsStore.find((item) => item.id === id)
    if (!document) throw new Error('Document not found.')
    document.status = 'rejected'
    document.verifiedAt = todayISO()
    document.rejectionReason = reason || 'Document rejected during compliance review.'
    document.reviewNote = document.rejectionReason
    saveDocuments()
    syncDocumentStatus(document.partnerId)
    return document
  },

  async deleteDocument(id) {
    if (!config.enableMocks) {
      const res = await apiClient.delete(`/documents/${id}`)
      return res?.data ?? res
    }
    const document = documentsStore.find((item) => item.id === id)
    if (!document) throw new Error('Document not found.')
    if (document.status === 'verified') throw new Error('Verified documents cannot be deleted.')
    documentsStore = documentsStore.filter((item) => item.id !== id)
    saveDocuments()
    return { success: true }
  },

  async updatePartnerProfile(id, patch) {
    if (!config.enableMocks) {
      const res = await apiClient.patch(`/admin/b2b/${id}`, patch)
      return res?.data ?? res
    }
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
