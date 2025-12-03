import { CTALinkOrButton, Modal, ProgressDots } from '@bluedot/ui';
import { ErrorView } from '@bluedot/ui/src/ErrorView';
import React, { useState } from 'react';
import { trpc } from '../../utils/trpc';
import { H1, P } from '../Text';
import Select from './group-switching/Select';
import { InfoIcon } from '../icons/InfoIcon';

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

  const {
    data: switchData,
    isLoading,
    isError,
    error,
  } = trpc.facilitators.discussionsAvailable.useQuery({
    courseSlug,
  });

  const groupOptions = switchData?.groups.map((group) => ({
    value: group.id,
    label: group.groupName || 'Group [Unknown]',
  })) || [];

  const discussionOptions = switchData?.discussionsByGroup[selectedGroupId || '']?.map((discussion) => ({
    value: discussion.id,
    label: discussion.label,
  })) || [];

  const selectedDiscussion = switchData?.discussionsByGroup[selectedGroupId || '']?.find(((d) => d.id === selectedDiscussionId));
  const selectedDiscussionDateTime = new Date((selectedDiscussion?.startDateTime || 0) * 1000);
  const dayOfWeek = selectedDiscussionDateTime.toLocaleDateString(undefined, { weekday: 'short' });
  const date = selectedDiscussionDateTime.toLocaleDateString(undefined, { dateStyle: 'medium' });
  const time = selectedDiscussionDateTime.toLocaleTimeString(undefined, { timeStyle: 'short' });
  const selectedDiscussionTimeString = `${dayOfWeek}, ${date} at ${time}`;

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
          <H1 className="text-size-md font-medium">1. What kind of update are you making?</H1>
          <Select
            label="Action"
            value={switchType}
            onChange={(value) => setSwitchType(value as SwitchType)}
            options={SWITCH_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
            placeholder="Choose an option"
          />
        </div>

        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium">2. For which group?</H1>
          <Select
            label="Group"
            value={selectedGroupId}
            onChange={(value) => setSelectedGroupId(value)}
            options={groupOptions}
            placeholder="Choose a group"
          />
        </div>

        <div className="flex flex-col gap-2">
          <H1 className="text-size-md font-medium">3. For which discussion?</H1>
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
          <H1 className="text-size-md font-medium">4. Select new discussion time</H1>
          <P>The selected time is in your time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</P>
        </div>

        <CTALinkOrButton className="w-full bg-bluedot-normal">Submit</CTALinkOrButton>
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
