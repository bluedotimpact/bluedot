import { useEffect, useState } from 'react';

/**
 * Returns the result of `Date.now()` on first render, updates every 30 seconds.
 * This serves 2 purposes:
 * - Avoid `purity` errors from eslint-plugin-react-hooks due to the time changing from
 * render to render
 * - Support live updating displays of time
 */
export const useCurrentTimeMs = (refreshIntervalMs = 30_000) => {
  const [currentTimeMs, setCurrentTimeMs] = useState(() => Date.now());

  // Update current time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeMs(Date.now());
    }, refreshIntervalMs);

    return () => clearInterval(interval);
  }, [refreshIntervalMs]);

  return currentTimeMs;
};
