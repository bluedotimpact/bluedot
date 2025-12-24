import { CTALinkOrButton, Input, P } from '@bluedot/ui';
import clsx from 'clsx';
import React, { useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/router';
import { FaUndo } from 'react-icons/fa';
import { formatStringToArray } from '../../../lib/utils';
import { getLoginUrl } from '../../../utils/getLoginUrl';
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';

type MultipleChoiceProps = {
  // Required
  answer: string;
  description: string;
  onExerciseSubmit: (savedExerciseResponse: string, completed?: boolean) => Promise<void>;
  options: string;
  title: string;
  // Optional
  className?: string;
  exerciseResponse?: string;
  isLoggedIn?: boolean;
};

type FormData = {
  answer: string;
};

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  answer,
  className,
  description,
  exerciseResponse,
  isLoggedIn,
  onExerciseSubmit,
  options,
  title,
}) => {
  const router = useRouter();
  /**
   * Options are stored as a string with newlines
   * Format them to be an array of strings with no empty strings (i.e., removing trailing return statements)
   */
  const formattedOptions = formatStringToArray(options, '\n');
  const formattedAnswer = answer.trim();
  const formattedExerciseResponse = exerciseResponse?.trim();

  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
    control,
  } = useForm<FormData>({
    defaultValues: {
      answer: formattedExerciseResponse,
    },
  });

  const currentAnswer = useWatch({ control, name: 'answer' });

  const handleOptionSelect = (option: string) => {
    setValue('answer', option);
    setIsEditing(true);
  };

  useEffect(() => {
    if (formattedExerciseResponse) {
      setValue('answer', formattedExerciseResponse);
    }
  }, [formattedExerciseResponse, setValue]);

  const onSubmit = useCallback(
    async (data: FormData) => {
      const isAnswerCorrect = data.answer === formattedAnswer;
      await onExerciseSubmit(data.answer, isAnswerCorrect);
      setIsEditing(false);
    },
    [onExerciseSubmit, formattedAnswer],
  );

  const handleTryAgain = () => {
    // Don't block on this request, we want to reset state immediately
    onExerciseSubmit('', false);
    setIsEditing(true);
    setValue('answer', '');
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) return 'Checking...';
    if (currentAnswer) return 'Check answer';
    return 'Select an option'; // No quiz options have been selected yet
  };

  const isCorrect = !isEditing && formattedExerciseResponse && formattedExerciseResponse === formattedAnswer;
  const isIncorrect = !isEditing && formattedExerciseResponse && formattedExerciseResponse !== formattedAnswer;

  const getOptionClasses = (option: string) => {
    const selected = currentAnswer === option;

    if (!selected) {
      // If there is a submitted answer, or the user is not logged in, dim unselected option text and don't allow hover effects.
      return `bg-[#2A2D340A] border-transparent ${isCorrect || isIncorrect || !isLoggedIn ? 'text-gray-400' : 'hover:bg-[#F0F5FD]'}`;
    }
    if (isCorrect) return 'bg-[#18B71B1A] border-[#18B71B]';
    if (isIncorrect) return 'bg-[#DC00001A] border-[#DC0000]';

    // Default style for selected option (when no answer has been submitted yet)
    return 'bg-[#F0F5FD] border-bluedot-normal';
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        // Need to add z-indexing so that when we shift the 'Correct! Quiz completed' text upwards using negative margin
        // it sits _behind_ the form card
        className={clsx('container-lined relative z-10 flex flex-col gap-6 bg-white p-8', className)}
      >
        <div className="flex flex-col gap-2">
          <p className="bluedot-h4 not-prose">{title}</p>
          <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
        </div>
        <div className="flex flex-col gap-2">
          {formattedOptions.map((option) => {
            return (
              <Input
                key={option}
                {...register('answer')}
                labelClassName={clsx('flex items-center gap-2 p-4 rounded-lg border-2', getOptionClasses(option))}
                inputClassName="flex-shrink-0"
                type="radio"
                value={option}
                onChange={() => handleOptionSelect(option)}
                disabled={!isLoggedIn || Boolean(isCorrect)}
              />
            );
          })}
        </div>
        {!isLoggedIn && (
          <CTALinkOrButton
            className="!bg-bluedot-normal !whitespace-normal"
            variant="primary"
            url={getLoginUrl(router.asPath, true)}
            withChevron
          >
            Create a free account to check your answer
          </CTALinkOrButton>
        )}
        {/* Submit button */}
        {isLoggedIn && !isCorrect && !isIncorrect && (
          <CTALinkOrButton
            className="!bg-bluedot-normal"
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || !currentAnswer}
          >
            {getSubmitButtonText()}
          </CTALinkOrButton>
        )}
        {/* Try again button */}
        {isLoggedIn && isIncorrect && (
          <CTALinkOrButton onClick={handleTryAgain} variant="black">
            <span className="flex items-center gap-2">
              Try again
              <FaUndo aria-hidden="true" />
            </span>
          </CTALinkOrButton>
        )}
      </form>
      {isCorrect && (
        <P className="relative z-0 -mt-2 w-full rounded-lg bg-[#F0F5FD] px-6 pt-4 pb-2 text-bluedot-normal">
          Correct! Quiz completed. 🎉
        </P>
      )}
    </div>
  );
};

export default MultipleChoice;
