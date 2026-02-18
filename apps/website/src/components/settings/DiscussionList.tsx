import type { Course } from '@bluedot/db';
import {
  CTALinkOrButton, OverflowMenu, type OverflowMenuItemProps,
  useCurrentTimeMs, cn,
} from '@bluedot/ui';
import { useState } from 'react';
import { FaArrowRightArrowLeft, FaRightToBracket } from 'react-icons/fa6';
import {
  buildGroupSlackChannelUrl, formatDateMonthAndDay, formatDateTimeRelative, formatTime12HourClock,
} from '../../lib/utils';
import type { GroupDiscussionWithGroupAndUnit } from '../../server/routers/group-discussions';
import type { SwitchType } from '../courses/GroupSwitchModal';
import type { FacilitatorModalType } from '../courses/FacilitatorSwitchModal';
import { SwitchUserIcon } from '../icons/SwitchUserIcon';
import type { ButtonOrMenuItem } from '../courses/GroupDiscussionBanner';
import { DocumentIcon } from '../icons/DocumentIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { SlackIcon } from '../icons/SlackIcon';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';

const BUTTON_STYLES = {
  primary: { variant: 'primary' as const, className: 'w-auto bg-bluedot-normal' },
  secondary: { variant: 'outline-black' as const, className: 'w-auto bg-bluedot-navy/5 hover:bg-bluedot-navy/10 text-bluedot-navy border-none' },
  ghost: { variant: 'outline-black' as const, className: 'w-auto bg-bluedot-navy/5 hover:bg-bluedot-navy/10 text-bluedot-navy border-none' },
};

export type DiscussionListProps = {
  discussions: GroupDiscussionWithGroupAndUnit[];
  course: Course;
  isFacilitator: boolean;
  onOpenGroupSwitchModal: (discussion: GroupDiscussionWithGroupAndUnit, switchType: SwitchType) => void;
  onOpenFacilitatorModal: (discussion: GroupDiscussionWithGroupAndUnit, modalType: FacilitatorModalType) => void;
  onOpenDropoutModal: () => void;
  isPast: boolean;
  emptyMessage: string;
};

