export const FOAI_COURSE_ID = 'rec0Zgize0c4liMl5';
export const FOAI_COURSE_SLUG = 'future-of-ai';

type CourseConfigItem = {
  icon: string;
  iconBackground: string;
  accentColor: string;
  badge?: string;
};

/* Course config information that doesn't yet live in Airtable */
export const COURSE_CONFIG: Record<string, CourseConfigItem> = {
  'future-of-ai': {
    icon: '/images/courses/future-of-ai-icon.svg',
    iconBackground: '#64663E',
    accentColor: '#8c8146',
  },
  'ai-governance': {
    icon: '/images/courses/ai-governance-icon.svg',
    iconBackground: '#1F588A',
    accentColor: '#4092d6',
  },
  'agi-strategy': {
    icon: '/images/courses/agi-strategy-icon.svg',
    iconBackground: '#2C3F81',
    accentColor: '#9177dc',
  },
  'technical-ai-safety': {
    icon: '/images/courses/technical-ai-safety-icon.svg',
    iconBackground: '#502869',
    accentColor: '#a060bb',
  },
  biosecurity: {
    icon: '/images/courses/biosecurity-icon.svg',
    iconBackground: '#316761',
    accentColor: '#3da462',
  },
  'technical-ai-safety-project': {
    icon: '/images/courses/technical-ai-safety-icon.svg',
    iconBackground: '#502869',
    accentColor: '#a060bb',
    badge: 'P',
  },
};
