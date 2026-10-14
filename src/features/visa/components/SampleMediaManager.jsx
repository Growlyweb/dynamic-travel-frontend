import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Eye,
  Trash2,
  Download,
  X,
  FileCheck,
  Sparkles,
} from "lucide-react";

// Pre-seeded SVG data URLs so every country can have rich sample previews out of the box!
const VISA_SAMPLE_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380" fill="none"><rect width="600" height="380" rx="16" fill="%23F8FAFC"/><rect x="10" y="10" width="580" height="360" rx="12" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><rect x="24" y="24" width="552" height="56" rx="8" fill="%23EFF6FF"/><text x="40" y="58" font-family="system-ui, sans-serif" font-size="18" font-weight="700" fill="%231E40AF">OFFICIAL VISA SPECIMEN / SAMPLE</text><rect x="40" y="100" width="110" height="140" rx="8" fill="%23E2E8F0"/><circle cx="95" cy="145" r="28" fill="%23CBD5E1"/><path d="M55 215 C55 180 135 180 135 215 Z" fill="%23CBD5E1"/><text x="170" y="125" font-family="sans-serif" font-size="14" font-weight="600" fill="%23334155">VISA NO: V-8892104-B</text><text x="170" y="150" font-family="sans-serif" font-size="13" fill="%2364748B">TYPE: TOURIST / MULTIPLE ENTRY</text><text x="170" y="175" font-family="sans-serif" font-size="13" fill="%2364748B">VALIDITY: 90 DAYS FROM ISSUE</text><text x="170" y="200" font-family="sans-serif" font-size="13" fill="%2364748B">ISSUED AT: EMBASSY CONSULAR SECTION</text><rect x="40" y="260" width="520" height="80" rx="6" fill="%23F1F5F9"/><text x="56" y="295" font-family="monospace" font-size="14" fill="%23475569">V&lt;SPECIMEN&lt;&lt;JOHN&lt;DOE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text><text x="56" y="320" font-family="monospace" font-size="14" fill="%23475569">A123456784BGD9501018M3010150&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;04</text></svg>`;

const PHOTO_SPEC_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400" fill="none"><rect width="500" height="400" rx="16" fill="%23FFFFFF" stroke="%23E2E8F0" stroke-width="2"/><text x="30" y="44" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="%230F172A">PHOTOGRAPH SPECIFICATION (35mm x 45mm)</text><rect x="50" y="75" width="180" height="240" rx="8" fill="%23F8FAFC" stroke="%233B82F6" stroke-width="2" stroke-dasharray="4 4"/><circle cx="140" cy="155" r="45" fill="%23DBEAFE"/><path d="M85 270 C85 210 195 210 195 270 Z" fill="%2393C5FD"/><text x="260" y="110" font-family="sans-serif" font-size="13" font-weight="600" fill="%231E293B">✓ 35mm Width x 45mm Height</text><text x="260" y="140" font-family="sans-serif" font-size="13" font-weight="600" fill="%231E293B">✓ 70%–80% Face Coverage</text><text x="260" y="170" font-family="sans-serif" font-size="13" font-weight="600" fill="%231E293B">✓ Pure White Background</text><text x="260" y="200" font-family="sans-serif" font-size="13" font-weight="600" fill="%231E293B">✓ Matte / Semi-matte Finish</text><text x="260" y="230" font-family="sans-serif" font-size="13" font-weight="600" fill="%231E293B">✓ Neutral Expression, No Teeth</text><text x="260" y="260" font-family="sans-serif" font-size="13" font-weight="600" fill="%23DC2626">✗ No Eyeglasses or Caps</text><text x="50" y="340" font-family="sans-serif" font-size="12" fill="%2364748B">Taken within the last 3 months. Color printed on photo paper.</text></svg>`;

export const DEFAULT_SAMPLE_DOCS = [
  {
    id: "doc_sample_visa",
    title: "Official Visa Sticker / eVisa Copy",
    type: "image",
    category: "Visa Specimen",
    size: "420 KB",
    previewUrl: VISA_SAMPLE_IMAGE,
    description: "Specimen format of issued visa showing entry conditions and seal.",
  },
  {
    id: "doc_sample_photo",
    title: "Biometric Photo Specification Guide",
    type: "image",
    category: "Photo Guideline",
    size: "280 KB",
    previewUrl: PHOTO_SPEC_IMAGE,
    description: "Required dimensions (35x45mm) with white background rule.",
  },
];