const DiscussionList = ({
  discussions,
  course,
  isFacilitator,
  onOpenGroupSwitchModal,
  onOpenFacilitatorModal,
  onOpenDropoutModal,
  isPast,
  emptyMessage,
}: DiscussionListProps) => {
  const [showAll, setShowAll] = useState(false);

  if (discussions.length === 0) {
    return <p className="text-size-sm text-gray-500 py-4">{emptyMessage}</p>;
  }

  return (
    <div>
      {(showAll ? discussions : discussions.slice(0, 3)).map((discussion, index) => (
        <DiscussionListRow
          key={discussion.id}
          discussion={discussion}
          isNext={!isPast && index === 0}
          isPast={isPast}
          course={course}
          isFacilitator={isFacilitator}
          onOpenGroupSwitchModal={onOpenGroupSwitchModal}
          onOpenFacilitatorModal={onOpenFacilitatorModal}
          onOpenDropoutModal={onOpenDropoutModal}
        />
      ))}
      {discussions.length > 3 && (
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
            aria-expanded={showAll}
          >
            {showAll ? 'Show less' : `See all (${discussions.length}) discussions`}
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscussionList;

type DiscussionListRowProps = {
  discussion: GroupDiscussionWithGroupAndUnit;
  isNext?: boolean;
  isPast?: boolean;
  course: Course;
  isFacilitator: boolean;
  onOpenGroupSwitchModal: (discussion: GroupDiscussionWithGroupAndUnit, switchType: SwitchType) => void;
  onOpenFacilitatorModal: (discussion: GroupDiscussionWithGroupAndUnit, modalType: FacilitatorModalType) => void;
  onOpenDropoutModal: () => void;
};

const DiscussionListRow = ({
  discussion,
  isNext = false,
  isPast = false,
  course,
  isFacilitator,
  onOpenGroupSwitchModal,
  onOpenFacilitatorModal,
  onOpenDropoutModal,
}: DiscussionListRowProps) => {
  const currentTimeMs = useCurrentTimeMs();

  const discussionTimeState = getDiscussionTimeState({ discussion, currentTimeMs });
  const discussionIsSoonOrLive = discussionTimeState === 'live' || discussionTimeState === 'soon';
  const discussionIsLive = discussionTimeState === 'live';

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const discussionMeetLink = discussion.zoomLink || '';
  const discussionPrepareLink = course.slug && discussion.unitNumber !== null ? `/courses/${course.slug}/${discussion.unitNumber}` : '';
  const slackChannelLink = discussion.slackChannelId ? buildGroupSlackChannelUrl(discussion.slackChannelId) : '';
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const discussionDocLink = discussion.activityDoc || '';

  const buttons: ButtonOrMenuItem[] = [
    // Primary CTA
    {
      id: 'join-now',
      label: 'Join now',
      variant: 'primary',
      url: discussionMeetLink,
      isVisible: isNext && discussionIsSoonOrLive,
      target: '_blank',
    },
    {
      id: 'prepare-for-discussion',
      label: 'Prepare for discussion',
      variant: 'primary',
      url: discussionPrepareLink,
      isVisible: isNext && !discussionIsSoonOrLive,
    },
    // Secondary CTA
    {
      id: 'cant-make-it',
      label: 'Can\'t make it?',
      variant: 'secondary',
      onClick: () => onOpenGroupSwitchModal(discussion, 'Switch group for one unit'),
      isVisible: !isFacilitator && !isPast,
      ariaLabel: `Switch group for Unit ${discussion.unitNumber}`,
    },
    {
      id: 'cant-make-it-facilitator',
      label: 'Update discussion time',
      variant: 'secondary',
      onClick: () => onOpenFacilitatorModal(discussion, 'Update discussion time'),
      isVisible: isFacilitator && !isPast,
      ariaLabel: `Update discussion for Unit ${discussion.unitNumber}`,
      overflowIcon: <ClockIcon className="mx-auto" size={20} />,
    },
    {
      id: 'change-facilitator',
      label: 'Change facilitator',
      variant: 'secondary',
      onClick: () => onOpenFacilitatorModal(discussion, 'Change facilitator'),
      isVisible: isFacilitator && !isPast,
      overflowIcon: <SwitchUserIcon className="mx-auto" size={20} />,
    },
    // Inside overflow menu
    {
      id: 'message-group',
      label: 'Message group',
      variant: 'secondary',
      url: slackChannelLink,
      target: '_blank',
      isVisible: !isPast,
      overflowIcon: <SlackIcon className="mx-auto" />,
    },
    {
      id: 'discussion-doc',
      label: 'Open discussion doc',
      variant: 'secondary',
      url: discussionDocLink,
      target: '_blank',
      isVisible: !isPast && (discussionIsSoonOrLive || isFacilitator),
      overflowIcon: <DocumentIcon className="mx-auto" />,
    },
    {
      id: 'switch-group-permanently',
      label: 'Switch group permanently',
      variant: 'secondary',
      onClick: () => onOpenGroupSwitchModal(discussion, 'Switch group permanently'),
      isVisible: !isFacilitator && !isPast,
      overflowIcon: <FaArrowRightArrowLeft className="mx-auto size-[14px]" />,
    },
    {
      id: 'dropout-or-deferral',
      label: 'Request dropout or deferral',
      variant: 'secondary',
      isVisible: !isFacilitator && !isPast,
      onClick: onOpenDropoutModal,
      overflowIcon: <FaRightToBracket className="mx-auto size-[14px]" />,
    },
  ];
  const visibleButtons = buttons.filter((button) => button.isVisible);

  const primaryButton = visibleButtons.find((button) => button.variant === 'primary');
  const cantMakeItButton = visibleButtons.find((button) => button.id === 'cant-make-it');
  const overflowButtons = visibleButtons.filter((button) => button.id !== primaryButton?.id && button.id !== cantMakeItButton?.id);

  return (
    <div key={discussion.id} className="py-5 border-b border-charcoal-light last:border-0">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Left side: Date/time and discussion details */}
        <div className="flex items-center gap-4 min-w-0">
          <TimeWidget isLive={discussionIsLive} dateTimeSeconds={discussion.startDateTime} />

          {/* Discussion details */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="text-size-sm font-medium text-gray-900 truncate">
              {discussion.unitRecord
                ? `Unit ${discussion.unitRecord.unitNumber}: ${discussion.unitRecord.title}`
                // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
                : `Unit ${discussion.unitFallback || ''}`}
            </div>
            {!isPast && isNext && (
              <div className="truncate text-size-xs text-bluedot-normal font-medium">
                {`Starts ${formatDateTimeRelative({ dateTimeMs: discussion.startDateTime * 1000, currentTimeMs })}`}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {primaryButton && (
            <CTALinkOrButton
              key={primaryButton.id}
              variant={BUTTON_STYLES[primaryButton.variant].variant}
              size="small"
              className={BUTTON_STYLES[primaryButton.variant].className}
              url={primaryButton.url}
              onClick={primaryButton.onClick}
              target={primaryButton.target}
            >
              {primaryButton.label}
            </CTALinkOrButton>
          )}
          <div className="flex flex-row gap-2">
            {cantMakeItButton && (
              <CTALinkOrButton
                key={cantMakeItButton.id}
                variant={BUTTON_STYLES[cantMakeItButton.variant].variant}
                size="small"
                className={cn('flex-1', BUTTON_STYLES[cantMakeItButton.variant].className)}
                url={cantMakeItButton.url}
                onClick={cantMakeItButton.onClick}
                aria-label={cantMakeItButton.ariaLabel}
              >
                {cantMakeItButton.label}
              </CTALinkOrButton>
            )}
            {overflowButtons.length > 0 && (
              <OverflowMenu
                ariaLabel="More actions"
                buttonClassName={BUTTON_STYLES.secondary.className}
                items={overflowButtons.map((button): OverflowMenuItemProps => ({
                  id: button.id,
                  label: button.overflowIcon ? (
                    <div className="grid grid-cols-[20px_1fr] gap-[6px] items-center">
                      {button.overflowIcon}
                      {button.label}
                    </div>
                  ) : button.label,
                  ...(button.url
                    ? { href: button.url, target: button.target }
                    : { onAction: button.onClick }
                  ),
                }))}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TimeWidget: React.FC<{
  isLive: boolean;
  dateTimeSeconds: number;
}> = ({ isLive, dateTimeSeconds }) => {
  if (isLive) {
    return (
      <div className="flex flex-col items-center justify-center min-w-[85px] border border-gray-200 rounded-lg overflow-hidden">
        <div className="text-size-sm font-bold pt-2 pb-1.5 text-gray-900 text-center">
          NOW
        </div>
        <div className="text-size-xs font-semibold text-white text-center bg-bluedot-normal py-1 w-full">
          LIVE
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-w-[85px] p-2 border border-gray-200 rounded-lg">
      <div className="text-size-sm font-semibold text-gray-900 text-center">
        {formatDateMonthAndDay(dateTimeSeconds)}
      </div>
      <div className="text-size-xs text-gray-500 text-center">
        {formatTime12HourClock(dateTimeSeconds)}
      </div>
    </div>
  );
};
