import React, { useState, useEffect } from "react";
import {
  X,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  FileText,
  Shield,
  Zap,
} from "lucide-react";
import CountryFlagPicker from "./CountryFlagPicker";
import RichChecklistEditor from "./RichChecklistEditor";
import SampleMediaManager, { DEFAULT_SAMPLE_DOCS } from "./SampleMediaManager";

const DEFAULT_RICH_CHECKLIST = `<h3>Mandatory Requirements</h3>
<ul>
  <li><strong>Original Passport:</strong> Must have at least 6 months validity from the travel date with minimum 2 blank pages.</li>
  <li><strong>Photographs:</strong> 2 recent studio passport photos (35mm x 45mm, white background, matte finish).</li>
  <li><strong>Bank Statement & Solvency:</strong> Last 6 months bank statement with authorized seal and minimum balance BDT 150,000+.</li>
  <li><strong>Air Ticket & Hotel Booking:</strong> Return flight reservation and confirmed hotel stay.</li>
</ul>
<h3>Professional Proof</h3>
<ol>
  <li><strong>Business Owners:</strong> Trade license copy, company memo, visiting card.</li>
  <li><strong>Employees:</strong> NOC from employer, salary certificate, office ID copy.</li>
  <li><strong>Students:</strong> Student ID card copy and leave endorsement letter.</li>
</ol>
<blockquote><strong>Important:</strong> Physical passport submission required at the visa application center.</blockquote>`;

const INITIAL_FORM = {
  name: "",
  code: "",
  flag: "🌐",
  description: "",
  status: "active",
  processingMode: "eVisa (Online)",
  processingTime: "5–7 working days",
  visaType: "Tourist Visa",
  physicalPassportRequired: true,
  expressAvailable: false,
  displayOrder: 1,
  richChecklist: DEFAULT_RICH_CHECKLIST,
  sampleDocs: [...DEFAULT_SAMPLE_DOCS],
};

