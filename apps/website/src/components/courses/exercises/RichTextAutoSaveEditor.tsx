import React, {
  useCallback, useEffect, useState, useRef,
} from 'react';
import { cn } from '@bluedot/ui';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import History from '@tiptap/extension-history';
import { Markdown } from 'tiptap-markdown';
import Placeholder from '@tiptap/extension-placeholder';
import SaveStatusIndicator from './SaveStatusIndicator';

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

type RichTextAutoSaveEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  height?: 'short' | 'normal';
  className?: string;
  /** Debug only: force a specific status for styling purposes */
  debugForceStatus?: SaveStatus;
};

const EDITOR_HEIGHT_STYLES = {
  short: 'min-h-[75px]',
  normal: 'min-h-[140px]',
} as const;

const AUTOSAVE_DELAY_IN_MS = 20000; // 20 seconds
const PERIODIC_SAVE_INTERVAL_IN_MS = 180000; // 3 minutes

const RichTextAutoSaveEditor: React.FC<RichTextAutoSaveEditorProps> = ({
  value,
  onChange,
  onSave,
  placeholder = 'Enter text here',
  disabled = false,
  height = 'normal',
  className,
  debugForceStatus,
}) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedValue, setLastSavedValue] = useState<string>(value);
  const [isFocussed, setIsFocussed] = useState<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const inactivityTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const valueRef = useRef<string>(value);
  const lastSavedContent = useRef<string>(value);

  const isEditing = value !== lastSavedValue;

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      BulletList,
      OrderedList,
      ListItem,
      History,
      // Type assertion needed due to tiptap-markdown version conflicts
      Markdown as never,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => {
      const markdown = updatedEditor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    onFocus: () => {
      if (!disabled) setIsFocussed(true);
    },
    onBlur: () => {
      if (disabled) return;

      const currentContent = editor?.storage.markdown.getMarkdown() || '';
      if (currentContent !== lastSavedValue) {
        // Cancel inactivity timer on blur save
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        saveValue(currentContent);
      }
    },
  }, [disabled, placeholder]);

  // Sync from external value (e.g., when exercise changes)
  useEffect(() => {
    if (!editor) return;

    // Don't sync while user is actively editing - let them type without interference
    if (isFocussed) return;

    const currentContent = editor.storage.markdown.getMarkdown();

    // If external value equals what we last saved, ignore
    // (this is just save confirmation coming back)
    if (value === lastSavedContent.current) return;

    // If value is genuinely different, sync it
    if (value !== currentContent) {
      editor.commands.setContent(value || '');
      lastSavedContent.current = value || '';
    }
  }, [value, editor, isFocussed]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      [inactivityTimerRef, statusTimerRef].forEach((ref) => {
        if (ref.current) clearTimeout(ref.current);
      });
    };
  }, []);

  const saveValue = useCallback(async (valueToSave: string) => {
    if (isSavingRef.current || valueToSave === lastSavedValue || disabled) {
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      await onSave(valueToSave);
      setLastSavedValue(valueToSave);
      lastSavedContent.current = valueToSave;
      setSaveStatus('saved');

      // Clear previous status timer and set new one
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = window.setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, lastSavedValue, disabled]);

  // Store latest values in refs to avoid recreating timer
  const saveValueRef = useRef(saveValue);
  const lastSavedValueRef = useRef(lastSavedValue);

  useEffect(() => {
    saveValueRef.current = saveValue;
    lastSavedValueRef.current = lastSavedValue;
  }, [saveValue, lastSavedValue]);

  // Keep valueRef updated with the current value
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Periodic save timer - runs independently at specified interval
  useEffect(() => {
    if (!isFocussed || disabled || PERIODIC_SAVE_INTERVAL_IN_MS <= 0) return undefined;

    const runPeriodicSave = () => {
      const currentSaveValue = saveValueRef.current;
      const currentLastSaved = lastSavedValueRef.current;
      const currentValue = valueRef.current;

      if (currentValue !== currentLastSaved) {
        currentSaveValue(currentValue);
      }
    };

    // Set up recurring timer
    const intervalId = window.setInterval(runPeriodicSave, PERIODIC_SAVE_INTERVAL_IN_MS);

    return () => clearInterval(intervalId);
  }, [disabled, isFocussed]);

  // Inactivity auto-save timer
  useEffect(() => {
    if (!isFocussed || !isEditing || disabled || AUTOSAVE_DELAY_IN_MS <= 0) return undefined;

    // Clear and reset the inactivity timer
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    inactivityTimerRef.current = window.setTimeout(() => {
      saveValue(value);
    }, AUTOSAVE_DELAY_IN_MS);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [value, isEditing, disabled, saveValue, isFocussed]);

  const handleRetry = () => {
    if (value !== lastSavedValue) {
      saveValue(value);
    }
  };

  // Click anywhere in the container to focus the editor
  const handleContainerClick = () => {
    if (!disabled && editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  };

  const editorContainerClasses = cn(
    'resize-y overflow-auto relative cursor-text',
    'box-border w-full bg-white rounded-[6px] z-[1] p-4',
    'border-[0.5px] border-[rgba(19,19,46,0.25)]',
    'focus-within:border-[1.25px] focus-within:border-[#1641D9] focus-within:shadow-[0px_0px_10px_rgba(34,68,187,0.3)]',
    'transition-all duration-200',
    '[&::-webkit-resizer]:hidden',
    disabled && 'cursor-not-allowed opacity-60',
    EDITOR_HEIGHT_STYLES[height],
    className,
  );

  return (
    <div className="flex flex-col relative">
      <div className="relative w-full z-[1]">
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- Click-to-focus is UX convenience; keyboard input handled by EditorContent inside */}
        <div className={editorContainerClasses} onClick={handleContainerClick}>
          <EditorContent
            editor={editor}
            className={cn(
              'outline-none max-w-none',
              '[&_.ProseMirror]:outline-none',
              '[&_.ProseMirror]:font-normal [&_.ProseMirror]:text-[14px] [&_.ProseMirror]:leading-[160%] [&_.ProseMirror]:tracking-[-0.002em] [&_.ProseMirror]:text-[#13132E]',
              '[&_.ProseMirror_p]:m-0',
              '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:my-1',
              '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:my-1',
              '[&_.ProseMirror_li]:my-0.5',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-[#999]',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
              '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
            )}
            aria-label="Rich text input area"
            aria-describedby={!disabled ? 'save-status-message' : undefined}
          />
        </div>
        {/* Custom drag notches overlay */}
        <div className="absolute w-[15px] h-[14px] right-2 bottom-2 pointer-events-none z-[2]">
          <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g opacity="0.6" clipPath="url(#clip0_auto_save)">
              <path d="M11.875 7L7.5 11.375" stroke="#13132E" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 2.1875L2.6875 10.5" stroke="#13132E" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <defs>
              <clipPath id="clip0_auto_save">
                <rect width="14" height="14" fill="white" transform="translate(0.5)" />
              </clipPath>
            </defs>
          </svg>
        </div>
      </div>
      {!disabled && (
        <SaveStatusIndicator
          status={debugForceStatus ?? saveStatus}
          id="save-status-message"
          onRetry={handleRetry}
          savedText="Saved"
        />
      )}
    </div>
  );
};

export default RichTextAutoSaveEditor;
