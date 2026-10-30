import { useEffect, useMemo, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import { visaApi } from '../visa.api'
import { usePermission } from '../../../hooks/usePermission'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatDate } from '../../../utils/formatters'

const DOC_TONES = { verified: 'success', pending: 'warning', rejected: 'danger' }

function fileSize(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// The files of one application: upload, preview, verify or reject (a rejection needs a note the applicant can read), delete.
export default function ApplicationDocuments({ application, checklist, onChanged }) {
  const { can } = usePermission()
  const canEdit = can(PERMISSIONS.VISA_EDIT)
  const canView = can(PERMISSIONS.DOCUMENT_VIEW)
  const canReview = can(PERMISSIONS.DOCUMENT_VERIFY)
  const items = useMemo(() => (checklist?.items ?? []).filter((item) => item.active), [checklist])

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadType, setUploadType] = useState('')
  const [file, setFile] = useState(null)
  const [review, setReview] = useState(null)
  const [note, setNote] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // A preview is a short-lived address for the downloaded file. It is released when the preview closes.
  useEffect(() => () => preview?.url && URL.revokeObjectURL(preview.url), [preview])

  function openUpload() {
    setUploadType(items[0]?.label ?? 'Other document')
    setFile(null)
    setError(null)
    setUploadOpen(true)
  }

  async function run(action, done) {
    setBusy(true)
    setError(null)
    try {
      await action()
      await onChanged(done)
      return true
    } catch (failure) {
      setError(errorMessage(failure))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function upload(event) {
    event.preventDefault()
    if (!file) return setError('Choose a file first (PDF or image).')
    const item = items.find((entry) => entry.label === uploadType)
    if (await run(() => visaApi.addDocument(application.id, { file, type: uploadType || 'Other document', checklistItemId: item?.id }), 'File uploaded.')) setUploadOpen(false)
  }

  async function submitReview() {
    if (review.status === 'rejected' && !note.trim()) return setError('A rejected document needs a note the applicant can read.')
    if (await run(() => visaApi.reviewDocument(application.id, review.document.id, { status: review.status, reviewNote: note.trim() }), review.status === 'verified' ? 'Document verified.' : 'Document rejected.')) setReview(null)
  }

  async function openPreview(document) {
    setBusy(true)
    try {
      const { blob } = await visaApi.downloadDocument(application.id, document.id)
      setPreview({ document, url: URL.createObjectURL(blob), image: blob.type.startsWith('image/') })
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <div className="row between">
        <p className="card__title" style={{ marginBottom: 0 }}>Documents</p>
        {canEdit ? <Button size="sm" variant="subtle" onClick={openUpload}>+ Add file</Button> : null}
      </div>
      {error && !uploadOpen && !review ? <div className="alert alert--danger mt-2">{error}</div> : null}
      <ul className="stack stack--sm mt-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {application.documents.map((document) => (
          <li key={document.id} className="row between row--wrap" style={{ gap: 8 }}>
            <div>
              <p className="strong" style={{ margin: 0 }}>{document.type}</p>
              <p className="muted small" style={{ margin: 0 }}>
                {document.name} · {fileSize(document.size)} · {formatDate(document.uploadedAt)} · by {document.uploadedBy || 'applicant'}
              </p>
              {document.reviewNote ? <p className="small" style={{ margin: 0, color: 'var(--color-danger, #dc2626)' }}>Note: {document.reviewNote}</p> : null}
            </div>
            <div className="row" style={{ gap: 6 }}>
              <Badge tone={DOC_TONES[document.status] ?? 'neutral'}>{document.status}</Badge>
              {canView ? <Button size="sm" variant="ghost" onClick={() => openPreview(document)} disabled={busy}>View</Button> : null}
              {canReview && document.status !== 'verified' ? <Button size="sm" variant="ghost" onClick={() => { setReview({ document, status: 'verified' }); setNote(''); setError(null) }}>Verify</Button> : null}
              {canReview && document.status !== 'rejected' ? <Button size="sm" variant="ghost" onClick={() => { setReview({ document, status: 'rejected' }); setNote(''); setError(null) }}>Reject</Button> : null}
              {canEdit ? <Button size="sm" variant="ghost" onClick={() => run(() => visaApi.removeDocument(application.id, document.id), 'File deleted.')} disabled={busy}>Delete</Button> : null}
            </div>
          </li>
        ))}
        {!application.documents.length ? <p className="muted small">No documents uploaded.</p> : null}
      </ul>

      <Modal
        open={uploadOpen}
        onClose={busy ? undefined : () => setUploadOpen(false)}
        title="Upload document"
        description="The file is stored on the server. Picking a checklist item marks that requirement as received."
        footer={
          <>
            <Button variant="ghost" onClick={() => setUploadOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={upload} loading={busy} disabled={!file}>Upload</Button>
          </>
        }
      >
        <form onSubmit={upload} className="stack">
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <div className="field">
            <label className="field__label" htmlFor="upload-doc-type">Document type</label>
            <select id="upload-doc-type" className="field__control" value={uploadType} onChange={(event) => setUploadType(event.target.value)}>
              {items.map((item) => <option key={item.id} value={item.label}>{item.label}</option>)}
              <option value="Other document">Other document</option>
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="upload-doc-file">File</label>
            <input id="upload-doc-file" type="file" className="field__control" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            <p className="field__hint">{file ? `${file.name} · ${fileSize(file.size)}` : 'Accepted: PDF, JPG, PNG, WEBP.'}</p>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(review)}
        onClose={busy ? undefined : () => setReview(null)}
        title={review?.status === 'verified' ? 'Verify document' : 'Reject document'}
        description={review ? `${review.document.type} — ${review.document.name}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReview(null)} disabled={busy}>Cancel</Button>
            <Button variant={review?.status === 'rejected' ? 'danger' : 'primary'} onClick={submitReview} loading={busy}>
              {review?.status === 'verified' ? 'Mark verified' : 'Mark rejected'}
            </Button>
          </>
        }
      >
        <div className="stack">
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <div className="field">
            <label className="field__label" htmlFor="doc-review-note">{review?.status === 'rejected' ? 'Note for the applicant *' : 'Note (optional)'}</label>
            <textarea id="doc-review-note" className="field__control" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder={review?.status === 'rejected' ? 'Blurry scan: the photo page is unreadable.' : ''} />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview ? `Preview: ${preview.document.type}` : ''}
        description={preview ? preview.document.name : undefined}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPreview(null)}>Close</Button>
            {preview ? <a className="btn btn--primary btn--md" href={preview.url} download={preview.document.name}>Download</a> : null}
          </>
        }
      >
        {preview?.image ? (
          <img src={preview.url} alt={preview.document.name} style={{ maxWidth: '100%', maxHeight: 460, borderRadius: 8 }} />
        ) : preview ? (
          <iframe src={preview.url} title={preview.document.name} style={{ width: '100%', height: 460, border: '1px solid var(--color-border)', borderRadius: 8 }} />
        ) : null}
      </Modal>
    </div>
  )
}
