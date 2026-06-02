import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { type TimeAvailabilityMap } from '@bluedot/utils';
import { TimeAvailabilityGrid } from './TimeAvailabilityGrid';

const meta = {
  title: 'ui/TimeAvailabilityGrid',
  component: TimeAvailabilityGrid,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TimeAvailabilityGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

const ControlledDemo = ({
  startHour,
  endHour,
  initial = {},
}: {
  startHour?: number;
  endHour?: number;
  initial?: TimeAvailabilityMap;
}) => {
  const [value, setValue] = useState<TimeAvailabilityMap>(initial);
  return (
    <div className="w-[600px]">
      <TimeAvailabilityGrid value={value} onChange={setValue} startHour={startHour} endHour={endHour} />
    </div>
  );
};

const noop = () => {};

export const Default: Story = {
  args: { value: {}, onChange: noop },
  render: () => <ControlledDemo />,
};

export const BusinessHours: Story = {
  args: { value: {}, onChange: noop },
  render: () => <ControlledDemo startHour={8} endHour={17} />,
};

export const Prefilled: Story = {
  args: { value: {}, onChange: noop },
  render: () => (
    <ControlledDemo
      startHour={8}
      endHour={23}
      initial={{
        // Monday 9:00 - 11:00
        540: true,
        570: true,
        600: true,
        630: true,
        // Wednesday 14:00 - 16:00
        3720: true,
        3750: true,
        3780: true,
        3810: true,
      }}
    />
  ),
};
