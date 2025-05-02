import { addQueryParam, CTALinkOrButton, Input } from '@bluedot/ui';
import clsx from 'clsx';
import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ROUTES } from '../../../lib/routes';
import { P } from '../../Text';
import { formatStringToArray } from '../../../lib/utils';

type MultiSelectProps = {
  // Required
  answer: string;
  description: string;
  onExerciseSubmit: (savedExerciseResponse: string, isAnswerCorrect: boolean) => void;
  options: string;
  title: string;
  // Optional
  className?: string;
  exerciseResponse?: string;
  isLoggedIn?: boolean;
};

type FormData = {
  answers: string[];
};

const MultiSelect: React.FC<MultiSelectProps> = ({
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
  const formattedOptions = formatStringToArray(options, '\n');
  const formattedAnswers = formatStringToArray(answer, '\n');
  const formattedExerciseResponses = exerciseResponse ? formatStringToArray(exerciseResponse, '\n') : [];

  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([]);
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const {
    register, handleSubmit, setValue, formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      answers: formattedExerciseResponses || [],
    },
  });

  const handleOptionSelect = (option: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      }
      return [...prev, option];
    });
    setIsEditing(true);
  };

  const isSelected = (option: string): boolean => {
    if (!isEditing && formattedExerciseResponses) {
      return formattedExerciseResponses.includes(option);
    }
    return selectedOptions.includes(option);
  };

  // useEffect(() => {
  //   if (formattedExerciseResponses) {
  //     setValue('answers', formattedExerciseResponses);
  //     setSelectedOptions(formattedExerciseResponses);
  //   }
  // }, [formattedExerciseResponses, setValue]);

  const onSubmit = useCallback(async (data: FormData) => {
    const isAnswerCorrect = JSON.stringify(data.answers.sort()) === JSON.stringify(formattedAnswers.sort());
    await onExerciseSubmit(data.answers.join('\n'), isAnswerCorrect);
    setIsEditing(false);
  }, [onExerciseSubmit, formattedAnswers]);

  const isCorrect = formattedExerciseResponses.length > 0 && 
    JSON.stringify(formattedExerciseResponses.sort()) === JSON.stringify(formattedAnswers.sort());
  const isIncorrect = formattedExerciseResponses.length > 0 && 
    JSON.stringify(formattedExerciseResponses.sort()) !== JSON.stringify(formattedAnswers.sort());

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={clsx('multiselect container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="multiselect__header flex flex-col gap-4">
        <div className="multiselect__header-icon">
          <img src="/icons/lightning_bolt.svg" className="w-15 h-15" alt="" />
        </div>
        <div className="multiselect__header-content flex flex-col gap-2">
          <p className="multiselect__title bluedot-h4">{title}</p>
          <P className="multiselect__description">{description}</P>
        </div>
      </div>
      <div className="multiselect__options flex flex-col gap-2">
        {formattedOptions.map((option) => (
          <Input 
            {...register('answers')}
            labelClassName={`
              multiselect__option flex items-center gap-2 p-4 hover:cursor-pointer
              ${(isSelected(option)) ? `multiselect__option--selected container-active
                ${(!isEditing && isCorrect) && 'multiselect__option--correct bg-[#63C96533] border-[#63C965]'}
                ${(!isEditing && isIncorrect) && 'multiselect__option--incorrect bg-[#FF636333] border-[#FF6363]'}`
              : 'container-lined'}`}
            defaultChecked={formattedExerciseResponses?.includes(option)}
            type="checkbox"
            value={option}
            onChange={() => handleOptionSelect(option)}
            disabled={!isLoggedIn}
          />
        ))}
      </div>
      {isLoggedIn ? (
        <CTALinkOrButton
          className="multiselect__submit"
          variant="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Checking...' : 'Check'}
        </CTALinkOrButton>
      ) : (
        <CTALinkOrButton
          className="multiselect__login-cta"
          variant="primary"
          url={addQueryParam(ROUTES.login.url, 'redirect_to', window.location.href)}
          withChevron
        >
          Login to check your answer
        </CTALinkOrButton>
      )}
      {(!isEditing && isCorrect) && <P className="multiselect__correct-msg">Correct! Quiz completed. 🎉</P>}
      {(!isEditing && isIncorrect) && <P className="multiselect__incorrect-msg">Try again. 🤔</P>}
    </form>
  );
};

export default MultiSelect;
