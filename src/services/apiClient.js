import { config, isMocked } from '../app/config'
import { getAccessToken, setAccessToken, endSession } from './authStorage'
import { sleep } from '../utils/helpers'

export class ApiError extends Error {
  constructor(message, { status, code, fields, data, retryAfter } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fields = fields ?? {}
    this.data = data
    this.retryAfter = retryAfter
  }
}

function buildUrl(path, params) {
  const url = `${config.apiBaseUrl}${path}`
  if (!params) return url
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    // The screens say pageSize, the server says limit.
    if (value !== undefined && value !== null && value !== '') search.append(key === 'pageSize' ? 'limit' : key, String(value))
  })
  const qs = search.toString()
  return qs ? `${url}?${qs}` : url
}

// Every object that has an `_id` also gets an `id`, so screens can read either.
function withIds(value) {
  if (Array.isArray(value)) return value.map(withIds)
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const copy = {}
    for (const [key, item] of Object.entries(value)) copy[key] = withIds(item)
    if ('_id' in copy && !('id' in copy)) copy.id = copy._id
    return copy
  }
  return value
}

// The server answers { success, message, data, meta }. A list becomes { items, total, page, pageSize, totalPages, ...extras }
// (the extras are what the server adds to meta, for example a summary). Anything else becomes its data.
function unwrap(body) {
  if (!body || typeof body !== 'object' || !('success' in body)) return body
  const { data, meta } = body
  if (meta && Array.isArray(data) && 'total' in meta) {
    const { limit, ...rest } = meta
    return { ...rest, items: withIds(data), pageSize: limit }
  }
  return withIds(data ?? null)
}

// The server's field errors come as { field: 'body.email', message }. A form wants { email: message }.
function fieldsOf(errors) {
  if (!Array.isArray(errors)) return {}
  return Object.fromEntries(errors.map(({ field, message }) => [String(field).replace(/^(body|query|params)\./, ''), message]))
}

// Two refreshes at once would rotate the cookie twice and sign the person out everywhere, so they share one request.
let refreshing = null

export function refreshSession() {
  if (!refreshing) {
    refreshing = fetch(buildUrl('/auth/refresh'), { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      .then(async (response) => {
        if (!response.ok) return null
        const body = await response.json().catch(() => null)
        const token = body?.data?.accessToken
        if (!token) return null
        setAccessToken(token)
        return withIds(body.data)
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

const RENEWABLE = new Set(['TOKEN_INVALID', 'SESSION_EXPIRED'])

async function send(path, { method, body, params, headers, signal }) {
  const isFormData = body instanceof FormData
  const token = getAccessToken()
  try {
    return await fetch(buildUrl(path, params), {
      method,
      signal,
      credentials: 'include',
      headers: {
        ...(isFormData || body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new ApiError('Cannot reach the server.', { status: 0, code: 'NETWORK' })
  }
}

async function request(path, options = {}) {
  // Whole-app demo mode: every call answers with an empty list-shaped payload.
  if (config.mockAll) {
    await sleep(200)
    return { data: null, items: [], total: 0, page: 1, pageSize: config.defaultPageSize }
  }

  let response = await send(path, options)
  let isJson = response.headers.get('content-type')?.includes('application/json')
  let data = isJson ? await response.json().catch(() => null) : null

  // An access token lasts 15 minutes. Renew it once and repeat the call.
  const isAuthCall = path.startsWith('/auth/') && path !== '/auth/me'
  if (response.status === 401 && RENEWABLE.has(data?.code) && !isAuthCall) {
    const session = await refreshSession()
    if (!session) {
      endSession()
      throw new ApiError('Your session has ended. Please sign in again.', { status: 401, code: 'SESSION_EXPIRED' })
    }
    response = await send(path, options)
    isJson = response.headers.get('content-type')?.includes('application/json')
    data = isJson ? await response.json().catch(() => null) : null
  }

  if (!response.ok) {
    if (response.status === 401 && !isAuthCall) endSession()
    if (data?.code === 'ACCOUNT_NOT_ACTIVE') endSession()
    throw new ApiError(data?.message || `Request failed with status ${response.status}`, {
      status: response.status,
      code: data?.code,
      fields: fieldsOf(data?.errors),
      data,
      retryAfter: Number(response.headers.get('retry-after')) || undefined,
    })
  }
  if (options.raw) return response
  return unwrap(data)
}

/**
 * Demo data for one module while its backend is not ready. `withModuleMock('vendorServices')` returns helpers that
 * serve demo data when that module is listed in VITE_MOCK_MODULES (or the whole app is on demo data), and call the
 * backend otherwise. A call site that gives no real request keeps serving demo data until it is converted.
 *
 *   const { withMock, withMockList } = withModuleMock('vendorServices')
 *   list: (params) => withMockList(DEMO, params, { searchKeys: ['name'] })
 *   get:  (id) => withMock(findDemo(id), () => apiClient.get(`/vendors/${id}`))
 */
export function withModuleMock(module) {
  function withMock(demo, requestFn) {
    if (!isMocked(module) && typeof requestFn === 'function') return requestFn()
    return sleep(150).then(() => (typeof demo === 'function' ? demo() : JSON.parse(JSON.stringify(demo))))
  }

  function withMockList(demoItems = [], params = {}, { searchKeys = ['name'] } = {}) {
    return withMock(() => {
      let items = [...demoItems]
      const { search, status, role, page = 1, pageSize = config.defaultPageSize } = params
      if (search) {
        const query = String(search).toLowerCase()
        items = items.filter((item) => searchKeys.some((key) => String(item[key] ?? '').toLowerCase().includes(query)))
      }
      if (status) items = items.filter((item) => item.status === status)
      if (role) items = items.filter((item) => item.role === role)
      const total = items.length
      const start = (Number(page) - 1) * Number(pageSize)
      return { items: items.slice(start, start + Number(pageSize)), total, page: Number(page), pageSize: Number(pageSize), totalPages: Math.max(Math.ceil(total / Number(pageSize)), 1) }
    })
  }

  return { withMock, withMockList }
}

// The old names, for api files not yet moved to a module. They behave as the "unassigned" module.
export const { withMock, withMockList } = withModuleMock('unassigned')

// A file the server sends back (a PDF, a spreadsheet): fetched with the token and handed over as a blob.
async function download(path, options = {}) {
  const response = await request(path, { ...options, method: 'GET', raw: true })
  const disposition = response.headers.get('content-disposition') ?? ''
  const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1]
  return { blob: await response.blob(), name }
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
  download,
}
