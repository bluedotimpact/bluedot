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
  <div aria-hidden className="flex size-16 shrink-0 flex-col overflow-hidden rounded-2xl border border-color-divider bg-white">
    <div className="flex h-6 items-center justify-center bg-bluedot-normal">
      <span className="text-size-xxs font-semibold text-white">{month.toUpperCase()}</span>
    </div>
    <div className="flex flex-1 items-center justify-center">
      {/* Calendar-badge day. Off-scale by design — sits between text-size-lg (24) and text-size-xl (32) so neither token reads right at the badge's 64px proportion. */}
      {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
      <span className="text-[28px] font-bold leading-none text-bluedot-navy">{day}</span>
    </div>
  </div>
);

const NextDiscussionCard = ({
  month, day, eyebrow, title, datetimeLabel, state, onReschedule, primaryHref,
}: NextDiscussionCardProps) => {
  const isLive = state === 'live';
  const primaryLabel = isLive ? 'Join discussion' : 'Prep for discussion';
  return (
    <div className="flex items-center gap-5 rounded-xl border border-color-divider bg-white p-6">
      <CalendarBadge month={month} day={day} />
      <div className="min-w-0 flex-1">
        <p className="text-size-xxs font-semibold tracking-wide text-bluedot-normal">{eyebrow}</p>
        <h3 className="text-size-lg font-semibold text-bluedot-navy">{title}</h3>
        <p className="mt-2 text-size-xxs font-medium text-gray-500">{datetimeLabel}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <CTALinkOrButton
          variant="secondary"
          size="small"
          onClick={onReschedule}
        >
          Reschedule
        </CTALinkOrButton>
        <CTALinkOrButton
          variant="primary"
          size="small"
          url={primaryHref}
          target={isLive ? '_blank' : undefined}
        >
          {primaryLabel}
        </CTALinkOrButton>
      </div>
    </div>
  );
};

export default NextDiscussionCard;
