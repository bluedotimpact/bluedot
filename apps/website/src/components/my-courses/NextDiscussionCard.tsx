import { CTALinkOrButton } from '@bluedot/ui';
import type { ReactNode } from 'react';

export type NextDiscussionCardState = 'next' | 'soon' | 'live';

export type NextDiscussionCardProps = {
  month: string;
  day: number | string;
  eyebrow: ReactNode;
  title: string;
  datetimeLabel: string;
  state: NextDiscussionCardState;
  onReschedule?: () => void;
  primaryHref?: string;
};

const CalendarBadge = ({ month, day }: { month: string; day: number | string }) => (
  <div aria-hidden className="flex size-11 shrink-0 flex-col overflow-hidden rounded-lg border border-color-divider bg-white sm:size-16 sm:rounded-2xl">
    <div className="flex h-4 items-center justify-center bg-bluedot-normal sm:h-6">
      {/* Mobile month label is 10px per design — below text-size-xxs (12px), no token. */}
      {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
      <span className="text-[10px]  leading-[16px] text-white sm:text-size-xxs sm:font-semibold">{month.toUpperCase()}</span>
    </div>
    <div className="flex flex-1 items-center justify-center">
      {/* Calendar-badge day. Off-scale by design — desktop sits between text-size-lg (24) and text-size-xl (32). */}
      {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
      <span className="text-size-md font-semibold leading-[24px] text-bluedot-navy sm:text-[28px] sm:font-bold sm:leading-none">{day}</span>
    </div>
  </div>
);

const NextDiscussionCard = ({
  month, day, eyebrow, title, datetimeLabel, state, onReschedule, primaryHref,
}: NextDiscussionCardProps) => {
  const isLive = state === 'live';
  const primaryLabel = isLive ? 'Join discussion' : 'Prep for discussion';
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-color-divider bg-white p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
      <div className="flex w-full items-start gap-4 sm:flex-1 sm:items-center sm:gap-5">
        <CalendarBadge month={month} day={day} />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <div className="flex flex-col items-start">
            <p className="text-size-xxs font-semibold leading-[16px] text-bluedot-normal">{eyebrow}</p>
            <h3 className="text-size-md font-semibold leading-[24px] text-bluedot-navy sm:text-size-lg sm:leading-[normal]">{title}</h3>
          </div>
          <p className="text-size-xxs  leading-[16px] text-gray-500">{datetimeLabel}</p>
        </div>
      </div>
      <div className="flex w-full gap-3 sm:w-auto sm:shrink-0 sm:items-center">
        <CTALinkOrButton
          variant="secondary"
          size="small"
          onClick={onReschedule}
          className="text-size-xxs "
        >
          Reschedule
        </CTALinkOrButton>
        <CTALinkOrButton
          variant="primary"
          size="small"
          url={primaryHref}
          target={isLive ? '_blank' : undefined}
          className="flex-1 text-size-xxs  sm:flex-none"
        >
          {primaryLabel}
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default NextDiscussionCard;
