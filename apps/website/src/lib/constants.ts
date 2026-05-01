import { COURSE_COLORS } from './courseColors';

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

/* Course config information that doesn't yet live in Airtable.
 * `iconBackground` and `accentColor` derive from the shared `lib/courseColors`
 * palette (`iconBackground` = `iconBackground`, `accentColor` = `full`). */
export const COURSE_CONFIG: Record<string, CourseConfigItem> = {
  'future-of-ai': {
    icon: '/images/courses/future-of-ai-icon.svg',
    iconBackground: COURSE_COLORS['future-of-ai'].iconBackground,
    accentColor: COURSE_COLORS['future-of-ai'].full,
    landerFolder: 'foai',
  },
  'ai-governance': {
    icon: '/images/courses/ai-governance-icon.svg',
    iconBackground: COURSE_COLORS['ai-governance'].iconBackground,
    accentColor: COURSE_COLORS['ai-governance'].full,
  },
  'agi-strategy': {
    icon: '/images/courses/agi-strategy-icon.svg',
    iconBackground: COURSE_COLORS['agi-strategy'].iconBackground,
    accentColor: COURSE_COLORS['agi-strategy'].full,
  },
  'technical-ai-safety': {
    icon: '/images/courses/technical-ai-safety-icon.svg',
    iconBackground: COURSE_COLORS['technical-ai-safety'].iconBackground,
    accentColor: COURSE_COLORS['technical-ai-safety'].full,
  },
  biosecurity: {
    icon: '/images/courses/biosecurity-icon.svg',
    iconBackground: COURSE_COLORS.biosecurity.iconBackground,
    accentColor: COURSE_COLORS.biosecurity.full,
  },
  'technical-ai-safety-project': {
    icon: '/images/courses/technical-ai-safety-icon.svg',
    // TASP intentionally re-uses the main TAS icon plate + accent here, not its
    // own deeper-purple TASP palette, so the homepage course-list cards read
    // as siblings rather than two unrelated TAS variants.
    iconBackground: COURSE_COLORS['technical-ai-safety'].iconBackground,
    accentColor: COURSE_COLORS['technical-ai-safety'].full,
    badge: 'P',
  },
  'personal-theory-of-impact': {
    icon: '/images/courses/personal-theory-of-impact-icon.svg',
    iconBackground: COURSE_COLORS['personal-theory-of-impact'].iconBackground,
    accentColor: COURSE_COLORS['personal-theory-of-impact'].full,
  },
};
