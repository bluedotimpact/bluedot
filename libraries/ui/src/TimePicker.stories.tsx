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
  render() {
    const ControlledDemo = () => {
      const [time, setTime] = useState<Date | undefined>(undefined);

      return (
        <div className="flex flex-col gap-4">
          <TimePicker label="Pick a time" timeValue={time} onTimeChange={setTime} />
          <div className="text-size-sm text-white">Selected: {time ? time.toLocaleTimeString() : 'None'}</div>
        </div>
      );
    };

    return <ControlledDemo />;
  },
};

export const Selected: Story = {
  args: {
    label: 'Pick a time',
    timeValue: new Date(2026, 6, 24, 7, 45),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Pick a time',
    timeValue: new Date(2026, 6, 24, 7, 45),
    disabled: true,
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
