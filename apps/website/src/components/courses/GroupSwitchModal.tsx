import React, {
  useState, useMemo, useCallback,
  useEffect,
} from 'react';
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
import { twMerge } from 'tailwind-merge';
import useAxios from 'axios-hooks';
import { FaChevronDown, FaCheck } from 'react-icons/fa6';
import clsx from 'clsx';
import { Course, Unit } from '@bluedot/db';
import { GetGroupSwitchingAvailableResponse } from '../../pages/api/courses/[courseSlug]/group-switching/available';
import { GroupSwitchingRequest, GroupSwitchingResponse } from '../../pages/api/courses/[courseSlug]/group-switching';
import { getDiscussionTimeDisplayStrings } from '../../lib/utils';

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

const getGMTOffsetWithCity = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = Math.abs(offsetMinutes) / 60;
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  const offsetFormatted = `${offsetSign}${Math.floor(offsetHours).toString().padStart(2, '0')}:${(Math.abs(offsetMinutes) % 60).toString().padStart(2, '0')}`;
  const cityName = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
  return `(GMT ${offsetFormatted}) ${cityName}`;
};

const getGroupSwitchDescription = ({
  userIsParticipant = false,
  isSelected,
  isTemporarySwitch,
  selectedUnitNumber,
}: {
  userIsParticipant?: boolean;
  isSelected: boolean;
  isTemporarySwitch: boolean;
  selectedUnitNumber?: string;
}): React.ReactNode => {
  if (isTemporarySwitch) {
    if (userIsParticipant) {
      return isSelected
        ? <span className="text-[#0037FF]">You are attending this discussion</span>
        : <span>You are switching out of this discussion</span>;
    }

    if (isSelected && selectedUnitNumber !== undefined) {
      return <span className="text-[#0037FF]">You are joining this group for Unit {selectedUnitNumber}</span>;
    }

    return undefined;
  }

  // For permanent switches
  if (userIsParticipant) {
    return isSelected
      ? <span className="text-[#0037FF]">You are currently in this group</span>
      : <span>You are switching out of this group for all upcoming units</span>;
  }

  if (isSelected) {
    return <span className="text-[#0037FF]">You are switching into this group for all upcoming units</span>;
  }

  return undefined;
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

  const getCurrentDiscussionInfo = useCallback((): GroupSwitchOptionProps | null => {
    if (isTemporarySwitch && oldDiscussion) {
      return {
        id: oldDiscussion.discussion.id,
        groupName: oldDiscussion.groupName,
        dateTime: oldDiscussion.discussion.startDateTime,
        spotsLeft: null,
        description: getGroupSwitchDescription({
          userIsParticipant: true,
          isSelected: !selectedDiscussionId,
          isTemporarySwitch,
          selectedUnitNumber,
        }),
        userIsParticipant: true,
      };
    }
    if (!isTemporarySwitch && oldGroup) {
      // For permanent switch, show next upcoming discussion time
      return {
        id: oldGroup.group.id,
        groupName: oldGroup.group.groupName ?? 'Group [Unknown]',
        dateTime: oldGroup.nextDiscussionStartDateTime,
        spotsLeft: null,
        description: getGroupSwitchDescription({
          userIsParticipant: true,
          isSelected: !selectedGroupId,
          isTemporarySwitch,
          selectedUnitNumber,
        }),
        userIsParticipant: true,
      };
    }

    return null;
  }, [isTemporarySwitch, oldDiscussion, oldGroup, selectedDiscussionId, selectedGroupId]);

  const currentInfo = getCurrentDiscussionInfo();

  const isSubmitDisabled = isSubmitting || !((isTemporarySwitch ? selectedDiscussionId : selectedGroupId) || isManualRequest) || !reason.trim();

  useEffect(() => {
    setSelectedDiscussionId('');
    setSelectedGroupId('');
  }, [switchType]);

  useEffect(() => {
    setSelectedDiscussionId('');
  }, [selectedUnitNumber]);

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;

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

  const groupOptions: GroupSwitchOptionProps[] = groups
    .filter((g) => !g.userIsParticipant)
    .map((g) => {
      const isSelected = selectedGroupId === g.group.id;
      return {
        id: g.group.id,
        groupName: g.group.groupName ?? 'Group [Unknown]',
        dateTime: g.nextDiscussionStartDateTime,
        spotsLeft: g.spotsLeft,
        isSelected,
        description: getGroupSwitchDescription({
          isSelected,
          isTemporarySwitch: false,
          selectedUnitNumber,
        }),
        onSelect: () => setSelectedGroupId(g.group.id),
        onConfirm: handleSubmit,
        canSubmit: !isSubmitDisabled,
        isSubmitting,
      };
    });

  const discussionOptions: GroupSwitchOptionProps[] = discussions
    .filter((d) => !d.userIsParticipant)
    .map((d) => {
      const isSelected = selectedDiscussionId === d.discussion.id;
      return {
        id: d.discussion.id,
        groupName: d.groupName,
        dateTime: d.discussion.startDateTime,
        spotsLeft: d.spotsLeft,
        isSelected,
        description: getGroupSwitchDescription({
          isSelected,
          isTemporarySwitch: true,
          selectedUnitNumber,
        }),
        onSelect: () => setSelectedDiscussionId(d.discussion.id),
        onConfirm: handleSubmit,
        canSubmit: !isSubmitDisabled,
        isSubmitting,
      };
    });

  const groupSwitchOptions = isTemporarySwitch ? discussionOptions : groupOptions;

  const alternativeCount = groupSwitchOptions.filter((op) => !(op.spotsLeft !== null && op.spotsLeft <= 0)).length;
  const alternativeCountMessage = isTemporarySwitch
    ? `There ${alternativeCount === 1 ? 'is' : 'are'} ${alternativeCount} alternative time slot${alternativeCount === 1 ? '' : 's'} available for this discussion`
    : `There ${alternativeCount === 1 ? 'is' : 'are'} ${alternativeCount} alternative group${alternativeCount === 1 ? '' : 's'} available`;

  const timezoneMessage = `Times are in your time zone: ${getGMTOffsetWithCity()}`;

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
        <form className="flex flex-col gap-5">
          {isManualRequest && (
            <div className="text-size-sm text-[#666C80]">
              We're keen for you to request manual switches where necessary to attend group discussions.
              However, because they do take time for us to process we expect you to have made a sincere
              effort to make your original discussion group and consider others available on the previous screen.
            </div>
          )}
          <Select
            label="Action"
            value={switchType}
            onChange={(value) => setSwitchType(value as SwitchType)}
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
              <div className="flex flex-col gap-2">
                <label htmlFor="reason" className="text-size-sm font-medium text-[#00114D]">Tell us why you're making this change.*</label>
                <p id="reason-description" className="text-size-xs text-[#666C80]">
                  Participants who stick with their group usually have a better experience on the course.
                </p>
              </div>
              <textarea
                id="reason"
                placeholder="Share your reason here"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border border-color-divider rounded-lg px-3 py-2 min-h-[80px] bg-white"
                required
                aria-describedby="reason-description"
                aria-label="Reason for group switch request"
              />
            </div>
          </div>
          {!isManualRequest && (
            <>
              <div className="h-px bg-color-divider" />
              <div className="flex flex-col gap-2">
                <div className="block text-size-sm font-medium">
                  Select a group
                </div>
                {currentInfo && (
                  <GroupSwitchOption {...currentInfo} />
                )}
                <p className="text-size-xs text-[#666C80]">
                  {alternativeCountMessage}
                </p>
                <p className="text-size-xs text-[#666C80]">
                  {timezoneMessage}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {groupSwitchOptions.map((option) => (
                  <GroupSwitchOption key={option.id} {...option} />
                ))}
              </div>
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
            </>
          )}

          {isManualRequest && (
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
                disabled={isSubmitDisabled}
                aria-label={isSubmitting ? 'Submitting group switch request' : 'Submit group switch request'}
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </CTALinkOrButton>
            </div>
          )}
        </form>
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
      aria-label={`Select ${label}`}
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

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="1em" height="1em" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10.5V9.5C10 8.96957 9.78929 8.46086 9.41421 8.08579C9.03914 7.71071 8.53043 7.5 8 7.5H4C3.46957 7.5 2.96086 7.71071 2.58579 8.08579C2.21071 8.46086 2 8.96957 2 9.5V10.5M8 3.5C8 4.60457 7.10457 5.5 6 5.5C4.89543 5.5 4 4.60457 4 3.5C4 2.39543 4.89543 1.5 6 1.5C7.10457 1.5 8 2.39543 8 3.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type GroupSwitchOptionProps = {
  id?: string;
  groupName: string;
  dateTime: number | null;
  spotsLeft: number | null;
  description?: React.ReactNode;
  isSelected?: boolean;
  userIsParticipant?: boolean;
  onSelect?: () => void;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
};

const GroupSwitchOption: React.FC<GroupSwitchOptionProps> = ({
  groupName,
  dateTime,
  spotsLeft,
  description,
  isSelected,
  userIsParticipant,
  onSelect,
  onConfirm,
  isSubmitting,
  canSubmit,
}) => {
  const hasAnySpotsLeft = spotsLeft !== 0;
  const isDisabled = userIsParticipant || !hasAnySpotsLeft;

  const displayDateTimeStrings = useMemo(() => {
    if (!dateTime) return null;
    return getDiscussionTimeDisplayStrings(dateTime);
  }, [dateTime]);

  const getSpotsLeftText = () => {
    if (!hasAnySpotsLeft) return 'No spots left';
    if (spotsLeft === null) return 'Spots available';
    return `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`;
  };

  const spotsLeftText = getSpotsLeftText();

  const getClassNames = () => {
    const classNames = [];

    // Later classes have higher priority
    classNames.push('rounded-lg p-3 transition-all cursor-pointer border bg-white hover:bg-blue-50 border-gray-200 hover:border-gray-300');
    if (isSelected) classNames.push('border-[#0037FF] hover:border-[#0037FF] bg-blue-50');
    if (!hasAnySpotsLeft) classNames.push('opacity-50 cursor-not-allowed hover:bg-white');
    if (userIsParticipant) classNames.push('border-none bg-transparent hover:bg-transparent cursor-auto');

    return twMerge(...classNames);
  };

  return (
    <div
      className={getClassNames()}
      {...(!isDisabled && {
        onClick: onSelect,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target as HTMLElement;
            // Don't prevent default if focus is on the confirm button
            if (target?.tagName === 'BUTTON') {
              return;
            }
            e.preventDefault(); // Stop page from scrolling on space
            onSelect?.();
          }
        },
        tabIndex: 0,
        role: 'button',
        'aria-label': `Select ${groupName}`,
      })}
    >
      <div className="grid gap-4 grid-cols-[80px_1fr] items-end">
        <div className="text-center my-auto">
          {displayDateTimeStrings && (
            <>
              <div className="font-medium whitespace-nowrap mb-[3px] mt-px">{displayDateTimeStrings.startTimeDisplayDate}</div>
              <div className={clsx('text-size-xs whitespace-nowrap', isSelected ? 'text-[#0037FF]' : 'text-gray-500')}>{displayDateTimeStrings.startTimeDisplayTime}</div>
            </>
          )}
        </div>
        <div className="flex gap-4 justify-between">
          <div>
            <div className="font-semibold mb-[4px]">
              {groupName}
            </div>
            <div className="flex items-center gap-[6px] text-size-xs text-gray-500">
              {!description ? (
                <>
                  <UserIcon className="-translate-y-px" />
                  <span>{spotsLeftText}</span>
                </>
              ) : description}
            </div>
          </div>
          {isSelected && (
            <CTALinkOrButton
              onClick={(e) => {
                e.stopPropagation(); // Avoid triggering parent onClick
                onConfirm?.();
              }}
              disabled={isDisabled || !canSubmit || isSubmitting}
              aria-label={`Confirm selection of ${groupName}`}
              className="h-fit my-auto"
            >
              {isSubmitting ? '...' : 'Confirm'}
            </CTALinkOrButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSwitchModal;
