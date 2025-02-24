import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumbs } from './Breadcrumbs';
import type { BluedotRoute } from './utils';

const meta = {
  title: 'ui/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

const route: BluedotRoute = {
  title: 'About us',
  url: '/about',
  parentPages: [{ title: 'Home', url: '/' }],
};

export const Default: Story = {
  args: {
    route,
  },
};
