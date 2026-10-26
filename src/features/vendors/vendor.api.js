import { apiClient } from '../../services/apiClient'

/**
 * Vendors, what they billed us (bills) and what we paid them (payments, and advances paid before a bill). Everything is
 * on /api/vendors and posts to the books on the server. Nothing is deleted: a mistake is voided with a reason.
 * Money is in taka.
 */

// The direct cost accounts a bill can be booked to.
export const COST_ACCOUNTS = [
  { value: '5010', label: 'Embassy and consular fees' },
  { value: '5020', label: 'Visa processing and courier' },
  { value: '5030', label: 'Land package or DMC cost' },
  { value: '5040', label: 'Airline fare cost' },
  { value: '5050', label: 'Hotel supplier cost' },
  { value: '5060', label: 'Transport supplier cost' },
  { value: '5070', label: 'Agent commission' },
  { value: '5080', label: 'Tour operations and guide cost' },
  { value: '5090', label: 'Other service cost' },
]

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'city', label: 'Bank' },
  { value: 'brac', label: 'Bank (BRAC)' },
  { value: 'bkash', label: 'bKash' },
]

export const vendorApi = {
  listVendors: (params = {}) => apiClient.get('/vendors', { params }),
  getVendor: (id) => apiClient.get(`/vendors/${id}`),
  // An opening balance is what the vendor was already owed (type due) or what we had already paid ahead (type advance).
  createVendor: (payload) => apiClient.post('/vendors', payload),
  updateVendor: (id, patch) => apiClient.patch(`/vendors/${id}`, patch),
  // A vendor is switched off, never deleted: its history stays in the books.
  setActive: (id, active) => apiClient.patch(`/vendors/${id}`, { active }),

  listBills: (params = {}) => apiClient.get('/vendors/bills', { params }),
  createBill: (payload) => apiClient.post('/vendors/bills', payload),
  // To correct a bill, void it and enter a new one.
  voidBill: (id, reason) => apiClient.post(`/vendors/bills/${id}/void`, { reason }),

  listPayments: (params = {}) => apiClient.get('/vendors/payments', { params }),
  // A payment above what is owed has to be an advance.
  createPayment: (payload) => apiClient.post('/vendors/payments', payload),
  voidPayment: (id, reason) => apiClient.post(`/vendors/payments/${id}/void`, { reason }),
}
