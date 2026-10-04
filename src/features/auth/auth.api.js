import { apiClient } from '../../services/apiClient'

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/me'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: ({ token, password }) => apiClient.post('/auth/reset-password', { token, password }),
  verifyOtp: ({ email, code }) => apiClient.post('/auth/verify-otp', { email, code }),
}
