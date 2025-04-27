import React, { useCallback, useEffect } from 'react';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { ProgressDots, useAuthStore } from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
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
  const exerciseClassNames = 'exercise not-prose my-6';

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
  }, [auth]);

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

    await fetchExerciseResponse().catch(() => { /* no op, as we handle errors above */ });
  }, [exerciseId, auth, fetchExerciseResponse]);

  if (exerciseLoading) {
    return <ProgressDots />;
  }

  if (exerciseError || exerciseResponseError || !exerciseData) {
    return <ErrorView error={exerciseError || exerciseResponseError || new Error('Failed to load exercise')} />;
  }

  switch (exerciseData.exercise.type) {
    case 'Free text':
      return (
        <FreeTextResponse
          className={exerciseClassNames}
          {...exerciseData.exercise}
          exerciseResponse={responseData?.exerciseResponse?.response}
          isLoggedIn={!!auth}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    case 'Multiple choice':
      return (
        <MultipleChoice
          className={exerciseClassNames}
          {...exerciseData.exercise}
          exerciseResponse={responseData?.exerciseResponse?.response}
          isLoggedIn={!!auth}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    default:
      return null;
  }
};

export default Exercise;
