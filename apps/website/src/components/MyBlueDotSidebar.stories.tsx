import type { Meta, StoryObj } from '@storybook/react';
import MyBlueDotSidebar from './MyBlueDotSidebar';

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

export const ActiveMyCourses: Story = {
  parameters: {
    nextjs: { router: { pathname: '/my-courses' } },
  },
};

export const ActiveAccount: Story = {
  parameters: {
    nextjs: { router: { pathname: '/account' } },
  },
};

export const NoActiveMatch: Story = {
  parameters: {
    nextjs: { router: { pathname: '/nowhere' } },
  },
};
