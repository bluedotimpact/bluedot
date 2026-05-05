import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import TabPills from './TabPills';

const TABS = [
  { id: 'in-progress', label: 'In Progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past-courses', label: 'Past Courses' },
] as const;

type TabId = typeof TABS[number]['id'];

const Demo = ({ initialTab }: { initialTab: TabId }) => {
  const [active, setActive] = useState<TabId>(initialTab);
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

export const InProgress: Story = { args: { initialTab: 'in-progress' } };
export const Upcoming: Story = { args: { initialTab: 'upcoming' } };
export const PastCourses: Story = { args: { initialTab: 'past-courses' } };
