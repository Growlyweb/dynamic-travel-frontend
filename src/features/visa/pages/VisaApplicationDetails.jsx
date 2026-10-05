import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/layout/PageHeader'
import Loader from '../../../components/common/Loader'
import ErrorState from '../../../components/common/ErrorState'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Modal from '../../../components/common/Modal'
import Select from '../../../components/common/Select'
import VisaStatusBadge from '../components/VisaStatusBadge'
import VisaTimeline from '../components/VisaTimeline'
import StatusChangeDialog from '../components/StatusChangeDialog'
import PassportManageDialog from '../components/PassportManageDialog'
import { visaApi, VISA_STAFF, PASSPORT_STATUS_LABELS, PASSPORT_STATUS_TONES, PASSPORT_METHOD_LABELS, PASSPORT_REQUIREMENT_LABELS } from '../visa.api'
import { uploadFile } from '../../../services/uploadService'
import { APP_ROUTES } from '../../../utils/constants'
import { formatDate, formatDateTime, formatCurrency } from '../../../utils/formatters'
import { cn, getApiErrorMessage } from '../../../utils/helpers'

const WORKFLOW_STEPS = [
  { key: 'submitted', label: 'Application submitted' },
  { key: 'under_review', label: 'Under review' },
  { key: 'processing', label: 'Processing' },
  { key: 'submitted_to_embassy', label: 'Submitted to embassy' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
]
const STATUS_ORDER = {
  submitted: 0,
  under_review: 1,
  action_required: 1,
  documents_completed: 1,
  processing: 2,
  submitted_to_embassy: 3,
  approved: 4,
  passport_ready: 4,
  completed: 5,
}

const DOC_TONES = { verified: 'success', pending: 'warning', rejected: 'danger', missing: 'neutral' }
const DOC_ICONS = { verified: '✓', pending: '⚠', rejected: '✕', missing: '—' }
const VISIBILITY_TONES = { internal: 'neutral', customer: 'info', both: 'primary' }

function normalizeTokens(text) {
  return String(text)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2)
}

function matchDocumentForItem(item, documents) {
  const itemTokens = new Set(normalizeTokens(item.label))
  let best = null
  for (const document of documents) {
    const docTokens = normalizeTokens(document.type)
    const overlap = docTokens.filter((token) => itemTokens.has(token)).length
    const score = overlap / Math.max(docTokens.length, itemTokens.size)
    if (overlap > 0 && (!best || score > best.score)) best = { document, score }
  }
  return best && best.score >= 0.4 ? best.document : null
}

