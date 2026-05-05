import type { GroupDiscussion, Unit } from '@bluedot/db';
import { useCurrentTimeMs } from '@bluedot/ui';
import { useState } from 'react';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { buildCourseUnitUrl } from '../../lib/utils';
import GroupSwitchModal from '../courses/GroupSwitchModal';
import NextDiscussionCard, { type NextDiscussionCardState } from './NextDiscussionCard';

type NextDiscussionSectionProps = {
  courseSlug: string;
  discussion: GroupDiscussion;
  unit: Unit | null;
};

const formatEyebrow = (state: NextDiscussionCardState, unitNumber: string | undefined, minutesUntil: number) => {
  if (state === 'live') return 'LIVE';
  if (state === 'soon') {
    return minutesUntil === 1 ? 'Starts in 1 minute' : `Starts in ${minutesUntil} minutes`;
  }

  return unitNumber !== undefined ? `UNIT ${unitNumber}` : '';
};

const formatDatetimeLabel = (startMs: number, endMs: number) => {
  const start = new Date(startMs);
  const end = new Date(endMs);
  const date = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date}, ${time(start)} - ${time(end)}`;
};

const TIME_STATE_TO_CARD_STATE: Record<ReturnType<typeof getDiscussionTimeState>, NextDiscussionCardState> = {
  live: 'live',
  soon: 'soon',
  upcoming: 'next',
  ended: 'next',
};

const NextDiscussionSection = ({ courseSlug, discussion, unit }: NextDiscussionSectionProps) => {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const currentTimeMs = useCurrentTimeMs();

  const startMs = discussion.startDateTime * 1000;
  const endMs = discussion.endDateTime * 1000;
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

  const roundId = discussion.round;

  return (
    <div>
      <h2 className="mb-3 text-size-sm font-semibold text-bluedot-navy">Next discussion</h2>
      <NextDiscussionCard
        month={month}
        day={day}
        eyebrow={formatEyebrow(cardState, unitNumber, minutesUntil)}
        title={title}
        datetimeLabel={formatDatetimeLabel(startMs, endMs)}
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
