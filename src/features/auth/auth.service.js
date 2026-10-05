import { authApi } from './auth.api'
import { config } from '../../app/config'
import { sleep } from '../../utils/helpers'
import { getStoredUser } from '../../services/authStorage'

// Mock accounts used while VITE_ENABLE_MOCKS=true, so both login roles are
// explorable without a backend. Any email/password combination signs in as
// the role chosen on the login panel.
export const MOCK_USERS = {
  admin: {
    id: 'usr_1',
    name: 'Alex Morgan',
    email: 'admin@traveldashboard.test',
    role: 'admin',
    avatarUrl: null,
  },
  staff: {
    id: 'usr_2',
    name: 'Samira Khan',
    email: 'staff@traveldashboard.test',
    role: 'agent',
    avatarUrl: null,
  },
}

export const authService = {
  async login(credentials) {
    if (config.enableMocks) {
      await sleep(400)
      const fallback = String(credentials?.email ?? '').includes('staff') ? 'staff' : 'admin'
      const user = MOCK_USERS[credentials?.role] ?? MOCK_USERS[fallback]
      return {
        token: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: { ...user, email: credentials?.email || user.email },
      }
    }
    const { user, accessToken, refreshToken } = await authApi.login(credentials)
    return { user, token: accessToken, refreshToken }
  },

  async logout() {
    if (!config.enableMocks) await authApi.logout().catch(() => {})
  },

  async getProfile() {
    if (config.enableMocks) return getStoredUser() ?? MOCK_USERS.admin
    return authApi.getProfile()
  },
}
