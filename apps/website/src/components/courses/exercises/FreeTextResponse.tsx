import { cn, Button } from '@bluedot/ui';
import type React from 'react';
import {
  useCallback, useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/router';
import { FaChevronRight, FaRotateLeft } from 'react-icons/fa6';
import { getLoginUrl } from '../../../utils/getLoginUrl';
import RichTextAutoSaveEditor from './RichTextAutoSaveEditor';

export type FreeTextResponseProps = {
  onExerciseSubmit: (exerciseResponse: string, complete?: boolean) => Promise<void>;
  exerciseResponse?: string;
  isCompleted?: boolean;
  isLoggedIn?: boolean;
  onTextChange?: (text: string) => void;
};

const FreeTextResponse: React.FC<FreeTextResponseProps> = ({
  exerciseResponse,
  isCompleted = false,
  isLoggedIn,
  onExerciseSubmit,
  onTextChange,
}) => {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const [answer, setAnswer] = useState<string>(exerciseResponse || '');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    setAnswer(exerciseResponse || '');
  }, [exerciseResponse]);

  const hasText = answer.trim().length > 0;
  const isDisabled = !isCompleted && !hasText;

  useEffect(() => {
    onTextChange?.(answer);
  }, [answer, onTextChange]);
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
          <Button
            variant="primary"
            url={getLoginUrl(router.asPath, true)}
            className="!w-auto !whitespace-normal text-center min-w-0"
          >
            Create a free account to save your answers
            <FaChevronRight aria-hidden className="size-4 shrink-0" />
          </Button>
        </div>
      )}

      {/* "Complete" button */}
      {showCompleteButton && (
        // Keep focus in the editor so the pending autosave fires before the completion toggle
        <div onMouseDown={(e) => e.preventDefault()}>
          {!isCompleted ? (
            <Button
              size="small"
              onClick={handleMarkComplete}
              disabled={isDisabled}
              aria-label="Mark exercise as complete"
            >
              Complete
            </Button>
          ) : (
            <button
              type="button"
              onClick={handleMarkIncomplete}
              className="flex items-center gap-2 h-[30px] transition-all duration-200 hover:opacity-70 bg-transparent border-none cursor-pointer p-0"
              aria-label="Mark exercise as incomplete"
            >
              <span className="font-medium text-size-xs leading-normal text-bluedot-normal">
                Completed
              </span>
              <FaRotateLeft aria-hidden="true" className="size-4 text-bluedot-normal" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FreeTextResponse;
