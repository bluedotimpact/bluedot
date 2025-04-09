import React from 'react';
import useAxios from 'axios-hooks';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import { GetExerciseResponse } from '../../../pages/api/courses/exercises/[exerciseId]';

type ExerciseProps = {
  // Required
  exerciseId?: string;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {
  const [{ data }] = useAxios<GetExerciseResponse>({
    method: 'get',
    url: `/api/courses/exercises/${exerciseId}`,
  });

  switch (data?.exercise.type) {
    case 'Free text':
      return <FreeTextResponse {...data?.exercise} />;
    case 'Multiple choice':
      return <MultipleChoice {...data?.exercise} />;
    default:
      return null;
  }
};

export default Exercise;
