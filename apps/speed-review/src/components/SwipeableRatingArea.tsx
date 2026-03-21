import { useCallback, useRef, useState } from 'react';
import { type RatingValue } from '../lib/client/types';
import { RatingButtons } from './RatingButtons';

const SWIPE_THRESHOLD = 0.3; // 30% of container width/height
const LOCK_THRESHOLD = 10; // px before locking axis

type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

const SWIPE_RATING: Record<Exclude<SwipeDirection, null>, RatingValue> = {
  left: 'no',
  right: 'yes',
  up: 'neutral-accept',
  down: 'neutral-reject',
};

const SWIPE_LABEL: Record<Exclude<SwipeDirection, null>, string> = {
  left: '← No',
  right: 'Yes →',
  up: '↑ Neutral Accept',
  down: '↓ Neutral Reject',
};

const SWIPE_COLOR: Record<Exclude<SwipeDirection, null>, string> = {
  left: 'bg-red-500/20 border-red-500',
  right: 'bg-green-500/20 border-green-500',
  up: 'bg-stone-500/20 border-stone-400',
  down: 'bg-stone-500/20 border-stone-400',
};

const SWIPE_TEXT_COLOR: Record<Exclude<SwipeDirection, null>, string> = {
  left: 'text-red-400',
  right: 'text-green-400',
  up: 'text-stone-300',
  down: 'text-stone-300',
};

type SwipeableRatingAreaProps = {
  onRate: (rating: RatingValue) => void;
  disabled?: boolean;
};

export const SwipeableRatingArea: React.FC<SwipeableRatingAreaProps> = ({ onRate, disabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [swipeState, setSwipeState] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    dx: number;
    dy: number;
    axis: 'x' | 'y' | null;
    direction: SwipeDirection;
    pastThreshold: boolean;
  }>({
    active: false, startX: 0, startY: 0, dx: 0, dy: 0, axis: null, direction: null, pastThreshold: false,
  });

  const getDirection = (dx: number, dy: number, axis: 'x' | 'y' | null): SwipeDirection => {
    if (!axis) return null;
    if (axis === 'x') return dx < 0 ? 'left' : 'right';
    return dy < 0 ? 'up' : 'down';
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0]!;
    setSwipeState({
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      dx: 0,
      dy: 0,
      axis: null,
      direction: null,
      pastThreshold: false,
    });
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.active || disabled) return;
    const touch = e.touches[0]!;
    const dx = touch.clientX - swipeState.startX;
    const dy = touch.clientY - swipeState.startY;

    let { axis } = swipeState;
    if (!axis && (Math.abs(dx) > LOCK_THRESHOLD || Math.abs(dy) > LOCK_THRESHOLD)) {
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }

    if (axis) {
      e.preventDefault();
    }

    const container = containerRef.current;
    const width = container?.offsetWidth ?? 300;
    const height = container?.offsetHeight ?? 100;
    const relevantDistance = axis === 'x' ? Math.abs(dx) / width : Math.abs(dy) / height;
    const pastThreshold = relevantDistance >= SWIPE_THRESHOLD;

    setSwipeState((prev) => ({
      ...prev,
      dx,
      dy,
      axis,
      direction: getDirection(dx, dy, axis),
      pastThreshold,
    }));
  }, [swipeState.active, swipeState.startX, swipeState.startY, swipeState.axis, disabled]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.active) return;
    if (swipeState.pastThreshold && swipeState.direction) {
      onRate(SWIPE_RATING[swipeState.direction]);
    }
    setSwipeState((prev) => ({
      ...prev, active: false, dx: 0, dy: 0, axis: null, direction: null, pastThreshold: false,
    }));
  }, [swipeState.active, swipeState.pastThreshold, swipeState.direction, onRate]);

  const { direction, pastThreshold, active, dx, dy, axis } = swipeState;

  // Calculate indicator offset for visual feedback
  const indicatorTranslate = active && axis
    ? axis === 'x'
      ? `translateX(${dx * 0.3}px)`
      : `translateY(${dy * 0.3}px)`
    : undefined;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative select-none touch-none"
    >
      {/* Swipe direction overlay */}
      {active && direction && (
        <div
          className={`absolute inset-0 rounded-xl border-2 flex items-center justify-center transition-opacity z-10 pointer-events-none ${SWIPE_COLOR[direction]} ${pastThreshold ? 'opacity-100' : 'opacity-50'}`}
          style={{ transform: indicatorTranslate }}
        >
          <span className={`text-lg font-bold ${SWIPE_TEXT_COLOR[direction]}`}>
            {SWIPE_LABEL[direction]}
          </span>
        </div>
      )}

      <RatingButtons onRate={onRate} disabled={disabled} />
      <p className="sm:hidden text-size-xs text-stone-500 text-center mt-3">
        Swipe to rate
      </p>
      <p className="hidden sm:block text-size-xs text-stone-500 text-center mt-3">
        ← / A No &nbsp;·&nbsp; ↑↓ / WS Neutral &nbsp;·&nbsp; → / D Yes &nbsp;·&nbsp; E Strong Yes &nbsp;·&nbsp; P Pause &nbsp;·&nbsp; Esc Conclude
      </p>
    </div>
  );
};
