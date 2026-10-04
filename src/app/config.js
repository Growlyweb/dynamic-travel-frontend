export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
  appName: import.meta.env.VITE_APP_NAME ?? 'Travel Dashboard',
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === 'true',
  defaultPageSize: 10,
}
