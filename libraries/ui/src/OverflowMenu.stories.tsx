import type { Meta, StoryObj } from '@storybook/react';
import { OverflowMenu } from './OverflowMenu';

const meta = {
  title: 'ui/OverflowMenu',
  component: OverflowMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    ariaLabel: 'Actions menu',
    items: [
      {
        id: 'edit',
        label: 'Edit',
        onAction() {
          // eslint-disable-next-line no-alert
          alert('Edit clicked');
        },
      },
      {
        id: 'duplicate',
        label: 'Duplicate',
        onAction() {
          // eslint-disable-next-line no-alert
          alert('Duplicate clicked');
        },
      },
      {
        id: 'delete',
        label: 'Delete',
        onAction() {
          // eslint-disable-next-line no-alert
          alert('Delete clicked');
        },
      },
    ],
  },
} satisfies Meta<typeof OverflowMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
