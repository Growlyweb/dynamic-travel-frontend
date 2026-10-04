import { config } from '../app/config'
import { getAccessToken, clearAuth } from './authStorage'
import { sleep } from '../utils/helpers'

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function buildUrl(path, params) {
  const base = config.apiBaseUrl.replace(/\/$/, '')
  const url = `${base}${path}`
  if (!params) return url
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.append(key, String(value))
  })
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

async function request(path, { method = 'GET', body, params, headers, signal } = {}) {
  // Safety net while no backend is connected: every call resolves with an
  // empty list-shaped payload instead of throwing a network error.
  if (config.enableMocks) {
    await sleep(200)
    return { data: null, items: [], total: 0, page: 1, pageSize: config.defaultPageSize }
  }

  const isFormData = body instanceof FormData
  const response = await fetch(buildUrl(path, params), {
    method,
    signal,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  })

  if (response.status === 401) {
    clearAuth()
    if (!path.startsWith('/auth/')) window.location.assign('/login')
    throw new ApiError('Your session has expired. Please sign in again.', { status: 401 })
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    throw new ApiError(data?.message || `Request failed with status ${response.status}`, {
      status: response.status,
      data,
    })
  }
  return data
}

/**
 * Demo helper: returns `demo` when mocks are enabled, otherwise performs the
 * real request. Lets every screen work before the backend exists.
 *
 *   list: (params) => withMockList(DEMO_USERS, params, { searchKeys: ['name'] })
 *   get:  (id) => withMock(findDemo(id), () => apiClient.get(`/users/${id}`))
 */
export function withMock(demo, requestFn) {
  if (!config.enableMocks) return requestFn()
  return sleep(150).then(() => (typeof demo === 'function' ? demo() : JSON.parse(JSON.stringify(demo))))
}

export function withMockList(demoItems = [], params = {}, { searchKeys = ['name'] } = {}) {
  return withMock(() => {
    let items = [...demoItems]
    const { search, status, role, page = 1, pageSize = config.defaultPageSize } = params
    if (search) {
      const query = String(search).toLowerCase()
      items = items.filter((item) =>
        searchKeys.some((key) => String(item[key] ?? '').toLowerCase().includes(query)),
      )
    }
    if (status) items = items.filter((item) => item.status === status)
    if (role) items = items.filter((item) => item.role === role)
    const total = items.length
    const start = (Number(page) - 1) * Number(pageSize)
    return { items: items.slice(start, start + Number(pageSize)), total, page: Number(page), pageSize: Number(pageSize) }
  })
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
}
