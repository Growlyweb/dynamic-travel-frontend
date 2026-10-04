import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import DocumentStatusBadge from '../components/DocumentStatusBadge'
import DocumentViewer from '../components/DocumentViewer'
import { documentsApi } from '../documents.api'
import { formatDate } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

export default function DocumentDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDocument(await documentsApi.get(id))
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(status) {
    setSaving(true)
    try {
      await documentsApi.setStatus(id, status)
      await load()
    } catch (statusError) {
      setError(statusError)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader fullPage label="Loading document…" />
  if (error) return <ErrorState title="Could not load this document" message={getApiErrorMessage(error)} onRetry={load} />
  if (!document) return null

  return (
    <div className="stack">
      <PageHeader
        title={document.name}
        description={`Owner: ${document.owner}`}
        breadcrumbs={[{ label: 'Documents', to: '/documents' }, { label: document.name }]}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate('/documents')}>
              Back
            </Button>
            {document.status !== 'rejected' ? (
              <Button variant="danger" loading={saving} onClick={() => setStatus('rejected')}>
                Reject
              </Button>
            ) : null}
            {document.status !== 'verified' ? (
              <Button loading={saving} onClick={() => setStatus('verified')}>
                Verify
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid grid--2">
        <DocumentViewer document={document} />
        <div className="card">
          <p className="card__title">Details</p>
          <dl className="detail-list">
            <div>
              <dt>Status</dt>
              <dd>
                <DocumentStatusBadge status={document.status} />
              </dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{document.owner}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{document.type}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{document.size}</dd>
            </div>
            <div>
              <dt>Uploaded</dt>
              <dd>{formatDate(document.uploadedAt)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
