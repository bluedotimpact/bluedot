import { Course, CourseRegistration } from '@bluedot/db';
import {
  CTALinkOrButton, ProgressDots, useCurrentTimeMs, OverflowMenu, type OverflowMenuItemProps,
  cn,
} from '@bluedot/ui';
import { useState } from 'react';
import { FaArrowRightArrowLeft } from 'react-icons/fa6';
import {
  buildGroupSlackChannelUrl, formatDateMonthAndDay, formatDateTimeRelative, formatTime12HourClock,
} from '../../lib/utils';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import GroupSwitchModal, { type SwitchType } from '../courses/GroupSwitchModal';
import FacilitatorSwitchModal, { type ModalType as FacilitatorModalType } from '../courses/FacilitatorSwitchModal';
import { SwitchUserIcon } from '../icons/SwitchUserIcon';
import type { ButtonOrMenuItem } from '../courses/GroupDiscussionBanner';
import { DocumentIcon } from '../icons/DocumentIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { SlackIcon } from '../icons/SlackIcon';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';

const BUTTON_STYLES = {
  primary: { variant: 'primary' as const, className: 'w-auto bg-bluedot-normal' },
  secondary: { variant: 'outline-black' as const, className: 'w-auto bg-[#13132E0D] hover:bg-[#13132E1C] text-[#13132E] border-none' },
  ghost: { variant: 'outline-black' as const, className: 'w-auto bg-[#13132E0D] hover:bg-[#13132E1C] text-[#13132E] border-none' },
};

type CourseDetailsRowProps = {
  discussion: GroupDiscussion;
  isNext?: boolean;
  isPast?: boolean;
  course: Course;
  isFacilitator: boolean;
  onOpenGroupSwitchModal: (discussion: GroupDiscussion, switchType: SwitchType) => void;
  onOpenFacilitatorModal: (discussion: GroupDiscussion, modalType: FacilitatorModalType) => void;
};

const CourseDetailsRow = ({
  discussion,
  isNext = false,
  isPast = false,
  course,
  isFacilitator,
  onOpenGroupSwitchModal,
  onOpenFacilitatorModal,
}: CourseDetailsRowProps) => {
  const currentTimeMs = useCurrentTimeMs();

  const discussionTimeState = getDiscussionTimeState({ discussion, currentTimeMs });
  const discussionIsSoonOrLive = discussionTimeState === 'live' || discussionTimeState === 'soon';
  const discussionIsLive = discussionTimeState === 'live';

  const discussionMeetLink = discussion.zoomLink || '';
  const discussionPrepareLink = course.slug && discussion.unitNumber !== null ? `/courses/${course.slug}/${discussion.unitNumber}` : '';
  const slackChannelLink = discussion.slackChannelId ? buildGroupSlackChannelUrl(discussion.slackChannelId) : '';
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
      label: "Can't make it?",
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
  ];
  const visibleButtons = buttons.filter((button) => button.isVisible);

  const primaryButton = visibleButtons.filter((button) => button.variant === 'primary')[0];
  const cantMakeItButton = visibleButtons.filter((button) => button.id === 'cant-make-it')[0];
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
                : `Unit ${discussion.unitNumber || ''}`}
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

type CourseDetailsProps = {
  course: Course;
  courseRegistration: CourseRegistration;
  attendedDiscussions: GroupDiscussion[];
  upcomingDiscussions: GroupDiscussion[];
  expectedDiscussions?: GroupDiscussion[];
  isLoading: boolean;
  isLast?: boolean;
};

