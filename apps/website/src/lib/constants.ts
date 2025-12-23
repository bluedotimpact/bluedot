export const FOAI_COURSE_ID = 'rec0Zgize0c4liMl5';

type CourseConfigItem = {
  icon: string;
  certificateRequiresActionPlan?: boolean;
};

/* Course config information that doesn't yet live in Airtable */
export const COURSE_CONFIG: Record<string, CourseConfigItem> = {
  'future-of-ai': { icon: '/images/courses/future-of-ai-icon.svg' },
  'ai-governance': { icon: '/images/courses/ai-governance-icon.svg' },
  'agi-strategy': { icon: '/images/courses/agi-strategy-icon.svg', certificateRequiresActionPlan: true },
  'technical-ai-safety': { icon: '/images/courses/technical-ai-safety-icon.svg' },
  biosecurity: { icon: '/images/courses/biosecurity-icon.svg' },
  // 'technical-ai-safety-project': { icon: '/images/courses/technical-ai-safety-project-icon.svg' }, // TODO: Add custom icon (SVG) when ready
};
