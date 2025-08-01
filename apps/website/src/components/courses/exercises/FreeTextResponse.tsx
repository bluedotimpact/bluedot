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

  // Inject styles for textarea resize handle
  useEffect(() => {
    const styleId = 'free-text-response-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .free-text-response__textarea {
        resize: vertical;
      }
      .free-text-response__textarea::-webkit-resizer {
        display: none;
      }
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
    <form onSubmit={handleSubmit(onSubmit)} className={clsx('free-text-response container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="free-text-response__header flex flex-col gap-4">
        <Tag variant="secondary" className="uppercase">
          Think it through
        </Tag>
        <div className="free-text-response__header-content flex flex-col gap-2">
          <p className="free-text-response__title bluedot-h4 not-prose">{title}</p>
          <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
        </div>
      </div>
      <div className="free-text-response__options flex flex-col relative">
        {/* Wrapper that clips drag notches to textarea boundaries */}
        <div
          className="textarea-wrapper"
          style={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            borderRadius: '10px',
            zIndex: 1,
          }}
        >
          <textarea
            {...register('answer')}
            className="free-text-response__textarea transition-all duration-200"
            style={{
              boxSizing: 'border-box',
              width: '100%',
              minHeight: '140px',
              background: '#FFFFFF',
              border: '0.5px solid rgba(19, 19, 46, 0.25)',
              borderRadius: '10px',
              padding: '20px 24px',
              fontWeight: 400,
              fontSize: '15px',
              lineHeight: '160%',
              letterSpacing: '-0.002em',
              color: '#13132E',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
              display: 'block',
            }}
            onFocus={(e) => {
              e.target.style.border = '1.25px solid #1641D9';
              e.target.style.boxShadow = '0px 0px 10px rgba(34, 68, 187, 0.3)';
            }}
            onBlur={(e) => {
              e.target.style.border = '0.5px solid rgba(19, 19, 46, 0.25)';
              e.target.style.boxShadow = 'none';
              handleTextareaBlur();
            }}
            placeholder={isLoggedIn ? 'Enter your answer here' : 'Create an account to save your answers'}
            disabled={!isLoggedIn}
            aria-label={`Writing exercise: ${title}`}
            aria-describedby={isLoggedIn ? 'save-status-message' : undefined}
            aria-required="false"
          />
          {/* Custom drag notches overlay - positioned within the clipping wrapper */}
          <div
            className="drag-notches"
            style={{
              position: 'absolute',
              width: '15px',
              height: '14px',
              right: '8px',
              bottom: '8px',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          >
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
          className="free-text-response__login-cta"
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
