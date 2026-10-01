import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FaClock, FaArrowRightArrowLeft } from 'react-icons/fa6';
import { Select, type SelectProps } from './Select';
import { BottomDrawerModal } from './BottomDrawerModal';
import { CTALinkOrButton } from './CTALinkOrButton';

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

const timeSlots = [
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

const courses = [
  { value: 'aisf', label: 'AI Safety Fundamentals' },
  { value: 'gov', label: 'AI Governance' },
  { value: 'tech', label: 'Technical AI Safety' },
];

const ControlledSelect = (props: Omit<SelectProps, 'value' | 'onChange'>) => {
  const [value, setValue] = useState<string | undefined>(undefined);
  return <Select {...props} value={value} onChange={setValue} />;
};

export const Placeholder: Story = {
  args: { options: courses, 'aria-label': 'Course' },
  render: (args) => <ControlledSelect {...args} options={args.options} />,
};

export const Filled: Story = {
  args: { options: courses, value: 'aisf', 'aria-label': 'Course' },
};

export const Disabled: Story = {
  args: {
    options: courses, value: 'aisf', disabled: true, 'aria-label': 'Course',
  },
};

export const Invalid: Story = {
  args: { options: courses, 'aria-invalid': true, 'aria-label': 'Course' },
  render: (args) => <ControlledSelect {...args} options={args.options} />,
};

export const LongList: Story = {
  args: { options: timeSlots, placeholder: 'Select a time slot', 'aria-label': 'Time slot' },
  render: (args) => <ControlledSelect {...args} options={args.options} />,
};

const switchOptions = [
  {
    value: 'one-unit',
    label: <span className="flex items-center gap-2"><FaClock className="size-4" /> Switch group for one unit</span>,
  },
  {
    value: 'permanent',
    label: <span className="flex items-center gap-2"><FaArrowRightArrowLeft className="size-4" /> Switch group permanently</span>,
  },
];

const GhostSelect = () => {
  const [value, setValue] = useState('one-unit');
  return (
    <Select
      options={switchOptions}
      value={value}
      onChange={setValue}
      variant="ghost"
      className="mx-auto"
      aria-label="Select action"
    />
  );
};

export const Ghost: Story = {
  args: { options: switchOptions },
  render: () => <GhostSelect />,
};

const InBottomDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState<string | undefined>(undefined);
  return (
    <>
      <CTALinkOrButton onClick={() => setIsOpen(true)}>Open drawer</CTALinkOrButton>
      <BottomDrawerModal isOpen={isOpen} setIsOpen={setIsOpen} title="Switch group" initialSize="fit-content">
        <div className="flex flex-col gap-4 p-4">
          <p className="text-size-sm text-primary">Pick a new discussion time.</p>
          <Select
            options={timeSlots}
            value={value}
            onChange={setValue}
            placeholder="Select a time slot"
            aria-label="Time slot"
          />
          <CTALinkOrButton className="w-full">Confirm</CTALinkOrButton>
        </div>
      </BottomDrawerModal>
    </>
  );
};

export const InsideBottomDrawer: Story = {
  args: { options: timeSlots },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <InBottomDrawer />,
};
