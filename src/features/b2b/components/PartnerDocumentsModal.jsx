import { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  FileCheck2,
  FileX2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  X,
  Loader2,
  ShieldCheck,
  Check,
} from 'lucide-react'
import { b2bApi } from '../b2b.api'
import DocumentPreviewModal from './DocumentPreviewModal'
import Badge from '../../../components/common/Badge'
import { formatDate } from '../../../utils/formatters'

const STATUS_TONES = {
  verified: 'success',
  pending: 'warning',
  rejected: 'danger',
}

export default function PartnerDocumentsModal({ open, partner, onClose, onPartnerUpdated }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [rejectingDocId, setRejectingDocId] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [approving, setApproving] = useState(false)

  const loadDocs = useCallback(async () => {
    if (!partner?.id) return
    setLoading(true)
    setError('')
    try {
      const docs = await b2bApi.getPartnerDocuments(partner.id)
      const list = Array.isArray(docs) ? docs : (docs?.items || [])
      setDocuments(list)
    } catch (err) {
      setError(err?.message || 'Could not load partner documents.')
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [partner?.id])

  useEffect(() => {
    if (open && partner?.id) {
      loadDocs()
      setRejectingDocId(null)
      setRejectionReason('')
      setPreviewDoc(null)
    }
  }, [open, partner?.id, loadDocs])

  // ESC key handler for closing the main modal only when preview modal is not active
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !previewDoc) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose, previewDoc])

  if (!open || !partner) return null

  const safeDocs = Array.isArray(documents) ? documents : []
  const verifiedCount = safeDocs.filter((d) => d.status === 'verified').length
  const totalCount = safeDocs.length
  const allVerified = totalCount > 0 && verifiedCount === totalCount

  const handleVerify = async (docId) => {
    setActionLoadingId(docId)
    setError('')
    try {
      await b2bApi.verifyDocument(docId, partner?.id)
      await loadDocs()
      onPartnerUpdated?.()
    } catch (err) {
      setError(err?.message || 'Failed to verify document.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleStartReject = (docId) => {
    setRejectingDocId(docId)
    setRejectionReason('')
  }

  const handleCancelReject = () => {
    setRejectingDocId(null)
    setRejectionReason('')
  }

  const handleConfirmReject = async (docId) => {
    setActionLoadingId(docId)
    setError('')
    try {
      await b2bApi.rejectDocument(docId, rejectionReason.trim(), partner?.id)
      setRejectingDocId(null)
      setRejectionReason('')
      await loadDocs()
      onPartnerUpdated?.()
    } catch (err) {
      setError(err?.message || 'Failed to reject document.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleApprovePartner = async () => {
    setApproving(true)
    setError('')
    try {
      await b2bApi.setApplicationStatus(partner.id, 'approved')
      onPartnerUpdated?.()
      onClose?.()
    } catch (err) {
      setError(err?.message || 'Failed to approve partner.')
      setApproving(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Partner Document Review"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !previewDoc) onClose?.()
      }}
    >
      <div className="relative flex flex-col w-[860px] max-w-[95vw] h-[660px] max-h-[88vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Fixed Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#2F80ED] border border-blue-100">
                <Building2 className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-slate-900 truncate">{partner.company}</h2>
                  <Badge tone={allVerified ? 'success' : STATUS_TONES[partner.status] ?? 'warning'}>
                    {allVerified ? 'All documents verified' : `${verifiedCount}/${totalCount} verified`}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-slate-700">{partner.contact || partner.name}</span>
                  </span>
                  {partner.email ? (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Mail className="size-3" />
                      {partner.email}
                    </span>
                  ) : null}
                  {partner.phone ? (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Phone className="size-3" />
                      {partner.phone}
                    </span>
                  ) : null}
                  {partner.country ? (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Globe className="size-3" />
                      {partner.country}
                    </span>
                  ) : null}
                  {partner.submittedAt ? (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="size-3" />
                      Submitted {formatDate(partner.submittedAt)}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {error ? (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-800">
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        {/* Scrollable Document List Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Submitted Documents ({safeDocs.length})
            </span>
            <span className="text-xs text-slate-500">
              Review and verify each document to approve this application
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-slate-500">
              <Loader2 className="size-6 animate-spin text-[#2F80ED]" />
              <p className="text-xs font-medium">Loading partner documents…</p>
            </div>
          ) : safeDocs.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              <FileX2 className="size-8 mx-auto text-slate-400 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No documents uploaded</p>
              <p className="text-xs text-slate-400 mt-1">This partner application does not have any attached files.</p>
            </div>
          ) : (
            safeDocs.map((doc) => {
              const isActionLoading = actionLoadingId === doc.id
              const isRejecting = rejectingDocId === doc.id
              const isVerified = doc.status === 'verified'
              const isRejected = doc.status === 'rejected'

              return (
                <div
                  key={doc.id}
                  className={`rounded-xl border p-4 transition-all bg-white shadow-xs ${
                    isVerified
                      ? 'border-emerald-200 bg-emerald-50/15'
                      : isRejected
                      ? 'border-rose-200 bg-rose-50/15'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Document Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`grid size-10 shrink-0 place-items-center rounded-xl border ${
                          isVerified
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : isRejected
                            ? 'bg-rose-50 text-rose-600 border-rose-100'
                            : 'bg-blue-50 text-blue-600 border-blue-100'
                        }`}
                      >
                        {isVerified ? (
                          <FileCheck2 className="size-5" />
                        ) : isRejected ? (
                          <FileX2 className="size-5" />
                        ) : (
                          <FileText className="size-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {doc.name || doc.fileName}
                          </p>
                          <Badge tone={STATUS_TONES[doc.status] ?? 'neutral'}>
                            {doc.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-0.5 text-xs text-slate-500">
                          <span className="capitalize font-medium text-slate-600">
                            {String(doc.type || 'Document').replace('_', ' ')}
                          </span>
                          <span>·</span>
                          <span>{doc.size ? (typeof doc.size === 'number' ? `${(doc.size / 1024).toFixed(1)} KB` : doc.size) : 'PDF'}</span>
                          {doc.uploadedAt ? (
                            <>
                              <span>·</span>
                              <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for Document */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* VIEW BUTTON */}
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        <Eye className="size-3.5 text-slate-600" />
                        View
                      </button>

                      {/* VERIFY BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleVerify(doc.id)}
                        disabled={isActionLoading || isVerified}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                          isVerified
                            ? 'bg-emerald-100 text-emerald-800 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        }`}
                      >
                        {isActionLoading && !isRejecting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : isVerified ? (
                          <Check className="size-3.5" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {isVerified ? 'Verified' : 'Verify'}
                      </button>

                      {/* REJECT BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleStartReject(doc.id)}
                        disabled={isActionLoading}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                          isRejected
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        }`}
                      >
                        <XCircle className="size-3.5" />
                        {isRejected ? 'Rejected' : 'Reject'}
                      </button>
                    </div>
                  </div>

                  {/* Display existing rejection note if rejected */}
                  {isRejected && (doc.rejectionReason || doc.reviewNote) && !isRejecting ? (
                    <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                      <AlertCircle className="size-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold">Rejection reason:</span>{' '}
                        <span>{doc.rejectionReason || doc.reviewNote}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Inline Rejection Reason Form */}
                  {isRejecting ? (
                    <div className="mt-3 p-3 rounded-xl bg-rose-50/80 border border-rose-200 space-y-2 animate-in fade-in-50 duration-150">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                          <AlertCircle className="size-3.5 text-rose-600" />
                          Provide reason for document rejection
                        </label>
                        <span className="text-[11px] text-rose-500">Optional but recommended</span>
                      </div>
                      <input
                        type="text"
                        autoFocus
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="e.g. License expired, blurred photo, illegible seal, or missing page…"
                        className="w-full text-xs h-8 px-2.5 bg-white border border-rose-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 placeholder:text-slate-400"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleConfirmReject(doc.id)
                          if (e.key === 'Escape') handleCancelReject()
                        }}
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCancelReject}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmReject(doc.id)}
                          disabled={isActionLoading}
                          className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-md transition flex items-center gap-1.5"
                        >
                          {isActionLoading ? <Loader2 className="size-3 animate-spin" /> : null}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            {allVerified ? (
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="size-4 text-emerald-600" />
                All {totalCount} documents verified! Application is ready for approval.
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-slate-400" />
                {verifiedCount} of {totalCount} documents verified. Verify all to approve.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition"
            >
              Close
            </button>

            {partner.status !== 'approved' ? (
              <button
                type="button"
                onClick={handleApprovePartner}
                disabled={!allVerified || approving}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition ${
                  allVerified
                    ? 'bg-[#2F80ED] hover:bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
                title={!allVerified ? 'All documents must be verified first' : 'Activate partner portal'}
              >
                {approving ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                Approve Partner
              </button>
            ) : null}
          </div>
        </div>

        {/* Secondary Document Viewer Modal Window */}
        <DocumentPreviewModal
          open={Boolean(previewDoc)}
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      </div>
    </div>,
    document.body,
  )
}
