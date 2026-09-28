import type { GroupSwitching } from '@bluedot/db';
import { ONE_DAY_MS } from '../constants';

export type SwitchRequestRow = Pick<GroupSwitching, 'requestStatus' | 'switchType' | 'oldDiscussion'>;

export type PendingSwitchRequestState = {
  /** Discussions the participant has an open one-unit reschedule request out of (and didn't attend anyway). */
  discussionIdsWithPendingReschedule: string[];
  /** The participant has an open request to switch group permanently. */
  hasPendingGroupSwitchRequest: boolean;
};

/** A request that nobody has actioned yet. */
export const isOpenSwitchRequest = (row: SwitchRequestRow): boolean => row.requestStatus === 'Requested' || row.requestStatus === 'Resolve';

/** The round is over once its last discussion day is fully behind us. */
export const getRoundEndMs = (lastDiscussionDate: string | null | undefined): number | null => {
  if (!lastDiscussionDate) return null;
  const startOfLastDayMs = new Date(lastDiscussionDate).getTime();
  return Number.isNaN(startOfLastDayMs) ? null : startOfLastDayMs + ONE_DAY_MS;
};

/** Which pending-switch chips to show. Every surface goes through this so they all agree. */
export const getPendingSwitchRequestState = ({
  switchRequests, attendedDiscussionIds, roundEndMs, nowMs,
}: {
  switchRequests: SwitchRequestRow[];
  attendedDiscussionIds: string[];
  /** null = unknown, so don't treat the requests as stale. */
  roundEndMs: number | null;
  nowMs: number;
}): PendingSwitchRequestState => {
  const isRoundOver = roundEndMs !== null && nowMs >= roundEndMs;
  if (isRoundOver) {
    return { discussionIdsWithPendingReschedule: [], hasPendingGroupSwitchRequest: false };
  }

  const openRequests = switchRequests.filter(isOpenSwitchRequest);
  const attended = new Set(attendedDiscussionIds);
  const discussionIdsWithPendingReschedule = [...new Set(openRequests
    .filter((r) => r.switchType === 'Switch group for one unit')
    .flatMap((r) => r.oldDiscussion ?? []))]
    .filter((id) => !attended.has(id));

  return {
    discussionIdsWithPendingReschedule,
    hasPendingGroupSwitchRequest: openRequests.some((r) => r.switchType === 'Switch group permanently'),
  };
};
