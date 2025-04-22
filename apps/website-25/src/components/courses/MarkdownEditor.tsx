import { useEditor, EditorContent } from '@tiptap/react';
import React from 'react';
import {
  FaBold,
  FaItalic,
  FaQuoteLeft,
  FaCode,
} from 'react-icons/fa6';
import {
  Bold,
  Code,
  Link,
  Italic,
  Strike,
  Text,
  Document,
  Heading,
  Paragraph,
  Blockquote,
  CodeBlock,
  HorizontalRule,
  BulletList,
  OrderedList,
  ListItem,
  Image,
  Uploader,
  Clipboard,
  History,
  Gapcursor,
  Dropcursor,
} from '@syfxlin/tiptap-starter-kit';
import { Markdown } from 'tiptap-markdown';

interface MarkdownEditorProps {
  children?: string;
  onChange?: (markdown: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ children, onChange }) => {
  const editor = useEditor({
    extensions: [
      Bold,
      Code,
      Link,
      Italic,
      Strike,
      Text,
      Document,
      Heading,
      Paragraph,
      Blockquote,
      CodeBlock,
      HorizontalRule,
      BulletList,
      OrderedList,
      ListItem,
      Image,
      Uploader,
      // NB: we use this instead of the tiptap starter kit because it handles input with newlines better
      Markdown,
      Clipboard,
      History,
      Gapcursor,
      Dropcursor,
    ],
    content: children,
    onUpdate: () => {
      const markdownOutput = editor?.storage.markdown.getMarkdown();
      onChange?.(markdownOutput);
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-radius-md overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('bold') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Bold"
        >
          <FaBold size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('italic') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Italic"
        >
          <FaItalic size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('code') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Code"
        >
          <FaCode size={16} />
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Heading 1"
        >
          <div className="flex items-center justify-center">
            <span className="text-size-xs font-bold">H1</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Heading 2"
        >
          <div className="flex items-center justify-center">
            <span className="text-size-xs font-bold">H2</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Heading 3"
        >
          <div className="flex items-center justify-center">
            <span className="text-size-xs font-bold">H3</span>
          </div>
        </button>

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('blockquote') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Blockquote"
        >
          <FaQuoteLeft size={16} />
        </button>
      </div>

      <EditorContent
        editor={editor}
        className="prose p-4 min-h-[200px]"
      />
    </div>
  );
};

export default MarkdownEditor;
