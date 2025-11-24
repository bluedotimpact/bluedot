import { Course, CourseRegistration } from '@bluedot/db';
import {
  CTALinkOrButton, ProgressDots, useCurrentTimeMs, OverflowMenu, type OverflowMenuItemProps,
} from '@bluedot/ui';
import { useState } from 'react';
import {
  buildGroupSlackChannelUrl, formatDateMonthAndDay, formatDateTimeRelative, formatTime12HourClock,
} from '../../lib/utils';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import GroupSwitchModal, { type SwitchType } from '../courses/GroupSwitchModal';

const HOUR_IN_MS = 60 * 60 * 1000;

// TODO actual styles
const BUTTON_STYLES = {
  primary: { variant: 'primary' as const, className: 'bg-[#2244BB]' },
  secondary: { variant: 'outline-black' as const, className: 'bg-transparent border-[#B5C3EC] text-[#2244BB] hover:bg-bluedot-lighter' },
};

type CourseDetailsRowProps = {
  discussion: GroupDiscussion;
  isNext?: boolean;
  isPast?: boolean;
  course: Course;
  isFacilitator: boolean;
  handleOpenGroupSwitchModal: (params: { discussion: GroupDiscussion; switchType: SwitchType }) => void;
};

// TODO decide whether to unify with GroupDiscussionBanner
type ButtonConfig = {
  id: string;
  label: React.ReactNode;
  style: keyof typeof BUTTON_STYLES;
  url?: string;
  onClick?: () => void;
  isVisible: boolean;
};

