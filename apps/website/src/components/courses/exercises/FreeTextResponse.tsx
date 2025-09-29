import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui';
import React, {
  useCallback, useEffect, useState, useRef,
} from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';
import { getLoginUrl } from '../../../utils/getLoginUrl';
import SaveStatusIndicator from './SaveStatusIndicator';

type SaveStatus = 'idle' | 'typing' | 'saving' | 'saved' | 'error';

type FreeTextResponseProps = {
  className?: string;
  description: string;
  onExerciseSubmit: (exerciseResponse: string, complete?: boolean) => void;
  title: string;
  exerciseResponse?: string;
  isLoggedIn?: boolean;
};

type FormData = {
  answer: string;
};

const FreeTextResponse: React.FC<FreeTextResponseProps> = ({
  className,
  description,
  exerciseResponse,
  isLoggedIn,
  onExerciseSubmit,
  title,
}) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedValue, setLastSavedValue] = useState<string>(exerciseResponse || '');
  const isSavingRef = useRef<boolean>(false);
  const inactivityTimerRef = useRef<number | null>(null);
  const statusTimerRef = useRef<number | null>(null);
  const {
    register, handleSubmit, setValue, watch,
  } = useForm<FormData>({
    defaultValues: {
      answer: exerciseResponse || '',
    },
  });
  const router = useRouter();

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      [inactivityTimerRef, statusTimerRef].forEach((ref) => {
        if (ref.current) clearTimeout(ref.current);
      });
    };
  }, []);

  // Inject style for Firefox to hide drag notches
  useEffect(() => {
    const styleId = 'free-text-response-firefox-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @-moz-document url-prefix() {
        .drag-notches {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // eslint-disable-next-line consistent-return
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  // Monitor current value for showing typing status
  const currentValue = watch('answer');
  const isEditing = currentValue !== lastSavedValue;

  useEffect(() => {
    if (exerciseResponse !== undefined) {
      setValue('answer', exerciseResponse);
      setLastSavedValue(exerciseResponse);
    }
  }, [exerciseResponse, setValue]);

  // Simplified save function without circular dependencies
  const saveValue = useCallback(async (value: string) => {
    if (isSavingRef.current || value === lastSavedValue) {
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      await onExerciseSubmit(value, value.trim().length > 0);
      setLastSavedValue(value);
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
  }, [onExerciseSubmit, lastSavedValue]);

  // Store latest values in refs to avoid recreating timer
  const watchRef = useRef(watch);
  const saveValueRef = useRef(saveValue);
  const lastSavedValueRef = useRef(lastSavedValue);

  useEffect(() => {
    watchRef.current = watch;
    saveValueRef.current = saveValue;
    lastSavedValueRef.current = lastSavedValue;
  });

  // Periodic save timer - runs independently every 3 minutes
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    const runPeriodicSave = () => {
      const currentVal = watchRef.current('answer') || '';
      if (currentVal !== lastSavedValueRef.current) {
        saveValueRef.current(currentVal);
      }
    };

    // Set up recurring 3-minute timer
    const intervalId = window.setInterval(runPeriodicSave, 3 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [isLoggedIn]);

  // Inactivity auto-save timer (5 seconds)
  useEffect(() => {
    if (!isEditing || !isLoggedIn) return undefined;

    // Clear and reset the inactivity timer
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    inactivityTimerRef.current = window.setTimeout(() => {
      const currentVal = watch('answer') || '';
      saveValue(currentVal);
    }, 5000);

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [currentValue, isEditing, isLoggedIn, saveValue, watch]);

  const onSubmit = useCallback((data: FormData) => {
    // Cancel inactivity timer on manual save
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    saveValue(data.answer);
  }, [saveValue]);

  const handleTextareaBlur = useCallback(() => {
    if (!isLoggedIn) return;

    const currentVal = watch('answer') || '';
    if (currentVal !== lastSavedValue) {
      // Cancel inactivity timer on blur save
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      saveValue(currentVal);
    }
  }, [lastSavedValue, isLoggedIn, saveValue, watch]);

  const handleRetry = useCallback(() => {
    const currentVal = watch('answer') || '';
    if (currentVal !== lastSavedValue) {
      saveValue(currentVal);
    }
  }, [watch, lastSavedValue, saveValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={clsx('container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="bluedot-h4 not-prose">{title}</p>
          <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
        </div>
      </div>
      <div className="flex flex-col relative">
        {/* Wrapper that clips drag notches to textarea boundaries */}
        <div className="relative w-full overflow-hidden rounded-[10px] z-[1]">
          <textarea
            {...register('answer')}
            className={clsx(
              'box-border w-full min-h-[140px] bg-white rounded-[10px] px-6 py-5',
              'font-normal text-[15px] leading-[160%] tracking-[-0.002em] text-[#13132E]',
              'resize-y outline-none transition-all duration-200 block',
              'border-[0.5px] border-[rgba(19,19,46,0.25)]',
              'focus:border-[1.25px] focus:border-[#1641D9] focus:shadow-[0px_0px_10px_rgba(34,68,187,0.3)]',
              'disabled:cursor-not-allowed disabled:opacity-60',
              '[&::-webkit-resizer]:hidden',
            )}
            onBlur={handleTextareaBlur}
            placeholder={isLoggedIn ? 'Enter your answer here' : 'Create an account to save your answers'}
            disabled={!isLoggedIn}
            aria-label={`Writing exercise: ${title}`}
            aria-describedby={isLoggedIn ? 'save-status-message' : undefined}
            aria-required="false"
          />
          {/* Custom drag notches overlay - positioned within the clipping wrapper */}
          <div className="drag-notches absolute w-[15px] h-[14px] right-2 bottom-2 pointer-events-none z-[2]">
            <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g opacity="0.6" clipPath="url(#clip0_910_4280)">
                <path d="M11.875 7L7.5 11.375" stroke="#13132E" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M11 2.1875L2.6875 10.5" stroke="#13132E" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <defs>
                <clipPath id="clip0_910_4280">
                  <rect width="14" height="14" fill="white" transform="translate(0.5)" />
                </clipPath>
              </defs>
            </svg>
          </div>
        </div>
        {isLoggedIn && (
          <SaveStatusIndicator
            status={saveStatus}
            isEditing={isEditing}
            id="save-status-message"
            onRetry={handleRetry}
          />
        )}
      </div>
      {!isLoggedIn && (
        <div className="w-full flex">
          <CTALinkOrButton
            variant="primary"
            url={getLoginUrl(router.asPath, true)}
            withChevron
            className="!w-auto !whitespace-normal text-center min-w-0"
          >
            Create a free account to save your answers
          </CTALinkOrButton>
        </div>
      )}
    </form>
  );
};

export default FreeTextResponse;
