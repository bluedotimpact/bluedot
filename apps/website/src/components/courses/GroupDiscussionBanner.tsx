import type { GroupDiscussion, Unit } from '@bluedot/db';
import {
  CTALinkOrButton,
  OverflowMenu,
  useCurrentTimeMs,
  type OverflowMenuItemProps,
} from '@bluedot/ui';
import { skipToken } from '@tanstack/react-query';
import clsx from 'clsx';
import React, { useEffect, useMemo, useState } from 'react';
import { FaCopy } from 'react-icons/fa6';
import { IoAdd } from 'react-icons/io5';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { buildGroupSlackChannelUrl, formatDateTimeRelative } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import { ClockIcon } from '../icons/ClockIcon';
import { DocumentIcon } from '../icons/DocumentIcon';
import { SlackIcon } from '../icons/SlackIcon';
import { SwitchUserIcon } from '../icons/SwitchUserIcon';
import FacilitatorSwitchModal, { FacilitatorModalType } from './FacilitatorSwitchModal';
import GroupSwitchModal from './GroupSwitchModal';

const BUTTON_STYLES = {
  primary: { variant: 'primary' as const, className: 'bg-bluedot-normal' },
  secondary: {
    variant: 'outline-black' as const,
    className: 'bg-transparent border-[#B5C3EC] text-bluedot-normal hover:bg-bluedot-lighter',
  },
  ghost: {
    variant: 'outline-black' as const,
    className: 'bg-transparent border-none text-bluedot-normal hover:bg-bluedot-lighter',
  },
};

