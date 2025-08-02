import clsx from 'clsx';
import { CTALinkOrButton, Tag } from '@bluedot/ui';
import React, { useCallback, useEffect, useState } from 'react';
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
  const {
    register, handleSubmit, setValue, watch,
  } = useForm<FormData>({
    defaultValues: {
      answer: exerciseResponse || '',
    },
  });
  const router = useRouter();

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

  useEffect(() => {
    if (exerciseResponse !== undefined) {
      setValue('answer', exerciseResponse);
      setLastSavedValue(exerciseResponse);
    }
  }, [exerciseResponse, setValue]);

  const handleSave = useCallback(async (value: string) => {
    if (!value || value.trim() === lastSavedValue.trim()) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');

    try {
      await onExerciseSubmit(value, value.trim().length > 0);

      setLastSavedValue(value);
      setSaveStatus('saved');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      setSaveStatus('error');
    }
  }, [onExerciseSubmit, lastSavedValue]);

  // Monitor current value for showing typing status
  const currentValue = watch('answer');
  const hasUserChangedValue = currentValue !== (exerciseResponse || '');
  const isEditing = currentValue !== lastSavedValue;

  useEffect(() => {
    // Show typing status when user has made changes
    if (hasUserChangedValue && isEditing) {
      setSaveStatus('typing');
    }
  }, [currentValue, lastSavedValue, hasUserChangedValue, isEditing]);

  const onSubmit = useCallback(async (data: FormData) => {
    await handleSave(data.answer);
  }, [handleSave]);

  const handleTextareaBlur = useCallback(() => {
    const currentVal = watch('answer') || '';
    // Only auto-save if user has changed value and it's different from saved
    if (isLoggedIn && hasUserChangedValue && currentVal !== lastSavedValue) {
      handleSave(currentVal);
    }
  }, [lastSavedValue, isLoggedIn, hasUserChangedValue, handleSave, watch]);

  const handleRetry = useCallback(() => {
    const currentVal = watch('answer') || '';
    if (currentVal && currentVal !== lastSavedValue) {
      handleSave(currentVal);
    }
  }, [watch, lastSavedValue, handleSave]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={clsx('container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="flex flex-col gap-4">
        <Tag variant="secondary" className="uppercase">
          Think it through
        </Tag>
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
        <CTALinkOrButton
          variant="primary"
          url={getLoginUrl(router.asPath, true)}
          withChevron
        >
          Create a free account to save your answers
        </CTALinkOrButton>
      )}
    </form>
  );
};

export default FreeTextResponse;
