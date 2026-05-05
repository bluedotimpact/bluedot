import { useCurrentTimeMs } from '@bluedot/ui';
import { skipToken } from '@tanstack/react-query';
import { useState } from 'react';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { buildCourseUnitUrl } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import GroupSwitchModal from '../courses/GroupSwitchModal';
import NextDiscussionCard, { type NextDiscussionCardState } from './NextDiscussionCard';

type NextDiscussionSectionProps = {
  courseSlug: string;
};

const formatEyebrow = (state: NextDiscussionCardState, unitNumber: number | string | undefined, minutesUntil: number) => {
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

const NextDiscussionSection = ({ courseSlug }: NextDiscussionSectionProps) => {
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const currentTimeMs = useCurrentTimeMs();

  const { data: nextDiscussion } = trpc.groupDiscussions.getByCourseSlug.useQuery({ courseSlug });
  const groupDiscussion = nextDiscussion?.groupDiscussion;

  const { data: unit } = trpc.courses.getUnit.useQuery(
    groupDiscussion?.courseBuilderUnitRecordId
      ? { courseSlug, unitId: groupDiscussion.courseBuilderUnitRecordId }
      : skipToken,
  );

  if (!groupDiscussion) return null;

  const startMs = groupDiscussion.startDateTime * 1000;
  const endMs = groupDiscussion.endDateTime * 1000;
  const timeState = getDiscussionTimeState({ discussion: groupDiscussion, currentTimeMs });

  // getDiscussionTimeState returns 'ended' | 'live' | 'soon' | 'upcoming'.
  // The endpoint already filters out 'ended' so only 3 cases remain.
  const cardState: NextDiscussionCardState = timeState === 'live' ? 'live' : timeState === 'soon' ? 'soon' : 'next';

  const minutesUntil = Math.max(0, Math.round((startMs - currentTimeMs) / 60_000));
  const start = new Date(startMs);
  const month = start.toLocaleDateString('en-US', { month: 'short' });
  const day = start.getDate();

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const unitNumber: number | string | undefined = unit?.unitNumber || groupDiscussion.unitFallback || undefined;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const title = unit?.title || 'Discussion';

  const primaryHref = cardState === 'live'
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    ? (groupDiscussion.zoomLink || undefined)
    : (unit ? buildCourseUnitUrl({ courseSlug, unitNumber: unit.unitNumber }) : undefined);

  return (
    <section aria-labelledby="next-discussion-heading">
      <h2 id="next-discussion-heading" className="mb-3 text-size-sm font-semibold text-bluedot-navy">
        Next discussion
      </h2>
      <NextDiscussionCard
        month={month}
        day={day}
        eyebrow={formatEyebrow(cardState, unitNumber, minutesUntil)}
        title={title}
        datetimeLabel={formatDatetimeLabel(startMs, endMs)}
        state={cardState}
        primaryHref={primaryHref}
        onReschedule={groupDiscussion.round ? () => setRescheduleOpen(true) : undefined}
      />
      {rescheduleOpen && groupDiscussion.round && unit && (
        <GroupSwitchModal
          handleClose={() => setRescheduleOpen(false)}
          initialUnitNumber={unit.unitNumber.toString()}
          courseSlug={courseSlug}
          roundId={groupDiscussion.round}
        />
      )}
    </section>
  );
};

export default NextDiscussionSection;
