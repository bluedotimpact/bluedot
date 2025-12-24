import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './DatePicker';

const meta = {
  title: 'ui/DatePicker',
  component: DatePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: new Date(),
  },
  render: () => {
    const ControlledDemo = () => {
      const [date, setDate] = useState<Date | undefined>(undefined);

      return (
        <div className="flex flex-col gap-4">
          <DatePicker label="Pick a date" value={date} onChange={setDate} />
          <div className="text-white text-size-sm">
            Selected: {date ? date.toLocaleDateString() : 'None'}
          </div>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

export const CustomLabel: Story = {
  args: {
    label: 'Select Date',
  },
};

export const HiddenLabel: Story = {
  args: {
    label: undefined,
  },
};

export const CustomStyles: Story = {
  args: {
    label: 'Custom Styled Date Picker',
    classNames: {
      root: 'border border-bluedot-normal rounded-lg p-2',
      label: 'text-bluedot-normal font-semibold',
      input: 'text-bluedot-normal placeholder-bluedot-light',
      button: 'text-bluedot-normal hover:text-bluedot-dark',
      popover: 'ring-bluedot-normal',
      calendar: {
        selected: 'bg-bluedot-normal text-white',
        today: 'text-bluedot-normal underline',
        chevron: 'fill-bluedot-normal hover:fill-bluedot-dark',
      },
    },
  },
};
