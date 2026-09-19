import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import EventsPage from '../../pages/events';
import { server, trpcMsw } from '../trpcMswSetup';
import { TrpcProvider } from '../trpcProvider';

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/events',
    query: {},
  }),
}));

const mockEvents = [
  {
    id: 'event-1',
    title: 'AI Governance Club',
    description: 'A weekly discussion on AI governance and strategy.',
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    location: 'ONLINE',
    timezone: 'UTC',
    url: 'https://lu.ma/event-1',
  },
  {
    id: 'event-2',
    title: 'London Community Meetup',
    description: 'Meet people working on governance, safety, and fieldbuilding in London.',
    startAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: 'LONDON',
    timezone: 'Europe/London',
    url: 'https://lu.ma/event-2',
  },
  {
    id: 'event-3',
    title: 'SF AI Safety Social',
    description: 'An in-person social for Bay Area people interested in AI safety.',
    startAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: 'SAN FRANCISCO',
    timezone: 'America/Los_Angeles',
    url: 'https://lu.ma/event-3',
  },
  {
    id: 'event-4',
    title: 'Virtual Workshop Night',
    description: 'A practical online session for working through current projects.',
    startAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: 'ONLINE',
    timezone: 'UTC',
    url: 'https://lu.ma/event-4',
  },
  {
    id: 'event-5',
    title: 'London Reading Group',
    description: 'A recurring London reading group on AI governance.',
    startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
    location: 'LONDON',
    timezone: 'Europe/London',
    url: 'https://lu.ma/event-5',
  },
  {
    id: 'event-6',
    title: 'London Policy Meetup',
    description: 'A London meetup for people working on policy and governance.',
    startAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: 'LONDON',
    timezone: 'Europe/London',
    url: 'https://lu.ma/event-6',
  },
  {
    id: 'event-7',
    title: 'Toronto Community Dinner',
    description: 'An in-person dinner for people in the Toronto community.',
    startAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    location: 'TORONTO',
    timezone: 'America/Toronto',
    url: 'https://lu.ma/event-7',
  },
  {
    id: 'event-8',
    title: 'Virtual Office Hours',
    description: 'An online drop-in session for questions and project updates.',
    startAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    location: 'ONLINE',
    timezone: 'UTC',
    url: 'https://lu.ma/event-8',
  },
];

beforeEach(() => {
  server.use(trpcMsw.courses.getAll.query(() => []));
  server.use(trpcMsw.programs.getInPerson.query(() => []));
  server.use(trpcMsw.programs.getGrants.query(() => []));
});

describe('EventsPage', () => {
  beforeEach(() => {
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.luma.getUpcomingEvents.query(() => mockEvents));
  });

  test('renders hero copy and upcoming events', async () => {
    render(<EventsPage />, { wrapper: TrpcProvider });

    expect(screen.getByText('Meet, learn, and work on AI safety with the BlueDot community.')).toBeTruthy();
    expect(screen.getByText('Online events in your time. In-person events in venue time.')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('AI Governance Club')).toBeTruthy();
      expect(screen.getByText('London Community Meetup')).toBeTruthy();
    });

    const ctas = screen.getAllByRole('link', { name: 'Follow on Luma ↗' });
    const trackedCtaUrl = new URL(ctas[0]?.getAttribute('href') ?? '');
    expect(`${trackedCtaUrl.origin}${trackedCtaUrl.pathname}`).toBe('https://lu.ma/bluedotevents');
    expect(trackedCtaUrl.searchParams.get('utm_source')).toBe('website');
    expect(trackedCtaUrl.searchParams.get('utm_campaign')).toBe('events-page');
    expect(trackedCtaUrl.searchParams.get('utm_content')).toBe('top-cta');
  });

  test('shows an empty state when no events are returned', async () => {
    server.use(trpcMsw.luma.getUpcomingEvents.query(() => []));

    render(<EventsPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('More events are on the way.')).toBeTruthy();
    });
  });

  test('filters the calendar list', async () => {
    render(<EventsPage />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('London Reading Group')).toBeTruthy();
    });

    fireEvent.change(screen.getByRole('combobox', { name: 'Location' }), { target: { value: 'LONDON' } });

    expect(screen.getByText('London Reading Group')).toBeTruthy();
    expect(screen.getByText('London Policy Meetup')).toBeTruthy();
    expect(screen.queryByText('Toronto Community Dinner')).toBeNull();
    expect(screen.queryByText('Virtual Office Hours')).toBeNull();
    expect(screen.queryByText('AI Governance Club')).toBeNull();
  });
});

test('filters the complete calendar before pagination and lets visitors reach later events', async () => {
  const manyEvents = Array.from({ length: 25 }, (_, index) => ({
    ...mockEvents[0]!, id: `event-${index}`, title: `Event ${index}`, location: index === 24 ? 'OXFORD' : 'ONLINE',
  }));
  server.use(trpcMsw.luma.getUpcomingEvents.query(() => manyEvents));
  render(<EventsPage />, { wrapper: TrpcProvider });
  await screen.findByText('Event 0');
  expect(screen.queryByText('Event 24')).toBeNull();
  fireEvent.change(screen.getByRole('combobox', { name: 'Location' }), { target: { value: 'OXFORD' } });
  expect(screen.getByText('Event 24')).toBeTruthy();
  expect(screen.queryByText('Event 0')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'All events' }));
  fireEvent.click(screen.getByRole('button', { name: /Show more events/ }));
  expect(screen.getByText('Event 24')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Show more events/ })).toBeNull();
});

test('shows a recovery link when the event feed fails', async () => {
  server.use(trpcMsw.luma.getUpcomingEvents.query(() => {
    throw new Error('Feed unavailable');
  }));
  render(<EventsPage />, { wrapper: TrpcProvider });
  expect((await screen.findByRole('alert')).textContent).toContain('We couldn’t load the events.');
  expect(screen.getByRole('link', { name: 'See the calendar on Luma ↗' })).toBeTruthy();
  expect(screen.queryByText('More events are on the way.')).toBeNull();
});
