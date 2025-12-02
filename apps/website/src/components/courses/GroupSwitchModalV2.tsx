import React, {
  useState, useMemo,
  useEffect,
} from 'react';
import {
  cn,
  CTALinkOrButton, ErrorSection, Modal, ProgressDots, useAuthStore,
} from '@bluedot/ui';
import clsx from 'clsx';
import { formatTime12HourClock, formatDateMonthAndDay, formatDateDayOfWeek } from '../../lib/utils';
import { trpc } from '../../utils/trpc';
import Select from './group-switching/Select';

export type GroupSwitchModalProps = {
  handleClose: () => void;
  initialUnitNumber?: string;
  initialSwitchType?: SwitchType;
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

export const sortGroupSwitchOptions = (options: GroupSwitchOptionProps[]): GroupSwitchOptionProps[] => {
  return [...options].sort((a, b) => {
    // Sort enabled before disabled
    const disabledA = a.isDisabled ?? false;
    const disabledB = b.isDisabled ?? false;
    if (disabledA !== disabledB) {
      return disabledA ? 1 : -1;
    }

    // Sort by time ascending
    const timeAMs = (a.dateTime ?? 0) * 1000;
    const timeBMs = (b.dateTime ?? 0) * 1000;

    // For recurring times, consider only weekday and time of day in local timezone
    if (a.isRecurringTime && b.isRecurringTime) {
      const dateA = new Date(timeAMs);
      const dateB = new Date(timeBMs);

      // Convert to Monday-first week (Monday=0, Sunday=6)
      const dayA = (dateA.getDay() + 6) % 7;
      const dayB = (dateB.getDay() + 6) % 7;

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      const timeOfDayA = dateA.getHours() * 3600 + dateA.getMinutes() * 60 + dateA.getSeconds();
      const timeOfDayB = dateB.getHours() * 3600 + dateB.getMinutes() * 60 + dateB.getSeconds();
      return timeOfDayA - timeOfDayB;
    }

    // For non-recurring times, sort by absolute timestamp
    return timeAMs - timeBMs;
  });
};

const getGroupSwitchDescription = ({
  userIsParticipant = false,
  isSelected,
  isTemporarySwitch,
  selectedUnitNumber,
  spotsLeftIfKnown,
}: {
  userIsParticipant?: boolean;
  isSelected: boolean;
  isTemporarySwitch: boolean;
  selectedUnitNumber?: string;
  spotsLeftIfKnown: number | null;
}): React.ReactNode => {
  if (isTemporarySwitch) {
    if (userIsParticipant) {
      return isSelected
        ? <span className="text-[#0037FF]">You are attending this discussion</span>
        : <span>You are switching out of this discussion</span>;
    }

    if (isSelected && selectedUnitNumber !== undefined) {
      return <span className="text-[#0037FF]">You are joining this group for <strong>Unit {selectedUnitNumber}</strong></span>;
    }
  } else {
    if (userIsParticipant) {
      return isSelected
        ? <span className="text-[#0037FF]">You are currently in this group</span>
        : <span>You are switching out of this group for all upcoming units</span>;
    }

    if (isSelected) {
      return <span className="text-[#0037FF]">You are switching into this group for all upcoming units</span>;
    }
  }

  // Default: N spots left
  const hasAnySpotsLeft = spotsLeftIfKnown !== 0;
  if (!hasAnySpotsLeft) {
    return <><UserIcon className="-translate-y-px" /><span>No spots left</span></>;
  }
  if (spotsLeftIfKnown === null) {
    return <><UserIcon className="-translate-y-px" /><span>Spots available</span></>;
  }
  return <><UserIcon className="-translate-y-px" /><span>{spotsLeftIfKnown} spot{spotsLeftIfKnown === 1 ? '' : 's'} left</span></>;
};

const GroupSwitchModal: React.FC<GroupSwitchModalProps> = ({
  handleClose,
  courseSlug,
  initialUnitNumber = '1',
  initialSwitchType = 'Switch group for one unit',
}) => {
  const [switchType, setSwitchType] = useState<SwitchType>(initialSwitchType);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState(initialUnitNumber);
  const [reason, setReason] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState('');
  const [isManualRequest, setIsManualRequest] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isTemporarySwitch = switchType === 'Switch group for one unit';

  const auth = useAuthStore((s) => s.auth);

  const { data: courseData, isLoading: isCourseLoading, error: courseError } = trpc.courses.getBySlug.useQuery({ courseSlug });

  const { data: switchingData, isLoading: isDiscussionsLoading, error: discussionsError } = trpc.groupSwitching.discussionsAvailable.useQuery({ courseSlug });

  const submitGroupSwitchMutation = trpc.groupSwitching.switchGroup.useMutation({
    onSuccess: () => {
      setShowSuccess(true);
    },
  });

  const isSubmitting = submitGroupSwitchMutation.isPending;

  const groups = switchingData?.groupsAvailable ?? [];
  const discussions = switchingData?.discussionsAvailable?.[selectedUnitNumber] ?? [];

  const unitOptions = courseData?.units.map((u) => {
    const unitDiscussions = switchingData?.discussionsAvailable?.[u.unitNumber];
    const hasAvailableDiscussions = unitDiscussions?.some((d) => !d.hasStarted);

    return {
      value: u.unitNumber.toString(),
      label: `Unit ${u.unitNumber}: ${u.title}${!hasAvailableDiscussions ? ' (no upcoming discussions)' : ''}`,
      disabled: !isManualRequest && !hasAvailableDiscussions,
    };
  }) ?? [];

  // Note: There are cases of people being in multiple discussions per unit, and there may be
  // people in multiple groups too. We're not explicitly supporting that case at the moment, but
  // we do at least display the group/discussion the user is switching out of so that
  // they can notice and request manual support.
  const oldGroup = groups.find((g) => g.userIsParticipant);
  const oldDiscussion = discussions.find((d) => d.userIsParticipant);

  const getCurrentDiscussionInfo = (): GroupSwitchOptionProps | null => {
    if (isTemporarySwitch && oldDiscussion) {
      return {
        id: oldDiscussion.discussion.id,
        groupName: oldDiscussion.groupName,
        dateTime: oldDiscussion.discussion.startDateTime,
        description: getGroupSwitchDescription({
          userIsParticipant: true,
          isSelected: !selectedDiscussionId,
          isTemporarySwitch,
          selectedUnitNumber,
          spotsLeftIfKnown: null,
        }),
        userIsParticipant: true,
      };
    }
    if (!isTemporarySwitch && oldGroup) {
      // For permanent switch, show recurring discussion time
      return {
        id: oldGroup.group.id,
        groupName: oldGroup.group.groupName ?? 'Group [Unknown]',
        dateTime: oldGroup.group.startTimeUtc,
        description: getGroupSwitchDescription({
          userIsParticipant: true,
          isSelected: !selectedGroupId,
          isTemporarySwitch,
          selectedUnitNumber,
          spotsLeftIfKnown: null,
        }),
        userIsParticipant: true,
        isRecurringTime: true,
      };
    }

    return null;
  };

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

    const oldGroupId = !isTemporarySwitch ? oldGroup?.group.id : undefined;
    const newGroupId = !isTemporarySwitch && !isManualRequest ? selectedGroupId : undefined;
    const oldDiscussionId = isTemporarySwitch ? oldDiscussion?.discussion.id : undefined;
    const newDiscussionId = isTemporarySwitch && !isManualRequest ? selectedDiscussionId : undefined;

    submitGroupSwitchMutation.mutate({
      switchType,
      notesFromParticipant: reason,
      isManualRequest,
      oldGroupId,
      newGroupId,
      oldDiscussionId,
      newDiscussionId,
      courseSlug,
    });
  };

  const getModalTitle = () => {
    if (isManualRequest) {
      return !showSuccess ? 'Request manual switch' : (
        <div className="flex items-center gap-3">
          <SendIcon />
          <span>We are working on your request</span>
        </div>
      );
    }
    if (showSuccess) {
      return (
        <div className="flex items-center gap-3">
          <SuccessIcon />
          <span>Success!</span>
        </div>
      );
    }
    return (
      <Select
        value={switchType}
        onChange={(value) => setSwitchType(value as SwitchType)}
        options={SWITCH_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
        className="border-none w-fit mx-auto"
      />
    );
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
        dateTime: g.group.startTimeUtc,
        isDisabled: g.spotsLeftIfKnown === 0 || g.allDiscussionsHaveStarted,
        isSelected,
        isRecurringTime: true,
        description: getGroupSwitchDescription({
          isSelected,
          isTemporarySwitch: false,
          selectedUnitNumber,
          spotsLeftIfKnown: g.spotsLeftIfKnown,
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
        isDisabled: d.spotsLeftIfKnown === 0 || d.hasStarted,
        isSelected,
        description: getGroupSwitchDescription({
          isSelected,
          isTemporarySwitch: true,
          selectedUnitNumber,
          spotsLeftIfKnown: d.spotsLeftIfKnown,
        }),
        onSelect: () => setSelectedDiscussionId(d.discussion.id),
        onConfirm: handleSubmit,
        canSubmit: !isSubmitDisabled,
        isSubmitting,
      };
    });

  const groupSwitchOptions = sortGroupSwitchOptions(isTemporarySwitch ? discussionOptions : groupOptions);
  const selectedOption = groupSwitchOptions.find((op) => op.isSelected);

  const alternativeCount = groupSwitchOptions.filter((op) => !op.isDisabled).length;
  const alternativeCountMessage = isTemporarySwitch
    ? `There ${alternativeCount === 1 ? 'is' : 'are'} ${alternativeCount} alternative time slot${alternativeCount === 1 ? '' : 's'} available for this discussion`
    : `There ${alternativeCount === 1 ? 'is' : 'are'} ${alternativeCount} alternative group${alternativeCount === 1 ? '' : 's'} available`;

  const timezoneMessage = `Times are in your time zone: ${getGMTOffsetWithCity()}`;

  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleClose()}
      title={title}
      bottomDrawerOnMobile
      ariaLabel="Group switching"
    >
      <div className="w-full max-w-[600px]">
        {(isDiscussionsLoading || isCourseLoading) && <ProgressDots />}
        {submitGroupSwitchMutation.isError && <ErrorSection error={submitGroupSwitchMutation.error} />}
        {courseError && <ErrorSection error={courseError} />}
        {discussionsError && <ErrorSection error={discussionsError} />}
        {showSuccess && (
          <div className="flex flex-col gap-4">
            {!isManualRequest && selectedOption && (
              <GroupSwitchOption {...selectedOption} userIsParticipant />
            )}
            {successMessages.map((message) => (
              <p key={message} className="text-size-sm text-[#666C80]">
                {message}
              </p>
            ))}
          </div>
        )}
        {!isDiscussionsLoading && !isCourseLoading && !showSuccess && (
        <form className="flex flex-col gap-5">
          {isManualRequest && (
            <div className="text-size-sm text-[#666C80]">
              We're keen for you to request manual switches where necessary to attend group discussions.
              However, because they do take time for us to process we expect you to have made a sincere
              effort to make your original discussion group and consider others available on the previous screen.
            </div>
          )}
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
                <div className="block text-size-sm font-medium text-[#00114D]">
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
            <>
              {auth?.email && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-size-sm font-medium text-[#00114D]">Update your availability</h3>
                  <p className="text-size-xs text-[#666C80]">
                    This helps us assign you to a group which best suits you. Then, return here to click "Submit".
                  </p>
                  <CTALinkOrButton
                    variant="secondary"
                    className="mx-auto"
                    target="_blank"
                    rel="noopener noreferrer"
                    url={`https://availability.bluedot.org/form/bluedot-course?email=${encodeURIComponent(auth.email)}&utm_source=bluedot-group-switch-modal`}
                    aria-label="Update availability (open in new tab)"
                  >
                    Update availability
                  </CTALinkOrButton>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <CTALinkOrButton
                  className="mx-auto"
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  aria-label={isSubmitting ? 'Submitting group switch request' : 'Submit group switch request'}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </CTALinkOrButton>
              </div>
            </>
          )}
        </form>
        )}
      </div>
    </Modal>
  );
};

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="1em" height="1em" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 10.5V9.5C10 8.96957 9.78929 8.46086 9.41421 8.08579C9.03914 7.71071 8.53043 7.5 8 7.5H4C3.46957 7.5 2.96086 7.71071 2.58579 8.08579C2.21071 8.46086 2 8.96957 2 9.5V10.5M8 3.5C8 4.60457 7.10457 5.5 6 5.5C4.89543 5.5 4 4.60457 4 3.5C4 2.39543 4.89543 1.5 6 1.5C7.10457 1.5 8 2.39543 8 3.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SuccessIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="12" fill="#0037FF" />
    <path d="M16 9L10.6496 14.3504C10.567 14.433 10.433 14.433 10.3504 14.3504L8 12" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const SendIcon = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="12" fill="#0037FF" />
    <path d="M17 7L11.5 12.5M17 7L13.5 17L11.5 12.5M17 7L7 10.5L11.5 12.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type GroupSwitchOptionProps = {
  id?: string;
  groupName: string;
  dateTime: number | null;
  isDisabled?: boolean;
  description: React.ReactNode;
  isSelected?: boolean;
  userIsParticipant?: boolean;
  isRecurringTime?: boolean;
  onSelect?: () => void;
  onConfirm?: () => void;
  isSubmitting?: boolean;
  canSubmit?: boolean;
};

