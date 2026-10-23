import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Info } from 'lucide-react';

export default function SendSmsModal({
  open,
  onClose,
  customer,
  templates = [],
  onSend,
}) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('tmpl-china-visa');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && customer) {
      const template =
        templates.find((t) => t.id === selectedTemplateId) || templates[0];
      const customerName = customer.name || 'Valued Customer';

      if (template) {
        const text = (template.smsBody || template.content || '').replace(
          /\{CustomerName\}|\{name\}/g,
          customerName
        );
        setMessage(text);
      } else {
        setMessage(
          `Dear ${customerName}, Special offer on China Visa processing with ABL Travels! Express processing, expert support & high approval rate. Call +880 1711-111111.`
        );
      }
    }
  }, [open, customer, selectedTemplateId, templates]);

  if (!open || !customer) return null;

  const handleTemplateChange = (tmplId) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl) {
      const customerName = customer.name || 'Valued Customer';
      const text = (tmpl.smsBody || tmpl.content || '').replace(
        /\{CustomerName\}|\{name\}/g,
        customerName
      );
      setMessage(text);
    }
  };

  const charCount = message.length;
  const smsSegments = Math.max(1, Math.ceil(charCount / 160));

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please enter an SMS message.');
      return;
    }

    setSending(true);
    try {
      await onSend({
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        message,
        templateId: selectedTemplateId,
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to send SMS.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Send SMS</h3>
              <p className="text-xs text-slate-500 mt-0.5">Send promotional SMS to your customer.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {/* To Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">To</label>
            <input
              type="text"
              readOnly
              value={`${customer.name} (${customer.phone})`}
              className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed select-all"
            />
          </div>

          {/* Template Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">SMS Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="text-xs text-blue-600 font-semibold bg-transparent border-0 hover:underline cursor-pointer focus:outline-none"
              >
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id} className="text-slate-800">
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Message Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Message <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your SMS message here..."
              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs leading-relaxed"
            />
            {/* Dynamic Counter Helper */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700">{charCount}</span> characters
                <span className="text-slate-300">|</span>
                <span className="font-semibold text-blue-600">{smsSegments}</span> SMS (max 160 characters per SMS)
              </div>
              <Info className="size-3.5 text-slate-400" title="160 characters per standard GSM SMS" />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Send className="size-3.5" />
              <span>{sending ? 'Sending...' : 'Send SMS'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
