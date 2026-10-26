import React, { useState, useEffect } from 'react';
import {
  Mail,
  X,
  Send,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link2,
  ChevronDown,
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

export default function SendEmailModal({
  open,
  onClose,
  customer,
  templates = [],
  onSend,
}) {
  const [subject, setSubject] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('tmpl-china-visa');
  const [sendCopyToMe, setSendCopyToMe] = useState(true);
  const [sending, setSending] = useState(false);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'focus:outline-none p-4 text-[13.5px] text-slate-800 leading-relaxed font-normal min-h-[200px] max-h-[300px] overflow-y-auto prose prose-sm max-w-none',
      },
    },
  });

  // Load template content or default whenever customer or modal opens
  useEffect(() => {
    if (open && customer) {
      const template =
        templates.find((t) => t.id === selectedTemplateId) || templates[0];
      const customerName = customer.name || 'Valued Customer';

      if (template) {
        setSubject(template.emailSubject || template.subject || 'Special China Visa Offer for You');
        const formattedHtml = (template.emailBodyHtml || template.emailBody || '')
          .replace(/\{CustomerName\}|\{name\}/g, customerName);
        if (editor) {
          editor.commands.setContent(formattedHtml);
        }
      } else {
        setSubject('Special China Visa Offer for You');
        const defaultHtml = `<p>Dear ${customerName},</p>
<p>We are pleased to inform you about our special China visa processing offer. Get reliable service, expert guidance and hassle-free processing with ABL Travels.</p>
<p>If you have any questions, feel free to contact us.</p>
<p>Best regards,<br/><strong>ABL Travels</strong><br/>House #1/B, Road #126, Gulshan 01, Dhaka 1212<br/>+880 1XXX-XXXXXX</p>`;
        if (editor) {
          editor.commands.setContent(defaultHtml);
        }
      }
    }
  }, [open, customer, selectedTemplateId, editor, templates]);

  if (!open || !customer) return null;

  const handleTemplateChange = (tmplId) => {
    setSelectedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl && editor) {
      const customerName = customer.name || 'Valued Customer';
      setSubject(tmpl.emailSubject || tmpl.subject || '');
      const formatted = (tmpl.emailBodyHtml || tmpl.emailBody || '').replace(
        /\{CustomerName\}|\{name\}/g,
        customerName
      );
      editor.commands.setContent(formatted);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert('Please enter an email subject.');
      return;
    }
    const htmlContent = editor ? editor.getHTML() : '';
    if (!htmlContent.trim()) {
      alert('Please enter an email message.');
      return;
    }

    setSending(true);
    try {
      await onSend({
        customerId: customer.id,
        customerName: customer.name,
        email: customer.email,
        subject,
        message: htmlContent,
        sendCopyToMe,
        templateId: selectedTemplateId,
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Mail className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Send Email</h3>
              <p className="text-xs text-slate-500 mt-0.5">Send promotional email to your customer.</p>
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
        <form onSubmit={handleSend} className="p-6 space-y-4 overflow-y-auto max-h-[calc(85vh-140px)]">
          {/* To Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">To</label>
            <input
              type="text"
              readOnly
              value={`${customer.name} (${customer.email})`}
              className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg cursor-not-allowed select-all"
            />
          </div>

          {/* Subject Field & Optional Template Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Subject <span className="text-rose-500">*</span>
              </label>
              {templates.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400">Template:</span>
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
              )}
            </div>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Special China Visa Offer for You"
              className="w-full px-3.5 py-2 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs"
            />
          </div>

          {/* Message Field with Rich Text Editor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Message <span className="text-rose-500">*</span>
            </label>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              {/* Rich Text Toolbar matching Image 2 */}
              <div className="flex flex-wrap items-center gap-1 px-3 py-2 bg-slate-50/80 border-b border-slate-200/80 select-none">
                {/* Normal / Heading dropdown */}
                <div className="relative mr-1">
                  <select
                    value={
                      editor?.isActive('heading', { level: 1 })
                        ? 'h1'
                        : editor?.isActive('heading', { level: 2 })
                        ? 'h2'
                        : 'p'
                    }
                    onChange={(e) => {
                      if (!editor) return;
                      const val = e.target.value;
                      if (val === 'p') editor.chain().focus().setParagraph().run();
                      else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
                      else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
                    }}
                    className="appearance-none bg-white border border-slate-200 rounded px-2.5 py-1 pr-6 text-xs font-medium text-slate-700 cursor-pointer focus:outline-none shadow-2xs hover:bg-slate-50"
                  >
                    <option value="p">Normal</option>
                    <option value="h1">Heading 1</option>
                    <option value="h2">Heading 2</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
                </div>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                {/* Bold */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`p-1.5 rounded transition-colors text-xs font-bold ${
                    editor?.isActive('bold')
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`p-1.5 rounded transition-colors ${
                    editor?.isActive('italic')
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={`p-1.5 rounded transition-colors ${
                    editor?.isActive('underline')
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  <UnderlineIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Strikethrough */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={`p-1.5 rounded transition-colors ${
                    editor?.isActive('strike')
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-1" />

                {/* Bullet List */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`p-1.5 rounded transition-colors ${
                    editor?.isActive('bulletList')
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                  title="Bullet List"
                >
                  <List className="w-3.5 h-3.5" />
                </button>

                {/* Ordered List */}
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`p-1.5 rounded transition-colors ${
                    editor?.isActive('orderedList')
                      ? 'bg-blue-100 text-blue-700 font-bold'
                      : 'hover:bg-slate-200/60 text-slate-700'
                  }`}
                  title="Numbered List"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>

                {/* Link */}
                <button
                  type="button"
                  onClick={setLink}
                  className="p-1.5 rounded hover:bg-slate-200/60 text-slate-700 transition-colors"
                  title="Insert Link"
                >
                  <Link2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Editor Content Area */}
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendCopyToMe}
                onChange={(e) => setSendCopyToMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-4"
              />
              <span className="text-xs font-medium text-slate-700">Send a copy to me</span>
            </label>

            <div className="flex items-center gap-2.5">
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
                <span>{sending ? 'Sending...' : 'Send Email'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
