import { type Course, type CourseRegistration } from '@bluedot/db';
import { ProgressDots } from '@bluedot/ui';
import { useState } from 'react';
import type { GroupDiscussionWithGroupAndUnit } from '../../server/routers/group-discussions';
import GroupSwitchModal, { type SwitchType } from '../courses/GroupSwitchModal';
import FacilitatorSwitchModal, { type FacilitatorModalType } from '../courses/FacilitatorSwitchModal';
import DropoutModal from '../courses/DropoutModal';
import DiscussionList from './DiscussionList';

type CourseDetailsProps = {
  course: Course;
  courseRegistration: CourseRegistration;
  attendedDiscussions: GroupDiscussionWithGroupAndUnit[];
  upcomingDiscussions: GroupDiscussionWithGroupAndUnit[];
  facilitatedDiscussions: GroupDiscussionWithGroupAndUnit[];
  isLoading: boolean;
};

const CourseDetails = ({
  course,
  courseRegistration,
  attendedDiscussions,
  upcomingDiscussions,
  facilitatedDiscussions,
  isLoading,
}: CourseDetailsProps) => {
  const showUpcomingTab = courseRegistration.roundStatus === 'Active' || upcomingDiscussions.length > 0;
  const showFacilitatedTab = facilitatedDiscussions.length > 0;
  const showAttendedTab = !(showFacilitatedTab && attendedDiscussions.length === 0);

  const getInitialTab = (): 'upcoming' | 'attended' | 'facilitated' => {
    if (showUpcomingTab) return 'upcoming';
    if (showFacilitatedTab) return 'facilitated';
    return 'attended';
  };

  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);
  const [facilitatorSwitchModalOpen, setFacilitatorSwitchModalOpen] = useState(false);
  const [dropoutModalOpen, setDropoutModalOpen] = useState(false);
  const [selectedSwitchType, setSelectedSwitchType] = useState<SwitchType>('Switch group for one unit');
  const [selectedFacilitatorModalType, setSelectedFacilitatorModalType] = useState<FacilitatorModalType>('Update discussion time');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'attended' | 'facilitated'>(getInitialTab());
  const [selectedDiscussion, setSelectedDiscussion] = useState<GroupDiscussionWithGroupAndUnit | null>(null);

  const isFacilitatorRole = courseRegistration.role === 'Facilitator';

  const handleOpenGroupSwitch = (discussion: GroupDiscussionWithGroupAndUnit, switchType: SwitchType) => {
    setSelectedDiscussion(discussion);
    setSelectedSwitchType(switchType);
    setGroupSwitchModalOpen(true);
  };

  const handleOpenFacilitatorModal = (discussion: GroupDiscussionWithGroupAndUnit, modalType: FacilitatorModalType) => {
    setSelectedDiscussion(discussion);
    setSelectedFacilitatorModalType(modalType);
    setFacilitatorSwitchModalOpen(true);
  };

  const handleOpenDropoutModal = () => {
    setDropoutModalOpen(true);
  };

  return (
    <>
      <div className="bg-white" role="region" aria-label={`Expanded details for ${course.title}`}>
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
              {showAttendedTab && (
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
              )}
              {showFacilitatedTab && (
                <button
                  type="button"
                  onClick={() => setActiveTab('facilitated')}
                  className={`relative py-2 px-1 text-size-xs font-medium transition-colors ${
                    activeTab === 'facilitated'
                      ? 'text-bluedot-normal border-b-2 border-bluedot-normal'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Facilitated discussions
                </button>
              )}
            </div>
          </div>

          <div className="p-4 sm:px-8 sm:py-3">
            {/* Content */}
            {isLoading ? (
              <ProgressDots className="py-8" />
            ) : (
              <div>
                {activeTab === 'upcoming' && (
                  <DiscussionList
                    discussions={upcomingDiscussions}
                    course={course}
                    isFacilitator={isFacilitatorRole}
                    onOpenGroupSwitchModal={handleOpenGroupSwitch}
                    onOpenFacilitatorModal={handleOpenFacilitatorModal}
                    onOpenDropoutModal={handleOpenDropoutModal}
                    isPast={false}
                    emptyMessage="No upcoming discussions"
                  />
                )}
                {activeTab === 'attended' && (
                  <DiscussionList
                    discussions={attendedDiscussions}
                    course={course}
                    isFacilitator={isFacilitatorRole}
                    onOpenGroupSwitchModal={handleOpenGroupSwitch}
                    onOpenFacilitatorModal={handleOpenFacilitatorModal}
                    onOpenDropoutModal={handleOpenDropoutModal}
                    isPast
                    emptyMessage="No attended discussions yet"
                  />
                )}
                {activeTab === 'facilitated' && (
                  <DiscussionList
                    discussions={facilitatedDiscussions}
                    course={course}
                    isFacilitator={isFacilitatorRole}
                    onOpenGroupSwitchModal={handleOpenGroupSwitch}
                    onOpenFacilitatorModal={handleOpenFacilitatorModal}
                    onOpenDropoutModal={handleOpenDropoutModal}
                    isPast
                    emptyMessage="No facilitated discussions yet"
                  />
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
            ? (selectedDiscussion?.unitRecord.unitNumber ?? '').toString()
            : undefined}
          initialSwitchType={selectedSwitchType}
          courseSlug={course.slug}
        />
      )}
      {facilitatorSwitchModalOpen && selectedDiscussion?.groupDetails?.round && (
        <FacilitatorSwitchModal
          handleClose={() => {
            setFacilitatorSwitchModalOpen(false);
            setSelectedDiscussion(null);
          }}
          roundId={selectedDiscussion.groupDetails.round}
          initialDiscussion={{ id: selectedDiscussion.id, group: selectedDiscussion.group ?? '' }}
          initialModalType={selectedFacilitatorModalType}
        />
      )}
      {dropoutModalOpen && (
        <DropoutModal
          applicantId={courseRegistration.id}
          handleClose={() => setDropoutModalOpen(false)}
        />
      )}
    </>
  );
};

export default CourseDetails;
