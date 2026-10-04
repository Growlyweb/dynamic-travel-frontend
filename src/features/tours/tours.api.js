import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_TOURS = [
  { id: 'tour_201', name: 'Bali Escape', destination: 'Bali, Indonesia', durationDays: 7, price: 1450, seats: 18, status: 'published', rating: 4.8, cover: '🏝️' },
  { id: 'tour_202', name: 'Swiss Alps Explorer', destination: 'Zurich, Switzerland', durationDays: 5, price: 2210, seats: 12, status: 'published', rating: 4.6, cover: '🏔️' },
  { id: 'tour_203', name: 'Dubai City Break', destination: 'Dubai, UAE', durationDays: 4, price: 980, seats: 24, status: 'draft', rating: 4.4, cover: '🌆' },
]

const DEMO_CUSTOM_TOURS = [
  { id: 'ct_1', name: 'Anniversary Maldives', customer: 'Jane & Mark Doyle', travelers: 2, budget: 6000, requestedAt: '2026-09-29', status: 'pending' },
  { id: 'ct_2', name: 'Corporate Offsite Goa', customer: 'Nimbus Labs', travelers: 34, budget: 18000, requestedAt: '2026-09-27', status: 'quoted' },
]

export const toursApi = {
  list: (params) => withMockList(DEMO_TOURS, params, { searchKeys: ['name', 'destination'] }),
  get: (id) => withMock(DEMO_TOURS.find((tour) => tour.id === id) ?? DEMO_TOURS[0], () => apiClient.get(`/tours/${id}`)),
  create: (payload) => apiClient.post('/tours', payload),
  update: (id, payload) => apiClient.patch(`/tours/${id}`, payload),
  remove: (id) => apiClient.del(`/tours/${id}`),
  listCustom: (params) => withMockList(DEMO_CUSTOM_TOURS, params, { searchKeys: ['name', 'customer'] }),
}
