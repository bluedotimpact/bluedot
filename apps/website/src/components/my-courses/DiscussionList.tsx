import type { Group, Unit } from '@bluedot/db';
import { isDiscussionFacilitator, isGroupFacilitator, type GroupDiscussionWithEnd } from '../../lib/group-discussions/utils';
import type { SwitchType } from '../courses/GroupSwitchModal';
import DiscussionListRow, { type DiscussionListRowMode } from './DiscussionListRow';

export type FacilitatorViewContext = {
  currentUserMeetPersonId: string | null;
  group: Pick<Group, 'facilitator'>;
  facilitatorNamesByMeetPersonId: Record<string, string>;
};

type DiscussionListProps = {
  mode?: DiscussionListRowMode;
  discussions: GroupDiscussionWithEnd[];
  units: Record<string, Unit>;
  attendedDiscussionIds: string[];
  courseSlug: string;
  canReschedule: boolean;
  rescheduleEligibleUnits: string[];
  discussionIdsWithPendingReschedule?: string[];
  facilitatorViewContext?: FacilitatorViewContext;
  onClickReschedule: (props: { unitNumber: string | null; switchType: SwitchType }) => void;
  onClickFacilitatorReschedule?: (discussion: GroupDiscussionWithEnd) => void;
  onClickFacilitatorAssignSubstitute?: (discussion: GroupDiscussionWithEnd) => void;
  onClickViewAttendees?: () => void;
};

const DiscussionList = ({
  mode = 'participant',
  discussions, units, attendedDiscussionIds, courseSlug, canReschedule, rescheduleEligibleUnits, discussionIdsWithPendingReschedule = [],
  facilitatorViewContext,
  onClickReschedule, onClickFacilitatorReschedule, onClickFacilitatorAssignSubstitute, onClickViewAttendees,
}: DiscussionListProps) => {
  const eligibleSet = new Set(rescheduleEligibleUnits);
  const attendedSet = new Set(attendedDiscussionIds);
  const pendingRescheduleSet = new Set(discussionIdsWithPendingReschedule);

  return (
    <ul className="px-6">
      {discussions.map((discussion) => {
        const unit = units[discussion.id] ?? null;
        const substituteFacilitatorRowProps = facilitatorViewContext && getSubstituteFacilitatorRowProps(discussion, facilitatorViewContext);

        return (
          <DiscussionListRow
            key={discussion.id}
            mode={mode}
            discussion={discussion}
            unit={unit}
            courseSlug={courseSlug}
            isAttended={attendedSet.has(discussion.id)}
            hasPendingReschedule={pendingRescheduleSet.has(discussion.id)}
            isFacilitatedByCurrentUser={substituteFacilitatorRowProps?.isFacilitatedByCurrentUser}
            substituteFacilitatorNote={substituteFacilitatorRowProps?.substituteFacilitatorNote}
            canReschedule={canReschedule && (unit?.unitNumber !== undefined && eligibleSet.has(unit.unitNumber))}
            onReschedule={() => onClickReschedule({ unitNumber: unit?.unitNumber ?? null, switchType: 'Switch group for one unit' })}
            onClickFacilitatorReschedule={onClickFacilitatorReschedule}
            onClickFacilitatorAssignSubstitute={onClickFacilitatorAssignSubstitute}
            onClickViewAttendees={onClickViewAttendees}
          />
        );
      })}
    </ul>
  );
};

const getSubstituteFacilitatorRowProps = (
  discussion: Pick<GroupDiscussionWithEnd, 'facilitators'>,
  { currentUserMeetPersonId, group, facilitatorNamesByMeetPersonId }: FacilitatorViewContext,
) => {
  const namesOf = (ids: string[]) => ids.flatMap((id) => (facilitatorNamesByMeetPersonId[id] ? [facilitatorNamesByMeetPersonId[id]] : []));
  const currentUserIsGroupFacilitator = currentUserMeetPersonId !== null && isGroupFacilitator(group, currentUserMeetPersonId);
  const isFacilitatedByCurrentUser = currentUserMeetPersonId !== null && isDiscussionFacilitator(discussion, currentUserMeetPersonId);

  if (isFacilitatedByCurrentUser && !currentUserIsGroupFacilitator) {
    const groupFacilitatorNames = namesOf(group.facilitator ?? []);
    return { isFacilitatedByCurrentUser, substituteFacilitatorNote: groupFacilitatorNames.length > 0 ? `Covering for ${groupFacilitatorNames.join(', ')}` : 'Covering as substitute' };
  }

  const substituteFacilitatorIds = discussion.facilitators.filter((id) => !isGroupFacilitator(group, id));
  if (!isFacilitatedByCurrentUser && substituteFacilitatorIds.length > 0) {
    const substituteNames = namesOf(substituteFacilitatorIds);
    return { isFacilitatedByCurrentUser, substituteFacilitatorNote: substituteNames.length > 0 ? `Covered by ${substituteNames.join(', ')}` : 'Covered by a substitute' };
  }

  return { isFacilitatedByCurrentUser, substituteFacilitatorNote: null };
};

export default DiscussionList;
