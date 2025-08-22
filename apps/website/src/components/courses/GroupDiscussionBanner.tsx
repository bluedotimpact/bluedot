import React, { useState, useEffect } from 'react';
import {
  InferSelectModel,
  groupDiscussionTable,
  unitTable,
} from '@bluedot/db';
import { CTALinkOrButton, Modal, useAuthStore } from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { GetGroupSwitchingAvailableResponse } from '../../pages/api/courses/[courseSlug]/group-switching/available';
import { PostGroupSwitchRequest, PostGroupSwitchResponse } from '../../pages/api/courses/[courseSlug]/groupSwitch';

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Unit = InferSelectModel<typeof unitTable.pg>;

type GroupDiscussionBannerProps = {
  unit: Unit;
  groupDiscussion: GroupDiscussion;
  onClickPrepare: () => void;
  units: Unit[];
};

const formatTimeStrings = (startDateTime: number) => {
  const startDate = new Date(startDateTime * 1000);
  const now = new Date();

  // Calculate relative time
  const timeDiffMs = startDate.getTime() - now.getTime();
  const timeDiffHours = Math.round(timeDiffMs / (1000 * 60 * 60));

  let startTimeDisplayRelative: string;
  // TODO support displaying minutes and days
  if (timeDiffHours > 0) {
    startTimeDisplayRelative = `in ${timeDiffHours} hour${timeDiffHours !== 1 ? 's' : ''}`;
  } else if (timeDiffHours === 0) {
    startTimeDisplayRelative = 'starting now';
  } else {
    startTimeDisplayRelative = `${Math.abs(timeDiffHours)} hour${Math.abs(timeDiffHours) !== 1 ? 's' : ''} ago`;
  }

  // Format date and time
  const startTimeDisplayDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const startTimeDisplayTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return { startTimeDisplayRelative, startTimeDisplayDate, startTimeDisplayTime };
};

const GroupDiscussionBanner: React.FC<GroupDiscussionBannerProps> = ({
  unit,
  groupDiscussion,
  onClickPrepare,
  units,
}) => {
  const [groupSwitchModalOpen, setGroupSwitchModalOpen] = useState(false);

  const unitTitle = `${unit.unitNumber}. ${unit.title}`;
  const { startTimeDisplayRelative, startTimeDisplayDate, startTimeDisplayTime } = formatTimeStrings(groupDiscussion.startDateTime);

  const discussionMeetLink = ''; // TODO use field fld5H5CNHA0B0EnYF on groupDiscussionTable

  const discussionDocLink = ''; // TODO use field fldR74MrOB3EvDnmw on groupDiscussionTable
  const slackChannelLink = ''; // TODO use field fldYFQwPDKdzIAy93 on groupDiscussionTable (and derive link from Slack channel ID)

  // TODO update dynamically
  const discussionStartsSoon = (groupDiscussion.startDateTime * 1000 - Date.now()) <= 3600_000;

  return (
    <div className="flex flex-col p-2 border-1 border-charcoal-light gap-2">
      <div className="flex justify-between items-center px-4 my-1 gap-4">
        <div>
          Your discussion on <span className="font-semibold">{unitTitle}</span> starts {startTimeDisplayRelative}
        </div>
        <div className="inline-block border border-charcoal-light rounded p-2 text-center text-size-sm">
          <div className="font-semibold whitespace-nowrap">{startTimeDisplayDate}</div>
          <div className="text-gray-600 whitespace-nowrap">{startTimeDisplayTime}</div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {discussionStartsSoon ? (
          <CTALinkOrButton
            target="_blank"
            url={discussionMeetLink}
            className="w-full"
          >
            Join discussion
          </CTALinkOrButton>
        ) : (
          <CTALinkOrButton onClick={onClickPrepare} className="w-full">
            Prepare for discussion
          </CTALinkOrButton>
        )}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(175px,1fr))] gap-2 w-full">
          {discussionStartsSoon && (
            <CTALinkOrButton
              variant="secondary"
              target="_blank"
              className="w-full"
              url={discussionDocLink}
            >
              Open discussion doc
            </CTALinkOrButton>
          )}
          <CTALinkOrButton
            variant="secondary"
            target="_blank"
            className="w-full"
            url={slackChannelLink}
          >
            Message your group
          </CTALinkOrButton>
          <CTALinkOrButton
            variant="secondary"
            className="w-full"
            onClick={() => setGroupSwitchModalOpen(true)}
          >
            Can't make it?
          </CTALinkOrButton>
        </div>
      </div>
      <GroupSwitchModal
        isOpen={groupSwitchModalOpen}
        setIsOpen={setGroupSwitchModalOpen}
        groupDiscussion={groupDiscussion}
        units={units}
        courseSlug={unit.courseSlug}
      />
    </div>
  );
};

type GroupSwitchModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  groupDiscussion: GroupDiscussion;
  units: Unit[];
  courseSlug: string;
};

const SWITCH_TYPE_OPTIONS = [
  { value: 'Switch group for one unit', label: 'Switch group for one unit' },
  { value: 'Switch group permanently', label: 'Switch group permanently' },
];

