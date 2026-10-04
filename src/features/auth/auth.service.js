import { authApi } from './auth.api'
import { config } from '../../app/config'
import { sleep } from '../../utils/helpers'

// Fake admin used while VITE_ENABLE_MOCKS=true, so the whole UI is explorable
// without a backend. Any email/password combination signs in.
const MOCK_USER = {
  id: 'usr_1',
  name: 'Alex Morgan',
  email: 'admin@traveldashboard.test',
  role: 'admin',
  avatarUrl: null,
}

export const authService = {
  async login(credentials) {
    if (config.enableMocks) {
      await sleep(400)
      return {
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { ...MOCK_USER, email: credentials.email || MOCK_USER.email },
      }
    }
    const { user, accessToken, refreshToken } = await authApi.login(credentials)
    return { user, token: accessToken, refreshToken }
  },

  async logout() {
    if (!config.enableMocks) await authApi.logout().catch(() => {})
  },

  async getProfile() {
    if (config.enableMocks) return MOCK_USER
    return authApi.getProfile()
  },
}
