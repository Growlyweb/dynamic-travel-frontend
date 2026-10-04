import { apiClient, withMockList } from '../../services/apiClient'

const DEMO_NOTIFICATIONS = [
  { id: 'ntf_1', type: 'visa', title: 'Visa application approved', body: "Sara Ali's Schengen visa was approved.", createdAt: '2026-10-02T09:24:00Z', read: false },
  { id: 'ntf_2', type: 'b2b', title: 'New withdrawal request', body: 'Skyline Travels requested a $1,250 payout.', createdAt: '2026-10-01T15:02:00Z', read: false },
  { id: 'ntf_3', type: 'tour', title: 'Custom tour request', body: 'New custom tour request for Bali (2 travelers).', createdAt: '2026-09-30T11:40:00Z', read: true },
  { id: 'ntf_4', type: 'system', title: 'Weekly report ready', body: 'Your weekly operations report is ready to download.', createdAt: '2026-09-29T08:00:00Z', read: true },
]

export const notificationsApi = {
  list: (params) => withMockList(DEMO_NOTIFICATIONS, params, { searchKeys: ['title'] }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}`, { read: true }),
  markAllRead: () => apiClient.post('/notifications/mark-all-read'),
}
