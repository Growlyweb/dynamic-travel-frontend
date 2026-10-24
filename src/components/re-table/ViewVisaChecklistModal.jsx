import React from 'react';
import { X, FileText, Clock, Hash, CheckCircle2, Pencil } from 'lucide-react';
import TableCountryCell from './TableCountryCell';
import TableBadge from './TableBadge';

/**
 * ViewVisaChecklistModal Component
 * Humanized, clean view modal for Visa Checklist details without unnecessary extra colors.
 * Displays:
 * - Country Name: China | Tourist (Sticker)
 * - Code: VI0005
 * - Visa Requirement list
 * - Terms & Conditions
 * - Processing time
 * - B2B Price
 */
export function ViewVisaChecklistModal({
  open = false,
  item = null,
  onClose,
  onEdit,
}) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl sm:max-w-3xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Visa Check List
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Code: {item.code || 'VI0005'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-0.5 leading-tight">
                {item.title || `${item.country} Visa Document Checklist`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Country Name:{' '}
                <span className="text-slate-800 font-semibold">{item.country}</span> |{' '}
                <span className="text-slate-800 font-semibold">
                  {item.visaType || 'Tourist (Sticker)'}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[calc(85vh-140px)] overflow-y-auto">
          {/* Metadata Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <div>
              <span className="block text-slate-400 font-medium mb-1">Country</span>
              <TableCountryCell
                name={item.country}
                code={item.countryCode}
                flag={item.flag}
              />
            </div>
            <div>
              <span className="block text-slate-400 font-medium mb-1">Visa Type</span>
              <TableBadge
                type="pill"
                variant={
                  item.visaType?.toLowerCase()?.includes('multiple') ? 'blue' : 'gray'
                }
              >
                {item.visaType}
              </TableBadge>
            </div>
            <div>
              <span className="block text-slate-400 font-medium mb-1">Status</span>
              <TableBadge
                type="status"
                variant={item.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}
              >
                {item.status || 'Active'}
              </TableBadge>
            </div>
            <div>
              <span className="block text-slate-400 font-medium mb-1">Processing Time</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {item.processingTime || '15 day (+ -)'}
              </span>
            </div>
          </div>

          {/* Checklist Requirements Content (Rendered from Tiptap HTML) */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Checklist Description & Requirements
            </h3>
            <div className="checklist-rendered-content rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-800 leading-relaxed shadow-2xs">
              {item.description ? (
                <div
                  dangerouslySetInnerHTML={{ __html: item.description }}
                  className="tiptap-html-output"
                />
              ) : (
                <p className="text-slate-400 italic">No checklist description provided.</p>
              )}
            </div>
          </div>

          {/* Media Attachments (if available) */}
          {Array.isArray(item.media) && item.media.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Attached Media & Samples ({item.media.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {item.media.map((med, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-2 flex flex-col items-center text-center"
                  >
                    {med.url ? (
                      <img
                        src={med.url}
                        alt={med.name || 'Sample'}
                        className="h-20 w-full object-cover rounded mb-2 border border-slate-100"
                      />
                    ) : (
                      <div className="h-20 w-full rounded bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <FileText className="w-6 h-6" />
                      </div>
                    )}
                    <span className="text-xs font-medium text-slate-700 truncate w-full">
                      {med.name || `Document ${idx + 1}`}
                    </span>
                    {med.size && (
                      <span className="text-[10px] text-slate-400">{med.size}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span>Display Order: #{item.displayOrder || 1}</span>
            <span>Created: {item.createdDate || 'Recent'}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-2xs"
          >
            Close
          </button>

          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-xs"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Check List</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded CSS for Humanized Typography */}
      <style>{`
        .tiptap-html-output h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          padding-bottom: 0.25rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .tiptap-html-output h3:first-child {
          margin-top: 0;
        }
        .tiptap-html-output p {
          margin: 0.5rem 0;
          color: #334155;
          line-height: 1.6;
        }
        .tiptap-html-output ul {
          list-style-type: disc;
          padding-left: 1.4rem;
          margin: 0.5rem 0 1rem;
        }
        .tiptap-html-output ol {
          list-style-type: decimal;
          padding-left: 1.4rem;
          margin: 0.5rem 0 1rem;
        }
        .tiptap-html-output li {
          margin-bottom: 0.35rem;
          line-height: 1.55;
          color: #334155;
        }
        .tiptap-html-output strong {
          color: #0f172a;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

export default ViewVisaChecklistModal;
