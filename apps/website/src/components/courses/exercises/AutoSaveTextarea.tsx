import React, {
  useCallback, useEffect, useState, useRef,
} from 'react';
import clsx from 'clsx';
import SaveStatusIndicator from './SaveStatusIndicator';

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

type AutoSaveTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
  showSaveStatus?: boolean;
  autoSaveDelay?: number; // milliseconds for inactivity timer (default 20000)
  periodicSaveInterval?: number; // milliseconds for periodic saves (default 180000)
  ariaLabel?: string;
  hideResizeHandle?: boolean;
  savedText?: string; // Custom text for saved state (default: "Answer saved")
};

const AutoSaveTextarea: React.FC<AutoSaveTextareaProps> = ({
  value,
  onChange,
  onSave,
  placeholder = 'Enter text here',
  minHeight = '140px',
  className,
  disabled = false,
  showSaveStatus = true,
  autoSaveDelay = 20000, // 20 seconds
  periodicSaveInterval = 180000, // 3 minutes
  ariaLabel,
  hideResizeHandle = false,
  savedText = 'Answer saved',
}) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedValue, setLastSavedValue] = useState<string>(value);
  const isSavingRef = useRef<boolean>(false);
  const inactivityTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);

  const isEditing = value !== lastSavedValue;

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      [inactivityTimerRef, statusTimerRef].forEach((ref) => {
        if (ref.current) clearTimeout(ref.current);
      });
    };
  }, []);

  // Inject style for Firefox to hide drag notches if needed
  useEffect(() => {
    if (!hideResizeHandle) return undefined;

    const styleId = 'auto-save-textarea-firefox-styles';
    if (document.getElementById(styleId)) return undefined;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @-moz-document url-prefix() {
        .auto-save-textarea-drag-notches {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [hideResizeHandle]);

  const saveValue = useCallback(async (valueToSave: string) => {
    if (isSavingRef.current || valueToSave === lastSavedValue || disabled) {
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      await onSave(valueToSave);
      setLastSavedValue(valueToSave);
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

  // Periodic save timer - runs independently at specified interval
  useEffect(() => {
    if (disabled || periodicSaveInterval <= 0) return undefined;

    const runPeriodicSave = () => {
      const currentSaveValue = saveValueRef.current;
      const currentLastSaved = lastSavedValueRef.current;

      if (value !== currentLastSaved) {
        currentSaveValue(value);
      }
    };

    // Set up recurring timer
    const intervalId = window.setInterval(runPeriodicSave, periodicSaveInterval);

    return () => clearInterval(intervalId);
  }, [disabled, periodicSaveInterval]);

  // Inactivity auto-save timer
  useEffect(() => {
    if (!isEditing || disabled || autoSaveDelay <= 0) return undefined;

    // Clear and reset the inactivity timer
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    inactivityTimerRef.current = window.setTimeout(() => {
      saveValue(value);
    }, autoSaveDelay);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [value, isEditing, disabled, saveValue, autoSaveDelay]);

  const handleTextareaBlur = useCallback(() => {
    if (disabled) return;

    if (value !== lastSavedValue) {
      // Cancel inactivity timer on blur save
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      saveValue(value);
    }
  }, [lastSavedValue, disabled, saveValue, value]);

  const handleRetry = useCallback(() => {
    if (value !== lastSavedValue) {
      saveValue(value);
    }
  }, [value, lastSavedValue, saveValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const textareaClasses = clsx(
    'box-border w-full bg-white rounded-[10px]',
    'font-normal text-[14px] leading-[160%] tracking-[-0.002em] text-[#13132E]',
    'resize-y outline-none transition-all duration-200 block',
    'border-[0.5px] border-[rgba(19,19,46,0.25)]',
    'focus:border-[1.25px] focus:border-[#1641D9] focus:shadow-[0px_0px_10px_rgba(34,68,187,0.3)]',
    'disabled:cursor-not-allowed disabled:opacity-60',
    hideResizeHandle && '[&::-webkit-resizer]:hidden',
    className,
  );

  const wrapperContent = (
    <>
      <textarea
        value={value}
        onChange={handleChange}
        onBlur={handleTextareaBlur}
        className={textareaClasses}
        style={{ minHeight }}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={showSaveStatus && !disabled ? 'save-status-message' : undefined}
      />
      {/* Custom drag notches overlay - only show if not hiding resize handle */}
      {!hideResizeHandle && (
        <div className="auto-save-textarea-drag-notches absolute w-[15px] h-[14px] right-2 bottom-2 pointer-events-none z-[2]">
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
      )}
    </>
  );

  return (
    <div className="flex flex-col relative">
      {hideResizeHandle ? (
        // Wrapper that clips drag notches to textarea boundaries
        <div className="relative w-full overflow-hidden rounded-[10px] z-[1]">
          {wrapperContent}
        </div>
      ) : (
        // Simple wrapper without clipping
        <div className="relative w-full">
          {wrapperContent}
        </div>
      )}
      {showSaveStatus && !disabled && (
        <SaveStatusIndicator
          status={saveStatus}
          id="save-status-message"
          onRetry={handleRetry}
          savedText={savedText}
        />
      )}
    </div>
  );
};

export default AutoSaveTextarea;