export default function SampleMediaManager({
  files = [],
  onChange,
  readOnly = false,
}) {
  const [previewModalItem, setPreviewModalItem] = useState(null);

  const handleFileUpload = (event) => {
    const uploaded = Array.from(event.target.files || []);
    if (!uploaded.length) return;

    uploaded.forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith("image/");
      reader.onload = (e) => {
        const newDoc = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          type: isImg ? "image" : "pdf",
          category: isImg ? "Sample Image" : "Document PDF",
          size: `${(file.size / 1024).toFixed(1)} KB`,
          previewUrl: e.target.result,
          fileName: file.name,
          description: "Uploaded sample reference file.",
        };
        onChange?.([...(files || []), newDoc]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    event.target.value = "";
  };

  const removeFile = (id) => {
    onChange?.(files.filter((item) => item.id !== id));
  };

  const addPreset = (preset) => {
    if (files.some((f) => f.title === preset.title)) return;
    onChange?.([...files, { ...preset, id: `doc_${Date.now()}` }]);
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone (Shopify-style Media Dropzone) */}
      {!readOnly && (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
              <UploadCloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Upload Sample Document / Image</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <span className="text-xs text-slate-400">or insert preset:</span>

            <button
              type="button"
              onClick={() => addPreset(DEFAULT_SAMPLE_DOCS[0])}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Sparkles className="h-3 w-3 text-amber-500" />
              Visa Sample
            </button>
            <button
              type="button"
              onClick={() => addPreset(DEFAULT_SAMPLE_DOCS[1])}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Sparkles className="h-3 w-3 text-blue-500" />
              Photo Guide
            </button>
          </div>
        </div>
      )}

      {/* Media Previews Grid */}
      {files && files.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            >
              {/* Thumbnail Container */}
              <div
                onClick={() => setPreviewModalItem(file)}
                className="relative flex h-36 w-full cursor-pointer items-center justify-center overflow-hidden bg-slate-100 transition group-hover:opacity-95 dark:bg-slate-950"
              >
                {file.previewUrl ? (
                  <img
                    src={file.previewUrl}
                    alt={file.title}
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <FileText className="h-10 w-10 text-slate-500" />
                    <span className="text-xs font-medium uppercase tracking-wider">
                      {file.type}
                    </span>
                  </div>
                )}

                {/* Hover overlay with preview icon */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-md">
                    <Eye className="h-3.5 w-3.5" /> Preview Sample
                  </span>
                </div>
              </div>

              {/* Card Meta & Actions */}
              <div className="flex flex-1 flex-col justify-between p-3">
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {file.category || "Sample Document"}
                    </span>
                    <span className="text-[11px] text-slate-400">{file.size}</span>
                  </div>
                  <h4 className="mt-1 line-clamp-1 text-xs font-semibold text-slate-800 dark:text-slate-100" title={file.title}>
                    {file.title}
                  </h4>
                  {file.description && (
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {file.description}
                    </p>
                  )}
                </div>

                <div className="mt-2.5 flex items-center justify-end gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewModalItem(file)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    title="View sample"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View</span>
                  </button>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      title="Remove sample"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <ImageIcon className="h-8 w-8 text-slate-400" />
          <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            No sample document previews attached
          </p>
          <p className="text-[11px] text-slate-400">
            Upload sample visas, bank solvency format, or photo guide for reference.
          </p>
        </div>
      )}

      {/* Backdrop Lightbox / Sample Preview Modal */}
      {previewModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in-0 duration-150">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCheck className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {previewModalItem.title}
                  </h3>
                  <span className="text-xs text-slate-500">
                    {previewModalItem.category} · {previewModalItem.size}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Media Content Preview */}
            <div className="flex flex-1 items-center justify-center overflow-auto bg-slate-100 p-6 dark:bg-slate-950">
              {previewModalItem.previewUrl ? (
                <img
                  src={previewModalItem.previewUrl}
                  alt={previewModalItem.title}
                  className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
                  <FileText className="h-16 w-16 text-slate-400" />
                  <p className="text-sm">Document preview available on download</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950">
              <span className="text-xs text-slate-500">
                {previewModalItem.description || "Official sample specimen"}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalItem(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
