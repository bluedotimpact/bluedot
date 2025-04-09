import React from 'react';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import { GetExerciseResponse } from '../../../pages/api/courses/exercises/[exerciseId]';
import useAxios from 'axios-hooks';

type ExerciseProps = {
  // Required
  exerciseId?: string;
};

const Exercise: React.FC<ExerciseProps> = ({
  exerciseId,
}) => {

  const [{ data, loading }] = useAxios<GetExerciseResponse>({
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
