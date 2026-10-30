import { apiClient, withModuleMock } from '../../services/apiClient'
import { isMocked } from '../../app/config'

const { withMock, withMockList } = withModuleMock('users')

const DEMO_USERS = [
  { id: 'usr_100', name: 'Sarah Jenkins', email: 'sarah@example.com', role: 'ADMIN', roles: [], status: 'active', createdAt: '2026-01-15' },
  { id: 'usr_101', name: 'Priya Nair', email: 'priya@example.com', role: 'STAFF', roles: [{ id: 'role_1', name: 'Visa officer' }], status: 'active', createdAt: '2026-08-14' },
]

// The server names a status ACTIVE, the screens say active. PENDING is a person who has not set a password yet.
const STATUS_NAMES = { ACTIVE: 'active', PENDING: 'invited', SUSPENDED: 'suspended', BLOCKED: 'blocked', INACTIVE: 'inactive' }

const toUser = (user) => (user ? { ...user, status: STATUS_NAMES[user.status] ?? String(user.status).toLowerCase(), roles: user.roles ?? [] } : user)

const toList = (result) => ({ ...result, items: (result.items ?? []).map(toUser) })

// Accounts of every kind: the people who work here (ADMIN, STAFF), partners (B2B) and customers (B2C).
export const ACCOUNT_TYPES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'B2B', label: 'Partner' },
  { value: 'B2C', label: 'Customer' },
]

export const usersApi = {
  list: ({ status, ...params } = {}) =>
    isMocked('users')
      ? withMockList(DEMO_USERS, { ...params, status }, { searchKeys: ['name', 'email'] })
      : apiClient.get('/admin/users', { params: { ...params, status: status ? status.toUpperCase() : undefined } }).then(toList),

  get: (id) => withMock(() => DEMO_USERS.find((user) => user.id === id) ?? DEMO_USERS[0], () => apiClient.get(`/admin/users/${id}`).then(toUser)),

  // A staff account needs a role. Without a password the person gets an invitation email and sets their own.
  createStaff: (payload) => apiClient.post('/admin/staff', payload).then((data) => ({ ...data, user: toUser(data.user) })),
  createAdmin: (payload) => apiClient.post('/admin/users', { ...payload, role: 'ADMIN' }).then((data) => ({ ...data, user: toUser(data.user) })),

  updateProfile: (id, { name, phone }) => apiClient.patch(`/admin/users/${id}`, { name, phone }).then((data) => toUser(data.user ?? data)),
  setStatus: (id, { status, reason }) => apiClient.patch(`/admin/users/${id}/status`, { status: status.toUpperCase(), reason }).then(toUser),
  setRoles: (id, roleIds) => apiClient.patch(`/admin/users/${id}/roles`, { roleIds }).then(toUser),
  changeAccountType: (id, role) => apiClient.patch(`/admin/users/${id}/role`, { role }).then(toUser),
  resendInvite: (id) => apiClient.post(`/admin/users/${id}/resend-invite`),
  convertPermissions: (id, payload) => apiClient.post(`/admin/users/${id}/permissions-to-role`, payload),
  remove: (id) => apiClient.del(`/admin/users/${id}`),
}

export const rolesApi = {
  // The permissions, the templates (what is ticked at the start), what needs what, the sensitive ones and the groups.
  catalog: () => apiClient.get('/admin/rbac'),
  list: () => apiClient.get('/admin/roles'),
  get: (id) => apiClient.get(`/admin/roles/${id}`),
  create: (payload) => apiClient.post('/admin/roles', payload),
  update: (id, payload) => apiClient.patch(`/admin/roles/${id}`, payload),
  remove: (id) => apiClient.del(`/admin/roles/${id}`),
}
