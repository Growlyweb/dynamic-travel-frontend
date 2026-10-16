import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Save,
  ChevronDown,
} from 'lucide-react';
import CountrySelect from './CountrySelect';
import RichTextEditor from './RichTextEditor';
import MediaManager, { DEFAULT_CHECKLIST_MEDIA } from './MediaManager';

const DEFAULT_DESCRIPTION = `<p>Please prepare the following documents for China Tourist Visa application. All documents must be clear, valid and updated.</p>`;

/**
 * AddVisaChecklistModal Component
 * Implements the modal popup from the reference image:
 * - Country picker using RestCountries/FlagCDN API
 * - Text decoration using TipTap rich text library
 * - Media/Images dropzone & thumbnail cards
 * - Display order & form controls
 */
export function AddVisaChecklistModal({
  open = false,
  initialData = null,
  onClose,
  onSave,
}) {
  const [formData, setFormData] = useState({
    country: 'China',
    countryCode: 'CN',
    visaType: 'Multiple',
    title: 'China Tourist Visa Document Check List',
    description: DEFAULT_DESCRIPTION,
    media: DEFAULT_CHECKLIST_MEDIA,
    displayOrder: 1,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          country: initialData.country || 'China',
          countryCode: initialData.countryCode || 'CN',
          visaType: initialData.visaType || 'Multiple',
          title: initialData.title || '',
          description: initialData.description || DEFAULT_DESCRIPTION,
          media: initialData.media || DEFAULT_CHECKLIST_MEDIA,
          displayOrder: initialData.displayOrder || 1,
        });
      } else {
        setFormData({
          country: 'China',
          countryCode: 'CN',
          visaType: 'Multiple',
          title: 'China Tourist Visa Document Check List',
          description: DEFAULT_DESCRIPTION,
          media: DEFAULT_CHECKLIST_MEDIA,
          displayOrder: 1,
        });
      }
    }
  }, [open, initialData]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    setTimeout(() => {
      onSave?.({
        ...formData,
        id: initialData?.id || Date.now(),
        status: initialData?.status || 'Active',
        createdDate: initialData?.createdDate || new Date().toISOString().split('T')[0],
      });
      setSaving(false);
      onClose?.();
    }, 250);
  };

  const handleCountryChange = (selectedCountry) => {
    setFormData((prev) => ({
      ...prev,
      country: selectedCountry.name,
      countryCode: selectedCountry.code,
      title: `${selectedCountry.name} Tourist Visa Document Check List`,
      description: `<p>Please prepare the following documents for ${selectedCountry.name} Tourist Visa application. All documents must be clear, valid and updated.</p>`,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-3xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header matching reference screenshot */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Add Visa Check List
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                Create a new visa checklist with required documents
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(88vh-130px)] overflow-y-auto">
          {/* Row 1: Country & Visa Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Country <span className="text-rose-500">*</span>
              </label>
              <CountrySelect
                value={formData.country}
                countryCode={formData.countryCode}
                onChange={handleCountryChange}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Visa Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.visaType}
                  onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
                  className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs pr-9 cursor-pointer"
                >
                  <option value="Multiple">Multiple</option>
                  <option value="Single">Single</option>
                  <option value="Transit">Transit</option>
                  <option value="Business">Business</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. China Tourist Visa Document Check List"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
            />
          </div>

          {/* Row 3: Description with Rich Text Editor */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Description <span className="text-rose-500">*</span>
            </label>
            <RichTextEditor
              value={formData.description}
              onChange={(html) => setFormData({ ...formData, description: html })}
            />
          </div>

          {/* Row 4: Media / Images */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Media / Images
            </label>
            <MediaManager
              mediaList={formData.media}
              onChange={(list) => setFormData({ ...formData, media: list })}
            />
          </div>

          {/* Row 5: Display Order */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Display Order <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                required
                value={formData.displayOrder}
                onChange={(e) =>
                  setFormData({ ...formData, displayOrder: Number(e.target.value) || 1 })
                }
                className="w-24 px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
              />
              <span className="text-xs sm:text-sm text-slate-400">
                Set the order position for this checklist
              </span>
            </div>
          </div>

          {/* Modal Footer matching reference screenshot */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 font-semibold text-sm transition-colors shadow-2xs"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0066FF] hover:bg-[#0055D6] active:bg-[#0047B3] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Check List'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddVisaChecklistModal;
