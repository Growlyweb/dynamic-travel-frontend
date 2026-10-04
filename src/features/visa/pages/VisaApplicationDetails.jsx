import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import ConfirmDialog from '../../../components/common/ConfirmDialog'
import VisaStatusBadge from '../components/VisaStatusBadge'
import VisaTimeline from '../components/VisaTimeline'
import VisaDocumentList from '../components/VisaDocumentList'
import { visaApi } from '../visa.api'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, titleCase } from '../../../utils/formatters'
import { getApiErrorMessage } from '../../../utils/helpers'

const STATUS_STEP_INDEX = { submitted: 0, in_review: 2, action_required: 2, approved: 3, rejected: 3 }

export default function VisaApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingStatus, setPendingStatus] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [applicationResult, documentResult] = await Promise.all([visaApi.get(id), visaApi.listDocuments(id)])
      setApplication(applicationResult)
      setDocuments(documentResult.items ?? documentResult ?? [])
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleUpdateStatus() {
    if (!pendingStatus) return
    setSaving(true)
    try {
      await visaApi.updateStatus(id, pendingStatus)
      setPendingStatus(null)
      await load()
    } catch (statusError) {
      setError(statusError)
      setPendingStatus(null)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader fullPage label="Loading application…" />
  if (error) return <ErrorState title="Could not load this application" message={getApiErrorMessage(error)} onRetry={load} />
  if (!application) return null

  const currentIndex = STATUS_STEP_INDEX[application.status] ?? 0
  const steps = [
    { label: 'Application submitted', at: formatDate(application.submittedAt), state: 'done' },
    { label: 'Documents collected', state: currentIndex >= 1 ? 'done' : 'todo' },
    { label: 'Under review', state: currentIndex >= 2 ? 'done' : 'todo' },
    {
      label: application.status === 'rejected' ? 'Rejected' : 'Decision issued',
      state: currentIndex >= 3 ? 'done' : 'todo',
    },
  ]
  const decided = application.status === 'approved' || application.status === 'rejected'

  return (
    <div className="stack">
      <PageHeader
        title={application.reference}
        description={`${application.applicant} · ${application.country}`}
        breadcrumbs={[
          { label: 'Visa', to: APP_ROUTES.VISA_APPLICATIONS },
          { label: 'Applications', to: APP_ROUTES.VISA_APPLICATIONS },
          { label: application.reference },
        ]}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate(APP_ROUTES.VISA_APPLICATIONS)}>
              Back
            </Button>
            {!decided ? (
              <>
                <Button variant="danger" onClick={() => setPendingStatus('rejected')}>
                  Reject
                </Button>
                <Button onClick={() => setPendingStatus('approved')}>Approve</Button>
              </>
            ) : null}
          </>
        }
      />

      <div className="card">
        <div className="row between row--wrap">
          <VisaStatusBadge status={application.status} />
          <span className="muted small">Assignee: {application.assignee}</span>
        </div>
        <dl className="detail-list mt-4">
          <div>
            <dt>Applicant</dt>
            <dd>{application.applicant}</dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{application.country}</dd>
          </div>
          <div>
            <dt>Visa type</dt>
            <dd>{titleCase(application.type)}</dd>
          </div>
          <div>
            <dt>Submitted</dt>
            <dd>{formatDate(application.submittedAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <p className="card__title">Progress</p>
          <VisaTimeline steps={steps} />
        </div>
        <div className="card">
          <p className="card__title">Documents</p>
          <VisaDocumentList documents={documents} />
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus === 'approved' ? 'Approve application' : 'Reject application'}
        message={`Set ${application.reference} to ${titleCase(pendingStatus ?? '')}?`}
        confirmLabel={titleCase(pendingStatus ?? 'Confirm')}
        tone={pendingStatus === 'rejected' ? 'danger' : 'primary'}
        loading={saving}
        onConfirm={handleUpdateStatus}
        onCancel={() => setPendingStatus(null)}
      />
    </div>
  )
}
