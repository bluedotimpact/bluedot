import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';

import { TabPills } from './TabPills';

const TABS = [
  { id: 'inProgress', label: 'In progress' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pastCourses', label: 'Past courses' },
];

const MANY_TABS = [
  ...TABS,
  { id: 'withdrawn', label: 'Withdrawn' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'archived', label: 'Archived' },
];

const meta = {
  title: 'ui/TabPills',
  component: TabPills,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  // Same horizontal padding as section-base so the edge bleed lines up as it does in the app
  decorators: [(Story) => <div className="px-spacing-x py-4"><Story /></div>],
  args: {
    ariaLabel: 'Course filter',
    tabs: TABS,
    value: 'inProgress',
    onChange: () => {},
  },
  render(args) {
    const ControlledDemo = () => {
      const [value, setValue] = useState(args.value);
      return <TabPills {...args} value={value} onChange={setValue} />;
    };

    return <ControlledDemo />;
  },
} satisfies Meta<typeof TabPills<string>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Pills never wrap. On narrow viewports the row scrolls and bleeds to the page edge. */
export const Overflow: Story = {
  args: {
    tabs: MANY_TABS,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};
