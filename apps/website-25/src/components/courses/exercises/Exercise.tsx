import React from 'react';
import useAxios from 'axios-hooks';
import { useAuthStore } from '@bluedot/ui';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import { GetExercise } from '../../../pages/api/courses/exercises/[exerciseId]';
import { GetExerciseResponse } from '../../../pages/api/courses/exercises/[exerciseId]/response';

type ExerciseProps = {
  // Required
  exerciseId: string;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {
  const [{ data: exerciseData }] = useAxios<GetExercise>({
    method: 'get',
    url: `/api/courses/exercises/${exerciseId}`,
  });

  if (!exerciseData || !exerciseData.exercise) {
    console.error('Exercise not found');
    return null;
  }

  const auth = useAuthStore((s) => s.auth);

  const [{ data: responseData }, executeResponse] = useAxios<GetExerciseResponse>({
    method: 'get',
    url: `/api/courses/exercises/${exerciseId}/response`,
    headers: auth ? {
      Authorization: `Bearer ${auth.token}`,
    } : undefined,
  }, { manual: true });

  // If the user is authenticated, fetch their response
  // This is needed as React always expects the same number of hooks to be returned
  // so we need to return an empty array for the second hook if the user is not authenticated
  React.useEffect(() => {
    if (auth) {
      executeResponse();
    }
  }, [auth, executeResponse]);

  const exerciseClassNames = 'exercise not-prose my-6';

  switch (exerciseData.exercise.type) {
    case 'Free text':
      return (
        <FreeTextResponse
          className={exerciseClassNames}
          {...exerciseData.exercise}
          exerciseId={exerciseId}
          exerciseResponse={responseData?.exerciseResponse?.response}
        />
      );
    case 'Multiple choice':
      return (
        <MultipleChoice
          className={exerciseClassNames}
          {...exerciseData.exercise}
          exerciseId={exerciseId}
          exerciseResponse={responseData?.exerciseResponse?.response}
        />
      );
    default:
      return null;
  }
};

export default Exercise;
