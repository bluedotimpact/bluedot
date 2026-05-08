import { useCurrentTimeMs } from '@bluedot/ui';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { useState } from 'react';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import type { SwitchType } from '../courses/GroupSwitchModal';
import DiscussionListRow from './DiscussionListRow';

const COLLAPSED_LIMIT = 3;

type DiscussionListProps = {
  discussions: GroupDiscussion[];
  units: Record<string, Unit>;
  attendedDiscussionIds: string[];
  courseSlug: string;
  onReschedule: (unitNumber: string | null, switchType: SwitchType) => void;
};

const DiscussionList = ({
  discussions, units, attendedDiscussionIds, courseSlug, onReschedule,
}: DiscussionListProps) => {
  const currentTimeMs = useCurrentTimeMs();
  const attendedSet = new Set(attendedDiscussionIds);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? discussions : discussions.slice(0, COLLAPSED_LIMIT);

  return (
    <>
      <ul className="px-6">
        {visible.map((discussion) => {
          const timeState = getDiscussionTimeState({ discussion, currentTimeMs });
          const isAttended = attendedSet.has(discussion.id);

          // Live wins over attended: suppress the Attended pill while a discussion is in progress so
          // users can't read off "you're counted as attended" the moment they click Join. After the
          // discussion ends, the row flips to attended/absent as expected.
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
              onReschedule={() => onReschedule(unit?.unitNumber ?? null, 'Switch group for one unit')}
            />
          );
        })}
      </ul>
      {discussions.length > COLLAPSED_LIMIT && (
        <div className="px-6 pt-3 pb-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="cursor-pointer text-size-sm font-medium text-bluedot-normal transition-colors hover:text-blue-700"
            aria-expanded={showAll}
          >
            {showAll ? 'Show less' : `See all (${discussions.length}) discussions`}
          </button>
        </div>
      )}
    </>
  );
};

export default DiscussionList;
