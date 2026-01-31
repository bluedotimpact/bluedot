import { cn, CTALinkOrButton } from '@bluedot/ui';
import React, {
  useCallback, useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/router';
import { getLoginUrl } from '../../../utils/getLoginUrl';
import RichTextAutoSaveEditor from './RichTextAutoSaveEditor';
import { UndoIcon } from '../../icons/UndoIcon';

export type FreeTextResponseProps = {
  onExerciseSubmit: (exerciseResponse: string, complete?: boolean) => Promise<void>;
  exerciseResponse?: string;
  isCompleted?: boolean;
  isLoggedIn?: boolean;
};

const FreeTextResponse: React.FC<FreeTextResponseProps> = ({
  exerciseResponse,
  isCompleted = false,
  isLoggedIn,
  onExerciseSubmit,
}) => {
  // TODO just confirm that no functionality has changed here apart from simplifying and moving up to parent
  const router = useRouter();
  const [answer, setAnswer] = useState<string>(exerciseResponse || '');

  useEffect(() => {
    setAnswer(exerciseResponse || '');
  }, [exerciseResponse]);

  const hasText = answer.trim().length > 0;
  const isDisabled = !isCompleted && !hasText;
  const showCompleteButton = isLoggedIn;

  const handleSave = useCallback(async (value: string) => {
    await onExerciseSubmit(value, undefined);
  }, [onExerciseSubmit]);

  const handleMarkComplete = useCallback(() => {
    onExerciseSubmit(answer, true).catch(() => {});
  }, [answer, onExerciseSubmit]);

  const handleMarkIncomplete = useCallback(() => {
    onExerciseSubmit(answer, false).catch(() => {});
  }, [answer, onExerciseSubmit]);

  return (
    <div className={cn('flex flex-col gap-2')}>
      <RichTextAutoSaveEditor
        value={answer}
        onChange={setAnswer}
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

      {/* "Complete" button */}
      {showCompleteButton && (
        <div>
          {!isCompleted ? (
            <button
              type="button"
              onClick={handleMarkComplete}
              disabled={isDisabled}
              className={cn(
                'flex flex-row justify-center items-center px-2.5 py-1.5 gap-2 h-[30px] rounded-md border-none font-medium text-[13px] leading-[140%] tracking-[-0.005em] transition-all duration-200 bg-bluedot-normal text-white cursor-pointer',
                isDisabled && 'opacity-60 cursor-not-allowed',
              )}
              aria-label="Mark exercise as complete"
            >
              Complete
            </button>
          ) : (
            <button
              type="button"
              onClick={handleMarkIncomplete}
              className="flex items-center gap-2 h-[30px] transition-all duration-200 hover:opacity-70 bg-transparent border-none cursor-pointer p-0"
              aria-label="Mark exercise as incomplete"
            >
              <span className="font-medium text-[13px] leading-[140%] tracking-[-0.005em] text-bluedot-normal">
                Completed
              </span>
              <UndoIcon className="text-bluedot-normal" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FreeTextResponse;
