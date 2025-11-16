import React, {
  useState, useMemo, useEffect,
} from 'react';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import {
  CTALinkOrButton,
  useCurrentTimeMs,
} from '@bluedot/ui';
import { skipToken } from '@tanstack/react-query';
import { MdOutlineVideocam } from 'react-icons/md';
import { IoAdd } from 'react-icons/io5';
import { FaCopy } from 'react-icons/fa6';
import GroupSwitchModal from './GroupSwitchModal';
import { formatDateTimeRelative } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

// Time constants
const ONE_HOUR_MS = 3600_000; // 1 hour in milliseconds

const VideoIconContainer: React.FC = () => (
  <div className="bg-white rounded px-2 py-1 flex items-center justify-center border border-[#C9D4F5]">
    <MdOutlineVideocam className="text-[#2244BB]" size={16} />
  </div>
);

const BUTTON_STYLES = {
  primary: { variant: 'primary' as const, className: 'text-[14px] bg-[#2244BB]' },
  secondary: { variant: 'outline-black' as const, className: 'bg-transparent border-[#B5C3EC] text-[14px] text-[#2244BB] hover:bg-bluedot-lighter' },
  ghost: { variant: 'outline-black' as const, className: 'bg-transparent border-none text-[#2244BB] hover:bg-bluedot-lighter' },
};

type ButtonConfig = {
  id: string;
  label: React.ReactNode;
  style: keyof typeof BUTTON_STYLES;
  url?: string;
  onClick?: () => void;
  isVisible: boolean;
};

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

  // TODO revert
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

  const buttons: ButtonConfig[] = [
    // Live discussion buttons
    {
      id: 'join-now',
      label: (
        <>
          <MdOutlineVideocam size={24} />
          Join now
        </>
      ),
      style: 'primary',
      url: discussionMeetLink,
      isVisible: discussionStartsSoon,
    },
    {
      id: 'host-key',
      label: (
        <>
          <FaCopy size={16} />
          {hostKeyCopied ? 'Copied host key!' : `Host key: ${hostKeyForFacilitators}`}
        </>
      ),
      style: 'secondary',
      onClick: copyHostKeyIfFacilitator,
      isVisible: discussionStartsSoon && userRole === 'facilitator',
    },
    {
      id: 'discussion-doc',
      label: 'Open discussion doc',
      style: 'secondary',
      url: discussionDocLink,
      isVisible: discussionStartsSoon,
    },
    {
      id: 'message-group',
      label: 'Message group',
      style: 'secondary',
      url: slackChannelLink,
      isVisible: discussionStartsSoon,
    },
    // Upcoming discussion buttons
    {
      id: 'see-details',
      label: 'See details',
      style: 'secondary',
      url: '/settings/courses',
      isVisible: !discussionStartsSoon,
    },
    {
      id: 'cant-make-it',
      label: "Can't make it?",
      style: 'ghost',
      onClick: () => setGroupSwitchModalOpen(true),
      isVisible: true,
    },
  ];

  const visibleButtons = buttons.filter((button) => button.isVisible);

  return (
    <>
      <div className="flex flex-col gap-3 p-4 bg-[#E4EDFE] border-b border-[#C9D4F5]">
        <div className="flex items-center gap-3 text-size-xs">
          {discussionStartsSoon ? (
            // TODO add aura
            <div className="bg-[#2244BB] text-white px-2 py-1 rounded font-bold">
              <div className="-translate-y-[0.5px]">LIVE</div>
            </div>
          ) : (
            <VideoIconContainer />
          )}
          <div className="flex gap-[6px]">
            <span className="text-[#2244BB] font-bold">
              {discussionStartsSoon ? 'Discussion is live' : `Discussion ${startTimeDisplayRelative}`}
            </span>
            <span className="text-[#2244BB]">•</span>
            {/* TODO Make this a regular <a> */}
            <button
              type="button"
              onClick={onClickPrepare}
              className="text-[#2244BB] underline underline-offset-2 cursor-pointer"
            >
              {unitTitle}
            </button>
          </div>
          {/* Desktop button container */}
          {isOpen && (
            <div className="flex gap-3 flex-1 items-center">
              {visibleButtons.map((button, index) => {
                const style = BUTTON_STYLES[button.style];
                const isLastButton = index === visibleButtons.length - 1;
                return (
                  <CTALinkOrButton
                    key={button.id}
                    variant={style.variant}
                    size="small"
                    url={button.url}
                    onClick={button.onClick}
                    target={button.url ? '_blank' : undefined}
                    className={`${style.className} flex gap-[6px] items-center ${isLastButton ? 'ml-auto' : ''}`.trim()}
                  >
                    {button.label}
                  </CTALinkOrButton>
                );
              })}
              <div className="w-px h-6 bg-[#B5C3EC]" />
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="cursor-pointer text-[#2244BB] ml-auto"
          >
            <IoAdd size={24} style={isOpen ? { transform: 'rotate(45deg)', transition: 'transform 200ms' } : { transition: 'transform 200ms' }} />
          </button>
        </div>
      </div>

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
