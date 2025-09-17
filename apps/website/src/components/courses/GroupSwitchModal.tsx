import React, {
  useState, useMemo, useCallback,
} from 'react';
import {
  InferSelectModel,
  unitTable,
  courseTable,
} from '@bluedot/db';
import {
  cn,
  CTALinkOrButton, Modal, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import useAxios from 'axios-hooks';
import { FaCheck } from 'react-icons/fa6';
import { GetGroupSwitchingAvailableResponse } from '../../pages/api/courses/[courseSlug]/group-switching/available';
import { GroupSwitchingRequest, GroupSwitchingResponse } from '../../pages/api/courses/[courseSlug]/group-switching';

type Unit = InferSelectModel<typeof unitTable.pg>;
type Course = InferSelectModel<typeof courseTable.pg>;

export type GroupSwitchModalProps = {
  handleClose: () => void;
  currentUnit: Unit;
  courseSlug: string;
};

const SWITCH_TYPE_OPTIONS = [
  { value: 'Switch group for one unit', label: 'Switch group for one unit' },
  { value: 'Switch group permanently', label: 'Switch group permanently' },
] as const;

type SwitchType = (typeof SWITCH_TYPE_OPTIONS)[number]['value'];

const formatDiscussionDateTime = (timestamp: number): string => {
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
  currentUnit,
  courseSlug,
}) => {
  const [switchType, setSwitchType] = useState<SwitchType>('Switch group for one unit');
  // Use the current unit's number as the default selected unit
  const [selectedUnitNumber, setSelectedUnitNumber] = useState(currentUnit.unitNumber.toString());
  const [reason, setReason] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState('');
  const [isManualRequest, setIsManualRequest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isTemporarySwitch = switchType === 'Switch group for one unit';

  const auth = useAuthStore((s) => s.auth);

  // Fetch course and its units
  const [{ data: courseData, loading: courseLoading }] = useAxios<{ course: Course; units: Unit[] }>({
    url: `/api/courses/${courseSlug}`,
    headers: auth?.token ? {
      Authorization: `Bearer ${auth.token}`,
    } : undefined,
    method: 'get',
  });

  const [{ data: switchingData, loading }] = useAxios<GetGroupSwitchingAvailableResponse>({
    url: `/api/courses/${courseSlug}/group-switching/available`,
    headers: auth?.token ? {
      Authorization: `Bearer ${auth.token}`,
    } : undefined,
    method: 'get',
  });

  const [, submitGroupSwitch] = useAxios<GroupSwitchingResponse, GroupSwitchingRequest>({
    url: `/api/courses/${courseSlug}/group-switching`,
    headers: auth?.token ? {
      Authorization: `Bearer ${auth.token}`,
    } : undefined,
    method: 'post',
  }, { manual: true });

  // Generate unit options from the course units
  const unitOptions = useMemo(() => courseData?.units.map((u) => ({ value: u.unitNumber.toString(), label: `Unit ${u.unitNumber}: ${u.title}` })) || [], [courseData]);

  const groupsAvailable = switchingData?.groupsAvailable ?? [];
  const discussions = switchingData?.discussionsAvailable[selectedUnitNumber] ?? [];

  // Note: There are cases of people being in multiple discussions per unit, and there may be
  // people in multiple groups too. We're not explicitly supporting that case at the moment, but
  // we do at least display the group/discussion the user is switching out of so that
  // they can notice and request manual support.
  const oldGroup = groupsAvailable.find((g) => g.userIsParticipant);
  const oldDiscussion = discussions.find((d) => d.userIsParticipant);
  const newGroups = groupsAvailable.filter((g) => !g.userIsParticipant);

  const discussionOptions = discussions
    .filter((d) => !d.userIsParticipant)
    .map((d) => ({
      value: d.discussion.id,
      label: `${d.groupName} - ${formatDiscussionDateTime(d.discussion.startDateTime)}${d.spotsLeft !== null ? ` (${d.spotsLeft} spots left)` : ''}`,
      disabled: d.spotsLeft !== null && d.spotsLeft <= 0,
    }));

  const getCurrentParticipationInfo = useCallback(() => {
    if (isTemporarySwitch && oldDiscussion) {
      return {
        date: new Date(oldDiscussion.discussion.startDateTime * 1000),
        name: oldDiscussion.groupName,
        subText: getDiscussionSubtext(oldDiscussion),
      };
    }
    if (!isTemporarySwitch && oldGroup) {
      // For permanent switch, show next upcoming discussion time
      const nextTime = oldGroup.nextDiscussionStartDateTime;
      return {
        date: nextTime ? new Date(nextTime * 1000) : undefined,
        name: oldGroup.group.groupName || `Group ${oldGroup.group.id}`,
        subText: getGroupSubtext(oldGroup),
      };
    }
    return null;
  }, [isTemporarySwitch, oldDiscussion, oldGroup, selectedGroupId]);

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

  const getGroupSubtext = (group: GetGroupSwitchingAvailableResponse['groupsAvailable'][number]) => {
    const baseStyle = 'text-[12px] leading-none font-medium text-[#666C80]';

    if (group.userIsParticipant) {
      if (selectedGroupId) {
        // When there is another group selected, 'you are switching out'
        return <span className={baseStyle}>You are switching out of this group for remaining units.</span>;
      }
      return (
        <div className="flex items-center gap-1 text-[#0037FF]">
          <span className={cn(baseStyle, 'text-inherit')}>You are currently in this group</span>
          <FaCheck size={10} />
        </div>
      );
    }

    if (group.group.id === selectedGroupId) {
      return <span className={cn(baseStyle, 'text-[#0037FF]')}>You are switching into this group for all remaining units.</span>;
    }

    let spotsLeft = 'No spots left';
    if (group.spotsLeft && group?.spotsLeft > 0) {
      spotsLeft = `${group.spotsLeft} spot${group.spotsLeft > 1 ? 's' : ''} left`;
    }
    return (
      <div className="flex items-center gap-1 text-[#666C80]">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M10 10.5V9.5C10 8.96957 9.78929 8.46086 9.41421 8.08579C9.03914 7.71071 8.53043 7.5 8 7.5H4C3.46957 7.5 2.96086 7.71071 2.58579 8.08579C2.21071 8.46086 2 8.96957 2 9.5V10.5M8 3.5C8 4.60457 7.10457 5.5 6 5.5C4.89543 5.5 4 4.60457 4 3.5C4 2.39543 4.89543 1.5 6 1.5C7.10457 1.5 8 2.39543 8 3.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={baseStyle}>{spotsLeft}</span>
      </div>
    );
  };

  const getDiscussionSubtext = (discussion: GetGroupSwitchingAvailableResponse['discussionsAvailable'][string][number]) => {
    const baseStyle = 'text-[12px] leading-none font-medium text-[#666C80]';

    if (discussion.userIsParticipant) {
      if (selectedDiscussionId) {
        // When there is another discussion selected
        return <span className={baseStyle}>You are not attending this discussion</span>;
      }
      return (
        <div className="flex items-center gap-1 text-[#0037FF]">
          <span className={cn(baseStyle, 'text-inherit')}>You are attending this discussion</span>
          <FaCheck size={10} />
        </div>
      );
    }

    if (discussion.discussion.id === selectedDiscussionId) {
      return <span className={cn(baseStyle, 'text-[#0037FF]')}>You are joining this group for this unit.</span>;
    }

    let spotsLeft = 'No spots left';
    if (discussion.spotsLeft && discussion?.spotsLeft > 0) {
      spotsLeft = `${discussion.spotsLeft} spot${discussion.spotsLeft > 1 ? 's' : ''} left`;
    }
    return (
      <div className="flex items-center gap-1 text-[#666C80]">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M10 10.5V9.5C10 8.96957 9.78929 8.46086 9.41421 8.08579C9.03914 7.71071 8.53043 7.5 8 7.5H4C3.46957 7.5 2.96086 7.71071 2.58579 8.08579C2.21071 8.46086 2 8.96957 2 9.5V10.5M8 3.5C8 4.60457 7.10457 5.5 6 5.5C4.89543 5.5 4 4.60457 4 3.5C4 2.39543 4.89543 1.5 6 1.5C7.10457 1.5 8 2.39543 8 3.5Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className={baseStyle}>{spotsLeft}</span>
      </div>
    );
  };

  const currentInfo = getCurrentParticipationInfo();
  
  return (
    <Modal isOpen setIsOpen={(open: boolean) => !open && handleClose()} title={title} bottomDrawerOnMobile>
      <div className="w-full max-w-[600px]">
        {(loading || courseLoading) && <ProgressDots />}
        {showSuccess && (
          <div className="flex flex-col gap-4">
            {successMessages.map((message) => (
              <p key={message} className="text-size-sm text-[#666C80]">
                {message}
              </p>
            ))}
          </div>
        )}
        {!loading && !courseLoading && !showSuccess && (
        <>
          {isManualRequest && (
            <div className="text-size-sm text-[#666C80] mb-4">
              We're keen for you to request manual switches where necessary to attend group discussions.
              However, because they do take time for us to process we expect you to have made a sincere
              effort to make your original discussion group and consider others available on the last screen.
            </div>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <label htmlFor="switchType" className="block text-size-xs text-[#666C80]">Action</label>
              <select
                id="switchType"
                value={switchType}
                onChange={(e) => setSwitchType(e.target.value as typeof switchType)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
              >
                {SWITCH_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {isTemporarySwitch && (
            <div className="flex flex-col gap-0.5">
              <label htmlFor="switchType" className="block text-size-xs text-[#666C80]">Unit</label>
              <select
                id="unitSelect"
                value={selectedUnitNumber}
                onChange={(e) => setSelectedUnitNumber(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
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
                <label htmlFor="reason" className="text-size-sm font-medium text-[#00114D]">Tell us why you're making this change.*</label>
                <p className="text-size-xs text-[#666C80]">
                  Participants who stick with their group usually have a better experience on the course.
                </p>
              </div>
              <textarea
                id="reason"
                placeholder="Share your reason here"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 min-h-[80px] focus:border-blue-500"
                required
              />
            </div>

            {!isManualRequest && (
            <div className="flex flex-col gap-2">
              <label htmlFor="targetSelect" className="block text-size-sm font-medium text-[#00114D]">
                {isTemporarySwitch ? 'Select new discussion' : 'Select new group'}
              </label>
              {currentInfo && (
                <div className="flex flex-col gap-2">
                  <GroupInfo date={currentInfo.date || new Date()} groupName={currentInfo.name} subText={currentInfo.subText} />
                  {/* TODO: there are n remaining time slots */}
                  <hr />
                </div>
              )}
              {isTemporarySwitch && (
              <select
                id="targetSelect"
                value={selectedDiscussionId}
                onChange={(e) => setSelectedDiscussionId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
                required
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
                <ul className="flex flex-col gap-2">
                  {newGroups.map((group) => {
                    return (
                      <li key={group.group.id} className="list-none">
                        <div className={cn('flex items-center rounded-xl outline-[0.5px] outline-stone-300', selectedGroupId === group.group.id && 'bg-[#F2F6FF]')}>
                          <button type="button" className="flex-1 cursor-pointer hover:enabled:bg-[#F2F6FF] disabled:opacity-50 disabled:cursor-not-allowed" onClick={() => { setSelectedGroupId(group.group.id); }} aria-pressed={selectedGroupId === group.group.id} disabled={group.spotsLeft === 0}>
                            <GroupInfo date={new Date((group.nextDiscussionStartDateTime || Date.now()) * 1000)} subText={getGroupSubtext(group)} groupName={group.group.groupName || ''} isActive={selectedGroupId === group.group.id} />
                          </button>
                          {selectedGroupId === group.group.id && (
                            <CTALinkOrButton onClick={handleSubmit} className="rounded-md m-2">
                              Confirm
                            </CTALinkOrButton>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            )}

            <div className="flex gap-2 justify-end">
              <CTALinkOrButton
                variant="secondary"
                onClick={handleClose}
                aria-label="Cancel group switching"
              >
                Cancel
              </CTALinkOrButton>
              <CTALinkOrButton
                onClick={handleSubmit}
                disabled={submitDisabled}
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

type GroupInfoProps = {
  date: Date;
  subText?: React.ReactNode;
  groupName: string;
  isActive?: boolean;
};

const GroupInfo = ({
  date, groupName, isActive = false, subText,
}: GroupInfoProps) => {
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="flex items-center gap-4 p-2.5">
      <div className="flex flex-col items-center rounded-md px-3 py-1.5">
        <div className="text-size-sm leading-snug font-medium text-blue-950">{day}</div>
        <div className={cn('text-[12px] leading-none font-medium text-[#666C80]', isActive && 'text-[#0037FF]')}>{time}</div>
      </div>
      <div className="flex flex-1 flex-col items-start">
        <div className="text-size-sm mb-1 leading-snug font-semibold text-blue-950">{groupName}</div>
        {subText}
      </div>
    </div>
  );
};

export default GroupSwitchModal;
