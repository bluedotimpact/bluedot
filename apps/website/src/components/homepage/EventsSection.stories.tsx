import type { Meta, StoryObj } from '@storybook/react';
import EventsSection from './EventsSection';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { Event } from '../../server/routers/luma';

const mockEvents: Event[] = [
  {
    id: 'event-1',
    title: 'AI Safety Fundamentals Workshop',
    startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
    location: 'LONDON',
    timezone: 'Europe/London',
    url: 'https://lu.ma/example-event-1',
  },
  {
    id: 'event-2',
    title: 'AI Governance Reading Group',
    startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    endAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
    location: 'ONLINE',
    timezone: 'UTC',
    url: 'https://lu.ma/example-event-2',
  },
  {
    id: 'event-3',
    title: 'Technical AI Safety Deep Dive',
    startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // +4 hours
    location: 'SAN FRANCISCO',
    timezone: 'America/Los_Angeles',
    url: 'https://lu.ma/example-event-3',
  },
  {
    id: 'event-4',
    title: 'BlueDot Alumni Mixer',
    startAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
    endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // +3 hours
    location: 'NEW YORK',
    timezone: 'America/New_York',
    url: 'https://lu.ma/example-event-4',
  },
];

const meta = {
  title: 'Website/Homepage/EventsSection',
  component: EventsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The events section of the homepage featuring a photo carousel and upcoming event cards fetched from Luma. Shows event dates, locations, and times.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EventsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.luma.getUpcomingEvents.query(() => mockEvents),
      ],
    },
  },
};

export const NoEvents: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.luma.getUpcomingEvents.query(() => []),
      ],
    },
  },
};
