import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3, Check, Settings2, FileText } from 'lucide-react';

export default function ManageTemplatesModal({
  open,
  onClose,
  templates = [],
  onSaveTemplate,
  onDeleteTemplate,
}) {
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [emailBodyHtml, setEmailBodyHtml] = useState('');

  if (!open) return null;

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingTemplate(null);
    setName('');
    setSubject('');
    setSmsBody('Dear {CustomerName}, ');
    setEmailBodyHtml('<p>Dear {CustomerName},</p><p>We are delighted to share our exclusive offers with you...</p><p>Best regards,<br/><strong>ABL Travels</strong></p>');
  };

  const handleStartEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setIsCreating(false);
    setName(tmpl.name);
    setSubject(tmpl.subject || tmpl.emailSubject || '');
    setSmsBody(tmpl.smsBody || tmpl.content || '');
    setEmailBodyHtml(tmpl.emailBodyHtml || tmpl.emailBody || '');
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a template name.');
      return;
    }

    const payload = {
      id: editingTemplate ? editingTemplate.id : `tmpl-${Date.now()}`,
      name,
      type: 'both',
      subject: subject.trim() || name,
      emailSubject: subject.trim() || name,
      smsBody,
      emailBodyHtml,
    };

    await onSaveTemplate(payload);
    handleCancelForm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Settings2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Manage Marketing Templates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize promotional email and SMS templates with personalized placeholders.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-130px)] space-y-4">
          {!isCreating && !editingTemplate ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Available Templates ({templates.length})
                </span>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Create New Template</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {templates.map((tmpl) => (
                  <div
                    key={tmpl.id}
                    className="p-4 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="size-4 text-blue-600 shrink-0" />
                        <h4 className="text-sm font-bold text-slate-900 truncate">{tmpl.name}</h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                        <span className="font-semibold text-slate-700">Subject: </span>
                        {tmpl.subject || tmpl.emailSubject || '—'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        <span className="font-semibold text-slate-600">SMS: </span>
                        {tmpl.smsBody || '—'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(tmpl)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Template"
                      >
                        <Edit3 className="size-4" />
                      </button>
                      {templates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete template "${tmpl.name}"?`)) {
                              onDeleteTemplate(tmpl.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">
                  {isCreating ? 'Create New Template' : `Edit: ${editingTemplate.name}`}
                </span>
                <span className="text-[11px] text-slate-400">
                  Placeholder: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600 font-mono">{"{CustomerName}"}</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Winter Holiday Discount"
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Exclusive Winter Travel Discounts with ABL Travels"
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SMS Message Body (max 160 chars recommended)
                </label>
                <textarea
                  rows={3}
                  value={smsBody}
                  onChange={(e) => setSmsBody(e.target.value)}
                  placeholder="SMS text..."
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Message Body (HTML or Plain Text)
                </label>
                <textarea
                  rows={5}
                  value={emailBodyHtml}
                  onChange={(e) => setEmailBodyHtml(e.target.value)}
                  placeholder="HTML email body..."
                  className="w-full px-3.5 py-2 text-xs font-mono text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="size-3.5" />
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!isCreating && !editingTemplate && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
