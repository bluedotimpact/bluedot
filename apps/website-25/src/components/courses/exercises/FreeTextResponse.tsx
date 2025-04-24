import clsx from 'clsx';
import { CTALinkOrButton } from '@bluedot/ui';
import React, { useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useForm } from 'react-hook-form';
import { ROUTES } from '../../../lib/routes';
import { P } from '../../Text';

type FreeTextResponseProps = {
  // Required
  className?: string;
  description: string;
  onExerciseSubmit: (exerciseResponse: string) => void;
  title: string;
  // Optional
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
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const { register, handleSubmit, setValue } = useForm<FormData>({
    defaultValues: {
      answer: exerciseResponse || '',
    },
  });

  useEffect(() => {
    if (exerciseResponse) {
      setValue('answer', exerciseResponse);
    }
  }, [exerciseResponse, setValue]);

  const onSubmit = useCallback(async (data: FormData) => {
    try {
      await onExerciseSubmit(data.answer);
      setIsEditing(false);
    } catch (e) {
      console.log('error', e);
      // Set some state for the error and render it
    }
  }, [onExerciseSubmit]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={clsx('free-text-response container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="free-text-response__header flex flex-col gap-4">
        <div className="free-text-response__header-icon">
          <img src="/icons/lightning_bolt.svg" className="w-15 h-15" alt="" />
        </div>
        <div className="free-text-response__header-content flex flex-col gap-2">
          <P className="free-text-response__title bluedot-h4">{title}</P>
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      </div>
      <div className="free-text-response__options flex flex-col gap-2">
        <textarea
          {...register('answer')}
          className={`free-text-response__textarea p-4${
            (!isEditing && exerciseResponse) ? ' free-text-response__textarea--saved container-active bg-[#63C96533] border-[#63C965] text-[#2A5D2A]' : ' container-lined'
          }`}
          placeholder={isLoggedIn ? 'Enter your answer here' : 'Login to save your answers'}
          onChange={() => setIsEditing(true)}
          disabled={!isLoggedIn}
        />
      </div>
      {isLoggedIn ? (
        <CTALinkOrButton
          className="free-text-response__submit"
          variant="primary"
          type="submit"
        >
          Save
        </CTALinkOrButton>
      ) : (
        <CTALinkOrButton
          className="free-text-response__login-cta"
          variant="primary"
          url={ROUTES.login.url}
          withChevron
        >
          Login to save your answers
        </CTALinkOrButton>
      )}
      {(!isEditing && exerciseResponse) && <P className="free-text-response__saved-msg">Saved! 🎉</P>}
    </form>
  );
};

export default FreeTextResponse;
