// Time unit constants (milliseconds)
export const ONE_SECOND_MS = 1_000;
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// Time unit constants (seconds)
export const ONE_MINUTE_SECONDS = 60;
export const ONE_HOUR_SECONDS = 60 * ONE_MINUTE_SECONDS;
export const ONE_DAY_SECONDS = 24 * ONE_HOUR_SECONDS;
export const ONE_YEAR_SECONDS = 365 * ONE_DAY_SECONDS;

export const FOAI_COURSE_ID = 'rec0Zgize0c4liMl5';
export const FOAI_COURSE_SLUG = 'future-of-ai';

type CourseConfigItem = {
  icon: string;
  iconBackground: string;
  accentColor: string;
  badge?: string;
  landerFolder?: string;
};

/* Course config information that doesn't yet live in Airtable */
export const COURSE_CONFIG: Record<string, CourseConfigItem> = {
  'future-of-ai': {
    icon: '/images/courses/future-of-ai-icon.svg',
    iconBackground: '#64663E',
    accentColor: '#8c8146',
    landerFolder: 'foai',
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
  'personal-theory-of-impact': {
    icon: '/images/courses/personal-theory-of-impact-icon.svg',
    iconBackground: '#6B3A50',
    accentColor: '#A06878',
  },
};
