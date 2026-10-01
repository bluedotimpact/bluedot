import type { GroupSwitching } from '@bluedot/db';
import type { SwitchType } from '../../components/courses/GroupSwitchModal';
import { ONE_DAY_MS } from '../constants';

export type SwitchRequestRow = Pick<GroupSwitching, 'requestStatus' | 'switchType' | 'oldDiscussion'>;

export type PendingSwitchRequestState = {
  /** Discussions the participant has an open one-unit reschedule request out of (and didn't attend anyway). */
  discussionIdsWithPendingReschedule: string[];
  hasPendingGroupSwitchRequest: boolean;
};

export const OPEN_SWITCH_REQUEST_STATUSES = ['Requested', 'Resolve'];

export const isOpenSwitchRequest = (row: SwitchRequestRow): boolean => !!row.requestStatus && OPEN_SWITCH_REQUEST_STATUSES.includes(row.requestStatus);

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

/** Which pending pill one discussion's actions show. A reschedule out of that discussion is the more specific of the two. */
export const getDiscussionPendingSwitch = (
  state: PendingSwitchRequestState,
  discussionId: string,
): SwitchType | null => {
  if (state.discussionIdsWithPendingReschedule.includes(discussionId)) return 'Switch group for one unit';
  if (state.hasPendingGroupSwitchRequest) return 'Switch group permanently';
  return null;
};
