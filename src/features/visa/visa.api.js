import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_APPLICATIONS = [
  { id: 'visa_501', reference: 'VS-2026-0501', applicant: 'Rohan Gupta', country: 'United Arab Emirates', type: 'Tourist', submittedAt: '2026-09-28', status: 'in_review', assignee: 'Priya Nair' },
  { id: 'visa_502', reference: 'VS-2026-0502', applicant: 'Sara Ali', country: 'Schengen (France)', type: 'Tourist', submittedAt: '2026-09-25', status: 'approved', assignee: 'Daniel Osei' },
  { id: 'visa_503', reference: 'VS-2026-0503', applicant: 'Tom Becker', country: 'United Kingdom', type: 'Business', submittedAt: '2026-09-22', status: 'action_required', assignee: 'Priya Nair' },
  { id: 'visa_504', reference: 'VS-2026-0504', applicant: 'Nina Roy', country: 'Singapore', type: 'Tourist', submittedAt: '2026-09-30', status: 'submitted', assignee: 'Unassigned' },
]

const DEMO_DOCUMENTS = [
  { id: 'doc_1', name: 'Passport bio page', status: 'verified', size: '2.1 MB' },
  { id: 'doc_2', name: 'Recent photograph', status: 'verified', size: '0.4 MB' },
  { id: 'doc_3', name: 'Bank statements (3 months)', status: 'pending', size: '5.8 MB' },
  { id: 'doc_4', name: 'Travel insurance', status: 'rejected', size: '1.2 MB' },
]

const DEMO_COUNTRIES = [
  { id: 'c_1', name: 'United Arab Emirates', code: 'AE', visaTypes: 'Tourist, Business', processingTime: '3–5 days', active: true },
  { id: 'c_2', name: 'Schengen Area (France)', code: 'FR', visaTypes: 'Tourist, Business, Student', processingTime: '10–15 days', active: true },
  { id: 'c_3', name: 'United Kingdom', code: 'GB', visaTypes: 'Tourist, Business', processingTime: '15 days', active: true },
  { id: 'c_4', name: 'Singapore', code: 'SG', visaTypes: 'Tourist', processingTime: '3 days', active: true },
  { id: 'c_5', name: 'Australia', code: 'AU', visaTypes: 'Tourist, Business', processingTime: '20 days', active: false },
]

export const visaApi = {
  list: (params) => withMockList(DEMO_APPLICATIONS, params, { searchKeys: ['reference', 'applicant', 'country'] }),
  get: (id) =>
    withMock(DEMO_APPLICATIONS.find((application) => application.id === id) ?? DEMO_APPLICATIONS[0], () =>
      apiClient.get(`/visa/applications/${id}`),
    ),
  updateStatus: (id, status) =>
    withMock(() => {
      const application = DEMO_APPLICATIONS.find((item) => item.id === id)
      if (application) application.status = status
      return application
    }, () => apiClient.patch(`/visa/applications/${id}`, { status })),
  listDocuments: (id) => withMock(DEMO_DOCUMENTS, () => apiClient.get(`/visa/applications/${id}/documents`)),
  listCountries: (params) => withMockList(DEMO_COUNTRIES, params, { searchKeys: ['name', 'code'] }),
}
