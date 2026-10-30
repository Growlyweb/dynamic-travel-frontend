import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_USERS = [
  { id: 'usr_100', name: 'Sarah Jenkins', email: 'sarah@example.com', role: 'admin', roles: ['admin'], status: 'active', createdAt: '2026-01-15' },
  { id: 'usr_101', name: 'Priya Nair', email: 'priya@example.com', role: 'agent', roles: ['agent'], status: 'active', createdAt: '2026-08-14' },
  { id: 'usr_102', name: 'Daniel Osei', email: 'daniel@example.com', role: 'manager', roles: ['manager', 'agent'], status: 'active', createdAt: '2026-07-02' },
  { id: 'usr_103', name: 'Mei Chen', email: 'mei@example.com', role: 'viewer', roles: ['viewer'], status: 'invited', createdAt: '2026-09-21' },
  { id: 'usr_104', name: 'Lucas Meyer', email: 'lucas@example.com', role: 'agent', roles: ['agent', 'partner'], status: 'suspended', createdAt: '2026-05-30' },
]

// Mutable so mock-mode role changes persist for the session (reset on reload).
let usersStore = DEMO_USERS.map((user) => ({ ...user }))

const clone = (value) => JSON.parse(JSON.stringify(value))

export const usersApi = {
  list: (params) =>
    withMockList(
      usersStore,
      params,
      { searchKeys: ['name', 'email'] },
      () => apiClient.get('/admin/users', { params })
    ),
  get: (id) =>
    withMock(
      usersStore.find((user) => user.id === id) ?? usersStore[0],
      async () => {
        const res = await apiClient.get(`/admin/users/${id}`)
        return res?.data ?? res
      }
    ),
  create: (payload) => apiClient.post('/admin/users', payload),
  update: (id, payload) =>
    withMock(
      () => {
        usersStore = usersStore.map((user) => (user.id === id ? { ...user, ...payload } : user))
        return clone(usersStore.find((user) => user.id === id) ?? null)
      },
      async () => {
        const res = await apiClient.patch(`/admin/users/${id}`, payload)
        return res?.data ?? res
      }
    ),
  remove: (id) =>
    withMock(
      () => {
        usersStore = usersStore.filter((user) => user.id !== id)
        return { ok: true }
      },
      () => apiClient.del(`/admin/users/${id}`)
    ),
  listRoles: () => apiClient.get('/admin/roles'),
  getRbac: () => apiClient.get('/admin/rbac'),
  updateRole: (id, role) => apiClient.patch(`/admin/users/${id}/role`, { role }),
  updatePermissions: (id, permissions) =>
    apiClient.patch(`/admin/users/${id}/permissions`, { permissions }),
  assignRoles: (id, roleIds) =>
    apiClient.patch(`/admin/users/${id}/roles`, { roleIds }),
}
