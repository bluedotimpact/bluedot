import React from 'react';
import FreeTextResponse from './FreeTextResponse';
import MultipleChoice from './MultipleChoice';
import { Exercise as ExerciseItem } from '../../../lib/api/db/tables';

type ExerciseProps = {
  // Required
  exercise: ExerciseItem;
};

const ExerciseType = {
  freeTextResponse: 'Free text',
  multipleChoice: 'Multiple choice',
};

const Exercise: React.FC<ExerciseProps> = ({
  exercise,
}) => {
  switch (exercise.type) {
    case ExerciseType.freeTextResponse:
      return <FreeTextResponse {...exercise} />;
    case ExerciseType.multipleChoice:
      return <MultipleChoice {...exercise} />;
    default:
      return null;
  }
};

export default Exercise;
