import {
  forwardRef, useEffect, useImperativeHandle, useRef, useState,
} from 'react';

type CountdownTimerProps = {
  durationMs: number;
  paused: boolean;
  onExpire: () => void;
  startMs: number;
};

export type CountdownTimerHandle = { addTime: (ms: number) => void };

export const CountdownTimer = forwardRef<CountdownTimerHandle, CountdownTimerProps>(({
  durationMs, paused, onExpire, startMs,
}, ref) => {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [elapsedSessionMs, setElapsedSessionMs] = useState(0);
  const lastTickRef = useRef<number>(Date.now());
  const expiredRef = useRef(false);

  useImperativeHandle(ref, () => ({
    addTime: (ms: number) => {
      expiredRef.current = false;
      setRemainingMs((prev) => prev + ms);
    },
  }));

  // Reset when a new card appears (durationMs reference changes or paused resets)
  useEffect(() => {
    setRemainingMs(durationMs);
    expiredRef.current = false;
    lastTickRef.current = Date.now();
  }, [durationMs]);

  useEffect(() => {
    if (paused) return;

    lastTickRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setElapsedSessionMs(now - startMs);
      setRemainingMs((prev) => {
        const next = Math.max(0, prev - delta);
        if (next === 0 && !expiredRef.current) {
          expiredRef.current = true;
          setTimeout(onExpire, 0);
        }

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [paused, onExpire, startMs]);

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const fraction = remainingMs / durationMs;

  const elapsedSeconds = Math.floor(elapsedSessionMs / 1000);
  const elapsedMins = Math.floor(elapsedSeconds / 60);
  const elapsedSecs = elapsedSeconds % 60;
  const elapsedFormatted = `${elapsedMins}:${String(elapsedSecs).padStart(2, '0')}`;

  const isWarning = remainingSeconds <= 10;

  return (
    <div className="flex items-center justify-between text-size-sm">
      <div className="flex items-center gap-3">
        {/* Countdown bar */}
        <div className="w-20 sm:w-32 h-2 bg-stone-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${isWarning ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
        <span className={`font-mono font-semibold tabular-nums ${isWarning ? 'text-red-400' : 'text-stone-300'}`}>
          {remainingSeconds}s {paused && <span className="text-stone-500">(paused)</span>}
        </span>
      </div>
      <span className="text-stone-500 font-mono tabular-nums">
        Total: {elapsedFormatted}
      </span>
    </div>
  );
});
