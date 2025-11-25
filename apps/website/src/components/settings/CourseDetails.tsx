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

const HOUR_IN_MS = 60 * 60 * 1000;

const BUTTON_STYLES = {
  primary: { variant: 'primary' as const, className: 'w-auto bg-[#2244BB]' },
  secondary: { variant: 'outline-black' as const, className: 'w-auto bg-[#13132E0D] hover:bg-[#13132E1C] text-[#13132E] border-none' },
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
  ariaLabel?: string;
  target?: React.HTMLAttributeAnchorTarget;
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
      target: '_blank',
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
      ariaLabel: `Switch group for Unit ${discussion.unitNumber}`,
    },
    // Inside overflow menu
    {
      id: 'message-group',
      label: <div className="grid grid-cols-[20px_1fr] gap-[6px] items-center"><SlackIcon className="mx-auto" />Message group</div>,
      style: 'secondary',
      url: slackChannelLink,
      isVisible: !isPast,
      target: '_blank',
    },
    {
      id: 'switch-group-permanently',
      label: <div className="grid grid-cols-[20px_1fr] gap-[6px] items-center"><FaArrowRightArrowLeft className="mx-auto" />Switch group permanently</div>,
      style: 'secondary',
      onClick: () => handleOpenGroupSwitchModal({ discussion, switchType: 'Switch group permanently' }),
      isVisible: !isFacilitator && !isPast,
    },
  ];
  const visibleButtons = buttons.filter((button) => button.isVisible);

  const primaryButton = visibleButtons.filter((button) => button.style === 'primary')[0];
  const cantMakeItButton = visibleButtons.filter((button) => button.id === 'cant-make-it')[0];
  const overflowButtons = visibleButtons.filter((button) => button.id !== primaryButton?.id && button.id !== cantMakeItButton?.id);

  return (
    <div key={discussion.id} className="py-4 border-b border-gray-100 last:border-0">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-start sm:justify-between">
        {/* Left side: Date/time and discussion details */}
        <div className="flex gap-4 min-w-0">
          {/* Date and time */}
          <div className="flex flex-col items-center justify-start sm:justify-center min-w-[50px] sm:min-w-[60px] pt-1 sm:pt-0">
            <div className="text-size-sm font-semibold text-gray-900 text-center">
              {formatDateMonthAndDay(discussion.startDateTime)}
            </div>
            <div className="text-size-xs text-gray-500 text-center">
              {formatTime12HourClock(discussion.startDateTime)}
            </div>
          </div>

          {/* Discussion details */}
          <div className="flex flex-col gap-1 min-w-0">
            {/* TODO refactor to simplify */}
            <div className="text-size-sm font-medium text-gray-900 truncate">
              {discussion.unitRecord
                ? `Unit ${discussion.unitRecord.unitNumber}: ${discussion.unitRecord.title}`
                : `Unit ${discussion.unitNumber || ''}`}
            </div>
            {!isPast && (
              <div className={`truncate text-size-xs ${isNext ? 'text-[#2244BB] font-medium' : 'text-gray-500'}`}>
                {`Starts ${formatDateTimeRelative({ dateTimeMs: discussion.startDateTime * 1000, currentTimeMs })}`}
              </div>
            )}
            {isPast && discussion.groupDetails && (
              <div className="truncate text-size-xs text-gray-500">
                {discussion.groupDetails.groupName || 'Group'}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          {primaryButton && (
            <CTALinkOrButton
              key={primaryButton.id}
              variant={BUTTON_STYLES[primaryButton.style].variant}
              size="small"
              className={BUTTON_STYLES[primaryButton.style].className}
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
                variant={BUTTON_STYLES[cantMakeItButton.style].variant}
                size="small"
                className={cn('flex-1', BUTTON_STYLES[cantMakeItButton.style].className)}
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
                  label: button.label,
                  ...(button.url
                    ? { href: button.url, target: '_blank' }
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
  const [initialUnitNumber, setInitialUnitNumber] = useState<string | undefined>(undefined);
  const [selectedSwitchType, setSelectedSwitchType] = useState<SwitchType>('Switch group for one unit');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'attended'>('upcoming');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllAttended, setShowAllAttended] = useState(false);

  // TODO make issue: "Use consistent method for checking whether a user is the facilitator"
  const isFacilitator = courseRegistration.role === 'Facilitator';

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
                    ? 'text-[#2244BB] border-b-2 border-[#2244BB]'
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
                    ? 'text-[#2244BB] border-b-2 border-[#2244BB]'
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
                            className="text-size-sm font-medium text-[#2244BB] hover:text-blue-700 transition-colors cursor-pointer"
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
                            className="text-size-sm font-medium text-[#2244BB] hover:text-blue-700 transition-colors cursor-pointer"
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

export const SlackIcon: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    className={className}
  >
    <g>
      <path d="M10 8.125V10H4.375C3.87772 10 3.40081 9.80246 3.04917 9.45083C2.69754 9.09919 2.5 8.62228 2.5 8.125C2.5 7.62772 2.69754 7.15081 3.04917 6.79917C3.40081 6.44754 3.87772 6.25 4.375 6.25H8.125C8.62228 6.25 9.09919 6.44754 9.45083 6.79917C9.80246 7.15081 10 7.62772 10 8.125Z" stroke="#13132E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6.25H8.125C7.62772 6.25 7.15081 6.05246 6.79917 5.70083C6.44754 5.34919 6.25 4.87228 6.25 4.375C6.25 3.87772 6.44754 3.40081 6.79917 3.04917C7.15081 2.69754 7.62772 2.5 8.125 2.5C8.62228 2.5 9.09919 2.69754 9.45083 3.04917C9.80246 3.40081 10 3.87772 10 4.375V6.25Z" stroke="#13132E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.875 10H10V4.375C10 3.87772 10.1975 3.40081 10.5492 3.04917C10.9008 2.69754 11.3777 2.5 11.875 2.5C12.3723 2.5 12.8492 2.69754 13.2008 3.04917C13.5525 3.40081 13.75 3.87772 13.75 4.375V8.125C13.75 8.62228 13.5525 9.09919 13.2008 9.45083C12.8492 9.80246 12.3723 10 11.875 10Z" stroke="#13132E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.75 10V8.125C13.75 7.62772 13.9475 7.15081 14.2992 6.79917C14.6508 6.44754 15.1277 6.25 15.625 6.25C16.1223 6.25 16.5992 6.44754 16.9508 6.79917C17.3025 7.15081 17.5 7.62772 17.5 8.125C17.5 8.62228 17.3025 9.09919 16.9508 9.45083C16.5992 9.80246 16.1223 10 15.625 10H13.75Z" stroke="#13132E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11.875V10H15.625C16.1223 10 16.5992 10.1975 16.9508 10.5492C17.3025 10.9008 17.5 11.3777 17.5 11.875C17.5 12.3723 17.3025 12.8492 16.9508 13.2008C16.5992 13.5525 16.1223 13.75 15.625 13.75H11.875C11.3777 13.75 10.9008 13.5525 10.5492 13.2008C10.1975 12.8492 10 12.3723 10 11.875Z" stroke="#13132E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 13.75H11.875C12.3723 13.75 12.8492 13.9475 13.2008 14.2992C13.5525 14.6508 13.75 15.1277 13.75 15.625C13.75 16.1223 13.5525 16.5992 13.2008 16.9508C12.8492 17.3025 12.3723 17.5 11.875 17.5C11.3777 17.5 10.9008 17.3025 10.5492 16.9508C10.1975 16.5992 10 16.1223 10 15.625V13.75Z" stroke="#13132E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.125 10H10V15.625C10 16.1223 9.80246 16.5992 9.45083 16.9508C9.09919 17.3025 8.62228 17.5 8.125 17.5C7.62772 17.5 7.15081 17.3025 6.79917 16.9508C6.44754 16.5992 6.25 16.1223 6.25 15.625V11.875C6.25 11.3777 6.44754 10.9008 6.79917 10.5492C7.15081 10.1975 7.62772 10 8.125 10Z" stroke="#13132E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.25 10V11.875C6.25 12.3723 6.05246 12.8492 5.70083 13.2008C5.34919 13.5525 4.87228 13.75 4.375 13.75C3.87772 13.75 3.40081 13.5525 3.04917 13.2008C2.69754 12.8492 2.5 12.3723 2.5 11.875C2.5 11.3777 2.69754 10.9008 3.04917 10.5492C3.40081 10.1975 3.87772 10 4.375 10H6.25Z" stroke="#13132E" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

export default CourseDetails;
