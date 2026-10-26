import { apiClient } from '../../services/apiClient'
import { isAdminSession } from '../../services/authStorage'

export const settingsApi = {
  // A person edits their own name and phone. The email and the role are changed by an administrator.
  getProfile: () => apiClient.get(isAdminSession() ? '/admin/profile' : '/staff/profile'),
  updateProfile: ({ name, phone }) => apiClient.patch(isAdminSession() ? '/admin/profile' : '/staff/profile', { name, phone }),

  // Everything the platform lets an administrator set: currencies, document limits, how long files are kept.
  getAll: () => apiClient.get('/settings'),
  save: (key, value) => apiClient.put(`/settings/${key}`, { value }),
  getCurrencies: () => apiClient.get('/settings/currencies'),
  saveCurrencies: (items) => apiClient.put('/settings/currencies', { items }),
  refreshCurrency: (code) => apiClient.post(`/settings/currencies/${code}/refresh`),
}
