import { COURSE_COLORS, type CourseColorSlug } from './courseColors';

type CourseCtaColors = { gradient: string; accent: string };

const DEFAULT_CTA_COLORS: CourseCtaColors = {
  gradient: 'linear-gradient(to right, rgba(26, 26, 46, 0.6) 0%, transparent 60%), #1a1a2e',
  accent: '#94a3b8',
};

export const getCourseCtaColors = (courseSlug: string): CourseCtaColors => {
  return COURSE_COLORS[courseSlug as CourseColorSlug] ?? DEFAULT_CTA_COLORS;
};
