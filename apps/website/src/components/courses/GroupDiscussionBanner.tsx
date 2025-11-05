import React, {
  useState, useMemo, useEffect,
} from 'react';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import {
  CTALinkOrButton,
} from '@bluedot/ui';
import { skipToken } from '@tanstack/react-query';
import { FaCopy } from 'react-icons/fa6';
import GroupSwitchModal from './GroupSwitchModal';
import { formatDateTimeRelative, formatDateMonthAndDay, formatTime12HourClock } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

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
  const [hostKeyCopied, setHostKeyCopied] = useState(false);

  // Update current time every 30 seconds for smoother countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!hostKeyCopied) return undefined;

    const timeoutId = setTimeout(() => {
      setHostKeyCopied(false);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [hostKeyCopied]);

  const { data: discussionUnit } = trpc.courses.getUnit.useQuery(
    groupDiscussion.courseBuilderUnitRecordId
      ? { courseSlug: unit.courseSlug, unitId: groupDiscussion.courseBuilderUnitRecordId }
      : skipToken,
  );

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
    if (hostKeyForFacilitators) {
      try {
        await navigator.clipboard.writeText(hostKeyForFacilitators);
        setHostKeyCopied(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to copy host key to clipboard:', error);
      }
    }
  };

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
            className="w-full"
          >
            Join discussion
          </CTALinkOrButton>
        ) : (
          <CTALinkOrButton onClick={onClickPrepare} className="w-full">
            Prepare for discussion
          </CTALinkOrButton>
        )}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(175px,1fr))] gap-2 w-full">
          {discussionStartsSoon && userRole === 'facilitator' && hostKeyForFacilitators && (
            <CTALinkOrButton
              variant="secondary"
              className="w-full gap-2"
              onClick={copyHostKeyIfFacilitator}
            >
              <span className="text-gray-600"><FaCopy size={14} /></span>
              {hostKeyCopied ? 'Copied host key!' : `Host key: ${hostKeyForFacilitators}`}
            </CTALinkOrButton>
          )}
          {(discussionStartsSoon || userRole === 'facilitator') && (
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
          initialUnitNumber={(discussionUnit || unit).unitNumber.toString()}
          courseSlug={unit.courseSlug}
        />
      )}
    </div>
  );
};

export default GroupDiscussionBanner;
