import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  Download,
  ExternalLink,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Hash,
} from 'lucide-react'

/**
 * Secondary modal window for inspecting partner documents (PDF, Image, or simulated specimen).
 */
export default function DocumentPreviewModal({ open, document: doc, onClose }) {
  const [zoom, setZoom] = useState(100)
  const [blobUrl, setBlobUrl] = useState(null)
  const [blobLoading, setBlobLoading] = useState(false)

  useEffect(() => {
    if (!open || !doc) return undefined

    let active = true
    const targetUrl = doc.url || doc.storageUrl || doc.dataUrl || ''
    if (targetUrl && (targetUrl.startsWith('/api/') || targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      setBlobLoading(true)
      const token = localStorage.getItem('token') || localStorage.getItem('access_token') || sessionStorage.getItem('token') || ''
      const urlWithToken = targetUrl.includes('?') ? `${targetUrl}&token=${token}` : `${targetUrl}?token=${token}`

      fetch(urlWithToken, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error('Fetch failed')
          return res.blob()
        })
        .then((blob) => {
          if (active) {
            const objUrl = URL.createObjectURL(blob)
            setBlobUrl(objUrl)
          }
        })
        .catch(() => {
          if (active) setBlobUrl(urlWithToken)
        })
        .finally(() => {
          if (active) setBlobLoading(false)
        })
    } else {
      setBlobUrl(targetUrl)
    }

    setZoom(100)
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      active = false
      window.removeEventListener('keydown', onKeyDown, true)
    }
  }, [open, onClose, doc])

  if (!open || !doc) return null

  const fileName = doc.name || doc.fileName || 'Document'
  const previewUrl = blobUrl || doc.dataUrl || doc.url || doc.storageUrl || ''
  const isPdf = /\.pdf$/i.test(fileName) || doc.mimeType === 'application/pdf'
  const isImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(fileName) || (doc.mimeType && doc.mimeType.startsWith('image/')) || (typeof previewUrl === 'string' && previewUrl.startsWith('data:image/'))

  const handleDownload = () => {
    if (previewUrl && previewUrl.startsWith('data:')) {
      const link = window.document.createElement('a')
      link.href = previewUrl
      link.download = fileName
      link.click()
      return
    }
    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer')
      return
    }
    // Fallback: create mock blob download for demo data
    const blob = new Blob([`Simulated Document Content for: ${fileName}\nPartner: ${doc.partner || 'B2B Partner'}\nStatus: ${doc.status}`], {
      type: 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = fileName.replace(/\.[^/.]+$/, '') + '.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${fileName}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="relative flex flex-col w-full max-w-5xl h-[86vh] rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FileText className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-100 truncate">{fileName}</h3>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span className="capitalize">{String(doc.type || 'Document').replace('_', ' ')}</span>
                {doc.size ? <span>· {typeof doc.size === 'number' ? `${(doc.size / 1024).toFixed(1)} KB` : doc.size}</span> : null}
                {doc.uploadedAt ? <span>· Uploaded {doc.uploadedAt}</span> : null}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isImage && previewUrl ? (
              <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 mr-2">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <span className="px-2 text-xs font-mono text-slate-300 min-w-[48px] text-center">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition"
                  title="Zoom In"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(100)}
                  className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-slate-700 transition"
                  title="Reset Zoom"
                >
                  <Maximize2 className="size-3.5" />
                </button>
              </div>
            ) : null}

            {previewUrl ? (
              <button
                type="button"
                onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
              >
                <ExternalLink className="size-3.5" />
                Open tab
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition"
            >
              <Download className="size-3.5" />
              Download
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-1"
              aria-label="Close Preview"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-4 relative select-none">
          {previewUrl && isPdf ? (
            <iframe
              src={previewUrl}
              title={fileName}
              className="w-full h-full rounded-lg bg-white border border-slate-800"
            />
          ) : previewUrl && isImage ? (
            <div className="flex items-center justify-center min-w-full min-h-full overflow-auto p-4">
              <img
                src={previewUrl}
                alt={fileName}
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center center' }}
                className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-xl transition-transform duration-100 ease-out"
              />
            </div>
          ) : (
            /* High-fidelity simulated specimen canvas for demo / mock records without physical binary storage */
            <div className="w-full max-w-2xl bg-white text-slate-900 rounded-xl shadow-2xl p-8 border border-slate-200 relative overflow-hidden select-text my-auto">
              {/* Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
                <ShieldCheck className="size-96 text-slate-900" />
              </div>

              {/* Specimen Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-6 text-blue-600" />
                    <span className="text-xs uppercase tracking-widest font-bold text-slate-500">Government of the People's Republic</span>
                  </div>
                  <h2 className="text-xl font-black tracking-tight text-slate-900 mt-1 uppercase">
                    {String(doc.type || 'Official Document').replace('_', ' ')}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">Commercial Registration & Regulatory Compliance Department</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 text-[11px] font-mono font-bold uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    DIGITAL SPECIMEN
                  </span>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">REF: {doc.id || 'DOC-99214'}</p>
                </div>
              </div>

              {/* Specimen Body */}
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400 block">Registered Partner / Entity</span>
                  <p className="font-bold text-slate-900 text-base">{doc.partner || 'Sunrise Holidays Ltd.'}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400 block">Document Designation</span>
                  <p className="font-semibold text-slate-800">{fileName}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400 block">Registration / License No</span>
                  <p className="font-mono font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Hash className="size-3.5 text-slate-400" />
                    TRD-2026-9812-B2B
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400 block">Submission Date</span>
                  <p className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="size-3.5 text-slate-400" />
                    {doc.uploadedAt || '2026-09-13'}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400 block">Verification Status</span>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                      doc.status === 'verified'
                        ? 'bg-emerald-100 text-emerald-800'
                        : doc.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {doc.status || 'pending'}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase text-slate-400 block">File Attributes</span>
                  <p className="text-xs text-slate-600 mt-1">
                    {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '184.2 KB'} · Application/PDF · Digital Stamp
                  </p>
                </div>
              </div>

              {/* Specimen Footer Notice */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Authenticated for B2B Portal Onboarding Review</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">Dynamic Travel B2B · DocViewer v2</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
