import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, FileText, Plus, Trash2, X } from 'lucide-react'
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
    <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <FileText className="size-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Application Documents</h3>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
            {application.documents.length}
          </span>
        </div>
        {canEdit ? (
          <Button
            size="sm"
            onClick={openUpload}
            className="h-8 gap-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs text-xs"
          >
            <Plus className="size-3.5" />
            Add file
          </Button>
        ) : null}
      </div>

      {error && !uploadOpen && !review ? <div className="alert alert--danger mt-2">{error}</div> : null}

      {application.documents.length > 0 ? (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-slate-50/30 overflow-hidden">
          {application.documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 transition-colors hover:bg-white"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate">{document.type}</p>
                    <Badge tone={DOC_TONES[document.status] ?? 'neutral'}>{document.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">{document.name}</span>
                    <span className="mx-1 text-slate-300">·</span>
                    <span>{fileSize(document.size)}</span>
                    <span className="mx-1 text-slate-300">·</span>
                    <span>{formatDate(document.uploadedAt)}</span>
                    <span className="mx-1 text-slate-300">·</span>
                    <span>{document.uploadedBy || 'applicant'}</span>
                  </p>
                  {document.reviewNote ? (
                    <p className="mt-1 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-2 py-0.5 inline-block">
                      Note: {document.reviewNote}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Action buttons toolbar */}
              <div className="flex items-center flex-wrap gap-1.5 shrink-0 self-end sm:self-center">
                {canView ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openPreview(document)}
                    disabled={busy}
                    className="h-7.5 px-2.5 text-xs text-slate-700 hover:bg-slate-100 border border-slate-200/80 gap-1"
                  >
                    <Eye className="size-3.5" />
                    View
                  </Button>
                ) : null}
                {canReview && document.status !== 'verified' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setReview({ document, status: 'verified' }); setNote(''); setError(null) }}
                    className="h-7.5 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1"
                  >
                    <Check className="size-3.5" />
                    Verify
                  </Button>
                ) : null}
                {canReview && document.status !== 'rejected' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setReview({ document, status: 'rejected' }); setNote(''); setError(null) }}
                    className="h-7.5 px-2.5 text-xs text-amber-700 hover:bg-amber-50 border border-amber-200 gap-1"
                  >
                    <X className="size-3.5" />
                    Reject
                  </Button>
                ) : null}
                {canEdit ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => run(() => visaApi.removeDocument(application.id, document.id), 'File deleted.')}
                    disabled={busy}
                    className="h-7.5 px-2 text-xs text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                    title="Delete document"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
          No documents uploaded yet.
        </div>
      )}

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
