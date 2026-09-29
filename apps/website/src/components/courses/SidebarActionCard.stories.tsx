import type { Meta, StoryObj } from '@storybook/react';
import { SidebarActionCard } from './SidebarActionCard';

const meta = {
  title: 'website/courses/SidebarActionCard',
  component: SidebarActionCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 300 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    tone: 'solid',
    title: 'AGI Strategy Certificate',
    subtitle: 'Join a facilitated cohort today',
    href: '/courses/agi-strategy/congratulations',
  },
} satisfies Meta<typeof SidebarActionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// One card per Figma tone, with the copy each status uses in SidebarCertificatePanel /
// SidebarFacilitateAgainPanel.
export const AllTones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <SidebarActionCard tone="solid" title="AGI Strategy Certificate" subtitle="Join a facilitated cohort today" href="#" />
      <SidebarActionCard tone="success" title="Your AGI Strategy Certificate" subtitle="View your certificate" href="#" />
      <SidebarActionCard tone="subtle" title="Course complete" subtitle="See what's next" href="#" />
      <SidebarActionCard tone="outline" title="Quick apply to facilitate again (~2 min)" href="#" />
      <SidebarActionCard
        tone="locked"
        title="AGI Strategy Certificate"
        subtitle={(
          <span>
            {'Finish the course and '}
            <button type="button" className="cursor-pointer underline">meet requirements</button>
            {' to unlock'}
          </span>
        )}
      />
    </div>
  ),
};
