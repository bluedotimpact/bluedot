import React, {
  useState, useMemo, useCallback,
} from 'react';
import {
  InferSelectModel,
  unitTable,
  courseTable,
} from '@bluedot/db';
import {
  CTALinkOrButton, ErrorSection, Modal, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Select as AriaSelect,
} from 'react-aria-components';
import useAxios from 'axios-hooks';
import { FaChevronDown, FaCheck } from 'react-icons/fa6';
import { GetGroupSwitchingAvailableResponse } from '../../pages/api/courses/[courseSlug]/group-switching/available';
import { GroupSwitchingRequest, GroupSwitchingResponse } from '../../pages/api/courses/[courseSlug]/group-switching';

type Unit = InferSelectModel<typeof unitTable.pg>;
type Course = InferSelectModel<typeof courseTable.pg>;

// TODO:
// 0. [x] Implement mobile "slide up from bottom" design, see if it is possible to make Modal do this generically (I have seen this somewhere)
//   a. [x] Put this up as a separate PR if possible
// 1. [x] Improve styling of selects, otherwise leave as they are (don't implement expanding selects, bid against this in the PR)
// 2. [x] Improve the styling of the textarea
//   a. Skipped until we have a common textarea component
// 3. [ ] Build out these components (for divide-and-conquer reasons, can later be ported inline again):
//   a. [ ] CurrentGroupInfo
//   b. [ ] DiscussionListItem, which can later be reused in CourseDetails/the future course settings page. Pull out from renderDiscussionItem
//      in CourseDetails if possible
// 4. [ ] Add "Update your availability" to the manual switch view, overall update to match designs
// 5. [ ] Update success view to match designs

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
  const [error, setError] = useState<unknown | undefined>();
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

  const groups = switchingData?.groupsAvailable ?? [];
  const discussions = switchingData?.discussionsAvailable?.[selectedUnitNumber] ?? [];

  // Note: There are cases of people being in multiple discussions per unit, and there may be
  // people in multiple groups too. We're not explicitly supporting that case at the moment, but
  // we do at least display the group/discussion the user is switching out of so that
  // they can notice and request manual support.
  const oldGroup = groups.find((g) => g.userIsParticipant);
  const oldDiscussion = discussions.find((d) => d.userIsParticipant);

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
      label: `${d.groupName} - ${formatDiscussionDateTime(d.discussion.startDateTime)}${d.spotsLeft !== null ? ` (${d.spotsLeft} spots left)` : ''}`,
      disabled: d.spotsLeft !== null && d.spotsLeft <= 0,
    }));

  const getCurrentDiscussionInfo = useCallback(() => {
    if (isTemporarySwitch && oldDiscussion) {
      return {
        name: oldDiscussion.groupName,
        time: formatDiscussionDateTime(oldDiscussion.discussion.startDateTime),
      };
    }
    if (!isTemporarySwitch && oldGroup) {
      // For permanent switch, show next upcoming discussion time
      const nextTime = oldGroup.nextDiscussionStartDateTime;
      return {
        name: oldGroup.group.groupName || `Group ${oldGroup.group.id}`,
        time: nextTime ? formatDiscussionDateTime(nextTime) : 'No upcoming discussions',
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
        setError(undefined);
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (e) {
      setError(e);
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
    <Modal isOpen setIsOpen={(open: boolean) => !open && handleClose()} title={title} bottomDrawerOnMobile>
      <div className="w-full max-w-[600px]">
        {(loading || courseLoading) && <ProgressDots />}
        {!!error && <ErrorSection error={error} />}
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
            <Select
              label="Action"
              value={switchType}
              onChange={(value) => setSwitchType(value as typeof switchType)}
              options={SWITCH_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            />

            {isTemporarySwitch && (
            <Select
              label="Unit"
              value={selectedUnitNumber}
              onChange={(value) => setSelectedUnitNumber(value)}
              options={unitOptions}
              placeholder="Select a unit"
            />
            )}

            <div className="flex flex-col gap-2">
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
                className="border border-color-divider rounded-lg px-3 py-2 min-h-[80px]"
                required
              />
            </div>

            {/* TODO probably add on to the section eventually */}
            <div className="h-px bg-color-divider my-4" />

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
            <div className="border-t border-color-divider pt-4">
              <div className="flex flex-col gap-2">
                <h3 className="text-size-sm font-medium text-[#00114D]">Don't see a group that works?</h3>
                <p className="text-size-xs text-[#666C80]">
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

type SelectProps = {
  label: string;
  options: { value: string; label: string; disabled?: boolean }[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
};

const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((op) => op.value === value);

  const handleSelectionChange = (key: React.Key | null) => {
    if (key !== null) {
      onChange?.(key as string);
      setIsOpen(false);
    }
  };

  return (
    <AriaSelect
      selectedKey={value}
      onSelectionChange={handleSelectionChange}
      className="w-full flex flex-col bg-white border border-color-divider rounded-lg transition-all"
    >
      <Button
        className="w-full flex border-none justify-between px-4 py-3 items-center cursor-pointer text-left"
        onPress={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <Label className="text-size-xs font-medium text-gray-500 flex-shrink-0">
            {label}
          </Label>
          {!isOpen && (
            <div className="text-size-sm text-gray-900">
              {selectedOption?.label || value || placeholder}
            </div>
          )}
        </div>
        <FaChevronDown
          className={`size-3 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </Button>
      {isOpen && (
        <ListBox className="flex flex-col px-4 pb-3 gap-1 max-h-60 overflow-y-auto outline-none">
          {options.map((option) => (
            <ListBoxItem
              key={option.value}
              id={option.value}
              textValue={option.label}
              isDisabled={option.disabled}
              className="px-3 py-2 gap-3 text-size-sm rounded cursor-pointer transition-colors hover:bg-gray-50 focus:bg-blue-50 focus:text-blue-900 selected:bg-gray-100 selected:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed outline-none flex items-center"
            >
              <span>{option.label}</span>
              {option.value === value && (
                <FaCheck className="size-3 text-blue-600" aria-hidden="true" />
              )}
            </ListBoxItem>
          ))}
        </ListBox>
      )}
    </AriaSelect>
  );
};

export default GroupSwitchModal;
