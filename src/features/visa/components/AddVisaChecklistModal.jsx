import React, { useEffect, useMemo, useState } from 'react';
import { X, FileText, Save, ChevronDown, AlertTriangle } from 'lucide-react';
import { CountrySelect, RichTextEditor } from '../../../components/re-table';
import SampleMediaManager from './SampleMediaManager';
import { errorMessage, fieldErrors } from '../../../utils/errors';

const inputClass = (error) =>
  `w-full px-3.5 py-2.5 text-sm border rounded-lg text-slate-800 focus:outline-none focus:ring-2 transition-all shadow-2xs ${
    error ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'
  }`;

const titleFor = (country, type) => [country, type, 'Document Check List'].filter(Boolean).join(' ');

/**
 * AddVisaChecklistModal Component
 * Adds or edits a "Visa Check List" page:
 * - Country picker (only the countries of the visa catalog) and the visa type of that country
 * - Title, and the description written with the rich text editor
 * - Sample links, display order and status
 * The country and the visa type are chosen once: an existing page keeps them.
 */
export function AddVisaChecklistModal({ open = false, initialData = null, countries = [], types = [], onClose, onSave }) {
  const editing = Boolean(initialData);
  const [formData, setFormData] = useState({ countryId: '', visaTypeId: '', title: '', description: '', media: [], displayOrder: 1, status: 'active' });
  const [titleEdited, setTitleEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const country = countries.find((item) => item.id === formData.countryId);
  const countryTypes = useMemo(() => types.filter((type) => type.countryId === formData.countryId), [types, formData.countryId]);
  const type = types.find((item) => item.id === formData.visaTypeId);
  // The picker lists the catalog countries by their ISO code, so it shows the same flags and search as everywhere else.
  const allowedCodes = useMemo(() => countries.map((item) => (item.code || '').toUpperCase()), [countries]);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setFormError(null);
    setTitleEdited(editing);
    if (initialData) {
      setFormData({
        countryId: initialData.countryId,
        visaTypeId: initialData.visaTypeId,
        title: initialData.title || '',
        description: initialData.description || '',
        media: initialData.media ?? [],
        displayOrder: initialData.displayOrder || 1,
        status: initialData.status || 'active',
      });
      return;
    }
    const first = countries[0];
    const firstType = types.find((item) => item.countryId === first?.id);
    setFormData({
      countryId: first?.id ?? '',
      visaTypeId: firstType?.id ?? '',
      title: titleFor(first?.name, firstType?.name),
      description: '',
      media: [],
      displayOrder: 1,
      status: 'active',
    });
    // The lists load before the dialog can be opened, and a reload while it is open must not wipe what was typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData]);

  if (!open) return null;

  const set = (patch) => {
    setFormData((current) => ({ ...current, ...patch }));
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !(key in patch))));
  };

  const handleCountryChange = (selected) => {
    const next = countries.find((item) => (item.code || '').toUpperCase() === selected.code.toUpperCase() || item.name.toLowerCase() === selected.name.toLowerCase());
    if (!next) return;
    const first = types.find((item) => item.countryId === next.id);
    set({ countryId: next.id, visaTypeId: first?.id ?? '', ...(titleEdited ? {} : { title: titleFor(next.name, first?.name) }) });
  };

  const handleTypeChange = (visaTypeId) => {
    const next = types.find((item) => item.id === visaTypeId);
    set({ visaTypeId, ...(titleEdited ? {} : { title: titleFor(country?.name, next?.name) }) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!formData.countryId) found.countryId = 'Please choose a country';
    if (!formData.visaTypeId) found.visaTypeId = 'This country has no visa type yet. Add one on the Visa types page.';
    if (!formData.title.trim()) found.title = 'Please enter a title';
    if (Object.keys(found).length) return setErrors(found);

    setSaving(true);
    setFormError(null);
    try {
      await onSave?.({
        id: initialData?.id,
        countryId: formData.countryId,
        visaTypeId: formData.visaTypeId,
        title: formData.title.trim(),
        description: formData.description,
        processingTime: initialData ? initialData.processingTime : undefined,
        media: formData.media,
        displayOrder: formData.displayOrder,
        status: formData.status,
      });
      onClose?.();
    } catch (error) {
      setErrors(fieldErrors(error));
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div role="dialog" aria-modal="true" aria-labelledby="visa-checklist-title" className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-3xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="visa-checklist-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {editing ? 'Edit Visa Check List' : 'Add Visa Check List'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                {editing ? 'Change the visa checklist and its required documents' : 'Create a new visa checklist with required documents'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close modal"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 max-h-[calc(88vh-130px)] overflow-y-auto">
          {formError && (
            <div role="alert" className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Country <span className="text-rose-500">*</span>
              </label>
              {editing ? (
                <div className={`${inputClass(false)} bg-slate-50 text-slate-600 cursor-not-allowed`}>{country?.name ?? initialData.countryName}</div>
              ) : (
                <CountrySelect value={country?.name ?? ''} countryCode={country?.code} allowedCodes={allowedCodes} onChange={handleCountryChange} />
              )}
              {errors.countryId && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.countryId}</span>}
            </div>

            <div>
              <label htmlFor="visa-checklist-type" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Visa Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  id="visa-checklist-type"
                  value={formData.visaTypeId}
                  disabled={editing || countryTypes.length === 0}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className={`appearance-none ${inputClass(errors.visaTypeId)} font-medium pr-9 ${editing || countryTypes.length === 0 ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : 'bg-white cursor-pointer'}`}
                >
                  {countryTypes.length === 0 && <option value="">No visa type yet</option>}
                  {(editing && !type ? [{ id: formData.visaTypeId, name: initialData.visaTypeName }] : countryTypes).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
              {errors.visaTypeId && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.visaTypeId}</span>}
            </div>
          </div>

          <div>
            <label htmlFor="visa-checklist-name" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              id="visa-checklist-name"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setTitleEdited(true);
                set({ title: e.target.value });
              }}
              placeholder="e.g. China Tourist Visa Document Check List"
              className={inputClass(errors.title)}
            />
            {errors.title && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.title}</span>}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Description</label>
            <RichTextEditor value={formData.description} onChange={(html) => set({ description: html })} />
            {errors.description && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.description}</span>}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Media / Images</label>
            <SampleMediaManager files={formData.media} onChange={(list) => set({ media: list })} />
            {errors.media && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.media}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="visa-checklist-order" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Display Order <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="visa-checklist-order"
                  type="number"
                  min="1"
                  value={formData.displayOrder}
                  onChange={(e) => set({ displayOrder: Number(e.target.value) || 1 })}
                  className="w-24 px-3.5 py-2 text-sm border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
                />
                <span className="text-xs sm:text-sm text-slate-400">Set the order position for this checklist</span>
              </div>
              {errors.displayOrder && <span className="text-xs text-rose-500 mt-1 block font-medium">{errors.displayOrder}</span>}
            </div>

            <div>
              <label htmlFor="visa-checklist-status" className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Status
              </label>
              <div className="relative">
                <select
                  id="visa-checklist-status"
                  value={formData.status}
                  onChange={(e) => set({ status: e.target.value })}
                  className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs pr-9 cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100/70 text-rose-600 font-semibold text-sm transition-colors shadow-2xs disabled:opacity-50"
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
