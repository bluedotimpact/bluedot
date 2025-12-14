import { GroupDiscussion } from '@bluedot/db';

const ONE_HOUR_MS = 3_600_000;

/**
 * Determines the time state of a group discussion.
 * - `ended`: end time has passed
 * - `live`: start time <= current time <= end time
 * - `soon`: starts within 1 hour
 * - `upcoming`: more than 1 hour away
 */
export function getDiscussionTimeState({
  discussion,
  currentTimeMs,
}: {
  discussion: Pick<GroupDiscussion, 'startDateTime' | 'endDateTime'>;
  currentTimeMs: number;
}) {
  const startMs = discussion.startDateTime * 1000;
  const endMs = discussion.endDateTime * 1000;

  if (currentTimeMs > endMs) {
    return 'ended';
  }

  if (currentTimeMs >= startMs) {
    return 'live';
  }

  if (startMs - currentTimeMs <= ONE_HOUR_MS) {
    return 'soon';
  }

  return 'upcoming';
}
