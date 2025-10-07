import useAxios from 'axios-hooks';
import { useState, useEffect } from 'react';
import { Course, CourseRegistration, MeetPerson } from '@bluedot/db';
import { CTALinkOrButton, ProgressDots } from '@bluedot/ui';
import { GroupDiscussion, GetGroupDiscussionResponse } from '../../pages/api/group-discussions/[id]';
import GroupSwitchModal from '../courses/GroupSwitchModal';
import { formatDateMonthAndDay, formatDateTimeRelative, formatTime12HourClock } from '../../lib/utils';

const HOUR_IN_SECONDS = 60 * 60; // 1 hour in seconds

type CourseDetailsProps = {
  course: Course;
  courseRegistration: CourseRegistration;
  authToken?: string;
};

const CourseDetails = ({
  course, courseRegistration, authToken,
}: CourseDetailsProps) => {
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<GroupDiscussion | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'attended'>('upcoming');
  const [expectedDiscussions, setExpectedDiscussions] = useState<GroupDiscussion[]>([]);
  const [attendedDiscussions, setAttendedDiscussions] = useState<GroupDiscussion[]>([]);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [showAllAttended, setShowAllAttended] = useState(false);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(Math.floor(Date.now() / 1000));

  // Fetch meetPerson data to get discussion IDs
  const [{ data: meetPersonData, loading }] = useAxios<{ type: 'success'; meetPerson: MeetPerson | null }>({
    method: 'get',
    url: `/api/meet-person?courseRegistrationId=${courseRegistration.id}`,
    headers: authToken ? {
      Authorization: `Bearer ${authToken}`,
    } : undefined,
  });

  const isFacilitator = courseRegistration.role === 'Facilitator';

  // Fetch individual discussions when we have the meetPerson data
  useEffect(() => {
    const fetchDiscussions = async () => {
      if (!meetPersonData?.meetPerson) {
        return;
      }

      // Fetch all expected discussions (will be filtered later to show only those not ended)
      // Use expectedDiscussionsFacilitator if the user is a facilitator, otherwise use expectedDiscussionsParticipant
      const expectedDiscussionIds = isFacilitator
        ? (meetPersonData.meetPerson.expectedDiscussionsFacilitator || [])
        : (meetPersonData.meetPerson.expectedDiscussionsParticipant || []);

      const expectedPromises = expectedDiscussionIds.map(async (id) => {
        try {
          const response = await fetch(`/api/group-discussions/${id}`);
          const data: GetGroupDiscussionResponse = await response.json();
          if (data.type === 'success') {
            return data.discussion;
          }
          return null;
        } catch {
          return null;
        }
      });

      // Fetch all attended discussions (all will be shown, no filtering)
      const attendedPromises = (meetPersonData.meetPerson.attendedDiscussions || []).map(async (id) => {
        try {
          const response = await fetch(`/api/group-discussions/${id}`);
          const data: GetGroupDiscussionResponse = await response.json();
          if (data.type === 'success') {
            return data.discussion;
          }
          return null;
        } catch {
          return null;
        }
      });

      const [expectedResults, attendedResults] = await Promise.all([
        Promise.all(expectedPromises),
        Promise.all(attendedPromises),
      ]);

      // Filter out nulls and sort by startDateTime
      const validExpected = expectedResults.filter((d): d is GroupDiscussion => d !== null);
      const validAttended = attendedResults.filter((d): d is GroupDiscussion => d !== null);

      validExpected.sort((a, b) => a.startDateTime - b.startDateTime);
      validAttended.sort((a, b) => a.startDateTime - b.startDateTime);

      setExpectedDiscussions(validExpected);
      setAttendedDiscussions(validAttended);
    };

    fetchDiscussions();
  }, [meetPersonData, isFacilitator]);

  // Update current time every 30 seconds for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimeSeconds(Math.floor(Date.now() / 1000));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Filter expected discussions to only show those where the end datetime hasn't passed yet
  const upcomingDiscussions = expectedDiscussions.filter(
    (discussion) => discussion.endDateTime > currentTimeSeconds,
  );

  const renderDiscussionItem = (discussion: GroupDiscussion, isNext = false, isPast = false) => {
    // Check if discussion starts in less than 1 hour
    const timeUntilStart = discussion.startDateTime - currentTimeSeconds;
    const isStartingSoon = timeUntilStart < HOUR_IN_SECONDS && timeUntilStart > 0;

    // Determine button text and URL based on timing
    const buttonText = isStartingSoon ? 'Join Discussion' : 'Prepare for discussion';
    let buttonUrl = '#';
    if (isStartingSoon) {
      buttonUrl = discussion.zoomLink || '#';
    } else if (course.slug && discussion.unitNumber) {
      buttonUrl = `/courses/${course.slug}/${discussion.unitNumber}`;
    }

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
                  {`Starts ${formatDateTimeRelative(discussion.startDateTime)}`}
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
                      e.preventDefault();
                      // Set the discussion for the modal
                      setSelectedDiscussion(discussion);
                      setGroupSwitchModalOpen(true);
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
                  {`Starts ${formatDateTimeRelative(discussion.startDateTime)}`}
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
            {isNext && (
              <CTALinkOrButton
                variant="primary"
                size="small"
                url={buttonUrl}
                disabled={!discussion.zoomLink && isStartingSoon}
                target="blank"
              >
                {buttonText}
              </CTALinkOrButton>
            )}
            {!isFacilitator && !isPast && (
              <CTALinkOrButton
                variant="outline-black"
                size="small"
                url="#"
                aria-label={`Switch group for Unit ${discussion.unitNumber}`}
                onClick={(e) => {
                  e.preventDefault();
                  // Set the discussion for the modal
                  setSelectedDiscussion(discussion);
                  setGroupSwitchModalOpen(true);
                }}
              >
                Switch group
              </CTALinkOrButton>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white border-x border-b border-gray-200 last:rounded-b-xl" role="region" aria-label={`Expanded details for ${course.title}`}>
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
            {loading ? (
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
                        .map((discussion, index) => renderDiscussionItem(discussion, index === 0, false))}

                      {/* Show "See all" button if there are more than 3 discussions */}
                      {upcomingDiscussions.length > 3 && !showAllUpcoming && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllUpcoming(true)}
                            className="text-size-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            See all ({upcomingDiscussions.length} discussions)
                          </button>
                        </div>
                      )}

                      {/* Show "Show less" button when expanded */}
                      {upcomingDiscussions.length > 3 && showAllUpcoming && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllUpcoming(false)}
                            className="text-size-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            Show less
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
                        .map((discussion) => renderDiscussionItem(discussion, false, true))}

                      {/* Show "See all" button if there are more than 3 discussions */}
                      {attendedDiscussions.length > 3 && !showAllAttended && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllAttended(true)}
                            className="text-size-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            See all ({attendedDiscussions.length} discussions)
                          </button>
                        </div>
                      )}

                      {/* Show "Show less" button when expanded */}
                      {attendedDiscussions.length > 3 && showAllAttended && (
                        <div className="pt-4 text-center">
                          <button
                            type="button"
                            onClick={() => setShowAllAttended(false)}
                            className="text-size-sm font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                          >
                            Show less
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
          currentUnit={selectedDiscussion.unitRecord}
          courseSlug={course.slug}
        />
      )}
    </>
  );
};

export default CourseDetails;
