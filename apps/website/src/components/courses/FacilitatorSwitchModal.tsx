import { Modal } from '@bluedot/ui';
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
      title="Update group discussion time"
      bottomDrawerOnMobile
    >
      <div className="w-full max-w-[600px]">
        <P className="mb-4">
          This will update the calendar invitation and Course Hub information. This tool <em>does not</em> notify your
          participants about this change.
        </P>

        <form className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <H1 className="text-size-md font-medium text-[#00114D]">Step 1: Select switch type</H1>
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
            <H1 className="text-size-md font-medium text-[#00114D]">Step 2: Select group</H1>
            <Select label="Group" options={[]} placeholder="Choose a group" />
          </div>

          <div className="flex flex-col gap-2">
            <H1 className="text-size-md font-medium text-[#00114D]">Step 3: Select unit</H1>
            <P>Which unit are you updating?</P>
            <Select label="Unit" options={[]} placeholder="Choose a unit" />
          </div>

          <div className="flex flex-col gap-2">
            <H1 className="text-size-md font-medium text-[#00114D]">Step 4: Select new discussion time</H1>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default FacilitatorSwitchModal;
