import type { GroupDiscussion, Unit } from '@bluedot/db';
import { useCurrentTimeMs } from '@bluedot/ui';
import { useState } from 'react';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { buildCourseUnitUrl, formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';
import GroupSwitchModal from '../courses/GroupSwitchModal';
import NextDiscussionCard, { type NextDiscussionCardState } from './NextDiscussionCard';

type NextDiscussionSectionProps = {
  courseSlug: string;
  courseTitle: string;
  discussion: GroupDiscussion;
  unit: Unit | null;
};

const formatEyebrow = (state: NextDiscussionCardState, courseTitle: string, unitNumber: string | undefined, minutesUntil: number) => {
  if (state === 'live') return 'LIVE';
  if (state === 'soon') {
    return minutesUntil === 1 ? 'Starts in 1 minute' : `Starts in ${minutesUntil} minutes`;
  }

  if (unitNumber === undefined) return courseTitle.toUpperCase();
  // Course-title prefix is desktop-only per design (mobile shows just "UNIT N").
  return (
    <>
      <span className="hidden sm:inline">{courseTitle.toUpperCase()}: </span>
      UNIT {unitNumber}
    </>
  );
};

const formatDatetimeLabel = (startSec: number, endSec: number) =>
  `${formatDateMonthAndDay(startSec)}, ${formatTime12HourClock(startSec)} - ${formatTime12HourClock(endSec)}`;

const TIME_STATE_TO_CARD_STATE: Record<ReturnType<typeof getDiscussionTimeState>, NextDiscussionCardState> = {
  live: 'live',
  soon: 'soon',
  upcoming: 'next',
  ended: 'next',
};

const NextDiscussionSection = ({
  courseSlug, courseTitle, discussion, unit,
}: NextDiscussionSectionProps) => {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const currentTimeMs = useCurrentTimeMs();

  const startMs = discussion.startDateTime * 1000;
  const cardState = TIME_STATE_TO_CARD_STATE[getDiscussionTimeState({ discussion, currentTimeMs })];

  const minutesUntil = Math.max(0, Math.round((startMs - currentTimeMs) / 60_000));
  const start = new Date(startMs);
  const month = start.toLocaleDateString('en-US', { month: 'short' });
  const day = start.getDate();

  const unitNumber = unit?.unitNumber;
  const title = unit?.title ?? 'Discussion';

  let primaryHref: string | undefined;
  if (cardState === 'live') {
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    primaryHref = discussion.zoomLink || undefined;
  } else if (unit) {
    primaryHref = buildCourseUnitUrl({ courseSlug, unitNumber: unit.unitNumber });
  }

  // The title always links to the unit page (curriculum), independent of the primary CTA
  // which flips to zoom when live.
  const titleHref = unit ? buildCourseUnitUrl({ courseSlug, unitNumber: unit.unitNumber }) : undefined;

  const roundId = discussion.round;

  return (
    <div>
      <h2 className="mb-3 text-size-sm font-semibold text-bluedot-navy">Next discussion</h2>
      <NextDiscussionCard
        month={month}
        day={day}
        eyebrow={formatEyebrow(cardState, courseTitle, unitNumber, minutesUntil)}
        title={title}
        titleHref={titleHref}
        datetimeLabel={formatDatetimeLabel(discussion.startDateTime, discussion.endDateTime)}
        state={cardState}
        primaryHref={primaryHref}
        onReschedule={roundId ? () => setRescheduleOpen(true) : undefined}
      />
      {rescheduleOpen && roundId && (
        <GroupSwitchModal
          handleClose={() => setRescheduleOpen(false)}
          initialUnitNumber={unit?.unitNumber}
          courseSlug={courseSlug}
          roundId={roundId}
        />
      )}
    </div>
  );
};

export default NextDiscussionSection;
