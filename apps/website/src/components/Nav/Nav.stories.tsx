import type { Meta, StoryObj } from '@storybook/react';
import type { RequestHandler } from 'msw';
import { loggedInStory, loggedOutStory } from '@bluedot/ui';

import { Nav } from './Nav';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { createMockCourse, MOCK_NAV_GRANTS, MOCK_NAV_IN_PERSON_PROGRAMS } from '../../__tests__/testUtils';

const handlers: RequestHandler[] = [
  trpcStorybookMsw.courses.getAll.query(() => [
    createMockCourse({
      id: '1', title: 'AGI Strategy', slug: 'agi-strategy', isFeatured: true,
    }),
    createMockCourse({
      id: '2', title: 'Biosecurity', slug: 'biosecurity', isNew: true,
    }),
    createMockCourse({ id: '3', title: 'Technical AI Safety', slug: 'technical-ai-safety' }),
  ]),
  trpcStorybookMsw.programs.getInPerson.query(() => MOCK_NAV_IN_PERSON_PROGRAMS),
  trpcStorybookMsw.programs.getGrants.query(() => MOCK_NAV_GRANTS),
  trpcStorybookMsw.courseRegistrations.getAll.query(() => []),
  trpcStorybookMsw.myBluedot.hasFacilitatorNavItems.query(() => ({ hasFacilitatedCourses: true, hasFacilitatorApplications: false })),
  trpcStorybookMsw.admin.canImpersonate.query(() => 'none'),
  trpcStorybookMsw.admin.isUserAdmin.query(() => false),
];

// Flattened props: a discriminated union makes Storybook infer `never` for args
type NavStoryProps = {
  variant?: 'default' | 'transparent' | 'minimal';
  title?: string;
  context?: string;
};

// -m-8 cancels the global story padding; min-height keeps the open drawers visible
const NavWrapper: React.FC<NavStoryProps> = (props) => (
  <div className="-m-8 min-h-96">
    <Nav {...(props as React.ComponentProps<typeof Nav>)} />
  </div>
);

const meta: Meta<typeof NavWrapper> = {
  title: 'ui/Nav',
  component: NavWrapper,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
    msw: { handlers },
  },
  // Note: autodocs removed because it doesn't work with the global logged in/out
  // Storybook's router reports pathname "/", which Nav treats as the homepage (auto-transparent), so be explicit
  args: { variant: 'default' },
  ...loggedOutStory(),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LoggedIn: Story = {
  ...loggedInStory(),
};

// Overlays a hero; the dark background stands in for the hero image
export const Transparent: Story = {
  args: { variant: 'transparent' },
  parameters: { backgrounds: { default: 'navy', values: [{ name: 'navy', value: '#13132e' }] } },
};

export const Minimal: Story = {
  args: {
    variant: 'minimal',
    title: 'Course Feedback',
    context: 'Technical AI Safety (2026 Feb W08) – Part-time',
  },
  ...loggedInStory(),
};