function passportValidityWarning(passport) {
  if (!passport?.expiry) return null
  const expiry = new Date(passport.expiry)
  if (Number.isNaN(expiry.getTime())) return null
  const sixMonthsLater = new Date()
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
  return expiry < sixMonthsLater
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageFile(name) {
  return /\.(jpe?g|png|gif|webp)$/i.test(name ?? '')
}

export default function VisaApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [application, setApplication] = useState(null)
  const [checklist, setChecklist] = useState(null)
  const [statusConfigs, setStatusConfigs] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [smsDialogOpen, setSmsDialogOpen] = useState(false)
  const [docReview, setDocReview] = useState(null) // { document, status }
  const [docNote, setDocNote] = useState('')
  const [noteDrafts, setNoteDrafts] = useState({ internal: '', customer: '' })
  const [savingAction, setSavingAction] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState('')
  const [uploadFileChosen, setUploadFileChosen] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [viewDoc, setViewDoc] = useState(null)
  const [visaType, setVisaType] = useState(null)
  const [passportDialogOpen, setPassportDialogOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const applicationResult = await visaApi.getApplication(id)
      setApplication(applicationResult)
      const [checklistResult, statusResult, templateResult, typeResult] = await Promise.all([
        visaApi.getChecklist({
          countryId: applicationResult.countryId,
          visaTypeId: applicationResult.visaTypeId,
          applicantType: applicationResult.applicant.applicantType,
        }),
        visaApi.listStatusConfigs(),
        visaApi.listSmsTemplates(),
        visaApi.listVisaTypes({ countryId: applicationResult.countryId }),
      ])
      setChecklist(checklistResult)
      setStatusConfigs((statusResult.items ?? []).filter((config) => config.active).sort((a, b) => a.displayOrder - b.displayOrder))
      setTemplates((templateResult.items ?? []).filter((template) => template.active))
      setVisaType((typeResult.items ?? []).find((type) => type.id === applicationResult.visaTypeId) ?? null)
    } catch (loadError) {
      setError(loadError)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function runAction(action) {
    setSavingAction(true)
    try {
      await action()
      await load()
    } finally {
      setSavingAction(false)
    }
  }

  if (loading) return <Loader fullPage label="Loading application…" />
  if (error) return <ErrorState title="Could not load this application" message={getApiErrorMessage(error)} onRetry={load} />
  if (!application) return null

  const isRejected = application.status === 'rejected'
  const order = isRejected ? WORKFLOW_STEPS.length - 1 : STATUS_ORDER[application.status] ?? 0
  const steps = WORKFLOW_STEPS.map((step, index) => ({
    label: isRejected && index === order ? 'Rejected' : step.label,
    state: index <= order ? 'done' : 'todo',
  }))

  const applicant = application.applicant
  const passport = application.passport
  const passportWarning = passportValidityWarning(passport)
  const price = application.price

  async function submitDocumentReview() {
    if (!docReview) return
    await runAction(async () => {
      await visaApi.reviewDocument(application.id, docReview.document.id, {
        status: docReview.status,
        reviewNote: docNote.trim(),
      })
    })
    setDocReview(null)
    setDocNote('')
  }

  async function addNote(type) {
    const text = noteDrafts[type].trim()
    if (!text) return
    await runAction(async () => {
      await visaApi.addNote(application.id, { type, text })
    })
    setNoteDrafts((current) => ({ ...current, [type]: '' }))
  }

  function openUpload() {
    const firstChecklistItem = checklist?.items.find((item) => item.active)
    setUploadType(firstChecklistItem?.label ?? 'Other document')
    setUploadFileChosen(null)
    setUploadError(null)
    setUploadOpen(true)
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!uploadFileChosen) {
      setUploadError('Choose a file first (PDF or image).')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const uploaded = await uploadFile(uploadFileChosen, { folder: 'visa-documents' })
      await visaApi.addDocument(application.id, {
        type: uploadType || 'Other document',
        name: uploaded.name,
        size: formatFileSize(uploaded.size),
        mime: uploadFileChosen.type || 'application/octet-stream',
        url: uploaded.url,
      })
      setUploadOpen(false)
      await load()
    } catch (submitError) {
      setUploadError(submitError?.message ?? 'Could not upload the file.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="stack">
      <PageHeader
        title={application.number}
        description={`${applicant.fullName} · ${application.country} · ${application.visaType}`}
        breadcrumbs={[
          { label: 'Visa', to: APP_ROUTES.VISA_APPLICATIONS },
          { label: 'Applications', to: APP_ROUTES.VISA_APPLICATIONS },
          { label: application.number },
        ]}
        actions={
          <>
            <Button variant="ghost" onClick={() => navigate(APP_ROUTES.VISA_APPLICATIONS)}>Back</Button>
            <Button variant="subtle" onClick={() => setSmsDialogOpen(true)}>Send SMS</Button>
            <Button onClick={() => setStatusDialogOpen(true)}>Change status</Button>
          </>
        }
      />

      {/* Header summary */}
      <div className="card">
        <div className="row between row--wrap">
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <VisaStatusBadge status={application.status} />
            <Badge tone={application.channel === 'b2b' ? 'info' : 'primary'}>
              {application.channel === 'b2b' ? `B2B · ${application.partner}` : 'B2C'}
            </Badge>
            {checklist?.isDefault ? <Badge tone="warning">checklist template</Badge> : null}
          </div>
          <span className="muted small">
            Submitted {formatDate(application.submittedAt)} · Updated {formatDate(application.updatedAt)}
          </span>
        </div>
        <dl className="detail-list mt-4">
          <div>
            <dt>Application no.</dt>
            <dd className="strong">{application.number}</dd>
          </div>
          <div>
            <dt>Country / visa type</dt>
            <dd>{application.country} — {application.visaType}</dd>
          </div>
          <div>
            <dt>Passport number</dt>
            <dd className="strong">{passport.number}</dd>
          </div>
          <div>
            <dt>Passport expiry</dt>
            <dd>
              {formatDate(passport.expiry)}
              {passportWarning ? <span className="small" style={{ color: 'var(--color-danger, #dc2626)' }}> · under 6 months</span> : null}
            </dd>
          </div>
          <div>
            <dt>Assigned staff</dt>
            <dd>
              <Select
                value={application.assignedStaff ?? ''}
                aria-label="Assigned staff"
                onChange={(event) => runAction(() => visaApi.assignStaff(application.id, event.target.value || null))}
                options={[{ value: '', label: 'Unassigned' }, ...VISA_STAFF.map((staff) => ({ value: staff, label: staff }))]}
              />
            </dd>
          </div>
          <div>
            <dt>{application.channel === 'b2b' ? 'B2B net price' : 'B2C price'}</dt>
            <dd className="strong">{formatCurrency(application.channel === 'b2b' ? price.b2b : price.b2c, price.currency)}</dd>
          </div>
        </dl>
        {passportWarning ? (
          <p className="alert alert--danger mt-3" style={{ padding: '8px 12px' }}>
            Passport should have at least 6 months validity for this visa application.
          </p>
        ) : null}
      </div>

      {/* Action required / rejection banners */}
      {application.actionRequired ? (
        <div className="alert alert--danger">
          <strong>Action required:</strong> {application.actionRequired.message}
          <span className="muted small" style={{ display: 'block' }}>
            Requested by {application.actionRequired.requestedBy} · {formatDate(application.actionRequired.requestedAt)}
          </span>
        </div>
      ) : null}
      {isRejected && application.rejection ? (
        <div className="alert alert--danger">
          <strong>Rejected:</strong> {application.rejection.customerReason || 'No customer-facing reason recorded.'}
          {application.rejection.internalReason ? (
            <span className="muted small" style={{ display: 'block' }}>Internal: {application.rejection.internalReason}</span>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid--2">
        {/* Applicant information */}
        <div className="stack stack--sm">
          <div className="card">
            <p className="card__title">Applicant information</p>
            <dl className="detail-list mt-2">
              <div><dt>Full name</dt><dd>{applicant.fullName}</dd></div>
              <div><dt>Date of birth</dt><dd>{formatDate(applicant.dob)}</dd></div>
              <div><dt>Gender</dt><dd>{applicant.gender}</dd></div>
              <div><dt>Nationality</dt><dd>{applicant.nationality}</dd></div>
              <div><dt>Mobile</dt><dd>{applicant.mobile}</dd></div>
              <div><dt>Email</dt><dd>{applicant.email}</dd></div>
              <div><dt>Address</dt><dd>{[applicant.address, applicant.city].filter(Boolean).join(', ') || '—'}</dd></div>
              <div><dt>Applicant type</dt><dd>{applicant.applicantType}</dd></div>
            </dl>
          </div>
          <div className="card">
            <div className="row between">
              <p className="card__title" style={{ marginBottom: 0 }}>Passport</p>
              <Button size="sm" variant="subtle" onClick={() => setPassportDialogOpen(true)}>Manage</Button>
            </div>
            <div className="row row--wrap mt-2" style={{ gap: 8 }}>
              <Badge tone="info">{PASSPORT_METHOD_LABELS[application.passportSubmissionMethod] ?? '—'}</Badge>
              <Badge tone={PASSPORT_STATUS_TONES[application.passportStatus] ?? 'neutral'}>
                {PASSPORT_STATUS_LABELS[application.passportStatus] ?? application.passportStatus}
              </Badge>
              <span className="muted small">
                {visaType ? PASSPORT_REQUIREMENT_LABELS[visaType.passportRequirement] ?? visaType.passportRequirement : ''}
              </span>
            </div>
            {application.pickupRequest ? (
              <p className="muted small mt-2" style={{ marginBottom: 0 }}>
                {application.pickupRequest.locationType} pickup · {application.pickupRequest.address}
                {application.pickupRequest.district ? `, ${application.pickupRequest.district}` : ''}
                {application.pickupRequest.preferredDate ? ` · preferred ${formatDate(application.pickupRequest.preferredDate)} ${application.pickupRequest.preferredTime ?? ''}` : ''}
                {application.pickupRequest.assignedStaff ? ` · staff: ${application.pickupRequest.assignedStaff}` : ''}
              </p>
            ) : null}
            {application.passportStatus === 'online' || application.passportStatus === 'not_required' ? (
              <p className="muted small mt-2" style={{ marginBottom: 0 }}>Online processing — no physical passport required.</p>
            ) : null}
          </div>
        </div>

        {/* Progress + documents */}
        <div className="stack stack--sm">
          <div className="card">
            <p className="card__title">Progress</p>
            <VisaTimeline steps={steps} />
          </div>
          <div className="card">
            <div className="row between">
              <p className="card__title" style={{ marginBottom: 0 }}>Documents</p>
              <Button size="sm" variant="subtle" onClick={openUpload}>+ Add file</Button>
            </div>
            <ul className="stack stack--sm mt-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {application.documents.map((document) => (
                <li key={document.id} className="row between row--wrap" style={{ gap: 8 }}>
                  <div>
                    <p className="strong" style={{ margin: 0 }}>{document.type}</p>
                    <p className="muted small" style={{ margin: 0 }}>
                      {document.name} · {document.size} · {formatDate(document.uploadedAt)} · by {document.uploadedBy}
                    </p>
                    {document.reviewNote ? (
                      <p className="small" style={{ margin: 0, color: 'var(--color-danger, #dc2626)' }}>Note: {document.reviewNote}</p>
                    ) : null}
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <Badge tone={DOC_TONES[document.status] ?? 'neutral'}>{document.status}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => setViewDoc(document)}>View</Button>
                    {document.status !== 'verified' ? (
                      <Button size="sm" variant="ghost" onClick={() => { setDocReview({ document, status: 'verified' }); setDocNote('') }}>
                        Verify
                      </Button>
                    ) : null}
                    {document.status !== 'rejected' ? (
                      <Button size="sm" variant="ghost" onClick={() => { setDocReview({ document, status: 'rejected' }); setDocNote('') }}>
                        Reject
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
              {!application.documents.length ? <p className="muted small">No documents uploaded.</p> : null}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        {/* Checklist */}
        <div className="card">
          <p className="card__title">Checklist — {application.country} / {application.visaType} / {applicant.applicantType}</p>
          {checklist ? (
            <ul className="stack stack--sm mt-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {checklist.items
                .filter((item) => item.active)
                .map((item) => {
                  const document = matchDocumentForItem(item, application.documents)
                  const status = document?.status ?? 'missing'
                  return (
                    <li key={item.id} className="row between" style={{ gap: 8 }}>
                      <span className="row" style={{ gap: 8 }}>
                        <span aria-hidden className={cn('strong', status === 'missing' && 'muted')}>{DOC_ICONS[status]}</span>
                        <span>
                          {item.label}
                          {item.requirement !== 'required' ? <span className="muted small"> ({item.requirement})</span> : null}
                        </span>
                      </span>
                      <Badge tone={DOC_TONES[status]}>{status === 'missing' ? 'not uploaded' : status}</Badge>
                    </li>
                  )
                })}
            </ul>
          ) : (
            <p className="muted small">No checklist configured for this combination.</p>
          )}
        </div>

        {/* Timeline */}
        <div className="card">
          <p className="card__title">Timeline</p>
          <ul className="stack stack--sm mt-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {application.timeline.map((event) => (
              <li key={event.id} className="row between row--wrap" style={{ gap: 8, borderBottom: '1px solid var(--color-border, #e5e7eb)', paddingBottom: 8 }}>
                <div>
                  <p className="strong" style={{ margin: 0 }}>{event.event}</p>
                  <p className="muted small" style={{ margin: 0 }}>{event.message}</p>
                  <p className="muted small" style={{ margin: 0 }}>
                    {formatDateTime(event.at)} · by {event.by}
                  </p>
                </div>
                <Badge tone={VISIBILITY_TONES[event.visibility] ?? 'neutral'}>{event.visibility}</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Notes */}
      <div className="grid grid--2">
        <div className="card">
          <p className="card__title">Internal notes <Badge tone="neutral">staff only</Badge></p>
          <ul className="stack stack--sm mt-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {application.internalNotes.map((note) => (
              <li key={note.id}>
                <p style={{ margin: 0 }}>{note.text}</p>
                <p className="muted small" style={{ margin: 0 }}>{formatDateTime(note.at)} · {note.by}</p>
              </li>
            ))}
            {!application.internalNotes.length ? <p className="muted small">No internal notes.</p> : null}
          </ul>
          <div className="field mt-3">
            <textarea
              className="field__control"
              rows={2}
              placeholder="Add an internal note…"
              value={noteDrafts.internal}
              onChange={(event) => setNoteDrafts((current) => ({ ...current, internal: event.target.value }))}
            />
            <div className="mt-2">
              <Button size="sm" variant="subtle" loading={savingAction} onClick={() => addNote('internal')}>Add internal note</Button>
            </div>
          </div>
        </div>

        <div className="card">
          <p className="card__title">Customer notes <Badge tone="info">visible to customer</Badge></p>
          <ul className="stack stack--sm mt-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {application.customerNotes.map((note) => (
              <li key={note.id}>
                <p style={{ margin: 0 }}>{note.text}</p>
                <p className="muted small" style={{ margin: 0 }}>{formatDateTime(note.at)} · {note.by}</p>
              </li>
            ))}
            {!application.customerNotes.length ? <p className="muted small">No customer notes.</p> : null}
          </ul>
          <div className="field mt-3">
            <textarea
              className="field__control"
              rows={2}
              placeholder="Add a note visible to the customer / B2B partner…"
              value={noteDrafts.customer}
              onChange={(event) => setNoteDrafts((current) => ({ ...current, customer: event.target.value }))}
            />
            <div className="mt-2">
              <Button size="sm" variant="subtle" loading={savingAction} onClick={() => addNote('customer')}>Add customer note</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document review dialog */}
      <Modal
        open={Boolean(docReview)}
        onClose={() => setDocReview(null)}
        title={docReview?.status === 'verified' ? 'Verify document' : 'Reject document'}
        description={docReview?.document ? `${docReview.document.type} — ${docReview.document.name}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDocReview(null)}>Cancel</Button>
            <Button
              variant={docReview?.status === 'rejected' ? 'danger' : 'primary'}
              onClick={submitDocumentReview}
              loading={savingAction}
            >
              {docReview?.status === 'verified' ? 'Mark verified' : 'Mark rejected'}
            </Button>
          </>
        }
      >
        <div className="field">
          <label className="field__label" htmlFor="doc-review-note">Review note</label>
          <textarea
            id="doc-review-note"
            className="field__control"
            rows={3}
            value={docNote}
            onChange={(event) => setDocNote(event.target.value)}
            placeholder={
              docReview?.status === 'rejected'
                ? 'Why is this document rejected? e.g. Blurry scan — bio page unreadable.'
                : 'Optional note for the record.'
            }
          />
        </div>
      </Modal>

      <StatusChangeDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        application={application}
        statusOptions={statusConfigs}
        onSaved={load}
      />

      <PassportManageDialog
        open={passportDialogOpen}
        onClose={() => setPassportDialogOpen(false)}
        application={application}
        visaType={visaType}
        staff={VISA_STAFF}
        onSaved={load}
      />

      {/* Document upload (demo: file stays in this browser session) */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload document"
        description="Demo upload — the file stays in this browser session, appears in the Documents list and matches the Checklist below."
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} loading={uploading} disabled={!uploadFileChosen}>Upload</Button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="stack">
          <div className="field">
            <label className="field__label" htmlFor="upload-doc-type">Document type</label>
            <select
              id="upload-doc-type"
              className="field__control"
              value={uploadType}
              onChange={(event) => setUploadType(event.target.value)}
            >
              {(checklist?.items ?? []).filter((item) => item.active).map((item) => (
                <option key={item.id} value={item.label}>{item.label}</option>
              ))}
              <option value="Other document">Other document</option>
            </select>
            <p className="field__hint">Picking a checklist type marks that requirement as fulfilled.</p>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="upload-doc-file">File (PDF or image)</label>
            <input
              id="upload-doc-file"
              type="file"
              className="field__control"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setUploadFileChosen(event.target.files?.[0] ?? null)}
            />
            {uploadFileChosen ? (
              <p className="field__hint">{uploadFileChosen.name} · {formatFileSize(uploadFileChosen.size)}</p>
            ) : (
              <p className="field__hint">Accepted: PDF, JPG, PNG, WEBP.</p>
            )}
          </div>
          {uploadError ? <p className="alert alert--danger" role="alert">{uploadError}</p> : null}
        </form>
      </Modal>

      {/* Document preview */}
      <Modal
        open={Boolean(viewDoc)}
        onClose={() => setViewDoc(null)}
        title={viewDoc ? `Preview — ${viewDoc.type}` : ''}
        description={viewDoc ? `${viewDoc.name} · ${viewDoc.size} · ${viewDoc.status}` : undefined}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewDoc(null)}>Close</Button>
            {viewDoc?.url ? <Button onClick={() => window.open(viewDoc.url, '_blank')}>Open in new tab</Button> : null}
          </>
        }
      >
        {viewDoc?.url ? (
          isImageFile(viewDoc.name) ? (
            <img
              src={viewDoc.url}
              alt={viewDoc.name}
              style={{ maxWidth: '100%', maxHeight: 460, borderRadius: 'var(--radius-sm, 8px)' }}
            />
          ) : (
            <iframe
              src={viewDoc.url}
              title={viewDoc.name}
              style={{ width: '100%', height: 460, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm, 8px)' }}
            />
          )
        ) : (
          <p className="muted small">
            This is a seeded demo record without a real file. Upload a file with “+ Add file” and its preview will show here.
          </p>
        )}
      </Modal>

      <SendSmsDialog
        open={smsDialogOpen}
        onClose={() => setSmsDialogOpen(false)}
        application={application}
        templates={templates}
        onSent={load}
      />
    </div>
  )
}

/** Manual SMS send (spec #20). Renders the chosen template for preview. */
function SendSmsDialog({ open, onClose, application, templates, onSent }) {
  const [templateId, setTemplateId] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) {
      setTemplateId(templates[0]?.id ?? '')
      setMessage(templates[0]?.message ?? '')
    }
  }, [open, templates])

  const preview = (message || '')
    .replaceAll('{{applicantName}}', application?.applicant?.fullName ?? '')
    .replaceAll('{{applicationNumber}}', application?.number ?? '')
    .replaceAll('{{country}}', application?.country ?? '')
    .replaceAll('{{visaType}}', application?.visaType ?? '')
    .replaceAll('{{status}}', application?.status ?? '')
    .replaceAll('{{trackingUrl}}', `dynamic.travel/track/${application?.number ?? ''}`)

  async function handleSend() {
    setSending(true)
    try {
      await visaApi.sendSms(application.id, { templateId: templateId || undefined, message })
      onSent?.()
      onClose()
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send SMS"
      description={`To ${application?.applicant?.fullName} · ${application?.applicant?.mobile}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSend} loading={sending} disabled={!message.trim()}>Send SMS</Button>
        </>
      }
    >
      <div className="stack">
        <Select
          label="Template"
          value={templateId}
          onChange={(event) => {
            setTemplateId(event.target.value)
            const template = templates.find((item) => item.id === event.target.value)
            setMessage(template?.message ?? '')
          }}
          options={templates.map((template) => ({ value: template.id, label: template.name }))}
          placeholder="No template — custom message"
        />
        <div className="field">
          <label className="field__label" htmlFor="sms-message">Message</label>
          <textarea
            id="sms-message"
            className="field__control"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <p className="field__hint">
            Variables: {'{{applicantName}} {{applicationNumber}} {{country}} {{visaType}} {{status}} {{trackingUrl}}'}
          </p>
        </div>
        <div className="alert alert--info">
          <p className="small" style={{ margin: 0 }}><strong>Preview:</strong> {preview}</p>
        </div>
      </div>
    </Modal>
  )
}
