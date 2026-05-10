import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import TabPills from './TabPills';

const TABS = [
  { id: 'in-progress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past-courses', label: 'Past Courses' },
] as const;

type TabId = typeof TABS[number]['id'];

const Demo = () => {
  const [active, setActive] = useState<TabId>('in-progress');
  return (
    <TabPills
      ariaLabel="Course filter"
      tabs={TABS}
      value={active}
      onChange={setActive}
    />
  );
};

const meta = {
  title: 'website/my-courses/TabPills',
  component: Demo,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Demo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
