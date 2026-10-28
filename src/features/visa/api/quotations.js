import { apiClient } from '../../../services/apiClient'

const day = (value) => (value ? String(value).slice(0, 10) : '')

// A quotation past its date that was never answered is shown as expired.
export const toQuotation = (raw) => {
  if (!raw) return raw
  const expired = ['draft', 'sent'].includes(raw.status) && raw.validUntil && new Date(raw.validUntil) < new Date()
  return {
    ...raw,
    id: raw.id ?? raw._id,
    partnerId: raw.partner,
    partner: raw.partnerName,
    countryId: raw.country,
    country: raw.countryName,
    visaTypeId: raw.visaType,
    visaType: raw.visaTypeName,
    validUntil: day(raw.validUntil),
    createdAt: day(raw.createdAt),
    status: expired ? 'expired' : raw.status,
  }
}

export const quotationsApi = {
  listQuotations: (params = {}) => apiClient.get('/visa/quotations', { params }).then((result) => ({ ...result, items: result.items.map(toQuotation) })),
  // The server owns the price: it copies the net price of the visa type and adds up the total.
  createQuotation: (payload) => apiClient.post('/visa/quotations', payload).then(toQuotation),
  updateQuotation: (id, patch) => apiClient.patch(`/visa/quotations/${id}`, patch).then(toQuotation),
  changeQuotationStatus: (id, status) => apiClient.patch(`/visa/quotations/${id}/status`, { status }).then(toQuotation),
  removeQuotation: (id) => apiClient.del(`/visa/quotations/${id}`),
}
