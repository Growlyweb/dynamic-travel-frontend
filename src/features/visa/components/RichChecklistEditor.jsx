import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Minus,
  RotateCcw,
  RotateCw,
  Sparkles,
  FileText,
} from "lucide-react";

const TEMPLATES = {
  tourist: `<h3>Mandatory Documents for Tourist Visa</h3>
<ul>
  <li><strong>Original Passport:</strong> Minimum 6 months validity remaining with at least 2 consecutive blank pages.</li>
  <li><strong>Photographs:</strong> 2 recent studio photographs (35mm x 45mm, white background, 80% face coverage, no glare/glasses).</li>
  <li><strong>Financial Proof:</strong> Last 6 months bank statement with bank stamp & seal (minimum closing balance BDT 150,000+ per applicant).</li>
  <li><strong>Bank Solvency Certificate:</strong> Issued by the bank branch manager.</li>
  <li><strong>Travel Itinerary:</strong> Return flight ticket booking and confirmed hotel reservation for the duration of stay.</li>
</ul>
<h3>Professional / Occupational Documents</h3>
<ol>
  <li><strong>For Business Owners:</strong> Updated trade license copy, memorandum of association, and visiting card.</li>
  <li><strong>For Salaried Executives:</strong> No Objection Certificate (NOC) on company letterhead, employee ID card, and 3 months payslips.</li>
  <li><strong>For Students:</strong> Valid student ID card copy and leave approval from school/university.</li>
</ol>
<blockquote><strong>Note:</strong> All non-English documents must have an official translated and notarized copy attached.</blockquote>`,

  business: `<h3>Required Documents for Business Visa</h3>
<ul>
  <li><strong>Original Passport:</strong> Minimum 6 months validity with previous visas copies.</li>
  <li><strong>Official Invitation Letter:</strong> From the host registered company/organization detailing visit purpose, duration, and financial sponsor.</li>
  <li><strong>Company Cover Letter:</strong> On corporate letterhead stating designation, itinerary, and business intent.</li>
  <li><strong>Company Bank Statement:</strong> Last 6 months company bank account statement along with solvency certificate.</li>
  <li><strong>Trade License & Chamber Membership:</strong> Copy of renewed trade license and Chamber of Commerce registration.</li>
</ul>
<blockquote><strong>Embassy Requirement:</strong> Physical passport submission and biometrics appointment required for verification.</blockquote>`,

  express: `<h3>Express / eVisa Requirements</h3>
<ul>
  <li><strong>Clear Passport Bio Page Scan:</strong> Full color scan with all 4 corners visible (no glare, PDF/JPEG).</li>
  <li><strong>Digital Photograph:</strong> High-resolution digital portrait with pure white backdrop.</li>
  <li><strong>Return Air Ticket:</strong> Confirmed roundtrip flight reservation.</li>
  <li><strong>Hotel Voucher / Host Address:</strong> Valid accommodation confirmation in destination country.</li>
</ul>
<blockquote><strong>Fast-track Timeline:</strong> Electronic approval issued within 24 to 72 hours directly to applicant email.</blockquote>`,
};

export default function RichChecklistEditor({
  value = "",
  onChange,
  placeholder = "Write or decorate visa requirements and checklist here...",
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-doc focus:outline-none min-h-[220px] max-h-[460px] overflow-y-auto px-4 py-3.5 text-sm leading-relaxed text-slate-800 dark:text-slate-100",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="flex h-36 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
        Loading rich text editor...
      </div>
    );
  }

  const insertTemplate = (key) => {
    const html = TEMPLATES[key];
    if (html) {
      editor.commands.setContent(html);
      onChange?.(html);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Google Docs-style Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-200 bg-slate-50/90 px-3 py-2 text-slate-700 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-200">
        <div className="flex flex-wrap items-center gap-1">
          {/* Headings */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition ${
              editor.isActive("heading", { level: 2 })
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "hover:bg-slate-200/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
            <span>H2</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition ${
              editor.isActive("heading", { level: 3 })
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "hover:bg-slate-200/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
            <span>H3</span>
          </button>

          <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

          {/* Text Decoration: Bold, Italic, Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              editor.isActive("bold")
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "hover:bg-slate-200/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              editor.isActive("italic")
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "hover:bg-slate-200/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              editor.isActive("underline")
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "hover:bg-slate-200/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

          {/* Lists: Bullets and Numbered */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium transition ${
              editor.isActive("bulletList")
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "hover:bg-slate-200/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Bulleted List"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Bullet</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium transition ${
              editor.isActive("orderedList")
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "hover:bg-slate-200/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
            <span className="hidden sm:inline">Numbered</span>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
              editor.isActive("blockquote")
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "hover:bg-slate-200/70 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
            title="Quote Callout"
          >
            <Quote className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Insert Divider"
          >
            <Minus className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-slate-300 dark:bg-slate-700" />

          {/* Undo / Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200/70 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Undo"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-700 hover:bg-slate-200/70 disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Redo"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quick Template Inserter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="hidden items-center gap-1 text-slate-500 md:flex dark:text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Preset:
          </span>
          <button
            type="button"
            onClick={() => insertTemplate("tourist")}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Tourist
          </button>
          <button
            type="button"
            onClick={() => insertTemplate("business")}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Business
          </button>
          <button
            type="button"
            onClick={() => insertTemplate("express")}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            eVisa
          </button>
        </div>
      </div>

      {/* Editor Content Box */}
      <div className="prose-editor-box bg-white dark:bg-slate-900">
        <EditorContent editor={editor} />
      </div>

      {/* Embedded CSS for Rich Typography */}
      <style>{`
        .prose-editor-box .tiptap-doc h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0f172a;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          letter-spacing: -0.01em;
        }
        .dark .prose-editor-box .tiptap-doc h2 {
          color: #f8fafc;
        }
        .prose-editor-box .tiptap-doc h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin-top: 0.85rem;
          margin-bottom: 0.35rem;
        }
        .dark .prose-editor-box .tiptap-doc h3 {
          color: #e2e8f0;
        }
        .prose-editor-box .tiptap-doc p {
          margin: 0.35rem 0;
          line-height: 1.6;
        }
        .prose-editor-box .tiptap-doc ul {
          list-style-type: disc;
          padding-left: 1.35rem;
          margin: 0.4rem 0;
        }
        .prose-editor-box .tiptap-doc ol {
          list-style-type: decimal;
          padding-left: 1.35rem;
          margin: 0.4rem 0;
        }
        .prose-editor-box .tiptap-doc li {
          margin-bottom: 0.3rem;
          line-height: 1.5;
        }
        .prose-editor-box .tiptap-doc blockquote {
          border-left: 3px solid #3b82f6;
          background-color: #f8fafc;
          padding: 0.5rem 0.85rem;
          margin: 0.65rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #475569;
          font-style: italic;
        }
        .dark .prose-editor-box .tiptap-doc blockquote {
          background-color: #0f172a;
          border-left-color: #60a5fa;
          color: #94a3b8;
        }
        .prose-editor-box .tiptap-doc hr {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 0.75rem 0;
        }
        .dark .prose-editor-box .tiptap-doc hr {
          border-top-color: #334155;
        }
      `}</style>
    </div>
  );
}
