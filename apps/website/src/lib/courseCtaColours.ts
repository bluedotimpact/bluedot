import { AGI_STRATEGY_COLORS } from '../components/lander/course-content/AgiStrategyContent';
import { AI_GOVERNANCE_COLORS } from '../components/lander/course-content/AiGovernanceContent';
import { BIOSECURITY_COLORS } from '../components/lander/course-content/BioSecurityContent';
import { FOAI_COLORS } from '../components/lander/course-content/FutureOfAiContent';
import { TAS_COLORS } from '../components/lander/course-content/TechnicalAiSafetyContent';

type CourseCtaColours = { gradient: string; accent: string };

const DEFAULT_CTA_COLORS: CourseCtaColours = {
  gradient: 'linear-gradient(to right, rgba(26, 26, 46, 0.6) 0%, transparent 60%), #1a1a2e',
  accent: '#94a3b8',
};

const COURSE_COLOR_MAP: Record<string, CourseCtaColours> = {
  'future-of-ai': FOAI_COLORS,
  'agi-strategy': AGI_STRATEGY_COLORS,
  'technical-ai-safety': TAS_COLORS,
  'technical-ai-safety-project': TAS_COLORS,
  'ai-governance': AI_GOVERNANCE_COLORS,
  biosecurity: BIOSECURITY_COLORS,
};

export const getCourseCtaColours = (courseSlug: string): CourseCtaColours => {
  return COURSE_COLOR_MAP[courseSlug] ?? DEFAULT_CTA_COLORS;
};
