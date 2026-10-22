import type { Meta, StoryObj } from '@storybook/react';
import FirstContactSection from './FirstContactSection';

const meta = {
  title: 'website/welcome/FirstContactSection',
  component: FirstContactSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof FirstContactSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PasswordAndConnect: Story = {};

export const Booked: Story = {
  parameters: {
    nextjs: {
      router: {
        query: {
          chats: JSON.stringify([
            { name: 'Alex Groth', start: '2026-10-20T17:00:00.000Z' },
            { name: 'Bilal Chughtai', start: '2026-10-21T14:30:00.000Z' },
            { name: 'Li-Lian Ang', start: '2026-10-22T18:00:00.000Z' },
            { name: 'Nixon Hanna', start: '2026-10-23T15:30:00.000Z' },
            { name: 'Cosima Axford', start: '2026-10-26T15:00:00.000Z' },
          ]),
          missing: '0',
        },
      },
    },
  },
};

export const SomeChatsMissing: Story = {
  parameters: {
    nextjs: {
      router: {
        query: {
          chats: JSON.stringify([{ name: 'Alex Groth', start: '2026-10-20T17:00:00.000Z' }]),
          missing: '4',
        },
      },
    },
  },
};

export const GoogleError: Story = {
  parameters: {
    nextjs: { router: { query: { error: 'missing_scope' } } },
  },
};
