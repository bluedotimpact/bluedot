// Which review courses can move an application onto another course's rounds,
// and which application flag gates the control. Course names must match the
// Airtable Course single-select choices exactly.
export type MoveTargetCourse = 'AGI Strategy' | 'Technical AI Safety';

export type CourseMove = {
  sourceCourse: string;
  targetCourse: MoveTargetCourse;
  allowKey: 'allowMoveToAgisc' | 'allowMoveToTais';
};

export const COURSE_MOVES: CourseMove[] = [
  { sourceCourse: 'Technical AI Safety', targetCourse: 'AGI Strategy', allowKey: 'allowMoveToAgisc' },
  { sourceCourse: 'Technical AI Safety Project', targetCourse: 'Technical AI Safety', allowKey: 'allowMoveToTais' },
];

export const moveFromCourse = (course: string): CourseMove | undefined => COURSE_MOVES.find((m) => m.sourceCourse === course);

// "Technical AI Safety (2026 Oct W41) - Intensive" → "Technical AI Safety".
// An includes() check would also match "Technical AI Safety Project" rounds.
export const courseOfRoundName = (name: string): string => name.split('(')[0]?.trim() ?? '';
