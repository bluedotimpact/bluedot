import {
  CTALinkOrButton, DatePicker, H1, Modal, P, ProgressDots, Select, TimePicker,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import React, { useState } from 'react';
import type { GroupDiscussion } from '@bluedot/db';
import { trpc } from '../../utils/trpc';
import { CheckIcon } from '../icons/CheckIcon';
import { InfoIcon } from '../icons/InfoIcon';

export type FacilitatorSwitchModalProps = {
  handleClose: () => void;
  courseSlug: string;
  initialDiscussion: GroupDiscussion | null;
};

const SWITCH_OPTIONS = [
  { value: 'Change for one unit', label: 'Change for one unit' },
  { value: 'Change permanently', label: 'Change permanently' },
] as const;

export type SwitchType = (typeof SWITCH_OPTIONS)[number]['value'];

const FacilitatorSwitchModal: React.FC<FacilitatorSwitchModalProps> = ({ handleClose, courseSlug, initialDiscussion }) => {
  const [switchType, setSwitchType] = useState<SwitchType | undefined>('Change for one unit');
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(initialDiscussion?.group);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | undefined>(initialDiscussion?.id);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>(undefined);

  const {
    data: switchData,
    isLoading,
    isError,
    error,
  } = trpc.facilitators.discussionsAvailable.useQuery({
    courseSlug,
  });

  const submitUpdateMutation = trpc.facilitators.updateDiscussion.useMutation();

  const groupOptions = switchData?.groups.map((group) => ({
    value: group.id,
    label: group.groupName || 'Group [Unknown]',
  })) || [];

  const discussionOptions = switchData?.discussionsByGroup[selectedGroupId || '']?.map((discussion) => ({
    value: discussion.id,
    label: discussion.label,
    disabled: discussion.hasStarted,
  })) || [];

  const selectedDiscussion = switchData?.discussionsByGroup[selectedGroupId || '']?.find(
    (d) => d.id === selectedDiscussionId,
  );
  const selectedDiscussionDateTime = selectedDiscussion ? new Date(selectedDiscussion.startDateTime * 1000) : undefined;
  const dayOfWeek = selectedDiscussionDateTime?.toLocaleDateString(undefined, { weekday: 'short' });
  const date = selectedDiscussionDateTime?.toLocaleDateString(undefined, { dateStyle: 'medium' });
  const time = selectedDiscussionDateTime?.toLocaleTimeString(undefined, { timeStyle: 'short' });
  const selectedDiscussionTimeString = `${dayOfWeek}, ${date} at ${time}`;

  const submitDisabled = !switchType || !selectedGroupId || submitUpdateMutation.isPending;

  const isSingleUnitChange = switchType === 'Change for one unit';

  const handleSubmit = () => {
    if (!switchType || !selectedGroupId) {
      return;
    }

    const discussionId = switchType === 'Change for one unit' ? selectedDiscussionId : undefined;

    const dateToUse = selectedDate ?? selectedDiscussionDateTime;
    const timeToUse = selectedTime ?? selectedDiscussionDateTime;

    if (!dateToUse || !timeToUse) {
      return;
    }

    // Already in UTC
    const newDateTime = new Date(dateToUse);
    newDateTime.setHours(timeToUse.getHours(), timeToUse.getMinutes(), 0, 0);

    submitUpdateMutation.mutate({
      courseSlug,
      discussionId,
      groupId: selectedGroupId,
      newDateTime: Math.floor(newDateTime.getTime() / 1000),
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <>
          <InformationBanner />
          <ProgressDots />
        </>
      );
    }

    if (isError) {
      return <ErrorView error={error} />;
    }

    if (submitUpdateMutation.isSuccess) {
      return (
        <div className="flex w-full flex-col items-center justify-center gap-8">
          <div className="bg-bluedot-normal/10 flex rounded-full p-4">
            <CheckIcon className="text-bluedot-normal" />
          </div>
          <div className="flex max-w-[400px] flex-col items-center gap-4">
            <P className="text-[#13132E] opacity-80">
              We've updated your group's {selectedDiscussionId ? 'discussion' : 'discussions'}.
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
            onChange={(value) => setSelectedGroupId(value)}
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
              value={selectedTime ?? selectedDiscussionDateTime}
              onChange={setSelectedTime}
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
      title={submitUpdateMutation.isSuccess ? 'Success' : 'Update your discussion time'}
      bottomDrawerOnMobile
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
        <P className="flex-1 justify-start text-[#1144CC]">
          Please discuss any changes with your participants beforehand. Any changes will update the calendar invitation
          and Course Hub information, but not notify your participants.
        </P>
      </div>
    </div>
  );
};

export default FacilitatorSwitchModal;
