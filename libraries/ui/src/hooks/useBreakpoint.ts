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
  // Initialize with actual boolean value based on current window width to prevent layout shifts.
  // Returns false during SSR when window is undefined.
  // This avoids the initial null state that would cause components to flicker on first render.
  const [isAbove, setIsAbove] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : false,
  );

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
