import { CTALinkOrButton, Modal } from '@bluedot/ui';
import React, { useState } from 'react';
import { H1, P } from '../Text';
import Select from './group-switching/Select';

export type FacilitatorSwitchModalProps = {
  handleClose: () => void;
  initialUnitNumber?: string;
  courseSlug: string;
};

const SWITCH_TYPE_OPTIONS = [
  { value: 'Change for one unit', label: 'Change for one unit' },
  { value: 'Change permanently', label: 'Change permanently' },
] as const;

export type SwitchType = (typeof SWITCH_TYPE_OPTIONS)[number]['value'];

const FacilitatorSwitchModal: React.FC<FacilitatorSwitchModalProps> = ({
  handleClose,
  courseSlug,
  initialUnitNumber = '1',
}) => {
  const [switchType, setSwitchType] = useState<SwitchType | undefined>(undefined);

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

          <div className="flex flex-col gap-2">
            <H1 className="text-size-md font-medium">Step 1: Select switch type</H1>
            <P>
              If you want to make updates to specific units instead of all upcoming group discussions, please select
              "Switch for one unit".
            </P>
            <Select
              label="Action"
              value={switchType}
              onChange={(value) => setSwitchType(value as SwitchType)}
              options={SWITCH_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              placeholder="Choose an option"
            />
          </div>

          <div className="flex flex-col gap-2">
            <H1 className="text-size-md font-medium">Step 2: Select group</H1>
            <Select label="Group" options={[]} placeholder="Choose a group" />
          </div>

          <div className="flex flex-col gap-2">
            <H1 className="text-size-md font-medium">Step 3: Select unit</H1>
            <P>Which unit are you updating?</P>
            <Select label="Unit" options={[]} placeholder="Choose a unit" />
          </div>

          <div className="flex flex-col gap-2">
            <H1 className="text-size-md font-medium">Step 4: Select new discussion time</H1>
            <P>The selected time is in your time zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</P>
          </div>

          <CTALinkOrButton className="w-full bg-[#1144CC]">Submit</CTALinkOrButton>
        </form>
      </div>
    </Modal>
  );
};

export default FacilitatorSwitchModal;

const InfoIcon = ({ className }: { className?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="10" fill="#1D4ED8" />
      <path d="M10 14V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="6.5" r="0.75" fill="white" />
    </svg>
  );
};
