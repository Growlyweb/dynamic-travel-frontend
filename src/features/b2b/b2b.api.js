import { apiClient } from '../../services/apiClient'
import { isAdminSession } from '../../services/authStorage'
import { isMocked } from '../../app/config'
import { sleep } from '../../utils/helpers'

/**
 * Partner agencies, seen from the admin side. A partner registers on the website, uploads business documents, and an
 * admin or staff member reviews them and approves the account. Applications, pickups, commissions and withdrawals of
 * partners are not on the server yet: those three pages stay on demo data (VITE_MOCK_MODULES=b2bOperations).
 */

const STATUS_NAMES = { PENDING: 'pending', UNDER_REVIEW: 'under_review', APPROVED: 'approved', REJECTED: 'rejected', SUSPENDED: 'suspended' }
const DOCUMENT_STATUS_NAMES = { PENDING: 'pending', VERIFIED: 'verified', REJECTED: 'rejected' }
const DOCUMENT_TYPE_LABELS = { TRADE_LICENSE: 'Trade license', BUSINESS_CARD: 'Business card', NID: 'National ID', TIN_CERTIFICATE: 'TIN certificate', OTHER: 'Other' }

const day = (value) => (value ? String(value).slice(0, 10) : '')

const toDocument = (partner) => (document) => ({
  ...document,
  partnerId: partner.id ?? partner._id,
  partner: partner.companyName,
  name: document.originalName,
  typeLabel: DOCUMENT_TYPE_LABELS[document.type] ?? document.type,
  status: DOCUMENT_STATUS_NAMES[document.status] ?? String(document.status).toLowerCase(),
  uploadedAt: day(document.uploadedAt),
})

// The screens read a partner with the owner's name, email and phone, and a lower case status.
const toPartner = (raw) => {
  if (!raw) return raw
  const owner = raw.userId && typeof raw.userId === 'object' ? raw.userId : {}
  const partner = { ...raw, id: raw.id ?? raw._id }
  const documents = (raw.documents ?? []).map(toDocument(partner))
  return {
    ...partner,
    ownerId: owner.id ?? owner._id ?? raw.userId,
    name: owner.name ?? '',
    company: raw.companyName,
    email: owner.email ?? '',
    phone: owner.phone ?? '',
    accountStatus: owner.status ?? '',
    isActive: owner.status === 'ACTIVE',
    status: STATUS_NAMES[raw.approvalStatus] ?? String(raw.approvalStatus).toLowerCase(),
    joinedAt: day(raw.createdAt),
    reviewedAt: day(raw.reviewedAt),
    documents,
    documentCount: documents.length,
    verifiedDocumentCount: documents.filter((document) => document.status === 'verified').length,
  }
}

const toList = (result) => ({ ...result, items: result.items.map(toPartner) })

export const b2bApi = {
  listPartners: ({ status, ...params } = {}) =>
    apiClient.get(isAdminSession() ? '/admin/b2b' : '/staff/partners', { params: { ...params, approvalStatus: status ? status.toUpperCase() : undefined } }).then(toList),
  getPartner: (id) => apiClient.get(`/admin/b2b/${id}`).then(toPartner),
  // decision: APPROVED, REJECTED, UNDER_REVIEW or SUSPENDED. A suspended partner is reactivated by approving again.
  decide: (id, decision, note) => apiClient.patch(`/admin/b2b/${id}/approval`, { decision, note: note || undefined }).then(toPartner),
  updatePartner: (id, patch) => apiClient.patch(`/admin/b2b/${id}`, patch).then(toPartner),
  reviewDocument: (partnerId, documentId, { status, note }) =>
    apiClient.patch(isAdminSession() ? `/admin/b2b/${partnerId}/documents/${documentId}` : `/staff/partners/${partnerId}/documents/${documentId}`, { status: status.toUpperCase(), note: note || undefined }).then(toPartner),
  // The file is only given to people who may see it, so it is fetched with the token and shown from a blob.
  downloadDocument: (partnerId, documentId) => apiClient.download(`/documents/partners/${partnerId}/${documentId}`),
}

/* ── Not on the server yet: demo data ── */

const DEMO = {
  pickups: [
    { id: 'pk_1', partner: 'Skyline Travels', location: 'Hazrat Shahjalal International Airport, Dhaka', pickupAt: '2026-10-04T14:30:00Z', travelers: 4, status: 'scheduled' },
    { id: 'pk_2', partner: 'Wanderlust Agency', location: 'Cox’s Bazar Airport', pickupAt: '2026-10-06T09:00:00Z', travelers: 2, status: 'requested' },
  ],
  commissions: [
    { id: 'cm_1', partner: 'Skyline Travels', booking: 'BK-88121', amount: 3200, rate: '8%', month: 'September 2026', status: 'earned' },
    { id: 'cm_2', partner: 'Skyline Travels', booking: 'BK-88094', amount: 2100, rate: '8%', month: 'September 2026', status: 'paid' },
    { id: 'cm_3', partner: 'Wanderlust Agency', booking: 'BK-88071', amount: 1450, rate: '6%', month: 'September 2026', status: 'earned' },
  ],
  withdrawals: [
    { id: 'wd_1', partner: 'Skyline Travels', amount: 12500, method: 'Bank transfer', requestedAt: '2026-10-01', status: 'pending' },
    { id: 'wd_2', partner: 'Wanderlust Agency', amount: 6400, method: 'bKash', requestedAt: '2026-09-24', status: 'paid' },
  ],
}

let withdrawals = DEMO.withdrawals.map((item) => ({ ...item }))

const notBuilt = () => {
  throw new Error('This part of the partner area is not available yet.')
}

const page = (items, { page: current = 1, pageSize = 50 } = {}) => {
  const start = (Number(current) - 1) * Number(pageSize)
  return { items: items.slice(start, start + Number(pageSize)), total: items.length, page: Number(current), pageSize: Number(pageSize), totalPages: Math.max(Math.ceil(items.length / Number(pageSize)), 1) }
}

export const b2bOperationsApi = {
  async listPickups(params = {}) {
    if (!isMocked('b2bOperations')) notBuilt()
    await sleep(150)
    return page(DEMO.pickups, params)
  },
  async listCommissions(params = {}) {
    if (!isMocked('b2bOperations')) notBuilt()
    await sleep(150)
    return page(DEMO.commissions, params)
  },
  async listWithdrawals(params = {}) {
    if (!isMocked('b2bOperations')) notBuilt()
    await sleep(150)
    return page(withdrawals, params)
  },
  async setWithdrawalStatus(id, status) {
    if (!isMocked('b2bOperations')) notBuilt()
    withdrawals = withdrawals.map((item) => (item.id === id ? { ...item, status } : item))
    return withdrawals.find((item) => item.id === id)
  },
}
