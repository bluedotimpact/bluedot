import type { Meta, StoryObj } from '@storybook/react';
import type { inferRouterOutputs } from '@trpc/server';
import JobsListSection from './JobsListSection';
import type { AppRouter } from '../../server/routers/_app';

type Jobs = inferRouterOutputs<AppRouter>['jobs']['getAll'];

const sampleJobs: Jobs = [
  {
    id: 'rec1',
    title: 'Software Engineer',
    subtitle: 'London or San Francisco · Full-time',
    slug: 'software-engineer',
    applicationUrl: 'https://example.com/apply/software-engineer',
    publicationStatus: 'Published',
    publishedAt: Math.floor(Date.now() / 1000),
    category: null,
    linkPreviewImage: null,
    priority: '1 Top',
  },
  {
    id: 'rec2',
    title: 'Product Manager',
    subtitle: 'London · Full-time',
    slug: 'product-manager',
    applicationUrl: 'https://example.com/apply/product-manager',
    publicationStatus: 'Published',
    publishedAt: Math.floor(Date.now() / 1000),
    category: null,
    linkPreviewImage: null,
    priority: '2 Med',
  },
  {
    id: 'rec3',
    title: 'Designer',
    subtitle: 'Remote · Full-time',
    slug: 'designer',
    applicationUrl: 'https://example.com/apply/designer',
    publicationStatus: 'Published',
    publishedAt: Math.floor(Date.now() / 1000),
    category: null,
    linkPreviewImage: null,
    priority: '2 Med',
  },
  {
    id: 'rec4',
    title: 'Course Author (paid contract)',
    subtitle: 'Remote · 3-month contract',
    slug: 'course-author',
    applicationUrl: 'https://example.com/apply/course-author',
    publicationStatus: 'Published',
    publishedAt: Math.floor(Date.now() / 1000),
    category: 'Contractor',
    linkPreviewImage: null,
    priority: '3 Low',
  },
];

const meta = {
  title: 'website/JoinUs/JobsListSection',
  component: JobsListSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Lists open roles on /join-us. Splits regular jobs from contractor roles (the latter rendered under "Support our mission"). Empty state shows a "no open hiring rounds" message.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof JobsListSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    jobs: sampleJobs,
  },
};

export const NoOpenRoles: Story = {
  args: {
    jobs: [],
  },
};

export const ContractorOnly: Story = {
  args: {
    jobs: sampleJobs.filter((job) => job.category === 'Contractor'),
  },
};
