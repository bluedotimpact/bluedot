import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';
import Link from '@tiptap/extension-link';
import React, {
  useState, useCallback, useRef, useEffect,
} from 'react';
import {
  FaBold,
  FaItalic,
  FaHeading,
  FaQuoteLeft,
  FaLink,
} from 'react-icons/fa6';

interface MarkdownEditorProps {
  children?: string;
}

const LinkPopup: React.FC<{
  isOpen: boolean;
  url: string;
  setUrl: (url: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  position: { x: number; y: number };
}> = ({
  isOpen, url, setUrl, onSubmit, onCancel, position,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute bg-white shadow-lg rounded-radius-base border border-gray-200 p-3 z-50"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: '300px',
      }}
    >
      <div className="mb-2 font-medium text-gray-700">Insert Link</div>
      <input
        ref={inputRef}
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        className="w-full p-2 border border-gray-300 rounded-radius-base mb-3"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSubmit();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-radius-base"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          className="px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-radius-base"
        >
          Save
        </button>
      </div>
    </div>
  );
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ children }) => {
  const [linkPopupOpen, setLinkPopupOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: children,
    onUpdate: () => {
      const markdownOutput = editor?.storage.markdown.getMarkdown();
      console.log(markdownOutput);
    },
  });

  const showLinkPopup = useCallback(() => {
    if (!editor) return;

    // Get the current selection position to place the popup
    if (editorRef.current) {
      const { top, left, height } = editorRef.current.getBoundingClientRect();
      const editorPos = { x: left, y: top + height / 3 };
      setPopupPosition(editorPos);
    }

    // If there's already a link at the current selection, get its URL
    const { from, to } = editor.state.selection;
    const linkMark = editor.state.doc.nodeAt(from)?.marks.find((mark) => mark.type.name === 'link');

    if (linkMark) {
      setLinkUrl(linkMark.attrs.href);
    } else {
      setLinkUrl('');
    }

    setLinkPopupOpen(true);
  }, [editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      // If URL is empty, remove the link
      editor.chain().focus().extendMarkRange('link').unsetLink()
        .run();
    } else {
      // Otherwise, set the link with the provided URL
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl })
        .run();
    }

    setLinkPopupOpen(false);
  }, [editor, linkUrl]);

  // Handle keyboard shortcut for link
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && editor) {
        e.preventDefault();
        showLinkPopup();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, showLinkPopup]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-radius-base overflow-hidden relative" ref={editorRef}>
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

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Heading 1"
        >
          <FaHeading size={16} />
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

        <div className="h-4 w-px bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={showLinkPopup}
          className={`p-2 rounded hover:bg-gray-200 transition-colors ${
            editor.isActive('link') ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          }`}
          title="Link (Cmd+K / Ctrl+K)"
        >
          <FaLink size={16} />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose p-4 min-h-[200px]"
      />

      {/* Link Popup */}
      <LinkPopup
        isOpen={linkPopupOpen}
        url={linkUrl}
        setUrl={setLinkUrl}
        onSubmit={handleSetLink}
        onCancel={() => setLinkPopupOpen(false)}
        position={popupPosition}
      />
    </div>
  );
};

export default MarkdownEditor;
