import { useCurrentTimeMs } from '@bluedot/ui';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
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
  const currentTimeMs = useCurrentTimeMs();
  const attendedSet = new Set(attendedDiscussionIds);

  return (
    <ul className="px-6">
      {discussions.map((discussion) => {
        const timeState = getDiscussionTimeState({ discussion, currentTimeMs });
        const isAttended = attendedSet.has(discussion.id);

        // Live wins over attended: suppress the Attended pill while a discussion is in progress so
        // users can't read off "you're counted as attended" the moment they click Join.
        let status: 'upcoming' | 'soon' | 'live' | 'attended' | 'absent';
        if (timeState === 'live') status = 'live';
        else if (isAttended) status = 'attended';
        else if (timeState === 'soon') status = 'soon';
        else if (timeState === 'ended') status = 'absent';
        else status = 'upcoming';

        const unit = units[discussion.id] ?? null;

        return (
          <DiscussionListRow
            key={discussion.id}
            discussion={discussion}
            unit={unit}
            courseSlug={courseSlug}
            status={status}
            canReschedule={canReschedule && (unit?.unitNumber !== undefined && eligibleSet.has(unit.unitNumber))}
            onReschedule={() => onClickReschedule({ unitNumber: unit?.unitNumber ?? null, switchType: 'Switch group for one unit' })}
          />
        );
      })}
    </ul>
  );
};

export default DiscussionList;
