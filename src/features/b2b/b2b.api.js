import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_PARTNERS = [
  { id: 'pt_301', name: 'Skyline Travels', company: 'Skyline Travels LLC', country: 'UAE', tier: 'gold', status: 'approved', commissionDue: 1250, joinedAt: '2025-11-03' },
  { id: 'pt_302', name: 'Wanderlust Agency', company: 'Wanderlust Tours Ltd', country: 'United Kingdom', tier: 'silver', status: 'approved', commissionDue: 640, joinedAt: '2026-02-18' },
  { id: 'pt_303', name: 'Sunrise Holidays', company: 'Sunrise Holidays Pvt Ltd', country: 'India', tier: 'bronze', status: 'pending', commissionDue: 0, joinedAt: '2026-09-12' },
  { id: 'pt_304', name: 'Pacific Voyages', company: 'Pacific Voyages Inc', country: 'Singapore', tier: 'silver', status: 'suspended', commissionDue: 210, joinedAt: '2025-06-25' },
]

const DEMO_APPLICATIONS = [
  { id: 'pa_1', company: 'Horizon Tours', contact: 'Amina Khan', email: 'amina@horizontours.test', country: 'Pakistan', submittedAt: '2026-09-26', status: 'pending' },
  { id: 'pa_2', company: 'Eagle Wings Travel', contact: 'Carlos Ruiz', email: 'carlos@eaglewings.test', country: 'Spain', submittedAt: '2026-09-20', status: 'pending' },
]

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

const DEMO_PARTNER_DOCUMENTS = [
  { id: 'pd_1', partner: 'Skyline Travels', name: 'Trade license 2026.pdf', uploadedAt: '2026-08-02', status: 'verified' },
  { id: 'pd_2', partner: 'Sunrise Holidays', name: 'IATA certificate.pdf', uploadedAt: '2026-09-13', status: 'pending' },
  { id: 'pd_3', partner: 'Pacific Voyages', name: 'Insurance policy.pdf', uploadedAt: '2026-07-19', status: 'rejected' },
]

export const b2bApi = {
  listPartners: (params) => withMockList(DEMO_PARTNERS, params, { searchKeys: ['name', 'company', 'country'] }),
  getPartner: (id) => withMock(DEMO_PARTNERS.find((partner) => partner.id === id) ?? DEMO_PARTNERS[0], () => apiClient.get(`/b2b/partners/${id}`)),
  setPartnerStatus: (id, status) =>
    withMock(() => {
      const partner = DEMO_PARTNERS.find((item) => item.id === id)
      if (partner) partner.status = status
      return partner
    }, () => apiClient.patch(`/b2b/partners/${id}`, { status })),
  listApplications: (params) => withMockList(DEMO_APPLICATIONS, params, { searchKeys: ['company', 'contact'] }),
  setApplicationStatus: (id, status) =>
    withMock(() => {
      const application = DEMO_APPLICATIONS.find((item) => item.id === id)
      if (application) application.status = status
      return application
    }, () => apiClient.patch(`/b2b/applications/${id}`, { status })),
  listPickups: (params) => withMockList(DEMO_PICKUPS, params, { searchKeys: ['partner', 'location'] }),
  listCommissions: (params) => withMockList(DEMO_COMMISSIONS, params, { searchKeys: ['partner', 'booking'] }),
  listWithdrawals: (params) => withMockList(DEMO_WITHDRAWALS, params, { searchKeys: ['partner'] }),
  setWithdrawalStatus: (id, status) =>
    withMock(() => {
      const withdrawal = DEMO_WITHDRAWALS.find((item) => item.id === id)
      if (withdrawal) withdrawal.status = status
      return withdrawal
    }, () => apiClient.patch(`/b2b/withdrawals/${id}`, { status })),
  listDocuments: (params) => withMockList(DEMO_PARTNER_DOCUMENTS, params, { searchKeys: ['partner', 'name'] }),
}
