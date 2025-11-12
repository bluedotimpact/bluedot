import React, {
  useState, useMemo, useEffect,
} from 'react';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import {
  CTALinkOrButton,
  useCurrentTimeMs,
} from '@bluedot/ui';
import { skipToken } from '@tanstack/react-query';
import { MdVideocam } from 'react-icons/md';
import { IoAdd } from 'react-icons/io5';
import { FaCopy } from 'react-icons/fa6';
import GroupSwitchModal from './GroupSwitchModal';
import { formatDateTimeRelative } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

// Time constants
const ONE_HOUR_MS = 3600_000; // 1 hour in milliseconds

type GroupDiscussionBannerV2Props = {
  unit: Unit;
  groupDiscussion: GroupDiscussion;
  userRole?: 'participant' | 'facilitator';
  hostKeyForFacilitators?: string;
  onClickPrepare: () => void;
};

const GroupDiscussionBannerV2: React.FC<GroupDiscussionBannerV2Props> = ({
  unit,
  groupDiscussion,
  userRole,
  hostKeyForFacilitators,
  onClickPrepare,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);
  const currentTimeMs = useCurrentTimeMs();
  const [hostKeyCopied, setHostKeyCopied] = useState(false);

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
  const startTimeDisplayRelative = useMemo(() => formatDateTimeRelative({ dateTimeMs: groupDiscussion.startDateTime * 1000, currentTimeMs }), [groupDiscussion.startDateTime, currentTimeMs]);

  // Dynamic discussion starts soon check
  // const discussionStartsSoon = useMemo(
  //   () => (groupDiscussion.startDateTime * 1000 - currentTimeMs) <= ONE_HOUR_MS,
  //   [groupDiscussion.startDateTime, currentTimeMs],
  // );
  const discussionStartsSoon = true;

  const discussionMeetLink = groupDiscussion.zoomLink || '';
  const discussionDocLink = groupDiscussion.activityDoc || '';
  const slackChannelLink = groupDiscussion.slackChannelId
    ? `https://app.slack.com/client/T01K0M15NEQ/${groupDiscussion.slackChannelId}`
    : '';

  const copyHostKeyIfFacilitator = async () => {
    if (userRole === 'facilitator' && hostKeyForFacilitators) {
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
    <>
      {/* Closed state */}
      {!isOpen && (
        <div className="flex items-center gap-3 p-4 bg-bluedot-lighter">
          {discussionStartsSoon ? (
            <div className="bg-blue-600 text-white px-2 py-1 rounded text-size-xs font-semibold">
              LIVE
            </div>
          ) : (
            <MdVideocam size={20} />
          )}
          <span className="text-size-sm">
            {discussionStartsSoon ? 'Discussion is live' : `Discussion ${startTimeDisplayRelative}`}
          </span>
          <button
            type="button"
            onClick={onClickPrepare}
            className="text-size-sm hover:underline"
          >
            {unitTitle}
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hover:opacity-70"
          >
            <IoAdd size={24} />
          </button>
        </div>
      )}

      {/* Open state */}
      {isOpen && (
        <div className="flex flex-col gap-3 p-4 bg-bluedot-lighter">
          <div className="flex items-center gap-3">
            {discussionStartsSoon ? (
              <div className="bg-blue-600 text-white px-2 py-1 rounded text-size-xs font-semibold">
                LIVE
              </div>
            ) : (
              <MdVideocam size={20} />
            )}
            <span className="text-size-sm">
              {discussionStartsSoon ? 'Discussion is live' : `Discussion ${startTimeDisplayRelative}`}
            </span>
            <button
              type="button"
              onClick={onClickPrepare}
              className="text-size-sm hover:underline"
            >
              {unitTitle}
            </button>
            {!discussionStartsSoon && (
              <CTALinkOrButton
                variant="outline-black"
                size="small"
                url={`/courses/${unit.courseSlug}/settings`}
              >
                See details
              </CTALinkOrButton>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="hover:opacity-70"
            >
              <IoAdd size={24} style={{ transform: 'rotate(45deg)' }} />
            </button>
          </div>

          {discussionStartsSoon && (
            <div className="flex gap-2">
              <CTALinkOrButton
                variant="black"
                target="_blank"
                url={discussionMeetLink}
              >
                Join now
              </CTALinkOrButton>
              {userRole === 'facilitator' && hostKeyForFacilitators && (
                <CTALinkOrButton
                  variant="outline-black"
                  onClick={copyHostKeyIfFacilitator}
                >
                  <FaCopy size={14} />
                  {hostKeyCopied ? 'Copied host key!' : `Host key: ${hostKeyForFacilitators}`}
                </CTALinkOrButton>
              )}
              <CTALinkOrButton
                variant="outline-black"
                target="_blank"
                url={discussionDocLink}
              >
                Open discussion doc
              </CTALinkOrButton>
              <CTALinkOrButton
                variant="outline-black"
                target="_blank"
                url={slackChannelLink}
              >
                Message group
              </CTALinkOrButton>
            </div>
          )}

          {userRole !== 'facilitator' && (
            <div className="flex gap-2">
              <CTALinkOrButton
                variant="outline-black"
                onClick={() => setGroupSwitchModalOpen(true)}
              >
                Can't make it?
              </CTALinkOrButton>
            </div>
          )}
        </div>
      )}

      {groupSwitchModalOpen && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitchModalOpen(false)}
          initialUnitNumber={(discussionUnit || unit).unitNumber.toString()}
          courseSlug={unit.courseSlug}
        />
      )}
    </>
  );
};

export default GroupDiscussionBannerV2;
