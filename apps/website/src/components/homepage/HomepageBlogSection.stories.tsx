import type { Meta, StoryObj } from '@storybook/react';
import HomepageBlogSection from './HomepageBlogSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  authorName: string;
  authorUrl: string | null;
  publishedAt: number;
  publicationStatus: string | null;
  isFeatured: boolean | null;
};

const mockBlogs: BlogPost[] = [
  {
    id: 'blog-1',
    title: 'Why AI Safety Matters Now More Than Ever',
    slug: 'why-ai-safety-matters',
    authorName: 'Sarah Chen',
    authorUrl: 'https://example.com/sarah',
    publishedAt: Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60,
    publicationStatus: 'Published',
    isFeatured: true,
  },
  {
    id: 'blog-2',
    title: 'Building a Career in AI Governance: A Guide',
    slug: 'career-ai-governance-guide',
    authorName: 'Michael Roberts',
    authorUrl: 'https://example.com/michael',
    publishedAt: Math.floor(Date.now() / 1000) - 14 * 24 * 60 * 60,
    publicationStatus: 'Published',
    isFeatured: false,
  },
  {
    id: 'blog-3',
    title: 'Lessons from Our Latest Cohort',
    slug: 'lessons-latest-cohort',
    authorName: 'Emily Watson',
    authorUrl: null,
    publishedAt: Math.floor(Date.now() / 1000) - 21 * 24 * 60 * 60,
    publicationStatus: 'Published',
    isFeatured: false,
  },
];

const meta = {
  title: 'Website/Homepage/HomepageBlogSection',
  component: HomepageBlogSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The blog section of the homepage displaying recent blog posts. Shows post titles, dates, and authors. Includes the NewsletterBanner component.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxItems: {
      description: 'Maximum number of blog posts to display',
      control: { type: 'number', min: 1, max: 10 },
    },
  },
} satisfies Meta<typeof HomepageBlogSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    maxItems: 3,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.blogs.getAll.query(() => mockBlogs),
      ],
    },
  },
};

export const NoBlogs: Story = {
  args: {
    maxItems: 3,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.blogs.getAll.query(() => []),
      ],
    },
  },
};
