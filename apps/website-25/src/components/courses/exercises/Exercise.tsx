import React, { useCallback } from 'react';
import useAxios from 'axios-hooks';
import axios from 'axios';
import { useAuthStore } from '@bluedot/ui';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import { GetExercise } from '../../../pages/api/courses/exercises/[exerciseId]';
import { GetExerciseResponseResponse, PutExerciseResponseRequest } from '../../../pages/api/courses/exercises/[exerciseId]/response';
import { error } from 'console';

type ExerciseProps = {
  // Required
  exerciseId: string;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {
  const exerciseClassNames = 'exercise not-prose my-6';

  const auth = useAuthStore((s) => s.auth);
  
  const [{ data: exerciseData }] = useAxios<GetExercise>({
    method: 'get',
    url: `/api/courses/exercises/${exerciseId}`,
  });

  const [{ data: responseData }, refetch] = useAxios<GetExerciseResponseResponse>({
    method: 'get',
    url: `/api/courses/exercises/${exerciseId}/response`,
    headers: auth ? {
      Authorization: `Bearer ${auth.token}`,
    } : undefined,
  });

  const handleExerciseSubmit = useCallback(async (exerciseResponse: string) => {
    await axios.put<unknown, unknown, PutExerciseResponseRequest>(
      `/api/courses/exercises/${exerciseId}/response`,
      {
        response: exerciseResponse,
      },
      {
        headers: {
          Authorization: `Bearer ${auth?.token}`,
        },
      },
    );
    
    await refetch();
  }, [exerciseId, auth, refetch]);

  if (!exerciseData || !exerciseData.exercise) {
    console.error('Exercise not found');
    return null;
  }

  switch (exerciseData.exercise.type) {
    case 'Free text':
      return (
        <FreeTextResponse
          className={exerciseClassNames}
          {...exerciseData.exercise}
          exerciseResponse={responseData?.exerciseResponse?.response}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    case 'Multiple choice':
      return (
        <MultipleChoice
          className={exerciseClassNames}
          {...exerciseData.exercise}
          exerciseResponse={responseData?.exerciseResponse?.response}
          onExerciseSubmit={handleExerciseSubmit}
        />
      );
    default:
      return null;
  }
};

export default Exercise;
