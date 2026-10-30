import { apiClient, withModuleMock } from '../../services/apiClient'

// The list of every document of every kind is not on the server yet (partner documents are reviewed on the partner's page,
// visa documents on the application). This page shows demo data until it is built: VITE_MOCK_MODULES=documents.
const { withMock, withMockList } = withModuleMock('documents')

const DEMO_DOCUMENTS = [
  { id: 'doc_401', name: 'passport_rohan_gupta.pdf', owner: 'Rohan Gupta', type: 'Passport', uploadedAt: '2026-09-28', status: 'pending', size: '2.1 MB' },
  { id: 'doc_402', name: 'bank_statement_sara_ali.pdf', owner: 'Sara Ali', type: 'Bank statement', uploadedAt: '2026-09-25', status: 'verified', size: '5.8 MB' },
  { id: 'doc_403', name: 'insurance_tom_becker.pdf', owner: 'Tom Becker', type: 'Insurance', uploadedAt: '2026-09-22', status: 'rejected', size: '1.2 MB' },
  { id: 'doc_404', name: 'photo_nina_roy.jpg', owner: 'Nina Roy', type: 'Photograph', uploadedAt: '2026-09-30', status: 'pending', size: '0.4 MB' },
]

export const documentsApi = {
  list: (params) =>
    withMockList(
      DEMO_DOCUMENTS,
      params,
      { searchKeys: ['name', 'owner', 'type'] },
      () => apiClient.get('/documents', { params })
    ),
  get: (id) =>
    withMock(
      DEMO_DOCUMENTS.find((document) => document.id === id) ?? DEMO_DOCUMENTS[0],
      async () => {
        const res = await apiClient.get(`/documents/${id}`)
        return res?.data ?? res
      }
    ),
  setStatus: (id, status, reviewNote = '') =>
    withMock(
      () => {
        const document = DEMO_DOCUMENTS.find((item) => item.id === id)
        if (document) document.status = status
        return document
      },
      () => apiClient.patch(`/documents/${id}/status`, { status, reviewNote })
    ),
  delete: (id) => apiClient.delete(`/documents/${id}`),
}
