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
import AutoSaveTextarea from './AutoSaveTextarea';

type FreeTextResponseProps = {
  className?: string;
  description: string;
  onExerciseSubmit: (exerciseResponse: string, complete?: boolean) => Promise<void>;
  title: string;
  exerciseResponse?: string;
  isLoggedIn?: boolean;
};

const FreeTextResponse: React.FC<FreeTextResponseProps> = ({
  className,
  description,
  exerciseResponse,
  isLoggedIn,
  onExerciseSubmit,
  title,
}) => {
  const router = useRouter();
  const [answer, setAnswer] = useState<string>(exerciseResponse || '');

  // Only sync from exerciseResponse on initial mount, not on subsequent changes
  // This prevents the refetch from overwriting user's unsaved changes
  const initialExerciseResponse = React.useRef(exerciseResponse);
  useEffect(() => {
    if (initialExerciseResponse.current !== exerciseResponse && answer === '') {
      setAnswer(exerciseResponse || '');
      initialExerciseResponse.current = exerciseResponse;
    }
  }, [exerciseResponse, answer]);

  const handleSave = useCallback(async (value: string) => {
    await onExerciseSubmit(value, value.trim().length > 0);
  }, [onExerciseSubmit]);

  return (
    <div className={clsx('container-lined bg-white p-8 flex flex-col gap-6', className)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="bluedot-h4 not-prose">{title}</p>
          <MarkdownExtendedRenderer>{description}</MarkdownExtendedRenderer>
        </div>
      </div>
      <AutoSaveTextarea
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
    </div>
  );
};

export default FreeTextResponse;
