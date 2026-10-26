import React from 'react';
import { X, Calendar, Send, CheckCircle2, Clock, Users, Mail, MessageSquare } from 'lucide-react';

export default function CampaignDetailsModal({ open, onClose, campaign }) {
  if (!open || !campaign) return null;

  const isSms = campaign.type === 'SMS';
  const deliveryPercent =
    campaign.recipients > 0
      ? Math.round((campaign.sent / campaign.recipients) * 100)
      : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                isSms ? 'bg-sky-100 text-sky-600' : 'bg-purple-100 text-purple-600'
              }`}
            >
              {isSms ? <MessageSquare className="size-5" /> : <Mail className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Campaign Details
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    isSms
                      ? 'bg-sky-50 text-sky-600 border-sky-200'
                      : 'bg-purple-50 text-purple-600 border-purple-200'
                  }`}
                >
                  {campaign.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{campaign.date}</p>
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

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(85vh-130px)]">
          {/* Key Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Recipients</span>
              <span className="text-lg font-bold text-slate-900">{campaign.recipients}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Successfully Sent</span>
              <span className="text-lg font-bold text-emerald-600">{campaign.sent}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center">
              <span className="text-[11px] font-medium text-slate-500 block">Status</span>
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mt-0.5 ${
                  campaign.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {campaign.status}
              </span>
            </div>
          </div>

          {/* Delivery Progress */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Delivery Success Rate</span>
              <span className="text-emerald-600">{deliveryPercent}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${deliveryPercent}%` }}
              />
            </div>
          </div>

          {/* Target Audience / Recipient */}
          {campaign.recipientName && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target / Recipient</label>
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                {campaign.recipientName}
              </div>
            </div>
          )}

          {/* Subject (if Email) */}
          {campaign.subject && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                {campaign.subject}
              </div>
            </div>
          )}

          {/* Message Content Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Message Content</label>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap max-h-56 overflow-y-auto">
              {campaign.content ? (
                campaign.content.includes('<') ? (
                  <div
                    className="prose prose-sm max-w-none text-xs"
                    dangerouslySetInnerHTML={{ __html: campaign.content }}
                  />
                ) : (
                  campaign.content
                )
              ) : (
                campaign.message
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
