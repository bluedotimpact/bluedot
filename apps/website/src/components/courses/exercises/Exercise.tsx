import React, { useCallback } from 'react';
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

  const { data: exerciseData, isLoading: exerciseLoading, error: exerciseError } = trpc.exercises.getExercise.useQuery({ exerciseId });

  // Only fetch user response when authenticated
  const {
    data: responseData,
    error: exerciseResponseError,
    refetch: fetchExerciseResponse,
  } = trpc.exercises.getExerciseResponse.useQuery(
    { exerciseId },
    {
      enabled: !!auth,
      retry: false,
    },
  );

  const saveResponseMutation = trpc.exercises.saveExerciseResponse.useMutation();

  const handleExerciseSubmit = useCallback(async (exerciseResponse: string, completed?: boolean) => {
    await saveResponseMutation.mutateAsync({
      exerciseId,
      response: exerciseResponse,
      completed: completed ?? true,
    });

    await fetchExerciseResponse();
  }, [exerciseId, saveResponseMutation, fetchExerciseResponse]);

  if (exerciseLoading) {
    return <ProgressDots />;
  }

  // We ignore 404s, as this just indicates the exercise response hasn't been created yet
  const shouldShowError = exerciseResponseError && exerciseResponseError.data?.code !== 'NOT_FOUND';
  if (exerciseError || shouldShowError || !exerciseData) {
    return <ErrorView error={exerciseError || exerciseResponseError || new Error('Failed to load exercise')} />;
  }

  switch (exerciseData.type) {
    case 'Free text':
      return (
        <FreeTextResponse
          className={exerciseClassNames}
          {...exerciseData}
          description={exerciseData.description || ''}
          title={exerciseData.title || ''}
          exerciseResponse={responseData?.response || undefined}
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
          exerciseResponse={responseData?.response || undefined}
          isLoggedIn={!!auth}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    default:
      return <ErrorView error={new Error(`Unknown exercise type: '${exerciseData.type}'`)} />;
  }
};

export default Exercise;
