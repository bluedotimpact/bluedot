import { CTALinkOrButton, Radio, type RadioTone } from '@bluedot/ui';
import React, { useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/router';
import { FaUndo } from 'react-icons/fa';
import { formatStringToArray } from '../../../lib/utils';
import { getLoginUrl } from '../../../utils/getLoginUrl';

type MultipleChoiceProps = {
  // Required
  answer: string;
  onExerciseSubmit: (savedExerciseResponse: string, completed?: boolean) => Promise<void>;
  options: string;
  // Optional
  exerciseResponse?: string;
  isLoggedIn?: boolean;
};

type FormData = {
  answer: string;
};

const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  answer,
  exerciseResponse,
  isLoggedIn,
  onExerciseSubmit,
  options,
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
    } else if (!isEditing) {
      setValue('answer', '');
      setIsEditing(true);
    }
    // Only re-run when the server response changes, not on isEditing transitions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formattedExerciseResponse, setValue]);

  const onSubmit = useCallback(
    (data: FormData) => {
      const isAnswerCorrect = data.answer === formattedAnswer;
      void onExerciseSubmit(data.answer, isAnswerCorrect);
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
    if (currentAnswer) return 'Check answer';
    return 'Select an option'; // No quiz options have been selected yet
  };

  const hasResult = !isEditing && Boolean(currentAnswer);
  const isCorrect = hasResult && currentAnswer === formattedAnswer;
  const isIncorrect = hasResult && !isCorrect;

  let resultTone: RadioTone | undefined;
  if (isCorrect) resultTone = 'success';
  if (isIncorrect) resultTone = 'error';

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        {formattedOptions.map((option) => (
          <Radio
            key={option}
            {...register('answer')}
            card
            value={option}
            tone={currentAnswer === option ? resultTone : undefined}
            onChange={() => handleOptionSelect(option)}
            disabled={!isLoggedIn || isCorrect}
          >
            {option}
          </Radio>
        ))}
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
      {isLoggedIn && !hasResult && (
        <CTALinkOrButton
          className="!bg-bluedot-normal"
          variant="primary"
          type="submit"
          disabled={!currentAnswer}
        >
          {getSubmitButtonText()}
        </CTALinkOrButton>
      )}
      {isLoggedIn && isIncorrect && (
        <CTALinkOrButton onClick={handleTryAgain} variant="black">
          <span className="flex items-center gap-2">
            Try again
            <FaUndo aria-hidden="true" />
          </span>
        </CTALinkOrButton>
      )}
    </form>
  );
};

export default MultipleChoice;
