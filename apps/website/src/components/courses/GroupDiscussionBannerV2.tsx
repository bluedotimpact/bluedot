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
import clsx from 'clsx';
import GroupSwitchModal from './GroupSwitchModal';
import { formatDateTimeRelative } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

// Time constants
const ONE_HOUR_MS = 3600_000; // 1 hour in milliseconds

const VideoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    className={className}
  >
    <g clipPath="url(#clip0_95_681)">
      <path d="M13.4166 4.08341L9.33331 7.00008L13.4166 9.91675V4.08341Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.16665 2.91675H1.74998C1.10565 2.91675 0.583313 3.43908 0.583313 4.08341V9.91675C0.583313 10.5611 1.10565 11.0834 1.74998 11.0834H8.16665C8.81098 11.0834 9.33331 10.5611 9.33331 9.91675V4.08341C9.33331 3.43908 8.81098 2.91675 8.16665 2.91675Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <defs>
      <clipPath id="clip0_95_681">
        <rect width="14" height="14" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const IndicatorIcon: React.FC<{ isLive: boolean }> = ({ isLive }) => (
  <div className={clsx(
    'px-3 py-1 flex items-center justify-center border-[#C9D4F5]',
    isLive ? 'bg-[#2244BB] font-bold border-4 rounded-lg' : 'bg-white border rounded',
  )}
  >
    {isLive ? (
      <div className="text-white -translate-y-[0.5px]">LIVE</div>
    ) : (
      <VideoIcon size={20} className="text-[#2244BB]" />
    )}
  </div>
);

const BUTTON_STYLES = {
  primary: { variant: 'primary' as const, className: 'bg-[#2244BB]' },
  secondary: { variant: 'outline-black' as const, className: 'bg-transparent border-[#B5C3EC] text-[#2244BB] hover:bg-bluedot-lighter' },
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
  const discussionStartsSoon = useMemo(
    () => (groupDiscussion.startDateTime * 1000 - currentTimeMs) <= ONE_HOUR_MS,
    [groupDiscussion.startDateTime, currentTimeMs],
  );
  const discussionIsLive = useMemo(
    () => (groupDiscussion.startDateTime * 1000) <= currentTimeMs && currentTimeMs <= (groupDiscussion.endDateTime * 1000),
    [groupDiscussion.startDateTime, groupDiscussion.endDateTime, currentTimeMs],
  );
  // const discussionStartsSoon = true;

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
          <VideoIcon size={20} />
          <div className="translate-y-[0.5px]">Join now</div>
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
          <IndicatorIcon isLive={discussionIsLive} />
          <div className="flex gap-[6px]">
            <span className="text-[#2244BB] font-bold">
              {discussionIsLive ? 'Discussion is live' : `Discussion ${startTimeDisplayRelative}`}
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
            <div className="flex gap-2 flex-1 items-center ml-2">
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
              <div className="w-px h-6 bg-[#B5C3EC] ml-1" />
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
