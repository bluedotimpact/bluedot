import type React from 'react';
import {
  useState, useMemo, useEffect,
} from 'react';
import {
  cn, ClickTarget, CTALinkOrButton,
  ErrorSection, Modal, ProgressDots,
  Select,
} from '@bluedot/ui';
import { FaArrowLeft, FaArrowRightArrowLeft } from 'react-icons/fa6';
import { ClockUserIcon } from '../icons/ClockUserIcon';
import { UserIcon } from '../icons/UserIcon';
import { formatTime12HourClock, formatDateMonthAndDay, formatDateDayOfWeek } from '../../lib/utils';
import { trpc } from '../../utils/trpc';

export type GroupSwitchModalProps = {
  handleClose: () => void;
  initialUnitNumber?: string;
  initialSwitchType?: SwitchType;
  courseSlug: string;
};

type FormSection = {
  id: string;
  isVisible: boolean;
  title: string;
  subtitle?: React.ReactNode;
  control: React.ReactNode;
};

// eslint-disable-next-line react/function-component-definition
export default function GroupSwitchModal({
  handleClose,
  courseSlug,
  initialUnitNumber = '1',
  initialSwitchType = 'Switch group for one unit',
}: GroupSwitchModalProps) {
  const [switchType, setSwitchType] = useState<SwitchType>(initialSwitchType);
  const [selectedUnitNumber, setSelectedUnitNumber] = useState(initialUnitNumber);
  const [reason, setReason] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedDiscussionId, setSelectedDiscussionId] = useState('');
  const [isManualRequest, setIsManualRequest] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasUpdatedAvailability, setHasUpdatedAvailability] = useState(false);

  const isTemporarySwitch = switchType === 'Switch group for one unit';

  const { data: user, error: userError } = trpc.users.getUser.useQuery();

  const { data: courseData, isLoading: isCourseLoading, error: courseError } = trpc.courses.getBySlug.useQuery({ courseSlug });

  const { data: availableGroupsAndDiscussions, isLoading: isDiscussionsLoading, error: discussionsError } = trpc.groupSwitching.discussionsAvailable.useQuery(
    { courseSlug },
    {
      // Disable once `showSuccess` is true, to avoid `selectedOption` (which displays on the success screen) being overwritten
      enabled: !showSuccess,
      refetchInterval: 30_000,
    },
  );

  const { data: courseRegistration } = trpc.courseRegistrations.getByCourseId.useQuery(
    { courseId: courseData?.course.id ?? '' },
    {
      enabled: !!courseData?.course.id,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  );

  const submitGroupSwitchMutation = trpc.groupSwitching.switchGroup.useMutation({
    onSuccess() {
      setShowSuccess(true);
    },
  });

  const isSubmitting = submitGroupSwitchMutation.isPending;
  const isLoading = isCourseLoading || isDiscussionsLoading;

  const groups = availableGroupsAndDiscussions?.groupsAvailable ?? [];
  const discussions = availableGroupsAndDiscussions?.discussionsAvailable?.[selectedUnitNumber] ?? [];

  const unitOptions = courseData?.units.map((u) => {
    const unitDiscussions = availableGroupsAndDiscussions?.discussionsAvailable?.[u.unitNumber];
    const hasAvailableDiscussions = unitDiscussions?.length;

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

  const formatCurrentDiscussionAsGroupSwitchOption = (): GroupSwitchOptionProps | null => {
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

  const currentDiscussionAsGroupSwitchOption = formatCurrentDiscussionAsGroupSwitchOption();

  const isSubmitDisabled = isSubmitting
    || (isManualRequest && !hasUpdatedAvailability)
    || (!isManualRequest && !(isTemporarySwitch ? selectedDiscussionId : selectedGroupId));

  useEffect(() => {
    setSelectedDiscussionId('');
    setSelectedGroupId('');
  }, [switchType]);

  useEffect(() => {
    setSelectedDiscussionId('');
  }, [selectedUnitNumber]);

  const handleSubmit = () => {
    if (isSubmitDisabled) {
      return;
    }

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
    const modalTitleClassName = 'text-size-md py-3 font-semibold mx-auto';

    if (isManualRequest && !showSuccess) {
      return (
        <div className="flex items-center w-full">
          <ClickTarget
            onClick={() => setIsManualRequest(false)}
            className="text-black rounded-[50%] p-[6px] hover:bg-gray-100 cursor-pointer"
            aria-label="Back to group selection"
          >
            <FaArrowLeft size={16} />
          </ClickTarget>
          <div className={cn(modalTitleClassName, 'md:pr-0 pr-6')}>Request manual switch</div>
        </div>
      );
    }

    if (isManualRequest && showSuccess) {
      return <div className={modalTitleClassName}>We are working on your request</div>;
    }

    if (showSuccess) {
      return <div className={modalTitleClassName}>Success</div>;
    }

    return (
      <Select
        value={switchType}
        onChange={(value) => setSwitchType(value as SwitchType)}
        options={SWITCH_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
        className="border-none text-size-md font-medium bg-transparent w-fit mx-auto [&>button]:px-6 [&>button]:py-3"
        ariaLabel="Select action"
      />
    );
  };

  const getSuccessMessage = () => {
    if (isManualRequest) {
      return <>We aim to process your request within 1-2 business days. Once your switch is complete, you will receive a calendar invitation and be added to your new group's Slack channel.</>;
    }

    return <>You <strong>will receive {isTemporarySwitch ? 'a calendar invite' : 'the calendar invites'} shortly</strong> and be added to the group's Slack channel.</>;
  };

  const groupOptions: GroupSwitchOptionProps[] = groups
    .filter((g) => !g.userIsParticipant)
    .map((g) => {
      const isSelected = selectedGroupId === g.group.id;
      return {
        id: g.group.id,
        groupName: g.group.groupName ?? 'Group [Unknown]',
        dateTime: g.group.startTimeUtc,
        isDisabled: g.spotsLeftIfKnown === 0,
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
        isDisabled: d.spotsLeftIfKnown === 0,
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

  const formSections: FormSection[] = [
    {
      id: 'switch-type',
      isVisible: isManualRequest,
      title: 'What are you switching?',
      control: (
        <Select
          value={switchType}
          onChange={(value) => setSwitchType(value as SwitchType)}
          options={SWITCH_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
          ariaLabel="Select action"
        />
      ),
    },
    {
      id: 'unit-selector',
      isVisible: isTemporarySwitch,
      title: 'Select unit to switch group discussion slot',
      control: (
        <Select
          value={selectedUnitNumber}
          onChange={(value) => setSelectedUnitNumber(value)}
          options={unitOptions}
          placeholder="Select a unit"
          ariaLabel="Select unit"
        />
      ),
    },
    {
      id: 'reason',
      isVisible: true,
      title: 'Tell us why you\'re making this change',
      subtitle: 'Participants who stick with their group usually have a better experience on the course.',
      control: (
        <textarea
          placeholder="Share your reason here..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="border border-color-divider rounded-lg px-3 py-2 min-h-[80px] bg-white"
          required
          aria-label="Reason for group switch request"
        />
      ),
    },
    {
      id: 'group-selection',
      isVisible: !isManualRequest,
      title: 'Select a group',
      control: (
        <div className="flex flex-col gap-2">
          {currentDiscussionAsGroupSwitchOption && <GroupSwitchOption {...currentDiscussionAsGroupSwitchOption} />}
          <p className="text-size-xs mt-1 text-[#666C80]">{alternativeCountMessage}</p>
          <p className="text-size-xs text-[#666C80]">Times are in your time zone: {getGMTOffsetWithCity()}</p>
          <div className="flex flex-col gap-2 mt-2">
            {groupSwitchOptions.map((option) => (
              <GroupSwitchOption key={option.id} {...option} />
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'availability',
      isVisible: !!user && isManualRequest,
      title: 'Update availability (required)',
      subtitle: user ? (
        <>
          To help us assign you to a group which best suits you, {' '}
          <a
            href={buildAvailabilityFormUrl({
              email: user.email,
              utmSource: 'bluedot-group-switch-modal',
              courseRegistration,
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              roundId: courseRegistration?.roundId || '',
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-bluedot-normal underline"
          >
            please update your availability
          </a>
          .
        </>
      ) : undefined,
      control: (
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={hasUpdatedAvailability}
            onChange={(e) => setHasUpdatedAvailability(e.target.checked)}
            className="size-4 rounded border-gray-300 text-bluedot-normal focus:ring-bluedot-normal cursor-pointer"
          />
          <span className="text-size-sm text-bluedot-navy">I have updated my availability</span>
        </label>
      ),
    },
  ];

  const visibleFormSections = formSections.filter((s) => s.isVisible);

  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleClose()}
      title={getModalTitle()}
      bottomDrawerOnMobile
      desktopHeaderClassName="border-b border-charcoal-light pt-3 pb-2 mb-0"
      ariaLabel="Group switching"
    >
      <div className="w-full pt-6 max-w-[600px]">
        {/* Spacer to stop the modal shrinking when there are no results */}
        <div className="w-[600px] max-w-full h-0" />
        {isLoading && <ProgressDots />}
        {submitGroupSwitchMutation.isError && <ErrorSection error={submitGroupSwitchMutation.error} />}
        {userError && <ErrorSection error={userError} />}
        {courseError && <ErrorSection error={courseError} />}
        {discussionsError && <ErrorSection error={discussionsError} />}
        {!isLoading && !showSuccess && (
          <form className="flex flex-col gap-8">
            {visibleFormSections.map((section, index) => (
              <div key={section.id} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <span className="text-size-sm font-medium text-bluedot-navy">{index + 1}. {section.title}</span>
                  {section.subtitle && (
                    <p className="text-size-xs text-[#666C80]">{section.subtitle}</p>
                  )}
                </div>
                {section.control}
              </div>
            ))}
            {isManualRequest && (
              <CTALinkOrButton
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                aria-label={isSubmitting ? 'Submitting group switch request' : 'Submit group switch request'}
              >
                {isSubmitting ? 'Submitting...' : 'Request Manual Switch'}
              </CTALinkOrButton>
            )}
          </form>
        )}
        {!isLoading && !showSuccess && !isManualRequest && (
          <div className="border-t border-color-divider pt-8 mt-8 mb-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <h3 className="text-size-sm font-medium text-bluedot-navy">Don't see a group that works?</h3>
                <p className="text-size-xs text-[#666C80]">
                  You can request a manual switch to join a group that's full or a group that is not
                  listed above, and we'll do our best to accommodate you.
                </p>
              </div>
              <CTALinkOrButton
                variant="secondary"
                className="border-bluedot-navy text-bluedot-navy hover:bg-blue-50"
                onClick={() => setIsManualRequest(true)}
                aria-label="Request manual group switch"
              >
                Request manual switch
              </CTALinkOrButton>
            </div>
          </div>
        )}
        {showSuccess && (
          <div className="flex items-center flex-col gap-4">
            {!isManualRequest && selectedOption && (
              <GroupSwitchOption {...selectedOption} userIsParticipant />
            )}
            <p className="text-size-sm text-center max-w-[500px] text-[#666C80]">
              {getSuccessMessage()}
            </p>
            <CTALinkOrButton
              className="w-full mt-4"
              onClick={handleClose}
            >
              Close
            </CTALinkOrButton>
          </div>
        )}
      </div>
    </Modal>
  );
}

const SWITCH_TYPE_OPTIONS = [
  {
    value: 'Switch group for one unit',
    label: <span className="grid grid-cols-[20px_1fr] gap-2 items-center"><ClockUserIcon className="mx-auto size-[22px] -translate-y-px" /> Switch group for one unit</span>,
  },
  {
    value: 'Switch group permanently',
    label: <span className="grid grid-cols-[20px_1fr] gap-2 items-center"><FaArrowRightArrowLeft className="mx-auto size-[14px]" /> Switch group permanently</span>,
  },
] as const;

export type SwitchType = (typeof SWITCH_TYPE_OPTIONS)[number]['value'];

const getGMTOffsetWithCity = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  const offsetHours = Math.abs(offsetMinutes) / 60;
  const offsetSign = offsetMinutes <= 0 ? '+' : '-';
  const offsetFormatted = `${offsetSign}${Math.floor(offsetHours).toString().padStart(2, '0')}:${(Math.abs(offsetMinutes) % 60).toString().padStart(2, '0')}`;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const cityName = timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
  return `(GMT ${offsetFormatted}) ${cityName}`;
};

export const buildAvailabilityFormUrl = ({
  email,
  utmSource,
  courseRegistration,
  roundId,
}: {
  email: string;
  utmSource: string;
  courseRegistration?: {
    availabilityIntervalsUTC?: string | null;
    availabilityTimezone?: string | null;
    availabilityComments?: string | null;
  } | null;
  roundId: string;
}): string => {
  const params = new URLSearchParams();
  params.set('email', email);
  params.set('utm_source', utmSource);
  params.set('roundId', roundId);

  const { availabilityIntervalsUTC, availabilityTimezone, availabilityComments } = courseRegistration ?? {};

  if (availabilityIntervalsUTC) {
    params.set('prefill_intervals', availabilityIntervalsUTC);
  }

  if (availabilityTimezone) {
    params.set('prefill_timezone', availabilityTimezone);
  }

  // Only include comments if they won't make the URL too long (2000 chars overall is generally considered safe)
  if (availabilityComments && availabilityComments.length <= 1500) {
    params.set('prefill_comment', availabilityComments);
  }

  return `https://availability.bluedot.org/form/bluedot-course?${params.toString()}`;
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
        ? <span className="text-bluedot-normal">You are attending this discussion</span>
        : <span>You are switching out of this discussion</span>;
    }

    if (isSelected && selectedUnitNumber !== undefined) {
      return <span className="text-bluedot-normal">You are joining this group for <strong>Unit {selectedUnitNumber}</strong></span>;
    }
  } else {
    if (userIsParticipant) {
      return isSelected
        ? <span className="text-bluedot-normal">You are currently in this group</span>
        : <span>You are switching out of this group for all upcoming units</span>;
    }

    if (isSelected) {
      return <span className="text-bluedot-normal">You are switching into this group for all upcoming units</span>;
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
    if (!dateTime) {
      return null;
    }

    return isRecurringTime ? formatDateDayOfWeek(dateTime) : formatDateMonthAndDay(dateTime);
  }, [dateTime, isRecurringTime]);

  const displayTime = useMemo(() => {
    if (!dateTime) {
      return null;
    }

    return formatTime12HourClock(dateTime);
  }, [dateTime]);

  return (
    <div
      className={cn(
        'rounded-lg p-3 transition-all cursor-pointer border bg-white hover:bg-blue-50 border-gray-200 hover:border-gray-300',
        isSelected && 'border-bluedot-normal hover:border-bluedot-normal bg-blue-50',
        isDisabled && !userIsParticipant && 'opacity-50 cursor-not-allowed hover:bg-white',
        userIsParticipant && 'border-none bg-transparent hover:bg-transparent cursor-auto',
      )}
      {...(!isDisabled && !userIsParticipant && {
        onClick: onSelect,
        onKeyDown(e: React.KeyboardEvent) {
          if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target as HTMLElement;
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
              <div className={`text-size-xs whitespace-nowrap ${isSelected ? 'text-bluedot-normal' : 'text-gray-500'}`}>{displayTime}</div>
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
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