const GroupSwitchOption: React.FC<GroupSwitchOptionProps> = ({
  groupName,
  dateTime,
  isDisabled,
  description,
  isSelected,
  userIsParticipant,
  isRecurringTime,
  onSelect,
  onConfirm,
  isSubmitting,
  canSubmit,
}) => {
  const displayDate = useMemo(() => {
    if (!dateTime) return null;
    return isRecurringTime ? formatDateDayOfWeek(dateTime) : formatDateMonthAndDay(dateTime);
  }, [dateTime, isRecurringTime]);

  const displayTime = useMemo(() => {
    if (!dateTime) return null;
    return formatTime12HourClock(dateTime);
  }, [dateTime]);

  const getClassNames = () => {
    const classNames = [];

    // Later classes have higher priority
    classNames.push('rounded-lg p-3 transition-all cursor-pointer border bg-white hover:bg-blue-50 border-gray-200 hover:border-gray-300');
    if (isSelected) classNames.push('border-[#0037FF] hover:border-[#0037FF] bg-blue-50');
    if (isDisabled && !userIsParticipant) classNames.push('opacity-50 cursor-not-allowed hover:bg-white');
    if (userIsParticipant) classNames.push('border-none bg-transparent hover:bg-transparent cursor-auto');

    return cn(...classNames);
  };

  return (
    <div
      className={getClassNames()}
      {...(!isDisabled && !userIsParticipant && {
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
          {displayDate && displayTime && (
            <>
              <div className="font-medium whitespace-nowrap mb-[3px] mt-px">{displayDate}</div>
              <div className={clsx('text-size-xs whitespace-nowrap', isSelected ? 'text-[#0037FF]' : 'text-gray-500')}>{displayTime}</div>
            </>
          )}
        </div>
        <div className="flex gap-4 justify-between">
          <div>
            <div className="font-semibold mb-[4px]">
              {groupName}
            </div>
            <div className="flex items-center gap-[6px] text-size-xs text-gray-500">
              {description}
            </div>
          </div>
          {isSelected && !userIsParticipant && (
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
