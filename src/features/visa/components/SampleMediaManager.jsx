import React, { useState } from "react";
import { FileText, Link2, Plus, Trash2, ExternalLink } from "lucide-react";

const TYPES = [
  { value: "image", label: "Image" },
  { value: "pdf", label: "PDF" },
  { value: "link", label: "Web page" },
];

const isHttp = (value) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

// Sample documents of a country: a name, a kind and a link to the file. Files cannot be uploaded here yet, so a sample
// is a link (for example to a shared drive or the embassy site).
export default function SampleMediaManager({ files = [], onChange, readOnly = false }) {
  const [draft, setDraft] = useState({ name: "", type: "image", url: "" });
  const [error, setError] = useState("");

  const add = () => {
    if (!draft.name.trim()) return setError("Give the sample a name.");
    if (!isHttp(draft.url.trim())) return setError("The link must start with http:// or https://.");
    setError("");
    onChange?.([...files, { name: draft.name.trim(), type: draft.type, url: draft.url.trim() }]);
    setDraft({ name: "", type: "image", url: "" });
  };

  const remove = (index) => onChange?.(files.filter((_, position) => position !== index));

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_120px_1.6fr_auto]">
          <input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Name, for example Visa specimen"
            className="h-9 rounded-lg border border-slate-300 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"
          />
          <select
            value={draft.type}
            onChange={(event) => setDraft({ ...draft, type: event.target.value })}
            className="h-9 rounded-lg border border-slate-300 px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            {TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <input
            value={draft.url}
            onChange={(event) => setDraft({ ...draft, url: event.target.value })}
            placeholder="https://…"
            className="h-9 rounded-lg border border-slate-300 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            type="button"
            onClick={add}
            className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {files.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {files.map((file, index) => (
            <li key={`${file.url}-${index}`} className="flex items-center gap-3 px-3 py-2.5">
              {file.type === "image" ? (
                <img src={file.url} alt="" className="h-10 w-10 rounded-md border border-slate-200 object-cover" onError={(event) => (event.currentTarget.style.display = "none")} />
              ) : (
                <FileText className="h-6 w-6 shrink-0 text-slate-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{file.name}</p>
                <a href={file.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 truncate text-[11px] text-blue-600 hover:underline">
                  <Link2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{file.url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
              {!readOnly && (
                <button type="button" onClick={() => remove(index)} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50" title="Remove sample">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800">
          No sample documents yet.
        </p>
      )}
    </div>
  );
}
