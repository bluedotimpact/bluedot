import type { Exercise } from '@bluedot/db';

// Transitional: status is migrating from Active/Inactive (+ isOptional) to Inactive/Core/Further/Maybe,
// mirroring unitResource.coreFurtherMaybe. Both shapes are supported until the data migration lands.

type ExerciseStatusFields = Pick<Exercise, 'status' | 'isOptional'>;

export const isRequiredExercise = (exercise: ExerciseStatusFields): boolean => {
  return exercise.status === 'Core' || (exercise.status === 'Active' && !exercise.isOptional);
};

export const isOptionalExercise = (exercise: ExerciseStatusFields): boolean => {
  return exercise.status === 'Further' || (exercise.status === 'Active' && exercise.isOptional === true);
};
