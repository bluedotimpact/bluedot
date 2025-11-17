import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui';
import React, {
  useCallback, useEffect,
} from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';
import { getLoginUrl } from '../../../utils/getLoginUrl';
import AutoSaveTextarea from './AutoSaveTextarea';
import { downloadAsText } from '../../../utils/downloadExerciseResponse';

type FreeTextResponseProps = {
  className?: string;
  description: string;
  onExerciseSubmit: (exerciseResponse: string, complete?: boolean) => Promise<void>;
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
  const {
    handleSubmit, setValue, watch,
  } = useForm<FormData>({
    defaultValues: {
      answer: exerciseResponse || '',
    },
  });
  const router = useRouter();

  useEffect(() => {
    if (exerciseResponse !== undefined) {
      setValue('answer', exerciseResponse);
    }
  }, [exerciseResponse, setValue]);

  const handleSave = useCallback(async (value: string) => {
    await onExerciseSubmit(value, value.trim().length > 0);
  }, [onExerciseSubmit]);

  const handleAnswerChange = useCallback((value: string) => {
    setValue('answer', value);
  }, [setValue]);

  const onSubmit = useCallback(async (data: FormData) => {
    await handleSave(data.answer);
  }, [handleSave]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={clsx('container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <p className="bluedot-h4 not-prose">{title}</p>
              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => downloadAsText({ title, description, response: watch('answer') || '' })}
                  aria-label="Download as TXT"
                  className="p-1 -mt-1 -mr-1 rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bluedot-normal flex-shrink-0"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 2.5V12.5M10 12.5L6.25 8.75M10 12.5L13.75 8.75M3.75 16.25H16.25"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>
            <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
          </div>
        </div>
      </div>
      <AutoSaveTextarea
        value={watch('answer')}
        onChange={handleAnswerChange}
        onSave={handleSave}
        placeholder={isLoggedIn ? 'Enter your answer here' : 'Create an account to save your answers'}
        disabled={!isLoggedIn}
      />
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
