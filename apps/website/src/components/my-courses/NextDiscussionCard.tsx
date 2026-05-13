import type { GroupDiscussion, Unit } from '@bluedot/db';
import { CTALinkOrButton, useCurrentTimeMs } from '@bluedot/ui';
import { useState, type ReactNode } from 'react';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { buildCourseUnitUrl, formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';
import GroupSwitchModal from '../courses/GroupSwitchModal';

type DiscussionTimeState = ReturnType<typeof getDiscussionTimeState>;

const formatEyebrow = (timeState: DiscussionTimeState, courseTitle: string, unitNumber: string | undefined, minutesUntil: number): ReactNode => {
  if (timeState === 'live') return 'LIVE';
  if (timeState === 'soon') {
    return minutesUntil === 1 ? 'Starts in 1 minute' : `Starts in ${minutesUntil} minutes`;
  }

  // 'upcoming' or 'ended': show the course/unit eyebrow.
  if (unitNumber === undefined) return courseTitle.toUpperCase();

  return (
    <>
      {courseTitle.toUpperCase()}: UNIT {unitNumber}
    </>
  );
};

const formatDatetimeLabel = (startSec: number, endSec: number) =>
  `${formatDateMonthAndDay(startSec)}, ${formatTime12HourClock(startSec)} - ${formatTime12HourClock(endSec)}`;

const CalendarBadge = ({ month, day }: { month: string; day: number }) => (
  <div aria-hidden className="flex size-11 shrink-0 flex-col overflow-hidden rounded-lg border border-color-divider bg-white sm:size-16 sm:rounded-2xl">
    <div className="flex h-4 items-center justify-center bg-bluedot-normal sm:h-6">
      {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
      <span className="text-[10px] leading-[16px] text-white sm:text-size-xxs sm:font-semibold">{month.toUpperCase()}</span>
    </div>
    <div className="flex flex-1 items-center justify-center">
      {/* eslint-disable-next-line @bluedot/custom/no-arbitrary-text-size */}
      <span className="text-size-md font-semibold leading-[24px] text-bluedot-navy sm:text-[28px] sm:font-bold sm:leading-none">{day}</span>
    </div>
  </div>
);

export type NextDiscussionCardProps = {
  courseSlug: string;
  courseTitle: string;
  discussion: GroupDiscussion;
  unit: Unit | null;
};

/**
 * Self-contained card showing one upcoming/live discussion. Owns its own reschedule
 * modal state so callers can drop multiple into a list without extra wiring.
 */
const NextDiscussionCard = ({
  courseSlug, courseTitle, discussion, unit,
}: NextDiscussionCardProps) => {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const currentTimeMs = useCurrentTimeMs();

  const startMs = discussion.startDateTime * 1000;
  const timeState = getDiscussionTimeState({ discussion, currentTimeMs });
  const isLive = timeState === 'live';

  const minutesUntil = Math.max(0, Math.round((startMs - currentTimeMs) / 60_000));
  const start = new Date(startMs);
  const month = start.toLocaleDateString('en-US', { month: 'short' });
  const day = start.getDate();

  const unitNumber = unit?.unitNumber;
  const titleHref = unit ? buildCourseUnitUrl({ courseSlug, unitNumber: unit.unitNumber }) : undefined;

  // Title always links to the unit page; the primary CTA flips to zoom when live.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const primaryHref = isLive ? (discussion.zoomLink || undefined) : titleHref;
  const primaryLabel = isLive ? 'Join discussion' : 'Prep for discussion';

  const roundId = discussion.round;

  return (
    <>
      <div className="flex flex-col gap-4 rounded-xl border border-color-divider bg-white p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
        <div className="flex w-full items-start gap-4 sm:flex-1 sm:items-center sm:gap-5">
          <CalendarBadge month={month} day={day} />
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
            <div className="flex flex-col items-start">
              <p className="text-size-xxs font-semibold leading-[16px] text-bluedot-normal">
                {formatEyebrow(timeState, courseTitle, unitNumber, minutesUntil)}
              </p>
              <h3 className="text-size-md font-semibold leading-[24px] text-bluedot-navy sm:text-size-lg sm:leading-[normal]">
                {titleHref ? (
                  <a
                    href={titleHref}
                    className="text-bluedot-navy no-underline transition-colors hover:text-bluedot-normal hover:underline underline-offset-2"
                  >
                    {unit?.title ?? 'Discussion'}
                  </a>
                ) : (unit?.title ?? 'Discussion')}
              </h3>
            </div>
            <p className="text-size-xs text-bluedot-navy">
              {formatDatetimeLabel(discussion.startDateTime, discussion.endDateTime)}
            </p>
          </div>
        </div>
        <div className="flex w-full gap-3 sm:w-auto sm:shrink-0 sm:items-center">
          {roundId && (
            <CTALinkOrButton
              variant="secondary"
              size="small"
              onClick={() => setRescheduleOpen(true)}
              className="text-size-xxs"
            >
              Reschedule
            </CTALinkOrButton>
          )}
          <CTALinkOrButton
            variant="primary"
            size="small"
            url={primaryHref}
            target={isLive ? '_blank' : undefined}
            className="flex-1 text-size-xxs sm:flex-none"
          >
            {primaryLabel}
          </CTALinkOrButton>
        </div>
      </div>
      {rescheduleOpen && roundId && (
        <GroupSwitchModal
          handleClose={() => setRescheduleOpen(false)}
          initialUnitNumber={unit?.unitNumber}
          courseSlug={courseSlug}
          roundId={roundId}
        />
      )}
    </>
  );
};

export default NextDiscussionCard;
