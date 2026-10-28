import { apiClient } from '../../services/apiClient'

export const authApi = {
  login: ({ email, password }) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  verifyResetCode: ({ email, otp }) => apiClient.post('/auth/verify-reset-token', { email, otp }),
  resetPassword: ({ email, otp, password }) => apiClient.post('/auth/reset-password', { email, otp, newPassword: password }),
  setupAccount: ({ token, password }) => apiClient.post('/auth/setup-account', { token, password }),
  changePassword: ({ currentPassword, newPassword }) => apiClient.post('/auth/change-password', { currentPassword, newPassword }),
}
