/**
 * Per-course visual color palettes. Used by lander content factories,
 * storybook stories, the CTA section, and the courseInformation registry.
 *
 * Each palette exposes:
 *   - gradient:       hero/banner background
 *   - accent:         hero accent text/icons
 *   - iconBackground: persona/benefit icon backgrounds
 *   - bright:         light tint for benefit icon containers
 *   - mid (optional): mid-tone for secondary surfaces
 *   - full:           course-info accent (used by `COURSE_INFORMATION_DETAILS.accentColor`)
 *   - categoryLabel (optional): hero category label override
 */

export const AGI_STRATEGY_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Main colorful gradient - pink→purple→dark blue from bottom-right
     3. Base color - dark navy */
  gradient: 'linear-gradient(to right, rgba(10, 8, 36, 0.9) 0%, rgba(10, 8, 36, 0.4) 5%, rgba(10, 8, 36, 0.15) 15%, rgba(10, 8, 36, 0.05) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(255, 194, 195, 0.65) 0%, rgba(255, 194, 195, 0.50) 25%, rgba(53, 42, 106, 0.65) 60%, rgba(10, 8, 36, 0.60) 100%), #181D3F',
  accent: '#BCA9FF',
  iconBackground: '#2C3F81',
  bright: '#f3e8ff',
  full: '#9177dc',
};

export const AI_GOVERNANCE_COLORS = {
  gradient: `
    linear-gradient(270deg, rgba(5, 24, 67, 0.00) -3.82%, rgba(5, 24, 67, 0.50) 98.44%),
    radial-gradient(96.03% 113.39% at 98.65% 96.93%, rgba(175, 196, 151, 0.40) 0%, rgba(21, 148, 194, 0.40) 44.58%, rgba(5, 24, 67, 0.40) 100%),
    #051843
  `,
  accent: '#adfeff',
  iconBackground: '#1F588A',
  bright: '#ddf4ff',
  full: '#4092d6',
};

export const BIOSECURITY_COLORS = {
  gradient: 'linear-gradient(135deg, #012A07 10%, rgba(1, 42, 7, 0.00) 90%), radial-gradient(110.09% 127.37% at 112.15% 117.08%, rgba(220, 238, 171, 0.45) 0%, rgba(86, 140, 94, 0.45) 50%, rgba(1, 42, 7, 0.45) 100%), radial-gradient(97.29% 122.23% at 85.59% 126.89%, rgba(222, 149, 47, 0.35) 0%, rgba(157, 205, 98, 0.35) 52.4%, rgba(28, 175, 141, 0.35) 100%), #012A07',
  accent: '#ABEEB5',
  categoryLabel: '#81DBAF',
  iconBackground: '#316761',
  bright: '#e5faea',
  full: '#3da462',
};

export const FOAI_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge
     2. Top-right subtle glow - very faint greenish highlight
     3. Colorful gradient - green→gold→purple from top-right (reduced opacity for muted look)
     4. Base color - dark olive */
  gradient: 'linear-gradient(to right, rgba(30, 30, 20, 0.6) 0%, rgba(30, 30, 20, 0.4) 25%, rgba(30, 30, 20, 0.2) 45%, transparent 60%), radial-gradient(ellipse 70% 60% at 85% 20%, rgba(155, 180, 115, 0.12) 0%, transparent 60%), radial-gradient(ellipse 200% 180% at 105% -5%, rgba(150, 207, 156, 0.35) 0%, rgba(163, 179, 110, 0.35) 28.6%, rgba(176, 152, 64, 0.35) 57.2%, rgba(147, 120, 64, 0.35) 67.9%, rgba(118, 88, 64, 0.35) 78.6%, rgba(89, 56, 63, 0.35) 89.3%, rgba(60, 24, 63, 0.35) 100%), #29281D',
  accent: '#E6DBA6',
  iconBackground: '#64663E',
  bright: '#faf6e1',
  full: '#8c8146',
};

// Custom color theme for Personal Theory of Impact - dusty rose/mauve, reflective and distinct
export const TOI_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Main colorful gradient - rose→mauve→deep plum from bottom-right
     3. Base color - deep plum */
  gradient: 'linear-gradient(to right, rgba(42, 21, 32, 0.9) 0%, rgba(42, 21, 32, 0.4) 5%, rgba(42, 21, 32, 0.15) 15%, rgba(42, 21, 32, 0.05) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(212, 160, 176, 0.55) 0%, rgba(180, 130, 155, 0.40) 25%, rgba(80, 40, 65, 0.65) 60%, rgba(42, 21, 32, 0.60) 100%), #2A1520',
  accent: '#D4A0B0', // Dusty rose accent
  iconBackground: '#6B3A50', // Deep mauve for icons
  bright: '#F5E4EA', // Light rose for benefit icons
  mid: '#B87A90', // Mid-tone mauve
  full: '#A06878', // Full rose for course info
};

export const TAS_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Bottom-right warm glow - peach → purple → dark purple (from Figma)
     3. Base color - deep purple/magenta */
  gradient: 'linear-gradient(to right, rgba(20, 8, 25, 0.6) 0%, rgba(20, 8, 25, 0.4) 20%, rgba(20, 8, 25, 0.2) 40%, transparent 55%), radial-gradient(130% 160% at 100% 108.81%, rgba(255, 202, 171, 0.40) 0%, rgba(126, 85, 144, 0.40) 52.4%, rgba(46, 16, 54, 0.40) 100%), #2E1036',
  accent: '#E0A5F9',
  iconBackground: '#502869',
  bright: '#ffe9ff',
  mid: '#b880d1',
  full: '#a060bb',
};

// Custom color theme for Technical AI Safety Project - slightly more blue-purple than the main TAS course
export const TASP_COLORS = {
  /* Gradient layers:
     1. Left-side darkness - horizontal gradient to darken left edge for text readability
     2. Bottom-right warm glow - blue-purple tones (differentiated from main TAS course)
     3. Base color - deep blue-purple */
  gradient: 'linear-gradient(to right, rgba(15, 10, 30, 0.6) 0%, rgba(15, 10, 30, 0.4) 20%, rgba(15, 10, 30, 0.2) 40%, transparent 55%), radial-gradient(130% 160% at 100% 108.81%, rgba(200, 180, 255, 0.40) 0%, rgba(100, 85, 160, 0.40) 52.4%, rgba(35, 20, 60, 0.40) 100%), #2A1854',
  accent: '#C8B3FF', // Lighter purple-blue accent
  iconBackground: '#4A3B7A', // Slightly bluer purple for icons
  bright: '#f0e6ff', // Light purple for benefit icons
  mid: '#9B7FD1', // Mid-tone purple-blue
  full: '#8A6BBB', // Full purple-blue for course info
};
