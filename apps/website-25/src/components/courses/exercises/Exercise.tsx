import React from 'react';
import useAxios from 'axios-hooks';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import { GetExerciseResponse } from '../../../pages/api/courses/exercises/[exerciseId]';

type ExerciseProps = {
  // Required
  exerciseId: string;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {
  const [{ data }] = useAxios<GetExerciseResponse>({
    method: 'get',
    url: `/api/courses/exercises/${exerciseId}`,
  });

  if (!data || !data.exercise) {
    console.error('Exercise not found');
    return null;
  }

  const exerciseClassNames = 'exercise not-prose my-6';

  switch (data.exercise.type) {
    case 'Free text':
      return <FreeTextResponse className={exerciseClassNames} {...data.exercise} exerciseId={exerciseId} />;
    case 'Multiple choice':
      return <MultipleChoice className={exerciseClassNames} {...data.exercise} exerciseId={exerciseId} />;
    default:
      return null;
  }
};

export default Exercise;
