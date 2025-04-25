import { useEditor, EditorContent, Editor } from '@tiptap/react';
import React from 'react';
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
import { LinkOrButton } from '@bluedot/ui/src/legacy/LinkOrButton';
import {
  FaBold,
  FaItalic,
  FaQuoteLeft,
  FaCode,
} from 'react-icons/fa6';

interface ToolbarButtonProps {
  onPress: () => void;
  isActive: boolean;
  icon: React.ReactNode;
  'aria-label'?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onPress,
  isActive,
  icon,
  'aria-label': ariaLabel,
}) => {
  return (
    <LinkOrButton
      onPress={onPress}
      className={`p-2 rounded hover:bg-gray-200 transition-colors ${
        isActive ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
      }`}
      aria-label={ariaLabel}
    >
      {icon}
    </LinkOrButton>
  );
};

interface ToolbarProps {
  editor: Editor;
}

const ToolbarDivider: React.FC = () => {
  return <div className="h-4 w-px bg-gray-300 mx-1" />;
};

const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  return (
    <div className="p-2 bg-gray-50 border-b border-gray-300" role="toolbar" aria-label="Text formatting options">
      <div className="flex items-center gap-1">
        <ToolbarButton
          onPress={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          aria-label="Bold"
          icon={<FaBold size={16} />}
        />

        <ToolbarButton
          onPress={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          aria-label="Italic"
          icon={<FaItalic size={16} />}
        />

        <ToolbarButton
          onPress={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          aria-label="Code"
          icon={<FaCode size={16} />}
        />

        <ToolbarDivider />

        {([1, 2, 3] as const).map((level) => (
          <ToolbarButton
            key={level}
            onPress={() => editor.chain().focus().toggleHeading({ level }).run()}
            isActive={editor.isActive('heading', { level })}
            aria-label={`Heading ${level}`}
            icon={(
              <div className="flex items-center justify-center">
                <span className="text-size-xs font-bold">H{level}</span>
              </div>
            )}
          />
        ))}

        <ToolbarDivider />

        <ToolbarButton
          onPress={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          aria-label="Blockquote"
          icon={<FaQuoteLeft size={16} />}
        />
      </div>
    </div>
  );
};

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
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <Toolbar editor={editor} />

      <EditorContent
        editor={editor}
        className="prose p-4 min-h-[200px]"
      />
    </div>
  );
};

export default MarkdownEditor;
