import { CTALinkOrButton, Input } from '@bluedot/ui';
import clsx from 'clsx';
import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { FaUndo } from 'react-icons/fa';
import { P } from '../../Text';
import { formatStringToArray } from '../../../lib/utils';
import { getLoginUrl } from '../../../utils/getLoginUrl';
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';

type MultipleChoiceProps = {
  // Required
  answer: string;
  description: string;
  onExerciseSubmit: (savedExerciseResponse: string, completed?: boolean) => void;
  /** Newline-separated string of multiple choice options, e.g. "Option A\nOption B\nOption C" */
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
    watch,
  } = useForm<FormData>({
    defaultValues: {
      answer: formattedExerciseResponse,
    },
  });

  const handleOptionSelect = (option: string) => {
    setValue('answer', option);
    setIsEditing(true);
  };

  const currentAnswer = watch('answer');

  const isSelected = (option: string): boolean => {
    if (!isEditing && formattedExerciseResponse) {
      return formattedExerciseResponse === option;
    }
    return currentAnswer === option;
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
    [onExerciseSubmit],
  );

  const handleTryAgain = () => {
    // Don't block on this request, we want to reset state immediately
    onExerciseSubmit('', false);
    setIsEditing(true);
    setValue('answer', '');
  };

  const isCorrect = !isEditing && formattedExerciseResponse && formattedExerciseResponse === formattedAnswer;
  const isIncorrect = !isEditing && formattedExerciseResponse && formattedExerciseResponse !== formattedAnswer;

  let buttonText = 'Select an option'; // No quiz options have been selected yet
  if (isSubmitting) {
    buttonText = 'Checking...';
  } else if (isIncorrect) {
    buttonText = 'Try again';
    // If the answer is correct we don't show a button at all
  } else if (currentAnswer) {
    buttonText = 'Check answer';
  }

  const getOptionClasses = (option: string) => {
    const selected = isSelected(option);

    if (!selected) {
      // If there is a correct/incorrect answer we dim the other option's text.
      // When not logged in all options are dimmed, and the `disabled` attribute takes care of pointer events.
      if (isCorrect || isIncorrect || !isLoggedIn) {
        return 'bg-[#2A2D340A] text-gray-400 border-transparent';
      }
      return 'bg-[#2A2D340A] hover:bg-[#F0F5FD] border-transparent';
    }
    if (isCorrect) {
      return 'multiple-choice__option--correct bg-[#18B71B1A] border-[#18B71B]';
    }
    if (isIncorrect) {
      return 'multiple-choice__option--incorrect bg-[#DC00001A] border-[#DC0000]';
    }

    // Default style for selected option (when no answer has been submitted yet)
    return 'bg-[#F0F5FD] border-[#2244BB]';
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={clsx('multiple-choice container-lined flex flex-col gap-6 bg-white p-8 relative z-10', className)}
      >
        <div className="multiple-choice__header flex flex-col gap-2">
          <p className="multiple-choice__title bluedot-h4 not-prose">{title}</p>
          <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
        </div>
        <div className="multiple-choice__options flex flex-col gap-2">
          {formattedOptions.map((option) => {
            return (
              <Input
                key={option}
                {...register('answer')}
                labelClassName={clsx('flex items-center gap-2 p-4 rounded-lg border-2', getOptionClasses(option))}
                type="radio"
                value={option}
                onChange={() => handleOptionSelect(option)}
                disabled={!isLoggedIn}
              />
            );
          })}
        </div>
        {!isLoggedIn && (
        <CTALinkOrButton
          className="multiple-choice__login-cta !bg-[#2244BB]"
          variant="primary"
          url={getLoginUrl(router.asPath, true)}
          withChevron
        >
          Create a free account to check your answer
        </CTALinkOrButton>
        )}
        {isLoggedIn && !isCorrect && !isIncorrect && (
        <CTALinkOrButton
          className="multiple-choice__submit !bg-[#2244BB]"
          variant="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting || !currentAnswer}
        >
          {buttonText}
        </CTALinkOrButton>
        )}
        {isLoggedIn && isIncorrect && <TryAgainButton onTryAgain={handleTryAgain} />}
      </form>
      {isCorrect && (
      <P className="multiple-choice__correct-msg w-full bg-[#F0F5FD] px-6 pt-4 pb-2 text-[#2244BB] rounded-lg -mt-2 relative z-0">
        Correct! Quiz completed. 🎉
      </P>
      )}
    </div>
  );
};

const TryAgainButton = ({ onTryAgain }: { onTryAgain: () => void }) => {
  return (
    <CTALinkOrButton className="multiple-choice__submit" onClick={onTryAgain} variant="black">
      <span className="flex items-center gap-2">
        Try again
        <FaUndo />
      </span>
    </CTALinkOrButton>
  );
};

export default MultipleChoice;
