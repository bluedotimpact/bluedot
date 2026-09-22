import type { Meta, StoryObj } from '@storybook/react';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { MyBlueDotSidebar } from './MyBlueDotSidebar';

const meta = {
  title: 'website/MyBlueDotSidebar',
  component: MyBlueDotSidebar,
  parameters: {
    layout: 'padded',
    viewport: { defaultViewport: 'lg' },
  },
} satisfies Meta<typeof MyBlueDotSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Participant: Story = {
  parameters: {
    nextjs: { router: { pathname: '/my-courses' } },
    msw: {
      handlers: [
        trpcStorybookMsw.myBluedot.hasFacilitatorNavItems.query(() => ({
          hasFacilitatedCourses: false,
          hasFacilitatorApplications: false,
        })),
      ],
    },
  },
};

export const Facilitator: Story = {
  parameters: {
    nextjs: { router: { pathname: '/facilitated-courses' } },
    msw: {
      handlers: [
        trpcStorybookMsw.myBluedot.hasFacilitatorNavItems.query(() => ({
          hasFacilitatedCourses: true,
          hasFacilitatorApplications: true,
        })),
      ],
    },
  },
};