export type ButtonOrMenuItem = {
  id: string;
  label: React.ReactNode;
  variant: 'primary' | 'secondary' | 'ghost';
  url?: string;
  onClick?: () => void;
  isVisible: boolean;
  target?: React.HTMLAttributeAnchorTarget;
  ariaLabel?: string;
  /**
   * Optional icon to display only when the button appears in the overflow menu
   */
  overflowIcon?: React.ReactNode;
};

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
  const [isOpen, setIsOpen] = useState(false);
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);
  const [facilitatorSwitchModalOpen, setFacilitatorSwitchModalOpen] = useState(false);
  const [facilitatorSwitchModalType, setFacilitatorSwitchModalType] = useState<FacilitatorModalType>('Update discussion time');
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

  const discussionTimeState = getDiscussionTimeState({ discussion: groupDiscussion, currentTimeMs });
  const discussionIsSoonOrLive = discussionTimeState === 'live' || discussionTimeState === 'soon';
  const discussionIsLive = discussionTimeState === 'live';

  const discussionMeetLink = groupDiscussion.zoomLink || '';
  const discussionDocLink = groupDiscussion.activityDoc || '';
  const slackChannelLink = groupDiscussion.slackChannelId
    ? buildGroupSlackChannelUrl(groupDiscussion.slackChannelId)
    : '';

  const isFacilitator = userRole === 'facilitator';

  const copyHostKeyIfFacilitator = async () => {
    if (isFacilitator && hostKeyForFacilitators) {
      try {
        await navigator.clipboard.writeText(hostKeyForFacilitators);
        setHostKeyCopied(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to copy host key to clipboard:', error);
      }
    }
  };

  const buttons: ButtonOrMenuItem[] = [
    // Live discussion buttons
    {
      id: 'join-now',
      label: (
        <>
          <VideoIcon size={20} />
          <div className="translate-y-[0.5px]">Join now</div>
        </>
      ),
      variant: 'primary',
      url: discussionMeetLink,
      target: '_blank',
      isVisible: discussionIsSoonOrLive,
    },
    {
      id: 'host-key',
      label: (
        <>
          <FaCopy size={16} />
          {hostKeyCopied ? 'Copied host key!' : `Host key: ${hostKeyForFacilitators}`}
        </>
      ),
      variant: 'secondary',
      onClick: copyHostKeyIfFacilitator,
      isVisible: discussionIsSoonOrLive && isFacilitator && !!hostKeyForFacilitators,
    },
    {
      id: 'discussion-doc',
      label: 'Open discussion doc',
      variant: 'secondary',
      url: discussionDocLink,
      target: '_blank',
      isVisible: discussionIsSoonOrLive || isFacilitator,
      overflowIcon: <DocumentIcon className="mx-auto" />,
    },
    {
      id: 'message-group',
      label: 'Message group',
      variant: 'secondary',
      url: slackChannelLink,
      target: '_blank',
      isVisible: discussionIsSoonOrLive,
      overflowIcon: <SlackIcon className="mx-auto" />,
    },
    // Upcoming discussion buttons
    {
      id: 'update-discussion-time',
      label: 'Update discussion time',
      variant: 'secondary',
      onClick: () => {
        setFacilitatorSwitchModalOpen(true);
        setFacilitatorSwitchModalType('Update discussion time');
      },
      isVisible: isFacilitator,
      overflowIcon: <ClockIcon className="mx-auto" size={20} />,
    },
    {
      id: 'change-facilitator',
      label: 'Change facilitator',
      variant: 'secondary',
      onClick: () => {
        setFacilitatorSwitchModalOpen(true);
        setFacilitatorSwitchModalType('Change facilitator');
      },
      isVisible: isFacilitator,
      overflowIcon: <SwitchUserIcon className="mx-auto" />,
    },
    {
      id: 'cant-make-it',
      label: "Can't make it?",
      variant: 'ghost',
      onClick: () => setGroupSwitchModalOpen(true),
      isVisible: !isFacilitator,
    },
  ];

  const visibleButtons = buttons.filter((button) => button.isVisible);

  return (
    <>
      <div className="@container flex flex-col gap-3 px-4 py-3 bg-[#E4EDFE] border-b border-[#C9D4F5]">
        <div className="flex items-center gap-3 text-size-xs">
          {(discussionIsLive || discussionIsSoonOrLive) && (
            <IndicatorIcon isLive={discussionIsLive} />
          )}
          <div className="flex gap-[6px] min-w-0 flex-initial">
            <span className="text-bluedot-normal font-bold whitespace-nowrap">
              {discussionIsLive ? 'Discussion is live' : `Discussion ${startTimeDisplayRelative}`}
            </span>
            <span className="text-bluedot-normal whitespace-nowrap">•</span>
            <button
              type="button"
              onClick={onClickPrepare}
              className="text-bluedot-normal underline underline-offset-2 cursor-pointer truncate min-w-0 hover:opacity-80"
            >
              {unitTitle}
            </button>
          </div>

          <button
            type="button"
            aria-label={isOpen ? 'Collapse upcoming discussion banner' : 'Expand upcoming discussion banner'}
            onClick={() => setIsOpen(!isOpen)}
            className="cursor-pointer text-bluedot-normal ml-auto hover:opacity-80"
          >
            <IoAdd size={24} style={isOpen ? { transform: 'rotate(45deg)', transition: 'transform 200ms' } : { transition: 'transform 200ms' }} />
          </button>
        </div>

        {/* Button container */}
        {isOpen
          && (() => {
            const directButtonIds = ['join-now', 'host-key', 'discussion-doc', 'cant-make-it'];
            const directButtons = visibleButtons.filter((b) => directButtonIds.includes(b.id));
            const overflowButtons = visibleButtons.filter((b) => !directButtonIds.includes(b.id));
            const hasOverflow = overflowButtons.length > 0;

            return (
              <div className="flex flex-col gap-2 sm:flex-row">
                {directButtons.map((button) => {
                  // Convert ghost to secondary for consistent styling
                  const variant = button.variant === 'ghost' ? 'secondary' : button.variant;
                  const style = BUTTON_STYLES[variant];

                  return (
                    <CTALinkOrButton
                      key={button.id}
                      variant={style.variant}
                      size="small"
                      url={button.url}
                      onClick={button.onClick}
                      target={button.target}
                      className={clsx(style.className, 'w-full flex-1 gap-[6px] sm:w-auto sm:flex-initial')}
                    >
                      {button.label}
                    </CTALinkOrButton>
                  );
                })}

                {hasOverflow && (
                  <>
                    <div className="hidden flex-1 sm:block" />
                    <OverflowMenu
                      ariaLabel="More discussion options"
                      buttonClassName="flex-1 sm:flex-initial border border-[#B5C3EC] w-full sm:w-auto px-3 py-2.5 h-9 text-[13px] font-medium whitespace-nowrap"
                      items={overflowButtons.map(
                        (button): OverflowMenuItemProps => ({
                          id: button.id,
                          label: button.overflowIcon ? (
                            <div className="grid grid-cols-[20px_1fr] items-center gap-[6px]">
                              {button.overflowIcon}
                              {button.label}
                            </div>
                          ) : (
                            button.label
                          ),
                          ...(button.url ? { href: button.url, target: button.target } : { onAction: button.onClick }),
                        }),
                      )}
                      trigger="More details"
                    />
                  </>
                )}
              </div>
            );
          })()}
      </div>

      {groupSwitchModalOpen && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitchModalOpen(false)}
          initialUnitNumber={(discussionUnit || unit).unitNumber.toString()}
          courseSlug={unit.courseSlug}
        />
      )}

      {facilitatorSwitchModalOpen && (
        <FacilitatorSwitchModal
          handleClose={() => setFacilitatorSwitchModalOpen(false)}
          courseSlug={unit.courseSlug}
          initialDiscussion={groupDiscussion}
          initialModalType={facilitatorSwitchModalType}
        />
      )}
    </>
  );
};

const VideoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    className={className}
  >
    <g>
      <path d="M13.4166 4.08341L9.33331 7.00008L13.4166 9.91675V4.08341Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.16665 2.91675H1.74998C1.10565 2.91675 0.583313 3.43908 0.583313 4.08341V9.91675C0.583313 10.5611 1.10565 11.0834 1.74998 11.0834H8.16665C8.81098 11.0834 9.33331 10.5611 9.33331 9.91675V4.08341C9.33331 3.43908 8.81098 2.91675 8.16665 2.91675Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const IndicatorIcon: React.FC<{ isLive: boolean }> = ({ isLive }) => (
  <div className={clsx(
    'px-3 py-1 flex items-center justify-center border-[#C9D4F5]',
    isLive ? 'bg-bluedot-normal font-bold border-4 rounded-lg' : 'bg-white border rounded',
  )}
  >
    {isLive ? (
      <div className="text-white -translate-y-[0.5px]">LIVE</div>
    ) : (
      <VideoIcon size={20} className="text-bluedot-normal" />
    )}
  </div>
);

export default GroupDiscussionBanner;
