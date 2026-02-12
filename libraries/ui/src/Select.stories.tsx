import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'ui/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const manyOptions = [
  { value: 'option-1', label: 'Monday 9:00 AM - 10:00 AM (GMT)' },
  { value: 'option-2', label: 'Monday 2:00 PM - 3:00 PM (GMT)' },
  { value: 'option-3', label: 'Tuesday 10:00 AM - 11:00 AM (GMT)' },
  { value: 'option-4', label: 'Tuesday 4:00 PM - 5:00 PM (GMT)' },
  { value: 'option-5', label: 'Wednesday 9:00 AM - 10:00 AM (GMT)' },
  { value: 'option-6', label: 'Wednesday 1:00 PM - 2:00 PM (GMT)' },
  { value: 'option-7', label: 'Thursday 11:00 AM - 12:00 PM (GMT)' },
  { value: 'option-8', label: 'Thursday 3:00 PM - 4:00 PM (GMT)' },
  { value: 'option-9', label: 'Friday 10:00 AM - 11:00 AM (GMT)' },
  { value: 'option-10', label: 'Friday 2:00 PM - 3:00 PM (GMT)' },
  { value: 'option-11', label: 'Saturday 9:00 AM - 10:00 AM (GMT)' },
  { value: 'option-12', label: 'Saturday 11:00 AM - 12:00 PM (GMT)' },
  { value: 'option-13', label: 'Sunday 10:00 AM - 11:00 AM (GMT)', disabled: true },
  { value: 'option-14', label: 'Sunday 2:00 PM - 3:00 PM (GMT)' },
  { value: 'option-15', label: 'Monday 6:00 PM - 7:00 PM (GMT)' },
];

export const Default: Story = {
  args: {
    options: manyOptions,
    placeholder: 'Select a time slot',
  },
};

const ControlledSelect = () => {
  const [value, setValue] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-col gap-4">
      <Select
        options={manyOptions}
        value={value}
        onChange={setValue}
        placeholder="Select a time slot"
      />
      <p className="text-size-sm text-gray-500">
        {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
        Selected: {value || 'None'}
      </p>
    </div>
  );
};

export const Controlled: Story = {
  render: () => <ControlledSelect />,
  args: {
    options: [],
  },
};
