export const FOAI_COURSE_ID = 'rec0Zgize0c4liMl5';
export const FOAI_COURSE_SLUG = 'future-of-ai';

type CourseConfigItem = {
  icon: string;
};

/* Course config information that doesn't yet live in Airtable */
export const COURSE_CONFIG: Record<string, CourseConfigItem> = {
  'future-of-ai': { icon: '/images/courses/future-of-ai-icon.svg' },
  'ai-governance': { icon: '/images/courses/ai-governance-icon.svg' },
  'agi-strategy': { icon: '/images/courses/agi-strategy-icon.svg' },
  'technical-ai-safety': { icon: '/images/courses/technical-ai-safety-icon.svg' },
  biosecurity: { icon: '/images/courses/biosecurity-icon.svg' },
  'technical-ai-safety-project': { icon: '/images/courses/technical-ai-safety-project-icon.svg' },
};
