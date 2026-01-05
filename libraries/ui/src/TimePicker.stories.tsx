import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TimePicker } from './TimePicker';

const meta = {
  title: 'ui/TimePicker',
  component: TimePicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const ControlledDemo = () => {
      const [time, setTime] = useState<Date | null>(null);

      return (
        <div className="flex flex-col gap-4">
          <TimePicker label="Pick a time" value={time} onChange={setTime} />
          <div className="text-size-sm text-white">Selected: {time ? time.toLocaleTimeString() : 'None'}</div>
        </div>
      );
    };
    return <ControlledDemo />;
  },
};

export const CustomLabel: Story = {
  args: {
    label: 'Select Time',
  },
};

export const HiddenLabel: Story = {
  args: {
    label: undefined,
  },
};

export const CustomStyles: Story = {
  args: {
    label: 'Custom Styled Time Picker',
    className: 'w-full',
    labelClassName: 'text-blue-600 font-bold text-lg',
    inputClassName: 'bg-blue-50 border-blue-300 hover:border-blue-500',
  },
};
