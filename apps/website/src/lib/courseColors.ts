/**
 * Single source of truth for per-course visual colours (gradients +
 * accent palette used by hero, course-information, schedule, quotes,
 * persona/benefit cards, certificate CTA, and the homepage course grid).
 *
 * Previously each lander file (`*Content.tsx`) declared its own `*_COLORS`
 * constant inline; the homepage `CourseSection` had a parallel inline copy
 * of the gradient; `lib/constants.ts` had a parallel `COURSE_CONFIG` with
 * `iconBackground` + `accentColor`. Four files needed editing in lockstep
 * for a single palette tweak. This file consolidates them all so each
 * course's palette lives in exactly one place.
 *
 * The lander files still export their old `*_COLORS` names as thin
 * re-exports from here, so existing imports (stories, certification.tsx,
 * etc.) keep working without churn.
 *
 * Field meanings (from existing usage):
 * - `gradient`       : hero background image (multi-layer linear/radial gradients)
 * - `accent`         : light/bright accent — used for hero accentColor, schedule numbers
 * - `iconBackground` : darker mid-tone for square icon plates
 * - `bright`         : near-white accent for benefit-icon backgrounds, quote-card bg
 * - `full`           : mid-saturation primary, used as accentColor in stories +
 *                      schedule-rounds + course-info, and as `accentColor` in `COURSE_CONFIG`
 * - `mid`            : optional intermediate tone (TAS, TASP, TOI)
 * - `categoryLabel`  : optional separate colour for the hero category label
 *                      (currently only Biosecurity overrides this)
 */

export type CourseColors = {
  gradient: string;
  accent: string;
  iconBackground: string;
  bright: string;
  full: string;
  mid?: string;
  categoryLabel?: string;
};

export const COURSE_COLORS = {
  'agi-strategy': {
    /* Left-side darkness gradient + bottom-right pink→purple→navy radial; base #181D3F */
    gradient: 'linear-gradient(to right, rgba(10, 8, 36, 0.9) 0%, rgba(10, 8, 36, 0.4) 5%, rgba(10, 8, 36, 0.15) 15%, rgba(10, 8, 36, 0.05) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(255, 194, 195, 0.65) 0%, rgba(255, 194, 195, 0.50) 25%, rgba(53, 42, 106, 0.65) 60%, rgba(10, 8, 36, 0.60) 100%), #181D3F',
    accent: '#BCA9FF',
    iconBackground: '#2C3F81',
    bright: '#f3e8ff',
    full: '#9177dc',
  },
  biosecurity: {
    gradient: 'linear-gradient(135deg, #012A07 10%, rgba(1, 42, 7, 0.00) 90%), radial-gradient(110.09% 127.37% at 112.15% 117.08%, rgba(220, 238, 171, 0.45) 0%, rgba(86, 140, 94, 0.45) 50%, rgba(1, 42, 7, 0.45) 100%), radial-gradient(97.29% 122.23% at 85.59% 126.89%, rgba(222, 149, 47, 0.35) 0%, rgba(157, 205, 98, 0.35) 52.4%, rgba(28, 175, 141, 0.35) 100%), #012A07',
    accent: '#ABEEB5',
    categoryLabel: '#81DBAF',
    iconBackground: '#316761',
    bright: '#e5faea',
    full: '#3da462',
  },
  'technical-ai-safety': {
    /* Bottom-right peach → purple radial on deep purple/magenta base */
    gradient: 'linear-gradient(to right, rgba(20, 8, 25, 0.6) 0%, rgba(20, 8, 25, 0.4) 20%, rgba(20, 8, 25, 0.2) 40%, transparent 55%), radial-gradient(130% 160% at 100% 108.81%, rgba(255, 202, 171, 0.40) 0%, rgba(126, 85, 144, 0.40) 52.4%, rgba(46, 16, 54, 0.40) 100%), #2E1036',
    accent: '#E0A5F9',
    iconBackground: '#502869',
    bright: '#ffe9ff',
    mid: '#b880d1',
    full: '#a060bb',
  },
  'technical-ai-safety-project': {
    /* Bluer purple variant, differentiated from main TAS course */
    gradient: 'linear-gradient(to right, rgba(15, 10, 30, 0.6) 0%, rgba(15, 10, 30, 0.4) 20%, rgba(15, 10, 30, 0.2) 40%, transparent 55%), radial-gradient(130% 160% at 100% 108.81%, rgba(200, 180, 255, 0.40) 0%, rgba(100, 85, 160, 0.40) 52.4%, rgba(35, 20, 60, 0.40) 100%), #2A1854',
    accent: '#C8B3FF',
    iconBackground: '#4A3B7A',
    bright: '#f0e6ff',
    mid: '#9B7FD1',
    full: '#8A6BBB',
  },
  'ai-governance': {
    gradient: 'linear-gradient(270deg, rgba(5, 24, 67, 0.00) -3.82%, rgba(5, 24, 67, 0.50) 98.44%), radial-gradient(96.03% 113.39% at 98.65% 96.93%, rgba(175, 196, 151, 0.40) 0%, rgba(21, 148, 194, 0.40) 44.58%, rgba(5, 24, 67, 0.40) 100%), #051843',
    accent: '#adfeff',
    iconBackground: '#1F588A',
    bright: '#ddf4ff',
    full: '#4092d6',
  },
  'future-of-ai': {
    /* Muted green→gold→purple top-right radial on dark olive base */
    gradient: 'linear-gradient(to right, rgba(30, 30, 20, 0.6) 0%, rgba(30, 30, 20, 0.4) 25%, rgba(30, 30, 20, 0.2) 45%, transparent 60%), radial-gradient(ellipse 70% 60% at 85% 20%, rgba(155, 180, 115, 0.12) 0%, transparent 60%), radial-gradient(ellipse 200% 180% at 105% -5%, rgba(150, 207, 156, 0.35) 0%, rgba(163, 179, 110, 0.35) 28.6%, rgba(176, 152, 64, 0.35) 57.2%, rgba(147, 120, 64, 0.35) 67.9%, rgba(118, 88, 64, 0.35) 78.6%, rgba(89, 56, 63, 0.35) 89.3%, rgba(60, 24, 63, 0.35) 100%), #29281D',
    accent: '#E6DBA6',
    iconBackground: '#64663E',
    bright: '#faf6e1',
    full: '#8c8146',
  },
  'personal-theory-of-impact': {
    /* Dusty rose → mauve → deep plum */
    gradient: 'linear-gradient(to right, rgba(42, 21, 32, 0.9) 0%, rgba(42, 21, 32, 0.4) 5%, rgba(42, 21, 32, 0.15) 15%, rgba(42, 21, 32, 0.05) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(212, 160, 176, 0.55) 0%, rgba(180, 130, 155, 0.40) 25%, rgba(80, 40, 65, 0.65) 60%, rgba(42, 21, 32, 0.60) 100%), #2A1520',
    accent: '#D4A0B0',
    iconBackground: '#6B3A50',
    bright: '#F5E4EA',
    mid: '#B87A90',
    full: '#A06878',
  },
} as const satisfies Record<string, CourseColors>;

export type CourseColorSlug = keyof typeof COURSE_COLORS;
