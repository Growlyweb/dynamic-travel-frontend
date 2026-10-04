import { apiClient, withMock, withMockList } from '../../services/apiClient'

const DEMO_DOCUMENTS = [
  { id: 'doc_401', name: 'passport_rohan_gupta.pdf', owner: 'Rohan Gupta', type: 'Passport', uploadedAt: '2026-09-28', status: 'pending', size: '2.1 MB' },
  { id: 'doc_402', name: 'bank_statement_sara_ali.pdf', owner: 'Sara Ali', type: 'Bank statement', uploadedAt: '2026-09-25', status: 'verified', size: '5.8 MB' },
  { id: 'doc_403', name: 'insurance_tom_becker.pdf', owner: 'Tom Becker', type: 'Insurance', uploadedAt: '2026-09-22', status: 'rejected', size: '1.2 MB' },
  { id: 'doc_404', name: 'photo_nina_roy.jpg', owner: 'Nina Roy', type: 'Photograph', uploadedAt: '2026-09-30', status: 'pending', size: '0.4 MB' },
]

export const documentsApi = {
  list: (params) => withMockList(DEMO_DOCUMENTS, params, { searchKeys: ['name', 'owner', 'type'] }),
  get: (id) => withMock(DEMO_DOCUMENTS.find((document) => document.id === id) ?? DEMO_DOCUMENTS[0], () => apiClient.get(`/documents/${id}`)),
  setStatus: (id, status) =>
    withMock(() => {
      const document = DEMO_DOCUMENTS.find((item) => item.id === id)
      if (document) document.status = status
      return document
    }, () => apiClient.patch(`/documents/${id}`, { status })),
}
