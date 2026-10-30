import { apiClient } from '../../../services/apiClient'
import { PAYMENT_METHODS } from '../lib/company'

/**
 * The simple Accounts screens. Every number comes from /api/accounts, where it is added up from the journals. Nothing is
 * stored or calculated in the browser. Money is in taka. A list answers with `rows` (one page), `total`, and the figures
 * of every match (`summary` or `totals`).
 */

export const PAY_METHODS = PAYMENT_METHODS

const list = (result) => ({ ...result, rows: result.items })

// The sale form says `selling`, the server says `sale`. Only what the server takes is sent.
const toSaleBody = ({ selling, sale, date, category, clientType, agencyName, clientName, phone, cost, received, discount, method, note, destination, detail, passportNo }) => ({
  date,
  category,
  clientType,
  agencyName,
  clientName,
  phone,
  sale: sale ?? selling,
  cost,
  received,
  discount,
  method,
  note,
  destination,
  detail,
  passportNo,
})

export const simpleApi = {
  /* ── Categories ── */
  getCategories: () => apiClient.get('/accounts/categories'),
  addCategory: (label, color) => apiClient.post('/accounts/categories', { label, color }),
  // The server deletes by id. The screens know the name.
  async deleteCategory(label) {
    const categories = await apiClient.get('/accounts/categories')
    const found = categories.find((category) => category.label === label)
    if (!found) throw new Error('This category no longer exists.')
    return apiClient.del(`/accounts/categories/${found.id ?? found._id}`)
  },
  getCategoryReport: (from, to) => apiClient.get('/accounts/categories/report', { params: { from, to } }),

  /* ── Reports ── */
  getHome: ({ year, month } = {}) => apiClient.get('/accounts/home', { params: { year, month } }),
  getMonthly: (year, month) => apiClient.get('/accounts/monthly', { params: { year, month } }),
  getYearly: (year) => apiClient.get('/accounts/yearly', { params: { year } }),
  getPriceList: () => apiClient.get('/accounts/price-list'),
  getAccountBalances: () => apiClient.get('/accounts/balances'),
  getVendorPayables: () => apiClient.get('/accounts/payables'),
  getVendorAdvances: () => apiClient.get('/accounts/advances'),
  getPartners: () => apiClient.get('/accounts/partners'),
  // Only an admin may enter partner capital.
  addPartnerTransaction: (payload) => apiClient.post('/accounts/partners/transactions', payload),

  /* ── Sales ── */
  listSales: (params = {}) => apiClient.get('/accounts/sales', { params }).then(list),
  getSale: (id) => apiClient.get(`/accounts/sales/${id}`),
  createSale: (payload) => apiClient.post('/accounts/sales', toSaleBody(payload)),
  updateSale: (id, payload) => apiClient.patch(`/accounts/sales/${id}`, toSaleBody(payload)),
  // A sale is never deleted: it is cancelled with a reason. When money was received the books need to know whether it was
  // given back (`refund`) or kept (`keep`).
  cancelSale: (id, { reason, settlement }) => apiClient.post(`/accounts/sales/${id}/cancel`, { reason, settlement }),
  addCost: (id, payload) => apiClient.post(`/accounts/sales/${id}/costs`, payload),
  listDue: (params = {}) => apiClient.get('/accounts/dues', { params }).then(list),

  /* ── Money receipts ── */
  listReceipts: (params = {}) => apiClient.get('/accounts/receipts', { params }).then(list),
  getReceipt: (idOrNo) => apiClient.get(`/accounts/receipts/${encodeURIComponent(idOrNo)}`),
  addReceipt: (payload) => apiClient.post('/accounts/receipts', payload),
  // A receipt is voided with a reason. It stays in the history.
  voidReceipt: (id, reason) => apiClient.post(`/accounts/receipts/${id}/void`, { reason }),

  /* ── Expenses and clients ── */
  getExpenseAccounts: () => apiClient.get('/accounts/expense-accounts'),
  addExpense: (payload) => apiClient.post('/accounts/expenses', payload),
  listParties: (type) => apiClient.get('/accounts/parties', { params: { type } }),
  addClient: (payload) => apiClient.post('/accounts/parties', payload),
}
