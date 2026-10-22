import type { Meta, StoryObj } from '@storybook/react';
import CalendarConnectionsSection from './CalendarConnectionsSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta = {
  title: 'website/settings/CalendarConnectionsSection',
  component: CalendarConnectionsSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof CalendarConnectionsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoCalendars: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.calendarConnections.list.query(() => [
          {
            id: 'c1', provider: 'google', email: 'robin.hueber@gmail.com', connectedAt: '2026-10-15T10:00:00.000Z', needsReconnect: false,
          },
          {
            id: 'c2', provider: 'google', email: 'robin.hueber.with.a.long.address@example-employer.org', connectedAt: '2026-10-16T10:00:00.000Z', needsReconnect: false,
          },
        ]),
      ],
    },
  },
};

export const NeedsReconnecting: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.calendarConnections.list.query(() => [
          {
            id: 'c1', provider: 'google', email: 'robin.hueber@gmail.com', connectedAt: '2026-10-15T10:00:00.000Z', needsReconnect: true,
          },
        ]),
      ],
    },
  },
};

// Hidden for anyone who has never connected a calendar
export const NoCalendars: Story = {
  parameters: {
    msw: {
      handlers: [trpcStorybookMsw.calendarConnections.list.query(() => [])],
    },
  },
};
