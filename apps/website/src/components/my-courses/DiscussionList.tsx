import type { GroupDiscussion, Unit } from '@bluedot/db';
import type { SwitchType } from '../courses/GroupSwitchModal';
import DiscussionListRow from './DiscussionListRow';

type DiscussionListProps = {
  discussions: GroupDiscussion[];
  units: Record<string, Unit>;
  attendedDiscussionIds: string[];
  courseSlug: string;
  canReschedule: boolean;
  rescheduleEligibleUnits: string[];
  onClickReschedule: (props: { unitNumber: string | null; switchType: SwitchType }) => void;
};

const DiscussionList = ({
  discussions, units, attendedDiscussionIds, courseSlug, canReschedule, rescheduleEligibleUnits, onClickReschedule,
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
            discussion={discussion}
            unit={unit}
            courseSlug={courseSlug}
            isAttended={attendedSet.has(discussion.id)}
            canReschedule={canReschedule && (unit?.unitNumber !== undefined && eligibleSet.has(unit.unitNumber))}
            onReschedule={() => onClickReschedule({ unitNumber: unit?.unitNumber ?? null, switchType: 'Switch group for one unit' })}
          />
        );
      })}
    </ul>
  );
};

export default DiscussionList;
