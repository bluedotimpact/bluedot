import { cn } from '@bluedot/ui';
import { formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';

export type DateBadgeProps = {
  dateTimeSeconds: number;
  isLive: boolean;
  /** `calendar`: square, month over day. `dateTime`: 96px wide, date over time. */
  layout?: 'calendar' | 'dateTime';
  className?: string;
};

const BAND_CLASS = 'flex w-full items-center justify-center bg-accent text-size-xxs font-semibold leading-none text-on-dark';

/**
 * Fixed-footprint date badge leading a discussion card or row. Swaps in place to
 * NOW / LIVE when the discussion is live; the caller decides the live window.
 *
 * Figma draws only the 64px calendar square. Below `sm` it shrinks to 44px to
 * match the course icon on the sibling rows.
 */
export const DateBadge = ({
  dateTimeSeconds, isLive, layout = 'calendar', className,
}: DateBadgeProps) => {
  const isCalendar = layout === 'calendar';
  const date = new Date(dateTimeSeconds * 1000);

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col overflow-hidden rounded-surface border border-default bg-raised text-center tabular-nums',
        isCalendar ? 'size-11 sm:size-16' : 'w-24',
        className,
      )}
    >
      {isLive ? (
        <>
          <div className={cn('flex w-full items-center justify-center text-size-xs font-semibold leading-normal text-primary', isCalendar ? 'flex-1' : 'px-3 py-2')}>NOW</div>
          <div className={cn(BAND_CLASS, isCalendar ? 'h-4 sm:h-5' : 'py-[3px]')}>LIVE</div>
        </>
      ) : isCalendar ? (
        <time dateTime={date.toISOString()} className="contents">
          <div className={cn(BAND_CLASS, 'h-4 sm:h-6')}>{date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</div>
          {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
          <div className="flex flex-1 items-center justify-center text-size-md font-semibold leading-none text-primary sm:text-[28px] sm:font-bold">{date.getDate()}</div>
        </time>
      ) : (
        <time dateTime={date.toISOString()} className="flex flex-col gap-0.5 px-3 py-[7px]">
          <span className="text-size-xs font-semibold leading-normal text-primary">{formatDateMonthAndDay(dateTimeSeconds)}</span>
          <span className="text-size-xs leading-[1.5] text-secondary">{formatTime12HourClock(dateTimeSeconds)}</span>
        </time>
      )}
    </div>
  );
};