const CourseDetails = ({
  course,
  courseRegistration,
  attendedDiscussions,
  upcomingDiscussions,
  expectedDiscussions,
  isLoading,
  isLast = false,
}: CourseDetailsProps) => {
  const showUpcomingTab = courseRegistration.roundStatus === 'Active' || upcomingDiscussions.length > 0;

  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);
  const [facilitatorSwitchModalOpen, setFacilitatorSwitchModalOpen] = useState(false);
  const [selectedSwitchType, setSelectedSwitchType] = useState<SwitchType>('Switch group for one unit');
  const [selectedFacilitatorModalType, setSelectedFacilitatorModalType] = useState<FacilitatorModalType>('Update discussion time');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'attended'>(showUpcomingTab ? 'upcoming' : 'attended');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllAttended, setShowAllAttended] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<GroupDiscussion | null>(null);

  const isFacilitator = courseRegistration.role === 'Facilitator';

  const handleOpenGroupSwitch = (discussion: GroupDiscussion, switchType: SwitchType) => {
    setSelectedDiscussion(discussion);
    setSelectedSwitchType(switchType);
    setGroupSwitchModalOpen(true);
  };

  const handleOpenFacilitatorModal = (discussion: GroupDiscussion, modalType: FacilitatorModalType) => {
    setSelectedDiscussion(discussion);
    setSelectedFacilitatorModalType(modalType);
    setFacilitatorSwitchModalOpen(true);
  };

  return (
    <>
      <div className={`bg-white border-x border-charcoal-light ${isLast ? 'border-b rounded-b-xl' : ''}`} role="region" aria-label={`Expanded details for ${course.title}`}>
        <div>
          {/* Section header with tabs */}
          <div className="flex border-b border-charcoal-light">
            <div className="flex px-4 sm:px-8 gap-8">
              {showUpcomingTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className={`relative py-2 px-1 text-size-xs font-medium transition-colors ${
                    activeTab === 'upcoming'
                      ? 'text-bluedot-normal border-b-2 border-bluedot-normal'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Upcoming discussions
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('attended')}
                className={`relative py-2 px-1 text-size-xs font-medium transition-colors ${
                  activeTab === 'attended'
                    ? 'text-bluedot-normal border-b-2 border-bluedot-normal'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Attended discussions
              </button>
            </div>
          </div>

          <div className="p-4 sm:px-8 sm:py-3">
            {/* Content */}
            {isLoading ? (
              <ProgressDots className="py-8" />
            ) : (
              <div className="min-h-[200px]">
                {activeTab === 'upcoming' && (
                  // Show only expected discussions where end datetime hasn't passed
                  upcomingDiscussions.length > 0 ? (
                    <div>
                      {/* Show first 3 or all based on showAllUpcoming state */}
                      {(showAllUpcoming ? upcomingDiscussions : upcomingDiscussions.slice(0, 3))
                        .map((discussion, index) => (
                          <CourseDetailsRow
                            key={discussion.id}
                            discussion={discussion}
                            isNext={index === 0}
                            isPast={false}
                            course={course}
                            isFacilitator={isFacilitator}
                            onOpenGroupSwitchModal={handleOpenGroupSwitch}
                            onOpenFacilitatorModal={handleOpenFacilitatorModal}
                          />
                        ))}

                      {/* "See all"/"Show less" button when more than 3 upcoming discussions */}
                      {upcomingDiscussions.length > 3 && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                            className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            {showAllUpcoming
                              ? 'Show less'
                              : `See all (${upcomingDiscussions.length}) discussions`}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-size-sm text-gray-500 py-4">No upcoming discussions</p>
                  )
                )}
                {activeTab === 'attended' && (
                  // Show all attended discussions without any filtering
                  attendedDiscussions.length > 0 ? (
                    <div>
                      {/* Show first 3 or all based on showAllAttended state */}
                      {(showAllAttended ? attendedDiscussions : attendedDiscussions.slice(0, 3))
                        .map((discussion) => (
                          <CourseDetailsRow
                            key={discussion.id}
                            discussion={discussion}
                            isPast
                            course={course}
                            isFacilitator={isFacilitator}
                            onOpenGroupSwitchModal={handleOpenGroupSwitch}
                            onOpenFacilitatorModal={handleOpenFacilitatorModal}
                          />
                        ))}

                      {/* "See all"/"Show less" button when more than 3 attended discussions */}
                      {attendedDiscussions.length > 3 && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllAttended(!showAllAttended)}
                            className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            {showAllAttended ? 'Show less' : `See all (${attendedDiscussions.length}) discussions`}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-size-sm text-gray-500 py-4">No attended discussions yet</p>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {groupSwitchModalOpen && course.slug && (
        <GroupSwitchModal
          handleClose={() => {
            setGroupSwitchModalOpen(false);
            setSelectedDiscussion(null);
          }}
          initialUnitNumber={selectedSwitchType === 'Switch group for one unit' && selectedDiscussion?.unitRecord
            ? selectedDiscussion?.unitRecord.unitNumber.toString()
            : undefined}
          initialSwitchType={selectedSwitchType}
          courseSlug={course.slug}
        />
      )}
      {facilitatorSwitchModalOpen && course.slug && (
        <FacilitatorSwitchModal
          handleClose={() => {
            setFacilitatorSwitchModalOpen(false);
            setSelectedDiscussion(null);
          }}
          courseSlug={course.slug}
          initialDiscussion={selectedDiscussion}
          allDiscussions={expectedDiscussions}
          initialModalType={selectedFacilitatorModalType}
        />
      )}
    </>
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

export default CourseDetails;
