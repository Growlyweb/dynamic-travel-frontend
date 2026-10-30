import { apiClient } from '../../services/apiClient'

/**
 * Customers (B2C accounts). They register on the website, so here they are read from the account list of the admin area.
 * A staff member with the customers permission cannot read them yet: that route comes with the customer endpoints (B-6).
 */

const day = (value) => (value ? String(value).slice(0, 10) : '')

const toCustomer = (user) => ({ ...user, joinedAt: day(user.createdAt) })

export const b2cApi = {
  list: ({ status, ...params } = {}) =>
    apiClient.get('/admin/users', { params: { ...params, role: 'B2C', status: status ? status.toUpperCase() : undefined } }).then((result) => ({ ...result, items: result.items.map(toCustomer) })),
  get: (id) => apiClient.get(`/admin/users/${id}`).then(toCustomer),
}
