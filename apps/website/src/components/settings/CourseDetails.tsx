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
import { SlackIcon } from '../icons/SlackIcon';
import type { ButtonOrMenuItem } from '../courses/GroupDiscussionBanner';
import { DocumentIcon } from '../icons/DocumentIcon';

const ONE_HOUR_MS = 3600_000;

const BUTTON_STYLES = {
  primary: { variant: 'primary' as const, className: 'w-auto bg-bluedot-normal' },
  secondary: { variant: 'outline-black' as const, className: 'w-auto bg-[#13132E0D] hover:bg-[#13132E1C] text-[#13132E] border-none' },
  ghost: { variant: 'outline-black' as const, className: 'w-auto bg-[#13132E0D] hover:bg-[#13132E1C] text-[#13132E] border-none' },
};

type CourseDetailsRowProps = {
  discussion: GroupDiscussion;
  isNext?: boolean;
  isPast?: boolean;
  didAttend?: boolean;
  course: Course;
  isFacilitator: boolean;
  handleOpenGroupSwitchModal: (params: { discussion: GroupDiscussion; switchType: SwitchType }) => void;
};

const CourseDetailsRow = ({
  discussion,
  isNext = false,
  isPast = false,
  didAttend = true,
  course,
  isFacilitator,
  handleOpenGroupSwitchModal,
}: CourseDetailsRowProps) => {
  const currentTimeMs = useCurrentTimeMs();

  const discussionIsSoonOrLive = (discussion.startDateTime * 1000 - currentTimeMs) <= ONE_HOUR_MS && currentTimeMs <= (discussion.endDateTime * 1000);
  const discussionIsLive = (discussion.startDateTime * 1000) <= currentTimeMs && currentTimeMs <= (discussion.endDateTime * 1000);

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
      onClick: () => handleOpenGroupSwitchModal({ discussion, switchType: 'Switch group for one unit' }),
      isVisible: !isFacilitator && !isPast,
      ariaLabel: `Switch group for Unit ${discussion.unitNumber}`,
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
      isVisible: discussionIsSoonOrLive || isFacilitator,
      overflowIcon: <DocumentIcon className="mx-auto" />,
    },
    {
      id: 'switch-group-permanently',
      label: 'Switch group permanently',
      variant: 'secondary',
      onClick: () => handleOpenGroupSwitchModal({ discussion, switchType: 'Switch group permanently' }),
      isVisible: !isFacilitator && !isPast,
      overflowIcon: <FaArrowRightArrowLeft className="mx-auto size-[14px]" />,
    },
  ];
  const visibleButtons = buttons.filter((button) => button.isVisible);

  const primaryButton = visibleButtons.filter((button) => button.variant === 'primary')[0];
  const cantMakeItButton = visibleButtons.filter((button) => button.id === 'cant-make-it')[0];
  const overflowButtons = visibleButtons.filter((button) => button.id !== primaryButton?.id && button.id !== cantMakeItButton?.id);

  const didNotAttend = isPast && !didAttend;

  return (
    <div key={discussion.id} className={cn('py-5 border-b border-charcoal-light last:border-0', didNotAttend && 'opacity-60')}>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Left side: Date/time and discussion details */}
        <div className="flex items-center gap-4 min-w-0">
          <TimeWidget isLive={discussionIsLive} dateTimeSeconds={discussion.startDateTime} />

          {/* Discussion details */}
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className={cn('text-size-sm font-medium truncate', didNotAttend ? 'text-gray-500' : 'text-gray-900')}>
              {discussion.unitRecord
                ? `Unit ${discussion.unitRecord.unitNumber}: ${discussion.unitRecord.title}`
                : `Unit ${discussion.unitNumber || ''}`}
            </div>
            {!isPast && isNext && (
              <div className="truncate text-size-xs text-bluedot-normal font-medium">
                {`Starts ${formatDateTimeRelative({ dateTimeMs: discussion.startDateTime * 1000, currentTimeMs })}`}
              </div>
            )}
            {didNotAttend && (
              <div className="truncate text-size-xs text-gray-400 font-medium">
                Did not attend
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
  expectedDiscussions: GroupDiscussion[];
  attendedDiscussions: GroupDiscussion[];
  isLoading: boolean;
  isLast?: boolean;
};

const CourseDetails = ({
  course,
  courseRegistration,
  expectedDiscussions,
  attendedDiscussions,
  isLoading,
  isLast = false,
}: CourseDetailsProps) => {
  const currentTimeMs = useCurrentTimeMs();
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);
  const [initialUnitNumber, setInitialUnitNumber] = useState<string | undefined>(undefined);
  const [selectedSwitchType, setSelectedSwitchType] = useState<SwitchType>('Switch group for one unit');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllPast, setShowAllPast] = useState(false);

  const isFacilitator = courseRegistration.role === 'Facilitator';

  const attendedDiscussionIds = new Set(attendedDiscussions.map((d) => d.id));

  // Combine discussions, preferring expected over attended when both exist
  const allDiscussions = [...expectedDiscussions, ...attendedDiscussions]
    .reduce((acc, discussion) => {
      const existing = acc.find((d) => d.id === discussion.id);
      if (!existing) {
        acc.push(discussion);
      }
      return acc;
    }, [] as GroupDiscussion[])
    .sort((a, b) => a.startDateTime - b.startDateTime);

  const isUpcoming = (discussion: GroupDiscussion) => (discussion.endDateTime * 1000) > currentTimeMs;
  const upcomingDiscussions = allDiscussions.filter(
    (discussion) => isUpcoming(discussion),
  );
  const pastDiscussions = allDiscussions.filter(
    (discussion) => !isUpcoming(discussion),
  );

  const handleOpenGroupSwitchModal = ({ discussion, switchType }: { discussion?: GroupDiscussion; switchType: SwitchType }) => {
    const unitNumber = switchType === 'Switch group for one unit' && discussion?.unitRecord
      ? discussion?.unitRecord.unitNumber.toString()
      : undefined;
    setInitialUnitNumber(unitNumber);
    setSelectedSwitchType(switchType);
    setGroupSwitchModalOpen(true);
  };

  return (
    <>
      <div className={`bg-white border-x border-charcoal-light ${isLast ? 'border-b rounded-b-xl' : ''}`} role="region" aria-label={`Expanded details for ${course.title}`}>
        <div>
          {/* Section header with tabs */}
          <div className="flex border-b border-charcoal-light">
            <div className="flex px-4 sm:px-8 gap-8">
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
              <button
                type="button"
                onClick={() => setActiveTab('past')}
                className={`relative py-2 px-1 text-size-xs font-medium transition-colors ${
                  activeTab === 'past'
                    ? 'text-bluedot-normal border-b-2 border-bluedot-normal'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Past discussions
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
                            handleOpenGroupSwitchModal={handleOpenGroupSwitchModal}
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
                {activeTab === 'past' && (
                  // Show all past discussions, indicating which ones weren't attended
                  pastDiscussions.length > 0 ? (
                    <div>
                      {/* Show first 3 or all based on showAllPast state */}
                      {(showAllPast ? pastDiscussions : pastDiscussions.slice(0, 3))
                        .map((discussion) => (
                          <CourseDetailsRow
                            key={discussion.id}
                            discussion={discussion}
                            isPast
                            didAttend={attendedDiscussionIds.has(discussion.id)}
                            course={course}
                            isFacilitator={isFacilitator}
                            handleOpenGroupSwitchModal={handleOpenGroupSwitchModal}
                          />
                        ))}

                      {/* "See all"/"Show less" button when more than 3 past discussions */}
                      {pastDiscussions.length > 3 && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllPast(!showAllPast)}
                            className="text-size-sm font-medium text-bluedot-normal hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            {showAllPast ? 'Show less' : `See all (${pastDiscussions.length}) discussions`}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-size-sm text-gray-500 py-4">No past discussions</p>
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
            setInitialUnitNumber(undefined);
          }}
          initialUnitNumber={initialUnitNumber}
          initialSwitchType={selectedSwitchType}
          courseSlug={course.slug}
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
