import {
  AGI_STRATEGY_COLORS,
  AI_GOVERNANCE_COLORS,
  BIOSECURITY_COLORS,
  FOAI_COLORS,
  TAS_COLORS,
} from './courseColors';

type CourseCtaColors = { gradient: string; accent: string };

const DEFAULT_CTA_COLORS: CourseCtaColors = {
  gradient: 'linear-gradient(to right, rgba(26, 26, 46, 0.6) 0%, transparent 60%), #1a1a2e',
  accent: '#94a3b8',
};

const COURSE_COLOR_MAP: Record<string, CourseCtaColors> = {
  'future-of-ai': FOAI_COLORS,
  'agi-strategy': AGI_STRATEGY_COLORS,
  'technical-ai-safety': TAS_COLORS,
  'technical-ai-safety-project': TAS_COLORS,
  'ai-governance': AI_GOVERNANCE_COLORS,
  biosecurity: BIOSECURITY_COLORS,
};

export const getCourseCtaColors = (courseSlug: string): CourseCtaColors => {
  return COURSE_COLOR_MAP[courseSlug] ?? DEFAULT_CTA_COLORS;
};
