import { apiClient } from '../../services/apiClient'

// A tour comes with its category as { id, name }. The form works with the category id.
const toTour = (tour) =>
  tour
    ? { ...tour, categoryId: tour.category?.id ?? tour.category?._id ?? tour.category ?? '', categoryName: tour.category?.name ?? '' }
    : tour

// The server's request statuses, with the names the screens show.
export const CUSTOM_REQUEST_STATUSES = [
  { value: 'NEW', label: 'New', tone: 'warning' },
  { value: 'IN_REVIEW', label: 'In review', tone: 'info' },
  { value: 'QUOTED', label: 'Quoted', tone: 'info' },
  { value: 'CONFIRMED', label: 'Confirmed', tone: 'success' },
  { value: 'CANCELLED', label: 'Cancelled', tone: 'neutral' },
]

const toRequest = (request) => (request ? { ...request, requestedAt: String(request.createdAt ?? '').slice(0, 10) } : request)

export const toursApi = {
  list: (params = {}) => apiClient.get('/tours', { params }).then((result) => ({ ...result, items: result.items.map(toTour) })),
  get: (id) => apiClient.get(`/tours/${id}`).then(toTour),
  create: (payload) => apiClient.post('/tours', payload).then(toTour),
  update: (id, payload) => apiClient.patch(`/tours/${id}`, payload).then(toTour),
  // A tour that has bookings is archived by the server, never removed.
  remove: (id) => apiClient.del(`/tours/${id}`),

  // Custom tour requests are made by customers on the website. Staff read them and move them along.
  listCustom: (params = {}) => apiClient.get('/tours/custom-requests', { params }).then((result) => ({ ...result, items: result.items.map(toRequest) })),
  getCustom: (id) => apiClient.get(`/tours/custom-requests/${id}`).then(toRequest),
  setCustomStatus: (id, status, note) => apiClient.patch(`/tours/custom-requests/${id}/status`, { status, note: note || undefined }).then(toRequest),
}
