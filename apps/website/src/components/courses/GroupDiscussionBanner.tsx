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

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Unit = InferSelectModel<typeof unitTable.pg>;

// Time constants
const ONE_HOUR_MS = 3600_000; // 1 hour in milliseconds

type GroupDiscussionBannerProps = {
  unit: Unit;
  groupDiscussion: GroupDiscussion;
  onClickPrepare: () => void;
};

const getDiscussionTimeDisplayStrings = (startDateTime: number) => {
  const startDate = new Date(startDateTime * 1000);
  const now = new Date();
  const timeDiffMs = startDate.getTime() - now.getTime();

  // Helper to pluralize units
  const pluralizeTimeUnit = (value: number, unit: string) => `${value} ${unit}${value !== 1 ? 's' : ''}`;

  // Helper to build human-readable time until/since
  const buildRelativeTimeString = (minutes: number, hours: number, days: number, suffix: string) => {
    if (days >= 1) {
      return `${pluralizeTimeUnit(days, 'day')}${suffix}`;
    }
    if (hours >= 1) {
      const remainingMinutes = minutes % 60;
      const hourPart = pluralizeTimeUnit(hours, 'hour');
      return remainingMinutes > 0
        ? `${hourPart} ${pluralizeTimeUnit(remainingMinutes, 'minute')}${suffix}`
        : `${hourPart}${suffix}`;
    }
    return `${pluralizeTimeUnit(minutes, 'minute')}${suffix}`;
  };

  // Calculate time units
  const absMinutes = Math.abs(Math.floor(timeDiffMs / (1000 * 60)));
  const absHours = Math.floor(absMinutes / 60);
  const absDays = Math.floor(absHours / 24);

  // Determine relative time string
  let startTimeDisplayRelative: string;
  if (timeDiffMs >= 0 && timeDiffMs < 60000) {
    startTimeDisplayRelative = 'starting now';
  } else if (timeDiffMs > 0) {
    startTimeDisplayRelative = `in ${buildRelativeTimeString(absMinutes, absHours, absDays, '')}`;
  } else {
    startTimeDisplayRelative = buildRelativeTimeString(absMinutes, absHours, absDays, ' ago');
  }

  // Format date and time
  const startTimeDisplayDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const startTimeDisplayTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { startTimeDisplayRelative, startTimeDisplayDate, startTimeDisplayTime };
};

const GroupDiscussionBanner: React.FC<GroupDiscussionBannerProps> = ({
  unit,
  groupDiscussion,
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
  const { startTimeDisplayRelative, startTimeDisplayDate, startTimeDisplayTime } = useMemo(() => getDiscussionTimeDisplayStrings(groupDiscussion.startDateTime), [groupDiscussion.startDateTime, currentTime]);

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
          <CTALinkOrButton
            variant="secondary"
            className="w-full"
            onClick={() => setGroupSwitchModalOpen(true)}
          >
            Can't make it?
          </CTALinkOrButton>
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
