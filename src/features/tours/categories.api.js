import { apiClient } from '../../services/apiClient'

export const categoriesApi = {
  list: (params = {}) => apiClient.get('/tour-categories', { params: { pageSize: 500, ...params } }),
  // A new category with the name of an existing one answers with the existing one.
  create: (payload) => apiClient.post('/tour-categories', payload),
  remove: (id) => apiClient.del(`/tour-categories/${id}`),
}
