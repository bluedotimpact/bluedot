import type { Meta, StoryObj } from '@storybook/react';
import MyBlueDotSidebar from './MyBlueDotSidebar';

const meta = {
  title: 'website/MyBlueDotSidebar',
  component: MyBlueDotSidebar,
  parameters: {
    layout: 'padded',
    viewport: { defaultViewport: 'lg' },
    nextjs: { router: { pathname: '/my-courses' } },
  },
} satisfies Meta<typeof MyBlueDotSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
