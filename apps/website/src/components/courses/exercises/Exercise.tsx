import React, { useCallback, useEffect } from 'react';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { ProgressDots, useAuthStore } from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
// eslint-disable-next-line import/no-cycle
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import { GetExercise } from '../../../pages/api/courses/exercises/[exerciseId]';
import { GetExerciseResponseResponse, PutExerciseResponseRequest } from '../../../pages/api/courses/exercises/[exerciseId]/response';

type ExerciseProps = {
  // Required
  exerciseId: string;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {
  const exerciseClassNames = 'exercise';

  const auth = useAuthStore((s) => s.auth);

  const [{ data: exerciseData, loading: exerciseLoading, error: exerciseError }] = useAxios<GetExercise>({
    method: 'get',
    url: `/api/courses/exercises/${exerciseId}`,
  });

  const [{ data: responseData, error: exerciseResponseError }, fetchExerciseResponse] = useAxios<GetExerciseResponseResponse>({
    method: 'get',
    url: `/api/courses/exercises/${exerciseId}/response`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
  }, { manual: true });

  useEffect(() => {
    if (auth) {
      fetchExerciseResponse().catch(() => { /* no op, as we handle errors above */ });
    }
  }, [auth, fetchExerciseResponse]);

  const handleExerciseSubmit = useCallback(async (exerciseResponse: string, completed?: boolean) => {
    await axios.put<unknown, unknown, PutExerciseResponseRequest>(
      `/api/courses/exercises/${exerciseId}/response`,
      {
        response: exerciseResponse,
        completed: completed ?? true,
      },
      {
        headers: {
          Authorization: `Bearer ${auth?.token}`,
        },
      },
    );

    // Refetch the exercise response to update the UI with the newly saved answer
    await fetchExerciseResponse().catch(() => { /* no op, as we handle errors above */ });
  }, [exerciseId, auth, fetchExerciseResponse]);

  if (exerciseLoading) {
    return <ProgressDots />;
  }

  // We ignore 404s, as this just indicates the exercise response hasn't been created yet
  if (exerciseError || (exerciseResponseError && exerciseResponseError.status !== 404) || !exerciseData) {
    return <ErrorView error={exerciseError || exerciseResponseError || new Error('Failed to load exercise')} />;
  }

  switch (exerciseData.exercise.type) {
    case 'Free text':
      return (
        <FreeTextResponse
          className={exerciseClassNames}
          {...exerciseData.exercise}
          description={exerciseData.exercise.description || ''}
          title={exerciseData.exercise.title || ''}
          exerciseResponse={responseData?.exerciseResponse?.response || undefined}
          isLoggedIn={!!auth}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    case 'Multiple choice':
      return (
        <MultipleChoice
          className={exerciseClassNames}
          {...exerciseData.exercise}
          answer={exerciseData.exercise.answer || ''}
          title={exerciseData.exercise.title || ''}
          description={exerciseData.exercise.description || ''}
          options={exerciseData.exercise.options || ''}
          exerciseResponse={responseData?.exerciseResponse?.response || undefined}
          isLoggedIn={!!auth}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    default:
      return <ErrorView error={new Error(`Unknown exercise type: '${exerciseData.exercise.type}'`)} />;
  }
};

export default Exercise;
