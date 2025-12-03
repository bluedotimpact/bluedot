import {
  CTALinkOrButton, DatePicker, Modal, ProgressDots, TimePicker,
} from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import React, { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { InfoIcon } from '../icons/InfoIcon';
import { H1, P } from '../Text';
import Select from './group-switching/Select';

export type FacilitatorSwitchModalProps = {
  handleClose: () => void;
  initialUnitNumber?: string;
  courseSlug: string;
};

const SWITCH_OPTIONS = [
  { value: 'Change for one unit', label: 'Change for one unit' },
  { value: 'Change permanently', label: 'Change permanently' },
] as const;

export type SwitchType = (typeof SWITCH_OPTIONS)[number]['value'];

const FacilitatorSwitchModal: React.FC<FacilitatorSwitchModalProps> = ({
  handleClose,
  courseSlug,
  initialUnitNumber = '1',
}) => {
  const [switchType, setSwitchType] = useState<SwitchType | undefined>(undefined);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const {
    data: switchData,
    isLoading,
    isError,
    error,
  } = trpc.facilitators.discussionsAvailable.useQuery({
    courseSlug,
  });

  const submitUpdateMutation = trpc.facilitators.updateDiscussion.useMutation({
    onSuccess: () => {
      console.log('success');
      // TODO
    },
  });

  const groupOptions = switchData?.groups.map((group) => ({
    value: group.id,
    label: group.groupName || 'Group [Unknown]',
  })) || [];

  const discussionOptions = switchData?.discussionsByGroup[selectedGroupId || '']?.map((discussion) => ({
    value: discussion.id,
    label: discussion.label,
  })) || [];

  const selectedDiscussion = switchData?.discussionsByGroup[selectedGroupId || '']?.find(
    (d) => d.id === selectedDiscussionId,
  );
  const selectedDiscussionDateTime = selectedDiscussion ? new Date(selectedDiscussion.startDateTime * 1000) : undefined;
  const dayOfWeek = selectedDiscussionDateTime?.toLocaleDateString(undefined, { weekday: 'short' });
  const date = selectedDiscussionDateTime?.toLocaleDateString(undefined, { dateStyle: 'medium' });
  const time = selectedDiscussionDateTime?.toLocaleTimeString(undefined, { timeStyle: 'short' });
  const selectedDiscussionTimeString = `${dayOfWeek}, ${date} at ${time}`;

  const handleSubmit = () => {
    if (!switchType || !selectedGroupId) {
      return;
    }

    const discussionId = switchType === 'Change for one unit' ? selectedDiscussionId : undefined;

    if (!selectedDate) {
      return;
    }
    if (!selectedTime) {
      return;
    }

    // Already in UTC
    const newDateTime = new Date(selectedDate);
    newDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

    submitUpdateMutation.mutate({
      courseSlug,
      discussionId,
      newDateTime,
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return <ProgressDots />;
    }

    if (isError) {
      return <ErrorView error={error} />;
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">1. What kind of update are you making?</H1>
          <Select
            label="Action"
            value={switchType}
            onChange={(value) => setSwitchType(value as SwitchType)}
            options={SWITCH_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            placeholder="Choose an option"
          />
        </div>

        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">2. For which group?</H1>
          <Select
            label="Group"
            value={selectedGroupId}
            onChange={(value) => setSelectedGroupId(value)}
            options={groupOptions}
            placeholder="Choose a group"
          />
        </div>

        {/* TODO: disable/hide when changing permanently */}
        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">3. For which discussion?</H1>
          <Select
            label="Discussion"
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

        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium text-black">4. Select new discussion time</H1>
          <P>The selected time is in your time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</P>
          <div className="flex flex-row gap-4">
            <DatePicker value={selectedDate ?? selectedDiscussionDateTime} onChange={setSelectedDate} hideLabel />
            <TimePicker
              className="w-fit"
              value={selectedTime ?? selectedDiscussionDateTime}
              onChange={setSelectedTime}
              hideLabel
            />
          </div>
        </div>

        <CTALinkOrButton className="bg-bluedot-normal w-full">Submit</CTALinkOrButton>
      </>
    );
  };

  console.log(discussions, isLoading, isError);

  return (
    <Modal
      isOpen
      setIsOpen={(open: boolean) => !open && handleClose()}
      title="Update your discussion time"
      bottomDrawerOnMobile
    >
      <div className="w-full max-w-[600px]">
        <form className="flex flex-col gap-8">
          <div className="inline-flex items-center justify-between self-stretch rounded-md bg-[#E5EDFE] px-4 py-3">
            <div className="flex flex-1 items-start justify-start gap-3">
              <div className="flex items-center justify-start">
                <InfoIcon className="size-5 shrink-0" />
              </div>
              <P className="flex-1 justify-start text-[#1144CC]">
                Please discuss any changes with your participants beforehand. Any changes will update the calendar
                invitation and Course Hub information, but not notify your participants.
              </P>
            </div>
          </div>
          {renderContent()}
        </form>
      </div>
    </Modal>
  );
};

export default FacilitatorSwitchModal;
