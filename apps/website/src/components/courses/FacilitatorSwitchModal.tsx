import {
  CTALinkOrButton,
  DatePicker,
  H1,
  Modal,
  P,
  ProgressDots,
  Select,
  TimePicker,
  useCurrentTimeMs,
} from '@bluedot/ui';
import { useState } from 'react';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import { trpc } from '../../utils/trpc';
import { CheckIcon } from '../icons/CheckIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { InfoIcon } from '../icons/InfoIcon';

const SWITCH_OPTIONS = [
  { value: 'Change for one unit', label: 'Change for one unit' },
  { value: 'Change permanently', label: 'Change permanently' },
] as const;

export type SwitchType = (typeof SWITCH_OPTIONS)[number]['value'];

export type FacilitatorSwitchModalProps = {
  handleClose: () => void;
  courseSlug: string;
  initialDiscussion: GroupDiscussion | null;
  allDiscussions?: GroupDiscussion[];
};

const FacilitatorSwitchModal: React.FC<FacilitatorSwitchModalProps> = ({
  handleClose,
  courseSlug,
  initialDiscussion,
  allDiscussions,
}) => {
  const [switchType, setSwitchType] = useState<SwitchType | undefined>('Change for one unit');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(initialDiscussion?.group);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | undefined>(initialDiscussion?.id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(undefined);

  const currentTimeMs = useCurrentTimeMs();
  const submitUpdateMutation = trpc.facilitators.updateDiscussion.useMutation();

  const { groupOptions, discussionOptionsByGroup } = buildOptions(allDiscussions ?? [], currentTimeMs);

  const discussionOptions = discussionOptionsByGroup[selectedGroupId || ''] ?? [];
  const selectedDiscussion = discussionOptions.find((d) => d.value === selectedDiscussionId);
  const selectedDiscussionDateTime = selectedDiscussion ? new Date(selectedDiscussion.startDateTime * 1000) : undefined;
  const selectedDiscussionTimeString = selectedDiscussionDateTime
    ? `${selectedDiscussionDateTime.toLocaleDateString(undefined, { weekday: 'short' })}, ${selectedDiscussionDateTime.toLocaleDateString(undefined, { dateStyle: 'medium' })} at ${selectedDiscussionDateTime.toLocaleTimeString(undefined, { timeStyle: 'short' })}`
    : undefined;

  const isSingleUnitChange = switchType === 'Change for one unit';

  const submitDisabled = !switchType
    || !selectedGroupId
    || (isSingleUnitChange && !selectedDiscussionId)
    || (!selectedDate && !selectedDiscussionDateTime)
    || (!selectedTime && !selectedDiscussionDateTime)
    || submitUpdateMutation.isPending;

  const handleSubmit = () => {
    if (!switchType || !selectedGroupId) {
      return;
    }

    // When `discussionId` is undefined the backend automation will update all future discussions for the group
    const discussionId = isSingleUnitChange ? selectedDiscussionId : undefined;

    const dateToUse = selectedDate ?? selectedDiscussionDateTime;
    const timeToUse = selectedTime ?? selectedDiscussionDateTime;

    if (!dateToUse || !timeToUse) {
      return;
    }

    // Local date and time, converted to UTC with `getTime()` below
    const newDateTime = new Date(dateToUse);
    newDateTime.setHours(timeToUse.getHours(), timeToUse.getMinutes(), 0, 0);

    submitUpdateMutation.mutate({
      courseSlug,
      discussionId,
      groupId: selectedGroupId,
      // `getTime()` converts to UTC milliseconds, we convert to seconds
      requestedDateTimeInSeconds: Math.floor(newDateTime.getTime() / 1000),
    });
  };

  const renderTitle = () => {
    const titleText = submitUpdateMutation.isSuccess ? 'Success' : 'Update your discussion time';
    return (
      <div className="flex w-full items-center justify-center gap-2">
        {!submitUpdateMutation.isSuccess && <ClockIcon />}
        <div className="text-size-md font-semibold">{titleText}</div>
      </div>
    );
  };

  const renderContent = () => {
    if (submitUpdateMutation.isSuccess) {
      return (
        <div className="flex w-full flex-col items-center justify-center gap-8">
          <div className="bg-bluedot-normal/10 flex rounded-full p-4">
            <CheckIcon className="text-bluedot-normal" />
          </div>
          <div className="flex max-w-[400px] flex-col items-center gap-4">
            <P className="text-[#13132E] opacity-80">
              We've updated your group's {isSingleUnitChange ? 'discussion' : 'discussions'}.
            </P>
            <P className="text-center text-[#13132E] opacity-80">
              You should see the changes reflected in the calendar event and Course Hub. Please allow up to 10 minutes.
            </P>
          </div>
          <CTALinkOrButton className="bg-bluedot-normal w-full" onClick={handleClose}>
            Close
          </CTALinkOrButton>
        </div>
      );
    }

    return (
      <>
        <InformationBanner />
        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">1. What kind of update are you making?</H1>
          <Select
            ariaLabel="Action"
            value={switchType}
            onChange={(value) => setSwitchType(value as SwitchType)}
            options={SWITCH_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            placeholder="Choose an option"
          />
        </div>

        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">2. For which group?</H1>
          <Select
            ariaLabel="Group"
            value={selectedGroupId}
            onChange={(value) => {
              setSelectedGroupId(value);
              setSelectedDiscussionId(undefined);
            }}
            options={groupOptions}
            placeholder="Choose a group"
          />
        </div>

        {isSingleUnitChange && (
          <div className="flex flex-col gap-2">
            <H1 className="text-size-md font-medium text-black">3. For which discussion?</H1>
            <Select
              ariaLabel="Discussion"
              options={discussionOptions}
              value={selectedDiscussionId}
              onChange={(value) => setSelectedDiscussionId(value)}
              placeholder="Choose a discussion"
            />
            {selectedDiscussion && (
              <P>
                Current time: <span className="text-bluedot-normal">{selectedDiscussionTimeString}</span>
              </P>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">
            {isSingleUnitChange ? '4' : '3'}. Select new discussion time
          </H1>
          <P>The selected time is in your time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</P>
          <div className="flex flex-row gap-4">
            <DatePicker value={selectedDate ?? selectedDiscussionDateTime} onChange={setSelectedDate} />
            <TimePicker
              className="w-fit"
              timeValue={selectedTime ?? selectedDiscussionDateTime}
              onTimeChange={setSelectedTime}
            />
          </div>
        </div>

        <CTALinkOrButton
          className="bg-bluedot-normal w-full disabled:opacity-50"
          onClick={handleSubmit}
          disabled={submitDisabled}
        >
          {submitUpdateMutation.isPending ? (
            <div className="flex items-center gap-2">
              <ProgressDots className="my-0" dotClassName="bg-white" />
              Submitting...
            </div>
          ) : (
            <span>Submit</span>
          )}
        </CTALinkOrButton>
      </>
    );
  };

  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleClose()}
      title={renderTitle()}
      bottomDrawerOnMobile
      desktopHeaderClassName="border-b border-charcoal-light py-4"
    >
      <div className="w-full md:w-[600px]">
        <form className="flex flex-col gap-8">{renderContent()}</form>
      </div>
    </Modal>
  );
};

const InformationBanner = () => {
  return (
    <div className="inline-flex items-center justify-between self-stretch rounded-md bg-[#E5EDFE] px-4 py-3">
      <div className="flex flex-1 items-start justify-start gap-3">
        <div className="flex items-center justify-start">
          <InfoIcon className="size-5 shrink-0" />
        </div>
        <P className="text-bluedot-normal flex-1 justify-start">
          Please discuss any changes with your participants beforehand. Any changes will update the calendar invitation
          and Course Hub information, but not notify your participants.
        </P>
      </div>
    </div>
  );
};

type GroupOption = { value: string; label: string; disabled?: boolean };
type DiscussionOption = GroupOption & { startDateTime: number };

const buildOptions = (discussions: GroupDiscussion[], currentTimeMs: number) => {
  const groupOptions: GroupOption[] = [];
  const discussionOptionsByGroup: Record<string, DiscussionOption[]> = {};
  const seenGroups = new Set<string>();

  for (const discussion of discussions) {
    const groupId = discussion.group;

    if (discussion.groupDetails && !seenGroups.has(groupId)) {
      seenGroups.add(groupId);
      groupOptions.push({
        value: groupId,
        label: discussion.groupDetails.groupName || 'Group [Unknown]',
      });
    }

    if (!discussionOptionsByGroup[groupId]) {
      discussionOptionsByGroup[groupId] = [];
    }

    discussionOptionsByGroup[groupId].push({
      value: discussion.id,
      label: discussion.unitRecord
        ? `Unit ${discussion.unitRecord.unitNumber}: ${discussion.unitRecord.title}`
        : 'Unknown Unit',
      disabled: discussion.startDateTime * 1000 <= currentTimeMs,
      startDateTime: discussion.startDateTime,
    });
  }

  // Sort discussions within each group by startDateTime
  for (const group of Object.values(discussionOptionsByGroup)) {
    group.sort((a, b) => a.startDateTime - b.startDateTime);
  }

  return { groupOptions, discussionOptionsByGroup };
};

export default FacilitatorSwitchModal;
