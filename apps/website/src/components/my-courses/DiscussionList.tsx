import { useCurrentTimeMs } from '@bluedot/ui';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import type { SwitchType } from '../courses/GroupSwitchModal';
import DiscussionListRow from './DiscussionListRow';

type DiscussionListProps = {
  discussions: GroupDiscussion[];
  units: Record<string, Unit>;
  attendedDiscussionIds: string[];
  onReschedule: (unitNumber: string | null, switchType: SwitchType) => void;
};

const DiscussionList = ({
  discussions, units, attendedDiscussionIds, onReschedule,
}: DiscussionListProps) => {
  const currentTimeMs = useCurrentTimeMs();
  const attendedSet = new Set(attendedDiscussionIds);

  return (
    <ul className="px-6">
      {discussions.map((discussion) => {
        const timeState = getDiscussionTimeState({ discussion, currentTimeMs });
        const isAttended = attendedSet.has(discussion.id);

        let status: 'upcoming' | 'soon' | 'live' | 'attended' | 'absent';
        if (isAttended) status = 'attended';
        else if (timeState === 'live') status = 'live';
        else if (timeState === 'soon') status = 'soon';
        else if (timeState === 'ended') status = 'absent';
        else status = 'upcoming';

        const unit = units[discussion.id] ?? null;

        return (
          <DiscussionListRow
            key={discussion.id}
            discussion={discussion}
            unit={unit}
            status={status}
            onReschedule={() => onReschedule(unit?.unitNumber ?? null, 'Switch group for one unit')}
          />
        );
      })}
    </ul>
  );
};

export default DiscussionList;