const GroupSwitchModal: React.FC<GroupSwitchModalProps> = ({
  isOpen,
  setIsOpen,
  groupDiscussion,
  units,
  courseSlug,
}) => {
  const [switchType, setSwitchType] = useState<'Switch group for one unit' | 'Switch group permanently'>('Switch group for one unit');
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id); // TODO default to the groupDiscussion unit number
  const [reason, setReason] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState('');
  const [isManualRequest, setIsManualRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const auth = useAuthStore((s) => s.auth);

  // Get the unit number for the selected unit
  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const selectedUnitNumber = selectedUnit?.unitNumber;

  const [{ data: switchingData, loading: isLoading }, fetchSwitchingData] = useAxios<GetGroupSwitchingAvailableResponse>({
    url: `/api/courses/${courseSlug}/group-switching/available`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
    method: 'get',
  }, { manual: true });

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSwitchingData();
    }
  }, [isOpen, fetchSwitchingData]);

  const [, submitGroupSwitch] = useAxios<PostGroupSwitchResponse, PostGroupSwitchRequest>({
    url: `/api/courses/${courseSlug}/groupSwitch`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
    method: 'post',
  }, { manual: true });

  const unitOptions = units.map((u) => ({ value: u.id, label: `${u.unitNumber}. ${u.title}` }));

  // Create options from the single API response
  const groups = switchingData?.type === 'success' ? Object.values(switchingData.groupAvailability) : [];
  const discussions = switchingData?.type === 'success' && selectedUnitNumber
    ? switchingData.groupDiscussionAvailability[selectedUnitNumber.toString()] || []
    : [];

  const groupOptions = groups
    // .filter((g) => g.group.id !== groupDiscussion.group) // TODO exclude current group, but not like this
    .map((g) => ({
      value: g.group.id,
      label: `${g.group.groupName || `Group ${g.group.id}`} (${g.spotsLeft} spots left)`,
    }));

  const discussionOptions = discussions
    .filter((d) => d.id !== groupDiscussion.id) // Exclude current discussion
    .map((d) => ({
      value: d.id,
      label: `Group Discussion ${d.id}`, // TODO: Better discussion naming with group info
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate based on switch type
    const isTemporarySwitch = switchType === 'Switch group for one unit';
    const hasValidSelection = isTemporarySwitch ? selectedDiscussionId : selectedGroupId;

    if (!hasValidSelection || !reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: PostGroupSwitchRequest = {
        switchType,
        notesFromParticipant: reason,
        isManualRequest,
        ...(isTemporarySwitch
          ? {
            oldDiscussionId: groupDiscussion.id,
            newDiscussionId: selectedDiscussionId,
            newGroupId: discussions.find((d) => d.id === selectedDiscussionId)?.group,
            unitId: selectedUnitId,
          }
          : {
            // TODO ideally add oldGroupId
            newGroupId: selectedGroupId,
          }
        ),
      };

      const response = await submitGroupSwitch({ data: payload });

      if (response.data?.type === 'success') {
        setIsOpen(false);
        // TODO: Show success message
      } else {
        throw new Error('Failed to submit request');
      }
    } catch {
      // TODO: Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Group switching">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-[600px] max-h-[600px] overflow-y-auto">
        <div>
          <label htmlFor="switchType" className="block text-size-sm font-medium mb-1">Action</label>
          <select
            id="switchType"
            value={switchType}
            onChange={(e) => setSwitchType(e.target.value as typeof switchType)}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            {SWITCH_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {switchType === 'Switch group for one unit' && (
          <div>
            <label htmlFor="unitSelect" className="block text-size-sm font-medium mb-1">Unit</label>
            <select
              id="unitSelect"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              {unitOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <p className="text-size-sm font-medium">Why are you making this change?</p>
            <p className="text-size-xs text-[#666C80]">
              Briefly, we'd like to understand why you're making this change. We've found that
              participants who stick with their group usually have a better experience on the course.
            </p>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 min-h-[80px]"
            required
          />
        </div>

        <div>
          <label htmlFor="targetSelect" className="block text-size-sm font-medium mb-1">
            {switchType === 'Switch group for one unit' ? 'Select a discussion' : 'Select a group'}
          </label>
          {isLoading && <p>Loading...</p>}
          {!isLoading && switchType === 'Switch group for one unit' && (
            <select
              id="targetSelect"
              value={selectedDiscussionId}
              onChange={(e) => setSelectedDiscussionId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select a discussion</option>
              {discussionOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}
          {!isLoading && switchType === 'Switch group permanently' && (
            <select
              id="targetSelect"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Select a group</option>
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="manualRequest"
            checked={isManualRequest}
            onChange={(e) => setIsManualRequest(e.target.checked)}
          />
          <label htmlFor="manualRequest" className="text-size-sm">
            Request manual switch
          </label>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !(switchType === 'Switch group for one unit' ? selectedDiscussionId : selectedGroupId) || !reason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GroupDiscussionBanner;
