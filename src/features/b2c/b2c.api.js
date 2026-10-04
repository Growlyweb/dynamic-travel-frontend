import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_CUSTOMERS = [
  { id: 'cus_401', name: 'Emma Wilson', email: 'emma@example.com', phone: '+44 20 7946 0958', country: 'United Kingdom', bookings: 6, totalSpend: 8420, joinedAt: '2025-12-04', status: 'active' },
  { id: 'cus_402', name: 'Ravi Patel', email: 'ravi@example.com', phone: '+91 98200 12345', country: 'India', bookings: 3, totalSpend: 3150, joinedAt: '2026-03-22', status: 'active' },
  { id: 'cus_403', name: 'Chloé Dubois', email: 'chloe@example.com', phone: '+33 1 44 55 66 77', country: 'France', bookings: 1, totalSpend: 980, joinedAt: '2026-08-30', status: 'active' },
  { id: 'cus_404', name: 'Omar Hassan', email: 'omar@example.com', phone: '+971 50 123 4567', country: 'UAE', bookings: 0, totalSpend: 0, joinedAt: '2026-09-28', status: 'inactive' },
]

export const b2cApi = {
  list: (params) => withMockList(DEMO_CUSTOMERS, params, { searchKeys: ['name', 'email', 'country'] }),
  get: (id) => withMock(DEMO_CUSTOMERS.find((customer) => customer.id === id) ?? DEMO_CUSTOMERS[0], () => apiClient.get(`/b2c/customers/${id}`)),
}
