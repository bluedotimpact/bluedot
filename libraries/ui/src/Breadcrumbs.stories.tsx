import type { Meta, StoryObj } from '@storybook/react';
import { type BluedotRoute, Breadcrumbs } from './Breadcrumbs';

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

const routeWithManyParents: BluedotRoute = {
  title: 'Unit 3: Alignment',
  url: '/courses/agi-safety/unit-3',
  parentPages: [
    { title: 'Home', url: '/' },
    { title: 'Courses', url: '/courses' },
    { title: 'AGI Safety Fundamentals', url: '/courses/agi-safety' },
  ],
};

export const ManyParentPages: Story = {
  args: {
    route: routeWithManyParents,
  },
};
