import { catalogApi } from './api/catalog'
import { applicationsApi } from './api/applications'
import { messagesApi } from './api/messages'
import { quotationsApi } from './api/quotations'

export * from './api/constants'

// One object for the visa screens. Every call goes to /api/visa.
export const visaApi = {
  ...catalogApi,
  ...applicationsApi,
  ...messagesApi,
  ...quotationsApi,
}
