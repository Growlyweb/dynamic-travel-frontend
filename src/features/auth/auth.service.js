import { authApi } from './auth.api'
import { config } from '../../app/config'
import { sleep } from '../../utils/helpers'
import { refreshSession } from '../../services/apiClient'
import { clearAuth, setAccessToken } from '../../services/authStorage'

// Demo accounts, used only while the whole app is on demo data (VITE_MOCK_MODULES=all).
const MOCK_USER = {
  id: 'usr_1',
  name: 'Alex Morgan',
  email: 'admin@traveldashboard.test',
  role: 'admin',
  serverRole: 'ADMIN',
  roles: [],
  permissions: [],
  isAdmin: true,
  avatarUrl: null,
}

// The app reads one shape of user: the account, plus what its roles allow.
const toAppUser = ({ user, access }) => ({
  ...user,
  id: user.id ?? user._id,
  role: user.role === 'ADMIN' ? 'admin' : 'staff',
  serverRole: user.role,
  roles: (access?.roles ?? []).map((role) => role.name),
  permissions: access?.permissions ?? [],
  isAdmin: Boolean(access?.isAdmin),
  avatarUrl: user.avatarUrl ?? null,
})

const loadProfile = async () => toAppUser(await authApi.me())

export const authService = {
  async login({ email, password }) {
    if (config.mockAll) {
      await sleep(300)
      return { ...MOCK_USER, email: email || MOCK_USER.email }
    }
    const { accessToken } = await authApi.login({ email, password })
    setAccessToken(accessToken)
    try {
      return await loadProfile()
    } catch (error) {
      clearAuth()
      throw error
    }
  },

  // On page load: the refresh cookie, if there is one, gives a new access token without asking for the password.
  async restore() {
    if (config.mockAll) return null
    const session = await refreshSession()
    return session ? loadProfile() : null
  },

  async reload() {
    return config.mockAll ? MOCK_USER : loadProfile()
  },

  async logout() {
    if (!config.mockAll) await authApi.logout().catch(() => {})
  },
}
