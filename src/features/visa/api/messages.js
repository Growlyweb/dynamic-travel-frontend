import { apiClient } from '../../../services/apiClient'

const ALL = { pageSize: 500 }

export const messagesApi = {
  /* ── Templates: an email goes out by itself when a file reaches its status, an SMS is prepared for staff to send ── */
  listTemplates: (params = {}) => apiClient.get('/visa/templates', { params: { ...ALL, ...params } }),
  saveTemplate: ({ id, ...payload }) => (id ? apiClient.patch(`/visa/templates/${id}`, payload) : apiClient.post('/visa/templates', payload)),
  updateTemplate: (id, patch) => apiClient.patch(`/visa/templates/${id}`, patch),
  removeTemplate: (id) => apiClient.del(`/visa/templates/${id}`),

  /* ── The message log ── */
  listMessages: (params = {}) => apiClient.get('/visa/messages', { params }),
  // An SMS the person sent from their own phone is logged with markSent. An email is sent by the server.
  sendMessage: (applicationId, body) => apiClient.post(`/visa/applications/${applicationId}/messages`, body),
  markMessage: (id, { status, error }) => apiClient.patch(`/visa/messages/${id}`, { status, error: error || undefined }),
  resendMessage: (id) => apiClient.post(`/visa/messages/${id}/send`),
}
