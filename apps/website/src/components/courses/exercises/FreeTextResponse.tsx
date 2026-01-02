import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui';
import React, {
  useCallback, useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/router';
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';
import { getLoginUrl } from '../../../utils/getLoginUrl';
import RichTextAutoSaveEditor from './RichTextAutoSaveEditor';
import { CheckmarkIcon } from '../../icons/CheckmarkIcon';
import { UndoIcon } from '../../icons/UndoIcon';

export type FreeTextResponseProps = {
  className?: string;
  description: string;
  onExerciseSubmit: (exerciseResponse: string, complete?: boolean) => Promise<void>;
  title: string;
  exerciseResponse?: string;
  isCompleted?: boolean;
  isLoggedIn?: boolean;
};

const FreeTextResponse: React.FC<FreeTextResponseProps> = ({
  className,
  description,
  exerciseResponse,
  isCompleted = false,
  isLoggedIn,
  onExerciseSubmit,
  title,
}) => {
  const router = useRouter();
  const [answer, setAnswer] = useState<string>(exerciseResponse || '');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setAnswer(exerciseResponse || '');
  }, [exerciseResponse]);

  const hasText = answer.trim().length > 0;
  const isDisabled = !isCompleted && !hasText;

  const handleSave = useCallback(async (value: string) => {
    await onExerciseSubmit(value, undefined);
  }, [onExerciseSubmit]);

  const handleMarkComplete = useCallback(async () => {
    await onExerciseSubmit(answer, true);
  }, [answer, onExerciseSubmit]);

  const handleMarkIncomplete = useCallback(async () => {
    await onExerciseSubmit(answer, false);
  }, [answer, onExerciseSubmit]);

  return (
    <li className="relative list-none">
      {/* Desktop "complete" button */}
      {isLoggedIn && (
        <div className="absolute hidden lg:block -left-[calc(24px+clamp(12px,3vw,24px))] top-6 z-[1]">
          <button
            type="button"
            onClick={isCompleted ? handleMarkIncomplete : handleMarkComplete}
            disabled={isDisabled}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`Mark as ${isCompleted ? 'incomplete' : 'complete'}`}
            className={clsx(
              'size-6 rounded-full flex items-center justify-center p-0 transition-all duration-300 box-border',
              isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
              isCompleted && 'bg-bluedot-normal border-none',
              !isCompleted && isHovered && !isDisabled && 'bg-[rgba(42,45,52,0.05)] border border-[rgba(42,45,52,0.6)]',
              !isCompleted && !(isHovered && !isDisabled) && 'bg-[#FCFBF9] border border-[rgba(19,19,46,0.2)]',
            )}
          >
            {(isCompleted || (isHovered && !isDisabled)) && (
              <CheckmarkIcon variant={isCompleted ? 'completed' : 'hover'} />
            )}
          </button>
        </div>
      )}

      <div className={clsx('container-lined bg-white p-8 flex flex-col gap-6', className)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="bluedot-h4 not-prose">{title}</p>
            <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
          </div>
        </div>
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

        {/* Mobile "complete" button */}
        {isLoggedIn && (
          <div className="lg:hidden">
            <div className="w-full h-0 opacity-20 border-[0.5px] border-[#13132E] mb-4" />

            {!isCompleted ? (
              <button
                type="button"
                onClick={handleMarkComplete}
                disabled={isDisabled}
                className={clsx(
                  'flex flex-row justify-center items-center px-2.5 py-1.5 gap-2 h-[30px] rounded-md border-none font-medium text-[13px] leading-[140%] tracking-[-0.005em] transition-all duration-200',
                  isDisabled
                    ? 'bg-bluedot-normal/40 text-white/60 cursor-not-allowed'
                    : 'bg-bluedot-normal text-white cursor-pointer',
                )}
                aria-label="Mark exercise as complete"
              >
                Complete
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMarkIncomplete}
                className="flex items-center gap-2 transition-all duration-200 hover:opacity-70 bg-transparent border-none cursor-pointer p-0"
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
    </li>
  );
};

export default FreeTextResponse;
