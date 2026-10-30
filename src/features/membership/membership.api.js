import { apiClient } from '../../services/apiClient'

/**
 * Memberships (B2C customers only). A plan is what the admin sells. A membership is one purchase by one customer, with a
 * snapshot of the plan at the time, so editing a plan later never changes old memberships. The server applies the member
 * discount when a booking is made.
 */

export const MEMBERSHIP_STATUSES = ['pending', 'active', 'expired', 'cancelled']
export const PAYMENT_METHODS = ['bkash', 'nagad', 'bank', 'cash', 'online']
export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded']
export const DURATION_UNITS = ['day', 'month', 'year']

export const membershipApi = {
  /* ── Plans ── */
  listPlans: (params = {}) => apiClient.get('/membership-plans', { params: { pageSize: 500, ...params } }),
  savePlan: (payload) => (payload.id ? apiClient.put(`/membership-plans/${payload.id}`, payload) : apiClient.post('/membership-plans', payload)),
  togglePlan: (id) => apiClient.patch(`/membership-plans/${id}/toggle`),
  deletePlan: (id) => apiClient.del(`/membership-plans/${id}`),

  /* ── Memberships ── */
  listMemberships: (params = {}) => apiClient.get('/memberships', { params }),
  // The customer paid outside the system (bKash, bank, cash). The payment is recorded here.
  createMembership: (payload) => apiClient.post('/memberships', payload),
  cancelMembership: (id, reason) => apiClient.patch(`/memberships/${id}/cancel`, { reason }),
  extendMembership: (id, extraDays) => apiClient.patch(`/memberships/${id}/extend`, { days: extraDays }),
  deleteMembership: (id) => apiClient.del(`/memberships/${id}`),
  listCustomerMemberships: (customerId) => apiClient.get(`/customers/${customerId}/memberships`),

  getStats: () => apiClient.get('/membership-stats'),
}

// The customers who have an active membership, by customer id. The customer pages use it for a badge.
export const activeMembershipMap = async () => {
  const result = await membershipApi.listMemberships({ status: 'active', pageSize: 500 })
  return new Map((result.items ?? []).map((membership) => [membership.customerId, membership]))
}
