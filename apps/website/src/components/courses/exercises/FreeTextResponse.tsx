import clsx from 'clsx';
import { CTALinkOrButton, Tag } from '@bluedot/ui';
import React, { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { P } from '../../Text';
// eslint-disable-next-line import/no-cycle
import MarkdownExtendedRenderer from '../MarkdownExtendedRenderer';
import { getLoginUrl } from '../../../utils/getLoginUrl';

type FreeTextResponseProps = {
  // Required
  className?: string;
  description: string;
  onExerciseSubmit: (exerciseResponse: string, complete?: boolean) => void;
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
  const {
    register, handleSubmit, setValue, formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      answer: exerciseResponse,
    },
  });
  const router = useRouter();

  useEffect(() => {
    if (exerciseResponse) {
      setValue('answer', exerciseResponse);
    }
  }, [exerciseResponse, setValue]);

  const onSubmit = useCallback(async (data: FormData) => {
    await onExerciseSubmit(data.answer, data.answer.trim().length > 0);
    setIsEditing(false);
  }, [onExerciseSubmit]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={clsx('free-text-response container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="free-text-response__header flex flex-col gap-4">
        <Tag variant="secondary" className="uppercase">
          Think it through
        </Tag>
        <div className="free-text-response__header-content flex flex-col gap-2">
          <p className="free-text-response__title bluedot-h4 not-prose">{title}</p>
          <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
        </div>
      </div>
      <div className="free-text-response__options flex flex-col gap-2">
        <textarea
          {...register('answer')}
          className={`free-text-response__textarea p-4${
            (!isEditing && exerciseResponse) ? ' free-text-response__textarea--saved container-active bg-[#63C96533] border-[#63C965] text-[#2A5D2A]' : ' container-lined'
          }`}
          placeholder={isLoggedIn ? 'Enter your answer here' : 'Create an account to save your answers'}
          onChange={() => setIsEditing(true)}
          disabled={!isLoggedIn}
        />
      </div>
      {isLoggedIn ? (
        <CTALinkOrButton
          className="free-text-response__submit"
          variant="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </CTALinkOrButton>
      ) : (
        <CTALinkOrButton
          className="free-text-response__login-cta"
          variant="primary"
          url={getLoginUrl(router.asPath, true)}
          withChevron
        >
          Create a free account to save your answers
        </CTALinkOrButton>
      )}
      {(!isEditing && exerciseResponse) && <P className="free-text-response__saved-msg">Saved! 🎉</P>}
    </form>
  );
};

export default FreeTextResponse;
