import { COURSE_COLORS } from './courseColors';

type CourseCtaColors = { gradient: string; accent: string };

const DEFAULT_CTA_COLORS: CourseCtaColors = {
  gradient: 'linear-gradient(to right, rgba(26, 26, 46, 0.6) 0%, transparent 60%), #1a1a2e',
  accent: '#94a3b8',
};

const COURSE_COLOR_MAP: Record<string, CourseCtaColors> = {
  'future-of-ai': COURSE_COLORS['future-of-ai'],
  'agi-strategy': COURSE_COLORS['agi-strategy'],
  'technical-ai-safety': COURSE_COLORS['technical-ai-safety'],
  'technical-ai-safety-project': COURSE_COLORS['technical-ai-safety'],
  'ai-governance': COURSE_COLORS['ai-governance'],
  biosecurity: COURSE_COLORS.biosecurity,
};

export const getCourseCtaColors = (courseSlug: string): CourseCtaColors => {
  return COURSE_COLOR_MAP[courseSlug] ?? DEFAULT_CTA_COLORS;
};
