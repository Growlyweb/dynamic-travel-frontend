import { authApi } from './auth.api'
import { config } from '../../app/config'
import { sleep } from '../../utils/helpers'
import { getStoredUser } from '../../services/authStorage'
import { b2bApi } from '../b2b/b2b.api'

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
    if (config.enableMocks && credentials?.role === 'partner') {
      await sleep(300)
      const partner = await b2bApi.loginPartner(credentials.email, credentials.password)
      return {
        token: `partner-token-${partner.id}`,
        refreshToken: `partner-refresh-${partner.id}`,
        user: {
          id: `partner_${partner.id}`,
          name: partner.name,
          email: partner.email,
          role: 'partner',
          partnerId: partner.id,
          company: partner.company,
          avatarUrl: null,
        },
      }
    }
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

    const res = await authApi.login(credentials)
    const payload = res?.data ?? res
    let user = payload?.user
    const accessToken = payload?.accessToken || payload?.token
    const refreshToken = payload?.refreshToken

    if (user) {
      user = {
        ...user,
        id: user.id || user._id,
        role: (user.role || credentials?.role || 'admin').toLowerCase(),
        roles: Array.isArray(user.roles)
          ? user.roles.map((r) => String(r).toLowerCase())
          : [(user.role || credentials?.role || 'admin').toLowerCase()],
      }
    }

    if (user && accessToken) {
      return { user, token: accessToken, refreshToken }
    }
    throw new Error(res?.message || 'Login failed')
  },

  async logout() {
    if (!config.enableMocks) await authApi.logout().catch(() => { })
  },

  async getProfile() {
    if (config.enableMocks) return getStoredUser() ?? MOCK_USERS.admin
    try {
      const res = await authApi.getProfile()
      const payload = res?.data ?? res
      let user = payload?.user ?? payload
      if (user) {
        user = {
          ...user,
          id: user.id || user._id,
          role: (user.role || 'admin').toLowerCase(),
          roles: Array.isArray(user.roles)
            ? user.roles.map((r) => String(r).toLowerCase())
            : [(user.role || 'admin').toLowerCase()],
        }
      }
      return user
    } catch {
      return getStoredUser() ?? MOCK_USERS.admin
    }
  },
}
