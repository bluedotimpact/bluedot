import { addQueryParam, CTALinkOrButton } from '@bluedot/ui';
import clsx from 'clsx';
import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ROUTES } from '../../../lib/routes';

type MultipleChoiceProps = {
  // Required
  answer: string;
  description: string;
  onExerciseSubmit: (savedExerciseResponse: string, completed?: boolean) => void;
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
  /**
   * Options are stored as a string with newlines
   * Format them to be an array of strings with no empty strings (i.e., removing trailing return statements)
   */
  const formattedOptions = (options.split('\n').map((o) => o.trim()).filter((o) => o !== ''));
  const formattedAnswer = answer.trim();
  const formattedExerciseResponse = exerciseResponse?.trim();

  const [selectedOption, setSelectedOption] = React.useState<string | null>();
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const { register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      answer: formattedExerciseResponse || '',
    },
  });

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setIsEditing(true);
  };

  const isSelected = (option: string): boolean => {
    if (!isEditing && formattedExerciseResponse) {
      return formattedExerciseResponse === option;
    }
    return selectedOption === option;
  };

  useEffect(() => {
    if (formattedExerciseResponse) {
      setValue('answer', formattedExerciseResponse);
    }
  }, [formattedExerciseResponse, setValue]);

  const onSubmit = useCallback(async (data: FormData) => {
    try {
      const isAnswerCorrect = data.answer === formattedAnswer;
      console.log('submitted this answer: ', data.answer, ' and is it correct? ', isAnswerCorrect);
      await onExerciseSubmit(data.answer, isAnswerCorrect);
      setIsEditing(false);
    } catch (e) {
      console.log('error', e);
      // Set some state for the error and render it
    }
  }, [onExerciseSubmit]);

  const isCorrect = formattedExerciseResponse && formattedExerciseResponse === formattedAnswer;
  const isIncorrect = formattedExerciseResponse && formattedExerciseResponse !== formattedAnswer;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={clsx('multiple-choice container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="multiple-choice__header flex flex-col gap-4">
        <div className="multiple-choice__header-icon">
          <img src="/icons/lightning_bolt.svg" className="w-15 h-15" alt="" />
        </div>
        <div className="multiple-choice__header-content flex flex-col gap-2">
          <p className="multiple-choice__title subtitle-sm">{title}</p>
          <p className="multiple-choice__description">{description}</p>
        </div>
      </div>
      <div className="multiple-choice__options flex flex-col gap-2">
        {formattedOptions.map((option) => (
          <label
            key={option}
            className={`
              multiple-choice__option flex items-center gap-2 p-4 hover:cursor-pointer
              ${(isSelected(option)) ? `multiple-choice__option--selected container-active
                ${(!isEditing && isCorrect) && 'multiple-choice__option--correct bg-[#63C96533] border-[#63C965]'}
                ${(!isEditing && isIncorrect) && 'multiple-choice__option--incorrect bg-[#FF636333] border-[#FF6363]'}`
              : 'container-lined'}`}
          >
            <input
              {...register('answer')}
              defaultChecked={formattedExerciseResponse === option}
              className="multiple-choice__input"
              type="radio"
              value={option}
              onChange={() => handleOptionSelect(option)}
              disabled={!isLoggedIn}
            />
            <span className="multiple-choice__label">{option}</span>
          </label>
        ))}
      </div>
      {isLoggedIn ? (
        <CTALinkOrButton
          className="multiple-choice__submit"
          variant="primary"
          type="submit"
        >
          Check
        </CTALinkOrButton>
      ) : (
        <CTALinkOrButton
          className="multiple-choice__login-cta"
          variant="primary"
          url={addQueryParam(ROUTES.login.url, 'redirect_to', window.location.href)}
          withChevron
        >
          Login to check your answer
        </CTALinkOrButton>
      )}
      {(!isEditing && isCorrect) && <p className="multiple-choice__correct-msg">Correct! Quiz completed. 🎉</p>}
      {(!isEditing && isIncorrect) && <p className="multiple-choice__incorrect-msg">Try again. 🤔</p>}
    </form>
  );
};

export default MultipleChoice;
