const list = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

// Modules that still use demo data, for example "vendorServices,marketing". "all" puts the whole app on demo data.
const mockModules = list(import.meta.env.VITE_MOCK_MODULES)
const mockAll = mockModules.includes('all')

const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '')

export const config = {
  apiBaseUrl,
  appName: import.meta.env.VITE_APP_NAME ?? 'Travel Dashboard',
  mockModules,
  mockAll,
  defaultPageSize: 50,
}

export const isMocked = (module) => mockAll || mockModules.includes(module)

// There is no address in the code. Without one the app has nothing to talk to, so it says so instead of failing later.
export const configProblem =
  !apiBaseUrl && !mockAll
    ? 'VITE_API_BASE_URL is not set. Copy .env.example to .env and set it to the address of the backend API, for example http://localhost:5000/api.'
    : null
