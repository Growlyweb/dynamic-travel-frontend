import { apiClient } from '../../../services/apiClient'

const day = (value) => (value ? String(value).slice(0, 10) : '')

const toDocument = (document) => ({
  ...document,
  name: document.originalName,
  mime: document.mimeType,
  uploadedBy: document.uploadedByName || '',
  uploadedAt: day(document.uploadedAt),
})

// The screens read an application the way they always did (country and visa type as names, the staff member as a name,
// documents with `name`). The ids and the server's own fields stay next to them.
export const toApplication = (raw) => {
  if (!raw) return raw
  const staff = raw.assignedStaff && typeof raw.assignedStaff === 'object' ? raw.assignedStaff : null
  const lines = raw.vendorLines ?? []
  const pickup = raw.pickupRequest
  return {
    ...raw,
    id: raw.id ?? raw._id,
    _id: raw._id ?? raw.id,
    submittedAt: day(raw.createdAt),
    updatedAt: day(raw.updatedAt),
    countryId: raw.country,
    country: raw.countryName || raw.country,
    countryName: raw.countryName || raw.country,
    visaTypeId: raw.visaType,
    visaType: raw.visaTypeName || raw.visaType,
    visaTypeName: raw.visaTypeName || raw.visaType,
    partnerId: raw.partner,
    partner: raw.partnerName || null,
    assignedStaffId: staff ? (staff.id ?? staff._id) : (raw.assignedStaff ?? null),
    assignedStaff: staff ? staff.name : null,
    service: { ...raw.service, clientName: raw.partnerName || raw.applicant?.fullName || '', visaType: raw.visaTypeName },
    vendor: lines.length
      ? { name: lines[0].name, reference: lines[0].reference, cost: lines.reduce((sum, line) => sum + line.price, 0), notes: lines[0].notes }
      : { name: '', reference: '', cost: 0, notes: '' },
    account: raw.account ? { ...raw.account, status: raw.account.paymentStatus } : raw.account,
    documents: (raw.documents ?? []).map(toDocument),
    pickupRequest: pickup ? { ...pickup, assignedStaffId: pickup.assignedStaff ?? '', assignedStaff: pickup.assignedStaffName || '' } : pickup,
  }
}

const toList = (result) => ({ ...result, items: result.items.map(toApplication) })

// What the new application form collects, in what the server takes. The server calculates net, due and the payment status.
// A visa sends its country and visa type; a ticket, hotel or tour sends its own block instead.
const toCreateBody = (payload) => {
  const visa = payload.serviceType === 'visa'
  return {
    serviceType: payload.serviceType,
    clientType: payload.clientType,
    partnerId: payload.partnerId || undefined,
    name: payload.name,
    phone: payload.phone,
    email: payload.email || undefined,
    passportNumber: payload.passportNumber || undefined,
    passportExpiry: payload.passportExpiry || undefined,
    countryId: visa ? payload.countryId : undefined,
    visaTypeId: visa ? payload.visaTypeId : undefined,
    entries: visa ? payload.entries : undefined,
    visaDuration: visa ? payload.visaDuration : undefined,
    ticket: payload.serviceType === 'ticket' ? payload.ticket : undefined,
    hotel: payload.serviceType === 'hotel' ? payload.hotel : undefined,
    tour: payload.serviceType === 'tour' ? payload.tour : undefined,
    currency: payload.currency,
    totalAmount: payload.totalAmount,
    totalOverrideReason: payload.totalOverrideReason || undefined,
    discountAmount: payload.discountAmount,
    advancePaid: payload.advancePaid,
    paymentMethod: payload.advancePaid > 0 ? payload.paymentMethod : undefined,
    vendorList: payload.vendorList,
    assignedStaff: payload.assignedStaff || undefined,
    confirmDuplicate: payload.confirmDuplicate || undefined,
  }
}

// Only what the server edits: the applicant, the passport, the entries and duration, the price and the staff member.
const toUpdateBody = (patch) => {
  const body = { ...patch }
  delete body.id
  return body
}

export const applicationsApi = {
  listApplications: (params = {}) => apiClient.get('/visa/applications', { params }).then(toList),
  getApplication: (id) => apiClient.get(`/visa/applications/${id}`).then(toApplication),
  createApplication: (payload) => apiClient.post('/visa/applications', toCreateBody(payload)).then(toApplication),
  updateApplication: (id, patch) => apiClient.patch(`/visa/applications/${id}`, toUpdateBody(patch)).then(toApplication),
  // `staff` is a user id, or null to take the application off its staff member.
  assignStaff: (id, staff) => apiClient.patch(`/visa/applications/${id}`, { assignedStaff: staff || null }).then(toApplication),
  changeStatus: (id, body) => apiClient.patch(`/visa/applications/${id}/status`, body).then(toApplication),
  addNote: (id, { type, text }) => apiClient.post(`/visa/applications/${id}/notes`, { type, text }).then(toApplication),

  addPayment: (id, { amount, method, date, note }) => apiClient.post(`/visa/applications/${id}/payments`, { amount, method, date, note: note || undefined }).then(toApplication),
  voidPayment: (id, paymentId, reason) => apiClient.post(`/visa/applications/${id}/payments/${paymentId}/void`, { reason }).then(toApplication),

  // The file goes as multipart. `type` is the checklist item name or "Other".
  addDocument: (id, { file, type, checklistItemId }) => {
    const form = new FormData()
    form.append('file', file)
    form.append('type', type)
    if (checklistItemId) form.append('checklistItemId', checklistItemId)
    return apiClient.post(`/visa/applications/${id}/documents`, form).then(toApplication)
  },
  reviewDocument: (id, documentId, { status, reviewNote }) => apiClient.patch(`/visa/applications/${id}/documents/${documentId}`, { status, reviewNote: reviewNote || undefined }).then(toApplication),
  removeDocument: (id, documentId) => apiClient.del(`/visa/applications/${id}/documents/${documentId}`).then(toApplication),
  downloadDocument: (id, documentId) => apiClient.download(`/visa/applications/${id}/documents/${documentId}/file`),

  updatePassport: (id, payload = {}) => apiClient.patch(`/visa/applications/${id}/passport`, payload).then(toApplication),

  // Staff who can be given an application or a passport pickup.
  listStaff: (search) => apiClient.get('/visa/staff', { params: { search } }),
  listPartners: (search) => apiClient.get('/visa/partners', { params: { search } }),

  getDashboardStats: () =>
    apiClient.get('/visa/dashboard').then((stats) => ({
      ...stats,
      approved: stats.approvedTotal,
      recent: (stats.recent ?? []).map(toApplication),
    })),
}
