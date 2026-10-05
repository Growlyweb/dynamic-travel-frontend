import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_USERS = [
  { id: 'usr_101', name: 'Priya Nair', email: 'priya@example.com', role: 'agent', status: 'active', createdAt: '2026-08-14' },
  { id: 'usr_102', name: 'Daniel Osei', email: 'daniel@example.com', role: 'manager', status: 'active', createdAt: '2026-07-02' },
  { id: 'usr_103', name: 'Mei Chen', email: 'mei@example.com', role: 'viewer', status: 'invited', createdAt: '2026-09-21' },
  { id: 'usr_104', name: 'Lucas Meyer', email: 'lucas@example.com', role: 'agent', status: 'suspended', createdAt: '2026-05-30' },
]

// Mutable so mock-mode role changes persist for the session (reset on reload).
let usersStore = DEMO_USERS.map((user) => ({ ...user }))

const clone = (value) => JSON.parse(JSON.stringify(value))

export const usersApi = {
  list: (params) => withMockList(usersStore, params, { searchKeys: ['name', 'email'] }),
  get: (id) =>
    withMock(usersStore.find((user) => user.id === id) ?? usersStore[0], () => apiClient.get(`/users/${id}`)),
  update: (id, payload) =>
    withMock(
      () => {
        usersStore = usersStore.map((user) => (user.id === id ? { ...user, ...payload } : user))
        return clone(usersStore.find((user) => user.id === id) ?? null)
      },
      () => apiClient.patch(`/users/${id}`, payload),
    ),
  remove: (id) =>
    withMock(
      () => {
        usersStore = usersStore.filter((user) => user.id !== id)
        return { ok: true }
      },
      () => apiClient.del(`/users/${id}`),
    ),
}
