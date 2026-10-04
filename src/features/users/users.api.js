import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_USERS = [
  { id: 'usr_101', name: 'Priya Nair', email: 'priya@example.com', role: 'agent', status: 'active', createdAt: '2026-08-14' },
  { id: 'usr_102', name: 'Daniel Osei', email: 'daniel@example.com', role: 'manager', status: 'active', createdAt: '2026-07-02' },
  { id: 'usr_103', name: 'Mei Chen', email: 'mei@example.com', role: 'viewer', status: 'invited', createdAt: '2026-09-21' },
  { id: 'usr_104', name: 'Lucas Meyer', email: 'lucas@example.com', role: 'agent', status: 'suspended', createdAt: '2026-05-30' },
]

export const usersApi = {
  list: (params) => withMockList(DEMO_USERS, params, { searchKeys: ['name', 'email'] }),
  get: (id) => withMock(DEMO_USERS.find((user) => user.id === id) ?? DEMO_USERS[0], () => apiClient.get(`/users/${id}`)),
  update: (id, payload) => apiClient.patch(`/users/${id}`, payload),
  remove: (id) => apiClient.del(`/users/${id}`),
}
