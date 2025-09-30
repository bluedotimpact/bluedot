import React, {
  useState, useMemo, useEffect,
} from 'react';
import {
  InferSelectModel,
  groupDiscussionTable,
  unitTable,
} from '@bluedot/db';
import {
  CTALinkOrButton,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import GroupSwitchModal from './GroupSwitchModal';
import { formatDateTimeRelative, formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Unit = InferSelectModel<typeof unitTable.pg>;

// Time constants
const ONE_HOUR_MS = 3600_000; // 1 hour in milliseconds

type GroupDiscussionBannerProps = {
  unit: Unit;
  groupDiscussion: GroupDiscussion;
  userRole?: 'participant' | 'facilitator';
  hostKeyForFacilitators?: string;
  onClickPrepare: () => void;
};

const GroupDiscussionBanner: React.FC<GroupDiscussionBannerProps> = ({
  unit,
  groupDiscussion,
  userRole,
  hostKeyForFacilitators,
  onClickPrepare,
}) => {
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [discussionUnit, setDiscussionUnit] = useState<Unit | null>(null);

  // Update current time every 30 seconds for smoother countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Always fetch the unit based on courseBuilderUnitRecordId
  const [{ data: fetchedUnit }] = useAxios<{ unit: Unit }>({
    url: groupDiscussion.courseBuilderUnitRecordId
      ? `/api/courses/${unit.courseSlug}/units/${groupDiscussion.courseBuilderUnitRecordId}`
      : undefined,
    method: 'get',
  }, {
    manual: !groupDiscussion.courseBuilderUnitRecordId,
  });

  useEffect(() => {
    if (fetchedUnit?.unit) {
      // Always use the fetched unit when available
      setDiscussionUnit(fetchedUnit.unit);
    } else {
      // No fetched unit yet
      setDiscussionUnit(null);
    }
  }, [fetchedUnit]);

  const unitTitle = discussionUnit
    ? `Unit ${discussionUnit.unitNumber}: ${discussionUnit.title}`
    : `Unit ${groupDiscussion.unitNumber || ''}`; // Fallback to unitNumber if unit not found

  // Recalculate time strings when currentTime changes
  const startTimeDisplayRelative = useMemo(() => formatDateTimeRelative(groupDiscussion.startDateTime), [groupDiscussion.startDateTime, currentTime]);
  const startTimeDisplayDate = useMemo(() => formatDateMonthAndDay(groupDiscussion.startDateTime), [groupDiscussion.startDateTime]);
  const startTimeDisplayTime = useMemo(() => formatTime12HourClock(groupDiscussion.startDateTime), [groupDiscussion.startDateTime]);

  // Dynamic discussion starts soon check
  const discussionStartsSoon = useMemo(
    () => (groupDiscussion.startDateTime * 1000 - currentTime) <= ONE_HOUR_MS,
    [groupDiscussion.startDateTime, currentTime],
  );

  const discussionMeetLink = groupDiscussion.zoomLink || '';

  const discussionDocLink = groupDiscussion.activityDoc || '';

  const slackChannelLink = groupDiscussion.slackChannelId
    ? `https://app.slack.com/client/T01K0M15NEQ/${groupDiscussion.slackChannelId}`
    : '';

  const copyHostKeyIfFacilitator = async () => {
    if (userRole === 'facilitator' && hostKeyForFacilitators) {
      try {
        await navigator.clipboard.writeText(hostKeyForFacilitators);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to copy host key to clipboard:', error);
      }
    }
  };

  const joinButtonText = userRole === 'facilitator' && hostKeyForFacilitators ? `Join discussion (Host key: ${hostKeyForFacilitators})` : 'Join discussion';

  return (
    <div className="flex flex-col p-2 border-1 border-charcoal-light gap-2">
      <div className="flex justify-between items-center px-4 my-1 gap-4">
        <div>
          Your discussion on <span className="font-semibold">{unitTitle}</span> starts {startTimeDisplayRelative}
        </div>
        <div className="inline-block border border-charcoal-light rounded p-2 text-center text-size-sm">
          <div className="font-semibold whitespace-nowrap">{startTimeDisplayDate}</div>
          <div className="text-gray-600 whitespace-nowrap">{startTimeDisplayTime}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {discussionStartsSoon ? (
          <CTALinkOrButton
            target="_blank"
            url={discussionMeetLink}
            onClick={copyHostKeyIfFacilitator}
            className="w-full"
          >
            {joinButtonText}
          </CTALinkOrButton>
        ) : (
          <CTALinkOrButton onClick={onClickPrepare} className="w-full">
            Prepare for discussion
          </CTALinkOrButton>
        )}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(175px,1fr))] gap-2 w-full">
          {discussionStartsSoon && (
            <CTALinkOrButton
              variant="secondary"
              target="_blank"
              className="w-full"
              url={discussionDocLink}
            >
              Open discussion doc
            </CTALinkOrButton>
          )}
          <CTALinkOrButton
            variant="secondary"
            target="_blank"
            className="w-full"
            url={slackChannelLink}
          >
            Message your group
          </CTALinkOrButton>
          {userRole !== 'facilitator' && (
            <CTALinkOrButton
              variant="secondary"
              className="w-full"
              onClick={() => setGroupSwitchModalOpen(true)}
            >
              Can't make it?
            </CTALinkOrButton>
          )}
        </div>
      </div>
      {groupSwitchModalOpen && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitchModalOpen(false)}
          currentUnit={discussionUnit || unit}
          courseSlug={unit.courseSlug}
        />
      )}
    </div>
  );
};

export default GroupDiscussionBanner;
