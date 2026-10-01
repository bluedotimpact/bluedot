import type { Meta, StoryObj } from '@storybook/react';
import { ListGroup, ListRow } from './ListRow';

const meta = {
  title: 'ui/ListRow',
  component: ListRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ListRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    href: '/grants/rapid',
    title: 'Rapid Grants',
    summary: 'Fund talented people in the BlueDot community to do excellent work on AI safety — research, events, community building, and more.',
  },
};

export const Static: Story = {
  args: {
    title: 'Project without a public link',
    summary: 'No href: rendered as a plain row with no CTA and no hover state.',
  },
};

export const InGroup: Story = {
  args: {
    href: '/grants/rapid',
    title: 'Rapid Grants',
    summary: 'Fund talented people in the BlueDot community to do excellent work on AI safety.',
  },
  render: (args) => (
    <ListGroup label="Open roles">
      <ListRow {...args} />
      <ListRow
        href="https://example.com/project"
        title="Operations Associate (part-time, remote across EMEA time zones)"
        summary="External link: opens in a new tab and announces it to screen readers."
        meta="Funding · On hiatus"
        ctaLabel="View project"
      />
      <ListRow
        title="Static row inside a group"
        summary="Mixed lists keep their dividers and alignment."
      />
    </ListGroup>
  ),
};
