import { useState } from 'react';
import { courseTable, courseRegistrationTable } from '@bluedot/db';
import useAxios from 'axios-hooks';
import { CTALinkOrButton, ProgressDots } from '@bluedot/ui';
import { GetGroupDiscussionsResponse, GroupDiscussionWithDetails } from '../../pages/api/group-discussions';

type CourseDetailsProps = {
  course: typeof courseTable.pg.$inferSelect;
  courseRegistration: typeof courseRegistrationTable.pg.$inferSelect;
  authToken?: string;
  isLast?: boolean;
};

const CourseDetails = ({
  course, courseRegistration, authToken, isLast = false,
}: CourseDetailsProps) => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'attended'>('upcoming');

  const [{ data: discussionsData, loading: discussionsLoading }] = useAxios<GetGroupDiscussionsResponse>({
    method: 'get',
    url: `/api/group-discussions?courseRegistrationId=${courseRegistration.id}`,
    headers: authToken ? {
      Authorization: `Bearer ${authToken}`,
    } : undefined,
  });

  // Get current time in seconds
  const currentTimeSeconds = Math.floor(Date.now() / 1000);

  // Helper function to format time until discussion
  const formatTimeUntilDiscussion = (startDateTime: number): string => {
    const timeUntilStart = startDateTime - currentTimeSeconds;

    if (timeUntilStart <= 0) {
      return 'Discussion has started';
    }

    const days = Math.floor(timeUntilStart / (24 * 60 * 60));
    const hours = Math.floor((timeUntilStart % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeUntilStart % (60 * 60)) / 60);

    if (days > 0) {
      if (days === 1) {
        return '1 day';
      }
      return `${days} days`;
    }

    if (hours > 0 && minutes > 0) {
      return `${hours}hr ${minutes}min`;
    }
    if (hours > 0) {
      return `${hours}hr`;
    }
    if (minutes > 0) {
      return `${minutes}min`;
    }
    return 'Less than 1min';
  };

  // Separate upcoming and attended discussions
  const upcomingDiscussions = discussionsData?.discussions.filter(
    (discussion) => discussion.startDateTime > currentTimeSeconds,
  ) || [];

  const attendedDiscussions = discussionsData?.discussions.filter(
    (discussion) => discussion.attendees.includes(discussionsData?.meetPerson?.id || ''),
  ) || [];

  // Format date and time
  const formatDiscussionDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDiscussionTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderDiscussionItem = (discussion: GroupDiscussionWithDetails, isNext = false) => {
    // Check if discussion starts in less than 1 hour
    const oneHourInSeconds = 60 * 60;
    const timeUntilStart = discussion.startDateTime - currentTimeSeconds;
    const isStartingSoon = timeUntilStart < oneHourInSeconds && timeUntilStart > 0;

    // Determine button text and URL based on timing
    const buttonText = isStartingSoon ? 'Join Discussion' : 'Prepare for discussion';
    let buttonUrl = '#';
    if (isStartingSoon) {
      buttonUrl = discussion.zoomLink || '#';
    } else if (course.slug && discussion.unitNumber) {
      buttonUrl = `/courses/${course.slug}/${discussion.unitNumber}`;
    }
    const openInNewTab = isStartingSoon;

    return (
      <div key={discussion.id} className="flex items-start justify-between py-4 border-b border-gray-100 last:border-0">
        <div className="flex gap-4">
          {/* Date and time */}
          <div className="flex flex-col items-center min-w-[60px]">
            <div className="text-size-sm font-semibold text-gray-900">
              {formatDiscussionDate(discussion.startDateTime)}
            </div>
            <div className="text-size-xs text-gray-500">
              {formatDiscussionTime(discussion.startDateTime)}
            </div>
          </div>

          {/* Discussion details */}
          <div className="flex flex-col gap-1">
            <div className="text-size-sm font-medium text-gray-900">
              {discussion.unitDetails?.title || `Unit ${discussion.unitNumber || ''}: Discussion`} {/* TODO: Add unit title */}
            </div>
            <div className={`text-size-xs ${isNext ? 'text-blue-600' : 'text-gray-500'}`}>
              Starts in {formatTimeUntilDiscussion(discussion.startDateTime)}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {isNext ? (
            <CTALinkOrButton
              variant="primary"
              size="small"
              url={buttonUrl}
              disabled={!discussion.zoomLink && isStartingSoon}
              target={openInNewTab ? '_blank' : undefined}
            >
              {buttonText}
            </CTALinkOrButton>
          ) : (
            <CTALinkOrButton
              variant="outline-black"
              size="small"
              url="#"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement switch group functionality
              }}
            >
              Switch group
            </CTALinkOrButton>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border-x border-b border-gray-200 ${isLast ? 'rounded-b-xl' : ''}`} role="region" aria-label={`Expanded details for ${course.title}`}>
      <div>
        {/* Tab navigation */}
        <nav className="flex border-b border-gray-200" aria-label="Course content tabs">
          <div className="flex px-4 sm:px-8 gap-8">
            <button
              type="button"
              className={`relative py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'upcoming'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
              aria-current={activeTab === 'upcoming' ? 'page' : undefined}
              role="tab"
              aria-selected={activeTab === 'upcoming'}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming discussions
            </button>
            <button
              type="button"
              className={`relative py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'attended'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
              }`}
              aria-current={activeTab === 'attended' ? 'page' : undefined}
              role="tab"
              aria-selected={activeTab === 'attended'}
              onClick={() => setActiveTab('attended')}
            >
              Attended discussions
            </button>
          </div>
        </nav>

        <div className="p-4 sm:px-8 sm:py-4">
          {/* Tab content */}
          {discussionsLoading ? (
            <div className="flex justify-center py-8">
              <ProgressDots />
            </div>
          ) : (
            <>
              {activeTab === 'upcoming' && (
                <div className="min-h-[200px]">
                  {upcomingDiscussions.length > 0 ? (
                    <div>
                      {upcomingDiscussions.map((discussion, index) => renderDiscussionItem(discussion, index === 0))}
                    </div>
                  ) : (
                    <p className="text-size-sm text-gray-500 py-4">No upcoming discussions</p>
                  )}
                </div>
              )}
              {activeTab === 'attended' && (
                <div className="min-h-[200px]">
                  {attendedDiscussions.length > 0 ? (
                    <div>
                      {attendedDiscussions.map((discussion) => renderDiscussionItem(discussion, false))}
                    </div>
                  ) : (
                    <p className="text-size-sm text-gray-500 py-4">No attended discussions yet</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
