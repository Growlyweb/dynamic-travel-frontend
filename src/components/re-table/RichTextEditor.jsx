import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Table as TableIcon,
  Undo2,
  Redo2,
  ChevronDown,
} from 'lucide-react';

/**
 * RichTextEditor Component
 * Uses official @tiptap/react library for text decoration matching the design image toolbar.
 */
export function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Please prepare the following documents for visa application...',
  minHeight = '130px',
  className = '',
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChange?.(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none p-3.5 text-sm text-slate-800 leading-relaxed font-normal min-h-[${minHeight}] prose prose-sm max-w-none`,
      },
    },
  });

  // Sync value if updated from parent
  React.useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="w-full h-32 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
        Loading editor...
      </div>
    );
  }

  const currentHeading = editor.isActive('heading', { level: 1 })
    ? 'Heading 1'
    : editor.isActive('heading', { level: 2 })
    ? 'Heading 2'
    : editor.isActive('heading', { level: 3 })
    ? 'Heading 3'
    : 'Paragraph';

  const handleHeadingChange = (e) => {
    const val = e.target.value;
    if (val === 'p') editor.chain().focus().setParagraph().run();
    else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
    else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
    else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className={`w-full rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all ${className}`}>
      {/* Editor Toolbar matching the reference screenshot */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-slate-50/70 border-b border-slate-200/80 text-slate-600 select-none">
        {/* Paragraph / Heading Selector */}
        <div className="relative mr-1">
          <select
            value={
              editor.isActive('heading', { level: 1 })
                ? 'h1'
                : editor.isActive('heading', { level: 2 })
                ? 'h2'
                : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : 'p'
            }
            onChange={handleHeadingChange}
            className="appearance-none bg-white border border-slate-200 rounded px-2.5 py-1 pr-6 text-xs font-medium text-slate-700 cursor-pointer focus:outline-none shadow-2xs hover:bg-slate-50"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-2 pointer-events-none" />
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bold')
              ? 'bg-blue-100 text-blue-700 font-bold'
              : 'hover:bg-slate-200/70 text-slate-700'
          }`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('italic')
              ? 'bg-blue-100 text-blue-700 font-bold'
              : 'hover:bg-slate-200/70 text-slate-700'
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('underline')
              ? 'bg-blue-100 text-blue-700 font-bold'
              : 'hover:bg-slate-200/70 text-slate-700'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-blue-100 text-blue-700 font-bold'
              : 'hover:bg-slate-200/70 text-slate-700'
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Ordered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-blue-100 text-blue-700 font-bold'
              : 'hover:bg-slate-200/70 text-slate-700'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => {
            // cycle alignment or keep default
          }}
          className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 transition-colors"
          title="Text Alignment"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Link */}
        <button
          type="button"
          onClick={setLink}
          className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 transition-colors"
          title="Insert Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        {/* Image */}
        <button
          type="button"
          onClick={addImage}
          className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 transition-colors"
          title="Insert Image"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        {/* Table */}
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().insertContent('<table><tr><td>Item</td><td>Requirement</td></tr></table>').run();
          }}
          className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 transition-colors"
          title="Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1" />

        {/* Undo */}
        <button
          type="button"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Undo"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Redo */}
        <button
          type="button"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-slate-200/70 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Redo"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
