import React, { useRef } from 'react';
import { ProgressDots, useAuthStore } from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
// eslint-disable-next-line import/no-cycle
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import { trpc } from '../../../utils/trpc';

type ExerciseProps = {
  // Required
  exerciseId: string;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {
  const exerciseClassNames = 'exercise';

  const auth = useAuthStore((s) => s.auth);
  const utils = trpc.useUtils();

  const {
    data: exerciseData,
    isLoading: exerciseLoading,
    error: exerciseError,
  } = trpc.exercises.getExercise.useQuery({ exerciseId });

  // Only fetch user response when authenticated
  const {
    data: responseData,
    isLoading: exerciseResponseLoading,
    error: exerciseResponseError,
  } = trpc.exercises.getExerciseResponse.useQuery(
    { exerciseId },
    { enabled: !!auth },
  );

  const saveResponseMutation = trpc.exercises.saveExerciseResponse.useMutation({
    onSuccess: async () => {
      // Await this invalidation to ensure mutation is kept in loading state until data is refetched.
      // Without this we get a UI flash where the mutation is complete but the new response data hasn't yet loaded.
      await utils.exercises.getExerciseResponse.invalidate({ exerciseId });
    },
  });

  // Prevent concurrent saves to avoid race condition creating duplicate records
  // Concurrent saves can happen e.g. when a blur and click event both trigger saves
  const isSavingRef = useRef(false);

  // Optimistically update `isCompleted` using mutation variables.
  // Note: generally use onMutate/onSettled if doing optimistic updates of whole
  // objects, this is just a simple workaround for this one field.
  const isCompleted = (!saveResponseMutation.isError && saveResponseMutation.variables?.completed !== undefined)
    ? saveResponseMutation.variables.completed
    : (responseData?.completed ?? false);

  const handleExerciseSubmit = async (exerciseResponse: string, completed?: boolean) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    try {
      await saveResponseMutation.mutateAsync({
        exerciseId,
        response: exerciseResponse,
        completed, // undefined means "don't change", backend preserves existing value
      });
    } finally {
      isSavingRef.current = false;
    }
  };

  if (exerciseLoading || exerciseResponseLoading) {
    return <ProgressDots />;
  }

  if (exerciseError || exerciseResponseError) {
    return <ErrorView error={exerciseError || exerciseResponseError} />;
  }

  if (!exerciseData) {
    return <ErrorView error={new Error('Exercise not found')} />;
  }

  switch (exerciseData.type) {
    case 'Free text':
      return (
        <FreeTextResponse
          className={exerciseClassNames}
          {...exerciseData}
          description={exerciseData.description || ''}
          title={exerciseData.title || ''}
          exerciseResponse={responseData?.response}
          isCompleted={isCompleted}
          isLoggedIn={!!auth}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    case 'Multiple choice':
      return (
        <MultipleChoice
          className={exerciseClassNames}
          {...exerciseData}
          answer={exerciseData.answer || ''}
          title={exerciseData.title || ''}
          description={exerciseData.description || ''}
          options={exerciseData.options || ''}
          exerciseResponse={responseData?.response}
          isLoggedIn={!!auth}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    default:
      return <ErrorView error={new Error(`Unknown exercise type: '${exerciseData.type}'`)} />;
  }
};

export default Exercise;
