import { useState, useEffect } from 'react';

/**
 * Pixel values of Tailwind default breakpoints.
 *
 * Note: These are just the default values hardcoded as a convenience,
 * if the defaults are changes these will not be accurate.
 */
export const breakpoints = {
  sm: 640, // 40rem
  md: 768, // 48rem
  lg: 1024, // 64rem
  xl: 1280, // 80rem
  '2xl': 1536, // 96rem
} as const;

export const useAboveBreakpoint = (breakpoint: number) => {
  const [isAbove, setIsAbove] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBreakpoint = () => {
      setIsAbove(window.innerWidth >= breakpoint);
    };

    checkBreakpoint();

    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, [breakpoint]);

  return isAbove;
};
