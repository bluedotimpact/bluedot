import React, { useState, useMemo, useCallback } from 'react';
import {
  InferSelectModel,
  groupDiscussionTable,
  unitTable,
} from '@bluedot/db';
import {
  CTALinkOrButton, Modal, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { GetGroupSwitchingAvailableResponse } from '../../pages/api/courses/[courseSlug]/group-switching/available';
import { GroupSwitchingRequest, GroupSwitchingResponse } from '../../pages/api/courses/[courseSlug]/group-switching';

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
      {groupSwitchModalOpen && (
        <GroupSwitchModal
          handleClose={() => setGroupSwitchModalOpen(false)}
          modalOpenedFromDiscussion={groupDiscussion}
          units={units}
          courseSlug={unit.courseSlug}
        />
      )}
    </div>
  );
};

type GroupSwitchModalProps = {
  handleClose: () => void;
  modalOpenedFromDiscussion: GroupDiscussion;
  units: Unit[];
  courseSlug: string;
};

const SWITCH_TYPE_OPTIONS = [
  { value: 'Switch group for one unit', label: 'Switch group for one unit' },
  { value: 'Switch group permanently', label: 'Switch group permanently' },
] as const;

const formatDiscussionTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const GroupSwitchModal: React.FC<GroupSwitchModalProps> = ({
  handleClose,
  modalOpenedFromDiscussion,
  units,
  courseSlug,
}) => {
  const [switchType, setSwitchType] = useState<'Switch group for one unit' | 'Switch group permanently'>('Switch group for one unit');
  const [selectedUnitNumber, setSelectedUnitNumber] = useState(modalOpenedFromDiscussion.unitNumber?.toString());
  const [reason, setReason] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState('');
  const [isManualRequest, setIsManualRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isTemporarySwitch = switchType === 'Switch group for one unit';

  const auth = useAuthStore((s) => s.auth);

  const [{ data: switchingData, loading }] = useAxios<GetGroupSwitchingAvailableResponse>({
    url: `/api/courses/${courseSlug}/group-switching/available`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
    method: 'get',
  });

  const [, submitGroupSwitch] = useAxios<GroupSwitchingResponse, GroupSwitchingRequest>({
    url: `/api/courses/${courseSlug}/group-switching`,
    headers: {
      Authorization: `Bearer ${auth?.token}`,
    },
    method: 'post',
  }, { manual: true });

  const unitOptions = useMemo(() => units.map((u) => ({ value: u.unitNumber, label: `${u.unitNumber}. ${u.title}` })), [units]);

  const groups = switchingData?.groupsAvailabile ? switchingData.groupsAvailabile : [];
  const discussions = switchingData?.discussionsAvailable && selectedUnitNumber
    ? switchingData.discussionsAvailable[selectedUnitNumber] || []
    : [];

  // Note: There are cases of people being in multiple discussions per unit, and there may be
  // people in multiple groups too. We're not explicitly supporting that case at the moment, but
  // we do at least display the group/discussion the user is switching out of so that
  // they can notice and request manual support.
  const oldGroup = groups.filter((g) => g.userIsParticipant)[0];
  const oldDiscussion = discussions.filter((d) => d.userIsParticipant)[0];

  const groupOptions = groups
    .filter((g) => !g.userIsParticipant)
    .map((g) => ({
      value: g.group.id,
      label: `${g.group.groupName || `Group ${g.group.id}`} (${g.spotsLeft} spots left)`,
      disabled: g.spotsLeft !== null && g.spotsLeft <= 0,
    }));

  const discussionOptions = discussions
    .filter((d) => !d.userIsParticipant)
    .map((d) => ({
      value: d.discussion.id,
      label: `${d.groupName} - ${formatDiscussionTime(d.discussion.startDateTime)}${d.spotsLeft !== null ? ` (${d.spotsLeft} spots left)` : ''}`,
      disabled: d.spotsLeft !== null && d.spotsLeft <= 0,
    }));

  const getCurrentDiscussionInfo = useCallback(() => {
    if (isTemporarySwitch && oldDiscussion) {
      return {
        name: oldDiscussion.groupName,
        time: formatDiscussionTime(oldDiscussion.discussion.startDateTime),
      };
    }
    if (!isTemporarySwitch && oldGroup) {
      // For permanent switch, show next upcoming discussion time
      const nextTime = oldGroup.nextDiscussionStartDateTime;
      return {
        name: oldGroup.group.groupName || `Group ${oldGroup.group.id}`,
        time: nextTime ? formatDiscussionTime(nextTime) : 'No upcoming discussions',
      };
    }
    return null;
  }, [isTemporarySwitch, oldDiscussion, oldGroup]);

  const currentInfo = getCurrentDiscussionInfo();

  const submitDisabled = isSubmitting || !((isTemporarySwitch ? selectedDiscussionId : selectedGroupId) || isManualRequest) || !reason.trim();

  const handleSubmit = async () => {
    if (submitDisabled) return;

    setIsSubmitting(true);

    const oldGroupId = !isTemporarySwitch ? oldGroup?.group.id : undefined;
    const newGroupId = !isTemporarySwitch && !isManualRequest ? selectedGroupId : undefined;
    const oldDiscussionId = isTemporarySwitch ? oldDiscussion?.discussion.id : undefined;
    const newDiscussionId = isTemporarySwitch && !isManualRequest ? selectedDiscussionId : undefined;
    try {
      const payload: GroupSwitchingRequest = {
        switchType,
        notesFromParticipant: reason,
        isManualRequest,
        oldGroupId,
        newGroupId,
        oldDiscussionId,
        newDiscussionId,
      };

      const response = await submitGroupSwitch({ data: payload });

      if (response.data?.type === 'success') {
        setShowSuccess(true);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch {
      // TODO: Show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalTitle = () => {
    if (isManualRequest) {
      return !showSuccess ? 'Request manual switch' : 'We are working on your request';
    }
    if (showSuccess) {
      return 'Success!';
    }
    return 'Group switching';
  };
  const title = getModalTitle();

  const getSuccessMessages = () => {
    if (isManualRequest) {
      return [
        'We aim to process your request within 1-2 business days.',
        "Once your switch is complete, you will receive a calendar invitation and be added to your new group's Slack channel.",
      ];
    }

    const message = `You will receive ${isTemporarySwitch ? 'a calendar invite' : 'the calendar invites'} shortly and be added to the group's Slack channel.`;
    return [message];
  };
  const successMessages = getSuccessMessages();

  return (
    <Modal isOpen setIsOpen={handleClose} title={title}>
      <div className="max-h-[600px] max-w-[600px] overflow-y-auto">
        {loading && <ProgressDots />}
        {showSuccess && (
          <div className="flex flex-col gap-4">
            {successMessages.map((message) => (
              <p key={message} className="text-size-sm text-[#666C80]">
                {message}
              </p>
            ))}
          </div>
        )}
        {!loading && !showSuccess && (
        <>
          {isManualRequest && (
            <div className="text-size-sm text-[#666C80] mb-4">
              We're keen for you to request manual switches where necessary to attend group discussions.
              However, because they do take time for us to process but we expect you to have made a sincere
              effort to make your original discussion group and consider others available on the last screen.
            </div>
          )}
          <form className="flex flex-col gap-4">
            <div>
              <label htmlFor="switchType" className="block text-size-sm font-medium mb-1">Action</label>
              <select
                id="switchType"
                value={switchType}
                onChange={(e) => setSwitchType(e.target.value as typeof switchType)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
                aria-describedby="switchType-description"
              >
                {SWITCH_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {isTemporarySwitch && (
            <div>
              <label htmlFor="unitSelect" className="block text-size-sm font-medium mb-1">Unit</label>
              <select
                id="unitSelect"
                value={selectedUnitNumber ?? ''}
                onChange={(e) => setSelectedUnitNumber(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
                aria-describedby="unitSelect-description"
                required
              >
                <option value="">Select a unit</option>
                {unitOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            )}

            <div className="flex flex-col gap-2 px-1">
              <div className="flex flex-col gap-2">
                <label htmlFor="reason" className="text-size-sm font-medium">Why are you making this change?*</label>
                <p className="text-size-sm text-[#666C80]">
                  Briefly, we'd like to understand why you're making this change. We've found that
                  participants who stick with their group usually have a better experience on the course.
                </p>
              </div>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 min-h-[80px] focus:border-blue-500"
                required
                aria-describedby="reason-description"
              />
            </div>

            {!isManualRequest && (
            <div className="flex flex-col gap-2">
              <label htmlFor="targetSelect" className="block text-size-sm font-medium mb-1">
                {isTemporarySwitch ? 'Select new discussion' : 'Select new group'}
              </label>
              {currentInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                <h4 className="text-size-sm font-medium text-gray-700 mb-1">
                  {isTemporarySwitch ? 'Current discussion:' : 'Current group (next discussion):'}
                </h4>
                <p className="text-size-sm text-gray-600">
                  {currentInfo.name} - {currentInfo.time}
                </p>
              </div>
              )}
              {isTemporarySwitch && (
              <select
                id="targetSelect"
                value={selectedDiscussionId}
                onChange={(e) => setSelectedDiscussionId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
                required
                aria-describedby="targetSelect-description"
              >
                <option value="">Select a discussion</option>
                {discussionOptions.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
              )}
              {!isTemporarySwitch && (
              <select
                id="targetSelect"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
                required
                aria-describedby="targetSelect-description"
              >
                <option value="">Select a group</option>
                {groupOptions.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))}
              </select>
              )}
            </div>
            )}

            <div className="flex gap-2 justify-end">
              <CTALinkOrButton
                variant="secondary"
                onClick={() => handleClose()}
                aria-label="Cancel group switching"
              >
                Cancel
              </CTALinkOrButton>
              <CTALinkOrButton
                onClick={handleSubmit}
                disabled={submitDisabled}
                className="disabled:cursor-not-allowed cursor-pointer disabled:opacity-50"
                aria-label={isSubmitting ? 'Submitting group switch request' : 'Submit group switch request'}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </CTALinkOrButton>
            </div>

            {!isManualRequest && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-size-sm font-medium">Don't see a group that works?</h3>
                <p className="text-size-sm text-[#666C80]">
                  You can request a manual switch to join a group that's full or a group that is not
                  listed above, and we'll do our best to accommodate you.
                </p>
                <CTALinkOrButton
                  variant="secondary"
                  onClick={() => setIsManualRequest(true)}
                  aria-label="Request manual group switch"
                >
                  Request manual switch
                </CTALinkOrButton>
              </div>
            </div>
            )}
          </form>
        </>
        )}
      </div>
    </Modal>
  );
};

export default GroupDiscussionBanner;
