import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../features/auth/auth.service'
import { clearAuth, onSessionEnd } from '../services/authStorage'
import { config } from '../app/config'

const AuthContext = createContext(null)
const MOCK_KEY = 'travel-dashboard.mock-user'

const readMockUser = () => {
  if (!config.mockAll) return null
  try {
    return JSON.parse(sessionStorage.getItem(MOCK_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readMockUser)
  // False until the first answer from the server, so a reload does not flash the login page.
  const [ready, setReady] = useState(config.mockAll)

  useEffect(() => {
    if (config.mockAll) return undefined
    let active = true
    authService
      .restore()
      .then((restored) => active && setUser(restored))
      .catch(() => active && setUser(null))
      .finally(() => active && setReady(true))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => onSessionEnd(() => setUser(null)), [])

  // What a person may do changes when an admin edits their roles. Reading it again when the tab regains focus keeps the
  // menu in step without a new login.
  useEffect(() => {
    if (config.mockAll || !user) return undefined
    const refresh = () => authService.reload().then(setUser).catch(() => {})
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [user])

  const login = useCallback(async (credentials) => {
    const signedIn = await authService.login(credentials)
    if (config.mockAll) sessionStorage.setItem(MOCK_KEY, JSON.stringify(signedIn))
    setUser(signedIn)
    return signedIn
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      clearAuth()
      sessionStorage.removeItem(MOCK_KEY)
      setUser(null)
    }
  }, [])

  const reload = useCallback(() => authService.reload().then(setUser), [])

  const value = useMemo(() => ({ user, ready, isAuthenticated: Boolean(user), login, logout, reload }), [user, ready, login, logout, reload])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
