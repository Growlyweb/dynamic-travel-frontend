// The access token lives in memory only. The refresh token is an httpOnly cookie that the browser sends by itself,
// so nothing that can sign a person in is kept in local storage.
let accessToken = null
const listeners = new Set()

export const getAccessToken = () => accessToken

export const setAccessToken = (token) => {
  accessToken = token || null
}

export const clearAuth = () => {
  accessToken = null
}

// Called when the session cannot be renewed. The auth provider listens and sends the person to the login page.
export const onSessionEnd = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export const endSession = () => {
  clearAuth()
  listeners.forEach((listener) => listener())
}
