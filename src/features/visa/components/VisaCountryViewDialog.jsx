import React from "react";
import {
  X,
  Globe,
  Clock,
  FileCheck2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Pencil,
  ShieldCheck,
  Send,
  Layers,
} from "lucide-react";
import SampleMediaManager from "./SampleMediaManager";

export default function VisaCountryViewDialog({
  open,
  country,
  onClose,
  onEdit,
}) {
  if (!open || !country) return null;

  const isActive = country.status === "active";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative my-8 flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Country Banner */}
        <div className="relative border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-blue-50/40 px-6 py-5 dark:border-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                {country.flag || "🌐"}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {country.name}
                  </h2>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {country.code || "ISO"}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-1 ring-emerald-500/20"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 ring-1 ring-amber-500/20"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    />
                    {isActive ? "Active Destination" : "Deactive / Paused"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {country.description || "Configured visa destination and requirements catalog."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Specifications Pills */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-[11px] font-medium text-slate-400">Processing Mode</span>
              <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {country.processingMode || "Online eVisa / Embassy"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-[11px] font-medium text-slate-400">Processing Time</span>
              <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {country.processingTime || "5–7 working days"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-[11px] font-medium text-slate-400">Physical Passport</span>
              <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {country.physicalPassportRequired ? "Required" : "Digital Only"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-slate-800 dark:bg-slate-900/80">
              <span className="text-[11px] font-medium text-slate-400">Express Service</span>
              <p className="mt-0.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                {country.expressAvailable ? "Available" : "Standard"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5 space-y-6">
          {/* Section: Google Docs Styled Visa Checklist Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Visa Requirements & Checklist Form
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Google Docs Decorated Format
              </span>
            </div>

            {country.richChecklist ? (
              <div
                className="checklist-rendered-content text-sm leading-relaxed text-slate-800 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: country.richChecklist }}
              />
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No custom rich text checklist configured for this destination yet.
              </div>
            )}
          </div>

          {/* Section: Sample Media & Documents Previews */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Sample Media & Document Previews
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {(country.sampleDocs || []).length} Sample(s)
              </span>
            </div>

            <SampleMediaManager files={country.sampleDocs || []} readOnly={true} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3.5 dark:border-slate-800 dark:bg-slate-950">
          <span className="text-xs text-slate-500">
            Last updated destination specifications
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit?.(country);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Country</span>
            </button>
          </div>
        </div>
      </div>

      {/* Styled Checklist HTML Renderer rules */}
      <style>{`
        .checklist-rendered-content h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .dark .checklist-rendered-content h2 {
          color: #f8fafc;
        }
        .checklist-rendered-content h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-top: 0.85rem;
          margin-bottom: 0.35rem;
        }
        .dark .checklist-rendered-content h3 {
          color: #e2e8f0;
        }
        .checklist-rendered-content p {
          margin: 0.35rem 0;
          line-height: 1.6;
        }
        .checklist-rendered-content ul {
          list-style-type: disc;
          padding-left: 1.35rem;
          margin: 0.4rem 0;
        }
        .checklist-rendered-content ol {
          list-style-type: decimal;
          padding-left: 1.35rem;
          margin: 0.4rem 0;
        }
        .checklist-rendered-content li {
          margin-bottom: 0.35rem;
          line-height: 1.5;
        }
        .checklist-rendered-content blockquote {
          border-left: 3px solid #3b82f6;
          background-color: #f1f5f9;
          padding: 0.5rem 0.85rem;
          margin: 0.65rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #475569;
          font-style: italic;
        }
        .dark .checklist-rendered-content blockquote {
          background-color: #0f172a;
          border-left-color: #60a5fa;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
