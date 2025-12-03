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
};

export const CustomLabel: Story = {
  args: {
    label: 'Select Date',
  },
};

export const HiddenLabel: Story = {
  args: {
    label: 'Date',
    hideLabel: true,
  },
};

export const Controlled: Story = {
  render: () => {
    const ControlledDemo = () => {
      const [date, setDate] = useState<Date | null>(null);

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
