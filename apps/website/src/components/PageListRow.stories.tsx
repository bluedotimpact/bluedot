import type { Meta, StoryObj } from '@storybook/react';
import { PageListRow, PageListGroup } from './PageListRow';

const meta = {
  title: 'website/PageListRow',
  component: PageListRow,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'List row used on listing pages (e.g. /grants, /career-transition-grant) for a programmatic, link-style row with an accent bar, optional summary/meta, and a trailing CTA. Compose multiple rows with `PageListGroup` for divided lists with optional heading.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: '/programs/rapid-grants',
    title: 'Rapid Grants',
    summary: 'Fund talented people in the BlueDot community to do excellent work on AI safety — research, events, community building, and more.',
    ctaLabel: 'Learn more',
  },
};

export const WithMeta: Story = {
  args: {
    href: '/programs/career-transition-grant',
    title: 'Career Transition Grant',
    summary: 'Funding for people changing careers into AI safety, governance, or biosecurity.',
    meta: 'Funding · On hiatus',
    ctaLabel: 'Read more',
  },
};

export const External: Story = {
  args: {
    href: 'https://example.com/external',
    title: 'External programme',
    summary: 'Opens in a new tab with proper rel attributes.',
    external: true,
  },
};

export const NotFullyClickable: Story = {
  args: {
    href: '/programs/rapid-grants',
    title: 'Row with interactive children',
    summary: 'Use this when the row contains other interactive elements so anchors do not nest.',
    fullyClickable: false,
  },
};

export const InGroup: Story = {
  args: {
    href: '/programs/rapid-grants',
    title: 'Rapid Grants',
  },
  render: () => (
    <PageListGroup label="Funding programmes">
      <PageListRow
        href="/programs/rapid-grants"
        title="Rapid Grants"
        summary="Fund talented people in the BlueDot community to do excellent work on AI safety."
        meta="Funding · Active"
      />
      <PageListRow
        href="/programs/career-transition-grant"
        title="Career Transition Grant"
        summary="Funding for people changing careers into AI safety, governance, or biosecurity."
        meta="Funding · On hiatus"
      />
    </PageListGroup>
  ),
};
