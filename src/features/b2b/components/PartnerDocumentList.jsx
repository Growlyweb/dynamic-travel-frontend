import { useEffect, useState } from 'react'
import Modal from '../../../components/common/Modal'
import Button from '../../../components/common/Button'
import Badge from '../../../components/common/Badge'
import Input from '../../../components/common/Input'
import { b2bApi } from '../b2b.api'
import { usePermission } from '../../../hooks/usePermission'
import { PERMISSIONS } from '../../../utils/permissions'
import { errorMessage } from '../../../utils/errors'
import { formatDate } from '../../../utils/formatters'

const TONES = { verified: 'success', pending: 'warning', rejected: 'danger' }

// The business documents of one partner: view each file, verify it, or reject it with a note.
export default function PartnerDocumentList({ partner, onChanged }) {
  const { can } = usePermission()
  const canReview = can(PERMISSIONS.DOCUMENT_VERIFY)
  const canView = can(PERMISSIONS.DOCUMENT_VIEW)
  const [review, setReview] = useState(null)
  const [note, setNote] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => () => preview?.url && URL.revokeObjectURL(preview.url), [preview])

  async function submit() {
    if (review.status === 'rejected' && !note.trim()) return setError('A rejected document needs a note.')
    setBusy(true)
    setError(null)
    try {
      await b2bApi.reviewDocument(partner.id, review.document.id, { status: review.status, note: note.trim() })
      setReview(null)
      await onChanged?.()
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  async function open(document) {
    setBusy(true)
    setError(null)
    try {
      const { blob } = await b2bApi.downloadDocument(partner.id, document.id)
      setPreview({ document, url: URL.createObjectURL(blob), image: blob.type.startsWith('image/') })
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack stack--sm">
      {error && !review ? <div className="alert alert--danger">{error}</div> : null}
      {partner.documents.map((document) => (
        <div key={document.id} className="row between row--wrap" style={{ gap: 8 }}>
          <div>
            <p className="strong" style={{ margin: 0 }}>{document.typeLabel}</p>
            <p className="muted small" style={{ margin: 0 }}>{document.name} · {formatDate(document.uploadedAt)}</p>
            {document.reviewNote ? <p className="small" style={{ margin: 0 }}>Note: {document.reviewNote}</p> : null}
          </div>
          <div className="row" style={{ gap: 6 }}>
            <Badge tone={TONES[document.status] ?? 'neutral'}>{document.status}</Badge>
            {canView ? <Button size="sm" variant="ghost" onClick={() => open(document)} disabled={busy}>View</Button> : null}
            {canReview && document.status !== 'verified' ? <Button size="sm" variant="ghost" onClick={() => { setReview({ document, status: 'verified' }); setNote(''); setError(null) }}>Verify</Button> : null}
            {canReview && document.status !== 'rejected' ? <Button size="sm" variant="ghost" onClick={() => { setReview({ document, status: 'rejected' }); setNote(''); setError(null) }}>Reject</Button> : null}
          </div>
        </div>
      ))}
      {!partner.documents.length ? <p className="muted small">No documents uploaded.</p> : null}

      <Modal
        open={Boolean(review)}
        onClose={busy ? undefined : () => setReview(null)}
        title={review?.status === 'verified' ? 'Verify document' : 'Reject document'}
        description={review ? `${review.document.typeLabel}: ${review.document.name}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReview(null)} disabled={busy}>Back</Button>
            <Button variant={review?.status === 'rejected' ? 'danger' : 'primary'} onClick={submit} loading={busy}>{review?.status === 'verified' ? 'Mark verified' : 'Mark rejected'}</Button>
          </>
        }
      >
        <div className="stack">
          {error ? <div className="alert alert--danger">{error}</div> : null}
          <Input label={review?.status === 'rejected' ? 'Note for the partner *' : 'Note (optional)'} value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
      </Modal>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview ? `Preview: ${preview.document.typeLabel}` : ''}
        size="lg"
        footer={<Button variant="ghost" onClick={() => setPreview(null)}>Close</Button>}
      >
        {preview?.image ? <img src={preview.url} alt={preview.document.name} style={{ maxWidth: '100%', maxHeight: 460 }} /> : preview ? <iframe src={preview.url} title={preview.document.name} style={{ width: '100%', height: 460, border: '1px solid var(--color-border)' }} /> : null}
      </Modal>
    </div>
  )
}