export default function VisaCountryFormDialog({
  open,
  country,
  positionMax = 1,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      if (country) {
        setFormData({
          id: country.id,
          name: country.name || "",
          code: country.code || "",
          flag: country.flag || "🌐",
          description: country.description || "",
          status: country.status === "paused" ? "deactive" : country.status || "active",
          processingMode: country.processingMode || "Embassy Appointment",
          processingTime: country.processingTime || "5–7 working days",
          visaType: country.visaType || "Tourist Visa",
          physicalPassportRequired: country.physicalPassportRequired ?? true,
          expressAvailable: country.expressAvailable ?? false,
          displayOrder: country.displayOrder || positionMax,
          richChecklist: country.richChecklist || DEFAULT_RICH_CHECKLIST,
          sampleDocs: country.sampleDocs && country.sampleDocs.length > 0
            ? country.sampleDocs
            : [...DEFAULT_SAMPLE_DOCS],
        });
      } else {
        setFormData({
          ...INITIAL_FORM,
          displayOrder: positionMax,
          sampleDocs: [...DEFAULT_SAMPLE_DOCS],
        });
      }
      setError(null);
    }
  }, [open, country, positionMax]);

  if (!open) return null;

  const handleCountryPick = (picked) => {
    setFormData((prev) => ({
      ...prev,
      name: picked.name,
      code: picked.code,
      flag: picked.flag,
      processingMode: picked.processingMode || prev.processingMode,
      processingTime: picked.processingTime || prev.processingTime,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please specify a country name.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave?.({
        ...(country || {}),
        ...formData,
        name: formData.name.trim(),
        code: (formData.code || "XX").toUpperCase(),
        status: formData.status === "deactive" ? "paused" : "active",
        displayOrder: Number(formData.displayOrder) || 1,
      });
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to save visa country.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/65 p-3 sm:p-5 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative my-6 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Shopify-style Top Navigation Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-2xl shadow-xs dark:bg-blue-950">
              {formData.flag || "🌐"}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {country ? `Edit Country: ${formData.name || "Visa Destination"}` : "Add Visa Country"}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    formData.status === "active"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {formData.status === "active" ? "Active" : "Deactive"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure versatile destination requirements, Google Docs decorated checklist, and sample media.
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

        {/* Scrollable Form Body (Shopify 2-Column Item Page Layout) */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">
            {error && (
              <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left / Main Column (Shopify Product Details style - 8 cols) */}
              <div className="space-y-6 lg:col-span-8">
                {/* Card 1: Country & Flag Selection */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Country & Destination Identity
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">Step 1</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Country Name with Flag <span className="text-rose-500">*</span>
                      </label>
                      <CountryFlagPicker
                        countryName={formData.name}
                        countryCode={formData.code}
                        countryFlag={formData.flag}
                        onSelectCountry={handleCountryPick}
                        onChangeName={(val) => setFormData((p) => ({ ...p, name: val }))}
                        onChangeCode={(val) => setFormData((p) => ({ ...p, code: val }))}
                        onChangeFlag={(val) => setFormData((p) => ({ ...p, flag: val }))}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Overview / Embassy Notes
                      </label>
                      <textarea
                        rows={2}
                        value={formData.description}
                        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Brief summary of visa processing, embassy notes, or appointment requirements..."
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Card 2: Google Docs Form Style Checklist */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Visa Requirements & Checklist Form
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Google Docs formatted text: decorate with Bold, Italic, Underline, Bulleted or Numbered lists.
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Rich Editor</span>
                  </div>

                  <RichChecklistEditor
                    value={formData.richChecklist}
                    onChange={(html) => setFormData((p) => ({ ...p, richChecklist: html }))}
                  />
                </div>

                {/* Card 3: Media File Sample Previews (Shopify Media Grid) */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                  <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        Media & Document Sample Previews
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Upload sample visa stickers, photo specification guides, or bank solvency templates.
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">Specimen Preview</span>
                  </div>

                  <SampleMediaManager
                    files={formData.sampleDocs}
                    onChange={(docs) => setFormData((p) => ({ ...p, sampleDocs: docs }))}
                  />
                </div>
              </div>

              {/* Right / Sidebar Column (Shopify Sidebar style - 4 cols) */}
              <div className="space-y-6 lg:col-span-4">
                {/* Status Box */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Destination Status
                  </h4>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Controls visibility in public catalog and application intake.
                  </p>

                  <div className="mt-3 space-y-2">
                    <label
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition ${
                        formData.status === "active"
                          ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Active</span>
                      </div>
                      <input
                        type="radio"
                        name="status"
                        value="active"
                        checked={formData.status === "active"}
                        onChange={() => setFormData((p) => ({ ...p, status: "active" }))}
                        className="text-emerald-600"
                      />
                    </label>

                    <label
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-xs font-medium transition ${
                        formData.status === "deactive"
                          ? "border-amber-500 bg-amber-50/70 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>Deactive / Paused</span>
                      </div>
                      <input
                        type="radio"
                        name="status"
                        value="deactive"
                        checked={formData.status === "deactive"}
                        onChange={() => setFormData((p) => ({ ...p, status: "deactive" }))}
                        className="text-amber-600"
                      />
                    </label>
                  </div>
                </div>

                {/* Processing Specs Box */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Processing Specifications
                  </h4>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Processing Mode
                    </label>
                    <select
                      value={formData.processingMode}
                      onChange={(e) => setFormData((p) => ({ ...p, processingMode: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="eVisa (Online)">eVisa (Online Portal)</option>
                      <option value="Embassy Appointment">Embassy Physical Submission</option>
                      <option value="VFS Global Appointment">VFS Global / Biometrics</option>
                      <option value="Consular Interview">Consular Interview</option>
                      <option value="Visa on Arrival">Visa on Arrival / ETA</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Standard Processing Time
                    </label>
                    <input
                      type="text"
                      value={formData.processingTime}
                      onChange={(e) => setFormData((p) => ({ ...p, processingTime: e.target.value }))}
                      placeholder="e.g. 5–7 working days"
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Primary Visa Type
                    </label>
                    <input
                      type="text"
                      value={formData.visaType}
                      onChange={(e) => setFormData((p) => ({ ...p, visaType: e.target.value }))}
                      placeholder="e.g. Tourist Visa, Business Visa"
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 shadow-2xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Physical Passport Submission
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.physicalPassportRequired}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, physicalPassportRequired: e.target.checked }))
                        }
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Express Fast-track Option
                      </span>
                      <input
                        type="checkbox"
                        checked={formData.expressAvailable}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, expressAvailable: e.target.checked }))
                        }
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Display Priority */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-950">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Catalog Display Priority
                  </h4>
                  <div className="mt-2.5">
                    <label className="mb-1 block text-xs text-slate-500">
                      Sort Position (1 = first)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.displayOrder}
                      onChange={(e) => setFormData((p) => ({ ...p, displayOrder: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 shadow-2xs outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Footer (Shopify Action Bar) */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-950">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving Country..." : country ? "Save Changes" : "Create Country"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
