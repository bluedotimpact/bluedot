import type { Unit } from '@bluedot/db';
import type { GroupDiscussionWithEnd } from '../../lib/group-discussions/utils';
import type { SwitchType } from '../courses/GroupSwitchModal';
import DiscussionListRow, { type DiscussionListRowMode } from './DiscussionListRow';

type DiscussionListProps = {
  mode?: DiscussionListRowMode;
  discussions: GroupDiscussionWithEnd[];
  units: Record<string, Unit>;
  attendedDiscussionIds: string[];
  courseSlug: string;
  canReschedule: boolean;
  rescheduleEligibleUnits: string[];
  onClickReschedule: (props: { unitNumber: string | null; switchType: SwitchType }) => void;
  onClickFacilitatorReschedule?: (discussion: GroupDiscussionWithEnd) => void;
  onClickFacilitatorAssignSubstitute?: (discussion: GroupDiscussionWithEnd) => void;
  onClickViewAttendees?: () => void;
};

const DiscussionList = ({
  mode = 'participant',
  discussions, units, attendedDiscussionIds, courseSlug, canReschedule, rescheduleEligibleUnits, onClickReschedule,
  onClickFacilitatorReschedule, onClickFacilitatorAssignSubstitute, onClickViewAttendees,
}: DiscussionListProps) => {
  const eligibleSet = new Set(rescheduleEligibleUnits);
  const attendedSet = new Set(attendedDiscussionIds);

  return (
    <ul className="px-6">
      {discussions.map((discussion) => {
        const unit = units[discussion.id] ?? null;

        return (
          <DiscussionListRow
            key={discussion.id}
            mode={mode}
            discussion={discussion}
            unit={unit}
            courseSlug={courseSlug}
            isAttended={attendedSet.has(discussion.id)}
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

export default DiscussionList;
