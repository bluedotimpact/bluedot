import React, {
  useCallback, useEffect, useState, useRef,
} from 'react';
import clsx from 'clsx';
import SaveStatusIndicator from './SaveStatusIndicator';
import { cn } from '@bluedot/ui';

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

type AutoSaveTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const AutoSaveTextarea: React.FC<AutoSaveTextareaProps> = ({
  value,
  onChange,
  onSave,
  placeholder = 'Enter text here',
  disabled = false,
  className,
}) => {
  const autoSaveDelayInMs = 20000; // 20 seconds
  const periodicSaveIntervalInMs = 180000; // 3 minutes
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedValue, setLastSavedValue] = useState<string>(value);
  const isSavingRef = useRef<boolean>(false);
  const inactivityTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const valueRef = useRef<string>(value);

  const isEditing = value !== lastSavedValue;

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
    if (disabled || periodicSaveIntervalInMs <= 0) return undefined;

    const runPeriodicSave = () => {
      const currentSaveValue = saveValueRef.current;
      const currentLastSaved = lastSavedValueRef.current;
      const currentValue = valueRef.current;

      if (currentValue !== currentLastSaved) {
        currentSaveValue(currentValue);
      }
    };

    // Set up recurring timer
    const intervalId = window.setInterval(runPeriodicSave, periodicSaveIntervalInMs);

    return () => clearInterval(intervalId);
  }, [disabled, periodicSaveIntervalInMs]);

  // Inactivity auto-save timer
  useEffect(() => {
    if (!isEditing || disabled || autoSaveDelayInMs <= 0) return undefined;

    // Clear and reset the inactivity timer
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    inactivityTimerRef.current = window.setTimeout(() => {
      saveValue(value);
    }, autoSaveDelayInMs);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [value, isEditing, disabled, saveValue, autoSaveDelayInMs]);

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

  const textareaClasses = cn(
    'box-border w-full bg-white rounded-[10px] px-6 py-5 z-[1]',
    'min-h-[140px]',
    'font-normal text-[14px] leading-[160%] tracking-[-0.002em] text-[#13132E]',
    'resize-y outline-none transition-all duration-200 block',
    'border-[0.5px] border-[rgba(19,19,46,0.25)]',
    'focus:border-[1.25px] focus:border-[#1641D9] focus:shadow-[0px_0px_10px_rgba(34,68,187,0.3)]',
    'disabled:cursor-not-allowed disabled:opacity-60',
    '[&::-webkit-resizer]:hidden',
    className,
  );

  return (
    <div className="flex flex-col relative">
      <div className="relative w-full z-[1]">
        <textarea
          value={value}
          onChange={handleChange}
          onBlur={handleTextareaBlur}
          className={textareaClasses}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Text input area"
          aria-describedby={!disabled ? 'save-status-message' : undefined}
        />
        {/* Custom drag notches overlay */}
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
      </div>
      {!disabled && (
        <SaveStatusIndicator
          status={saveStatus}
          id="save-status-message"
          onRetry={handleRetry}
          savedText="Saved"
        />
      )}
    </div>
  );
};

export default AutoSaveTextarea;
