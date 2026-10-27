type ExerciseResponse = {
  completedAt?: string | null;
  response: string;
};

/** FoAI counts a saved written answer even when the learner does not click Complete. */
export const isFoaiExerciseComplete = (
  exerciseType: string | null | undefined,
  response: ExerciseResponse | null | undefined,
): boolean => response != null && (
  response.completedAt != null
  || (exerciseType === 'Free text' && response.response.trim().length > 0)
);