const CourseDetailsRow = ({
  discussion,
  isNext = false,
  isPast = false,
  course,
  isFacilitator,
  handleOpenGroupSwitchModal,
}: CourseDetailsRowProps) => {
  const currentTimeMs = useCurrentTimeMs();

  // Check if discussion starts in less than 1 hour
  // TODO unify with GroupDiscussionBanner
  const timeUntilStartMs = discussion.startDateTime * 1000 - currentTimeMs;
  const isStartingSoon = timeUntilStartMs < HOUR_IN_MS && timeUntilStartMs > 0;

  // Determine button text and URL based on timing
  const buttonText = isStartingSoon ? 'Join Discussion' : 'Prepare for discussion';
  let buttonUrl = '#';
  if (isStartingSoon) {
    buttonUrl = discussion.zoomLink || '#';
  } else if (course.slug && discussion.unitNumber !== null) {
    buttonUrl = `/courses/${course.slug}/${discussion.unitNumber}`;
  }

  const discussionMeetLink = discussion.zoomLink || '';
  const discussionPrepareLink = course.slug && discussion.unitNumber !== null ? `/courses/${course.slug}/${discussion.unitNumber}` : '';
  const slackChannelLink = discussion.slackChannelId ? buildGroupSlackChannelUrl(discussion.slackChannelId) : '';

  const buttons: ButtonConfig[] = [
    // Primary CTA
    {
      id: 'join-now',
      label: 'Join now',
      style: 'primary',
      url: discussionMeetLink,
      isVisible: isNext && isStartingSoon,
    },
    {
      id: 'prepare-for-discussion',
      label: 'Prepare for discussion',
      style: 'primary',
      url: discussionPrepareLink,
      isVisible: isNext && !isStartingSoon,
    },
    // Secondary CTA
    {
      id: 'cant-make-it',
      label: "Can't make it?",
      style: 'secondary',
      onClick: () => handleOpenGroupSwitchModal({ discussion, switchType: 'Switch group for one unit' }),
      isVisible: !isFacilitator && !isPast,
    },
    // Inside overflow menu
    {
      id: 'message-group',
      label: 'Message group',
      style: 'secondary',
      url: slackChannelLink,
      isVisible: !isPast,
    },
    {
      id: 'switch-group-permanently',
      label: 'Switch group permanently',
      style: 'secondary',
      onClick: () => handleOpenGroupSwitchModal({ discussion, switchType: 'Switch group permanently' }),
      isVisible: !isFacilitator && !isPast,
    },
  ];
  const visibleButtons = buttons.filter((button) => button.isVisible);

  return (
    <div key={discussion.id} className="py-4 border-b border-gray-100 last:border-0">
      {/* Mobile layout */}
      <div className="flex gap-4 sm:hidden">
        {/* Date and time column */}
        <div className="flex flex-col items-center justify-start min-w-[50px] pt-1">
          <div className="text-size-sm font-semibold text-gray-900 text-center">
            {formatDateMonthAndDay(discussion.startDateTime)}
          </div>
          <div className="text-size-xs text-gray-500 text-center">
            {formatTime12HourClock(discussion.startDateTime)}
          </div>
        </div>

        {/* Unit details and buttons column */}
        <div className="flex-1 flex flex-col gap-3">
          {/* Discussion details */}
          <div className="flex flex-col gap-1">
            <div className="text-size-sm font-medium text-gray-900">
              {discussion.unitRecord
                ? `Unit ${discussion.unitRecord.unitNumber}: ${discussion.unitRecord.title}`
                : `Unit ${discussion.unitNumber || ''}`}
            </div>
            {!isPast && (
              <div className={`text-size-xs ${isNext ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {`Starts ${formatDateTimeRelative({ dateTimeMs: discussion.startDateTime * 1000, currentTimeMs })}`}
              </div>
            )}
            {isPast && discussion.groupDetails && (
              <div className="text-size-xs text-gray-500">
                {discussion.groupDetails.groupName || 'Group'}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {isNext && (
              <div className="w-full">
                <CTALinkOrButton
                  variant="primary"
                  size="small"
                  url={buttonUrl}
                  disabled={!discussion.zoomLink && isStartingSoon}
                  target="_blank"
                >
                  {buttonText}
                </CTALinkOrButton>
              </div>
            )}
            {!isFacilitator && !isPast && (
              <div className="w-full">
                <CTALinkOrButton
                  variant="outline-black"
                  size="small"
                  url="#"
                  aria-label={`Switch group for Unit ${discussion.unitNumber}`}
                  onClick={(e) => {
                    e.preventDefault(); // TODO Audit reason for this, add a comment if it is required
                    handleOpenGroupSwitchModal({ discussion, switchType: 'Switch group for one unit' });
                  }}
                >
                  Switch group
                </CTALinkOrButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:flex sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {/* Date and time */}
          <div className="flex flex-col items-center justify-center min-w-[60px]">
            <div className="text-size-sm font-semibold text-gray-900 text-center">
              {formatDateMonthAndDay(discussion.startDateTime)}
            </div>
            <div className="text-size-xs text-gray-500 text-center">
              {formatTime12HourClock(discussion.startDateTime)}
            </div>
          </div>

          {/* Discussion details */}
          <div className="flex flex-col gap-1">
            <div className="text-size-sm font-medium text-gray-900">
              {discussion.unitRecord
                ? `Unit ${discussion.unitRecord.unitNumber}: ${discussion.unitRecord.title}`
                : `Unit ${discussion.unitNumber || ''}`}
            </div>
            {!isPast && (
              <div className={`text-size-xs ${isNext ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {`Starts ${formatDateTimeRelative({ dateTimeMs: discussion.startDateTime * 1000, currentTimeMs })}`}
              </div>
            )}
            {isPast && discussion.groupDetails && (
              <div className="text-size-xs text-gray-500">
                {discussion.groupDetails.groupName || 'Group'}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-row gap-2">
          {(() => {
            const primaryButtons = visibleButtons.filter((b) => b.style === 'primary');
            const secondaryButtons = visibleButtons.filter((b) => b.style === 'secondary');
            const firstSecondaryButton = secondaryButtons[0];
            const overflowButtons = secondaryButtons.slice(1);

            return (
              <>
                {/* Primary buttons */}
                {primaryButtons.map((button) => (
                  <CTALinkOrButton
                    key={button.id}
                    variant="primary"
                    size="small"
                    url={button.url}
                    onClick={button.onClick}
                    disabled={button.id === 'join-now' && !discussion.zoomLink}
                    target={button.url ? '_blank' : undefined}
                  >
                    {button.label}
                  </CTALinkOrButton>
                ))}

                {/* First secondary button */}
                {firstSecondaryButton && (
                  <CTALinkOrButton
                    key={firstSecondaryButton.id}
                    variant="outline-black"
                    size="small"
                    url={firstSecondaryButton.url}
                    onClick={firstSecondaryButton.onClick}
                    aria-label={typeof firstSecondaryButton.label === 'string' ? firstSecondaryButton.label : undefined}
                  >
                    {firstSecondaryButton.label}
                  </CTALinkOrButton>
                )}

                {/* Overflow menu for remaining secondary buttons */}
                {overflowButtons.length > 0 && (
                  <OverflowMenu
                    ariaLabel="More actions"
                    buttonClassName="px-3 py-1.5 text-size-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    items={overflowButtons.map((button): OverflowMenuItemProps => ({
                      id: button.id,
                      label: button.label,
                      ...(button.url
                        ? { href: button.url, target: '_blank' }
                        : { onAction: button.onClick }
                      ),
                    }))}
                  />
                )}
              </>
            );
          })()}
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
  isLoading: boolean;
  isLast?: boolean;
};

const CourseDetails = ({
  course,
  courseRegistration,
  attendedDiscussions,
  upcomingDiscussions,
  isLoading,
  isLast = false,
}: CourseDetailsProps) => {
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<GroupDiscussion | null>(null);
  const [selectedSwitchType, setSelectedSwitchType] = useState<SwitchType>('Switch group for one unit');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'attended'>('upcoming');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllAttended, setShowAllAttended] = useState(false);

  // TODO make issue: "Use consistent method for checking whether a user is the facilitator"
  const isFacilitator = courseRegistration.role === 'Facilitator';

  const handleOpenGroupSwitchModal = ({ discussion, switchType }: { discussion: GroupDiscussion; switchType: SwitchType }) => {
    setSelectedDiscussion(discussion);
    setSelectedSwitchType(switchType);
    setGroupSwitchModalOpen(true);
  };

  return (
    <>
      <div className={`bg-white border-x border-b border-gray-200 ${isLast ? 'rounded-b-xl' : ''}`} role="region" aria-label={`Expanded details for ${course.title}`}>
        <div>
          {/* Section header with tabs */}
          <div className="flex border-b border-gray-200">
            <div className="flex px-4 sm:px-8 gap-8">
              <button
                type="button"
                onClick={() => setActiveTab('upcoming')}
                className={`relative py-2 px-1 text-size-xs font-medium transition-colors ${
                  activeTab === 'upcoming'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Upcoming discussions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('attended')}
                className={`relative py-2 px-1 text-size-xs font-medium transition-colors ${
                  activeTab === 'attended'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Attended discussions
              </button>
            </div>
          </div>

          <div className="p-4 sm:px-8 sm:py-4">
            {/* Content */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <ProgressDots />
              </div>
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
                            className="text-size-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
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
                            handleOpenGroupSwitchModal={handleOpenGroupSwitchModal}
                          />
                        ))}

                      {/* "See all"/"Show less" button when more than 3 attended discussions */}
                      {attendedDiscussions.length > 3 && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllAttended(!showAllAttended)}
                            className="text-size-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
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
      {groupSwitchModalOpen && selectedDiscussion && course.slug && selectedDiscussion.unitRecord && (
        <GroupSwitchModal
          handleClose={() => {
            setGroupSwitchModalOpen(false);
            setSelectedDiscussion(null);
          }}
          initialUnitNumber={selectedDiscussion?.unitRecord.unitNumber.toString()}
          initialSwitchType={selectedSwitchType}
          courseSlug={course.slug}
        />
      )}
    </>
  );
};

export default CourseDetails;
