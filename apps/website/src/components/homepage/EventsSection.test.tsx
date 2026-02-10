import { render, screen, waitFor } from '@testing-library/react';
import {
  describe, expect, test, beforeEach,
} from 'vitest';
import EventsSection, { buildTimeDeltaString } from './EventsSection';
import type { Event } from '../../server/routers/luma';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';

const LOCALE = 'en-GB';

describe('buildTimeDeltaString', () => {
  describe('online single-day events', () => {
    test('formats time in user local timezone (en-GB)', () => {
      const event: Event = {
        id: '1',
        title: 'Test Event',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'America/New_York', // This is ignored for online events
        startAt: '2024-03-15T14:00:00Z', // 2:00 PM UTC = Fri
        endAt: '2024-03-15T16:00:00Z', // 4:00 PM UTC
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // For en-GB with hour12:true, times show as 12-hour with am/pm
      expect(result).toBe('Fri 2:00 pm - 4:00 pm UTC');
    });

    test('shows times in user local timezone for online events (different time)', () => {
      const event: Event = {
        id: '2',
        title: 'Online Workshop',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'Europe/London',
        startAt: '2024-06-20T09:00:00Z', // 9:00 AM UTC = Thu
        endAt: '2024-06-20T17:00:00Z', // 5:00 PM UTC
      };

      const result = buildTimeDeltaString(event, LOCALE);

      expect(result).toBe('Thu 9:00 am - 5:00 pm UTC');
    });
  });

  describe('in-person single-day events', () => {
    test('formats time in event timezone (New York)', () => {
      const event: Event = {
        id: '3',
        title: 'Workshop',
        url: 'https://example.com',
        location: 'NEW YORK',
        timezone: 'America/New_York',
        startAt: '2024-03-15T18:00:00Z', // Fri 6:00 PM UTC = Fri 2:00 PM EDT
        endAt: '2024-03-15T20:00:00Z', // Fri 8:00 PM UTC = Fri 4:00 PM EDT
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // In-person events use event's timezone
      // GMT-4 is the numeric representation of EDT
      expect(result).toBe('Fri 2:00 pm - 4:00 pm GMT-4');
    });

    test('formats time in event timezone (London)', () => {
      const event: Event = {
        id: '4',
        title: 'London Meetup',
        url: 'https://example.com',
        location: 'LONDON',
        timezone: 'Europe/London',
        startAt: '2024-07-10T17:00:00Z', // Wed 5:00 PM UTC = Wed 6:00 PM BST
        endAt: '2024-07-10T20:00:00Z', // Wed 8:00 PM UTC = Wed 9:00 PM BST
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // July 10, 2024 is during BST (British Summer Time)
      expect(result).toBe('Wed 6:00 pm - 9:00 pm BST');
    });

    test('formats time in event timezone (UTC)', () => {
      const event: Event = {
        id: '5',
        title: 'UTC Event',
        url: 'https://example.com',
        location: 'SOMEWHERE',
        timezone: 'UTC',
        startAt: '2024-03-15T14:00:00Z', // Fri 2:00 PM UTC
        endAt: '2024-03-15T16:00:00Z', // Fri 4:00 PM UTC
      };

      const result = buildTimeDeltaString(event, LOCALE);

      expect(result).toBe('Fri 2:00 pm - 4:00 pm UTC');
    });
  });

  describe('online multi-day events', () => {
    test('includes end date for multi-day online events', () => {
      const event: Event = {
        id: '6',
        title: 'Multi-day Conference',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'America/Los_Angeles',
        startAt: '2024-03-15T09:00:00Z', // Fri 9:00 AM UTC
        endAt: '2024-03-17T17:00:00Z', // Sun 5:00 PM UTC
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // Multi-day format: "Weekday Time - Weekday Time (Date) Timezone"
      expect(result).toBe('Fri 9:00 am - Sun 5:00 pm (17 Mar) UTC');
    });

    test('handles multi-day event spanning month boundary', () => {
      const event: Event = {
        id: '7',
        title: 'Month Boundary Event',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'UTC',
        startAt: '2024-03-30T09:00:00Z', // Sat 9:00 AM UTC
        endAt: '2024-04-02T17:00:00Z', // Tue 5:00 PM UTC
      };

      const result = buildTimeDeltaString(event, LOCALE);

      expect(result).toBe('Sat 9:00 am - Tue 5:00 pm (2 Apr) UTC');
    });

    test('handles multi-day event with different year', () => {
      const event: Event = {
        id: '8',
        title: 'Year Boundary Event',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'UTC',
        startAt: '2024-12-30T10:00:00Z', // Mon 10:00 AM UTC
        endAt: '2025-01-02T18:00:00Z', // Thu 6:00 PM UTC
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // Month abbreviation for January
      expect(result).toBe('Mon 10:00 am - Thu 6:00 pm (2 Jan) UTC');
    });
  });

  describe('in-person multi-day events', () => {
    test('includes end date for multi-day in-person events', () => {
      const event: Event = {
        id: '9',
        title: 'Conference',
        url: 'https://example.com',
        location: 'SAN FRANCISCO',
        timezone: 'America/Los_Angeles',
        startAt: '2024-09-10T16:00:00Z', // Tue 4:00 PM UTC = Tue 9:00 AM PDT
        endAt: '2024-09-13T00:00:00Z', // Fri midnight UTC = Thu 5:00 PM PDT
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // en-GB abbreviates September as "Sept", GMT-7 (PDT) for Los Angeles
      expect(result).toBe('Tue 9:00 am - Thu 5:00 pm (12 Sept) GMT-7');
    });

    test('handles multi-day event in Asia timezone', () => {
      const event: Event = {
        id: '10',
        title: 'Tokyo Summit',
        url: 'https://example.com',
        location: 'TOKYO',
        timezone: 'Asia/Tokyo',
        startAt: '2024-11-20T00:00:00Z', // Wed midnight UTC = Wed 9:00 AM JST
        endAt: '2024-11-22T09:00:00Z', // Fri 9:00 AM UTC = Fri 6:00 PM JST
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // GMT+9 (JST) for Tokyo
      expect(result).toBe('Wed 9:00 am - Fri 6:00 pm (22 Nov) GMT+9');
    });
  });

  describe('edge cases', () => {
    test('handles event starting at midnight', () => {
      const event: Event = {
        id: '11',
        title: 'Midnight Event',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'UTC',
        startAt: '2024-03-15T00:00:00Z', // Fri midnight
        endAt: '2024-03-15T02:00:00Z', // Fri 2:00 AM
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // Midnight is represented as 12:00 am in 12-hour format
      expect(result).toBe('Fri 12:00 am - 2:00 am UTC');
    });

    test('handles event ending at midnight (crosses day boundary)', () => {
      const event: Event = {
        id: '12',
        title: 'Late Night Event',
        url: 'https://example.com',
        location: 'NEW YORK',
        timezone: 'America/New_York',
        startAt: '2024-03-15T02:00:00Z', // Fri 2:00 AM UTC = Thu 10:00 PM EDT
        endAt: '2024-03-15T04:00:00Z', // Fri 4:00 AM UTC = Fri midnight EDT
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // This crosses midnight in the event timezone, so it's multi-day
      expect(result).toBe('Thu 10:00 pm - Fri 12:00 am (15 Mar) GMT-4');
    });

    test('handles single hour event', () => {
      const event: Event = {
        id: '13',
        title: 'Quick Meeting',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'UTC',
        startAt: '2024-03-15T12:00:00Z', // Fri noon
        endAt: '2024-03-15T13:00:00Z', // Fri 1:00 PM
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // Noon is represented as 12:00 pm in 12-hour format
      expect(result).toBe('Fri 12:00 pm - 1:00 pm UTC');
    });

    test('handles event in different DST period', () => {
      const event: Event = {
        id: '14',
        title: 'Winter Event',
        url: 'https://example.com',
        location: 'LONDON',
        timezone: 'Europe/London',
        startAt: '2024-12-15T10:00:00Z', // Sun 10:00 AM UTC = Sun 10:00 AM GMT
        endAt: '2024-12-15T18:00:00Z', // Sun 6:00 PM UTC = Sun 6:00 PM GMT
      };

      const result = buildTimeDeltaString(event, LOCALE);

      // December is GMT, not BST
      expect(result).toBe('Sun 10:00 am - 6:00 pm GMT');
    });

    test('handles morning event with am times', () => {
      const event: Event = {
        id: '15',
        title: 'Morning Event',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'UTC',
        startAt: '2024-03-15T08:00:00Z', // Fri 8:00 AM
        endAt: '2024-03-15T11:00:00Z', // Fri 11:00 AM
      };

      const result = buildTimeDeltaString(event, LOCALE);

      expect(result).toBe('Fri 8:00 am - 11:00 am UTC');
    });
  });

  describe('locale override', () => {
    test('uses en-US locale format', () => {
      const event: Event = {
        id: '16',
        title: 'US Locale Event',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'UTC',
        startAt: '2024-03-15T14:00:00Z',
        endAt: '2024-03-15T16:00:00Z',
      };

      const result = buildTimeDeltaString(event, 'en-US');

      // en-US uses uppercase AM/PM
      expect(result).toBe('Fri 2:00 PM - 4:00 PM UTC');
    });

    test('uses en-US locale for multi-day event', () => {
      const event: Event = {
        id: '20',
        title: 'US Multi-day Event',
        url: 'https://example.com',
        location: 'ONLINE',
        timezone: 'UTC',
        startAt: '2024-03-15T09:00:00Z',
        endAt: '2024-03-17T17:00:00Z',
      };

      const result = buildTimeDeltaString(event, 'en-US');

      // en-US uses uppercase AM/PM and different date format
      expect(result).toBe('Fri 9:00 AM - Sun 5:00 PM (Mar 17) UTC');
    });
  });
});

describe('EventsSection featured events', () => {
  const mockEvents: Event[] = [
    {
      id: 'event-1',
      title: 'First Chronologically',
      startAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      location: 'LONDON',
      timezone: 'Europe/London',
      url: 'https://lu.ma/event-1',
    },
    {
      id: 'event-2',
      title: 'Second Chronologically',
      startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      location: 'ONLINE',
      timezone: 'UTC',
      url: 'https://lu.ma/event-2',
    },
    {
      id: 'event-3',
      title: 'Third Chronologically - Featured',
      startAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      location: 'NEW YORK',
      timezone: 'America/New_York',
      url: 'https://lu.ma/event-3',
    },
    {
      id: 'event-4',
      title: 'Fourth Chronologically',
      startAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      location: 'TOKYO',
      timezone: 'Asia/Tokyo',
      url: 'https://lu.ma/event-4',
    },
  ];

  beforeEach(() => {
    server.use(trpcMsw.luma.getUpcomingEvents.query(() => mockEvents));
  });

  // Helper to get event titles in order from the desktop layout (single row)
  const getDesktopEventTitles = (container: HTMLElement): string[] => {
    // Desktop layout uses flex, find the container with "hidden min-[1280px]:flex"
    const desktopContainer = container.querySelector('.hidden.min-\\[1280px\\]\\:flex');
    if (!desktopContainer) {
      return [];
    }

    const headings = desktopContainer.querySelectorAll('h3');
    return Array.from(headings).map((h) => h.textContent || '');
  };

  test('displays events in chronological order when no featured URLs provided', async () => {
    const { container } = render(<EventsSection featuredUrls={[]} />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getAllByText('First Chronologically').length).toBeGreaterThan(0);
    });

    const titles = getDesktopEventTitles(container);
    expect(titles).toEqual([
      'First Chronologically',
      'Second Chronologically',
      'Third Chronologically - Featured',
      'Fourth Chronologically',
    ]);
  });

  test('displays featured event first when featuredUrls is provided', async () => {
    const { container } = render(
      <EventsSection featuredUrls={['https://lu.ma/event-3']} />,
      { wrapper: TrpcProvider },
    );

    await waitFor(() => {
      expect(screen.getAllByText('Third Chronologically - Featured').length).toBeGreaterThan(0);
    });

    const titles = getDesktopEventTitles(container);
    expect(titles).toEqual([
      'Third Chronologically - Featured',
      'First Chronologically',
      'Second Chronologically',
      'Fourth Chronologically',
    ]);
  });

  test('handles URL normalization (trailing slashes)', async () => {
    const { container } = render(
      <EventsSection featuredUrls={['https://lu.ma/event-3/']} />,
      { wrapper: TrpcProvider },
    );

    await waitFor(() => {
      expect(screen.getAllByText('Third Chronologically - Featured').length).toBeGreaterThan(0);
    });

    const titles = getDesktopEventTitles(container);
    expect(titles[0]).toBe('Third Chronologically - Featured');
  });

  test('preserves order of multiple featured events as specified in featuredUrls', async () => {
    const { container } = render(
      <EventsSection featuredUrls={['https://lu.ma/event-4', 'https://lu.ma/event-2']} />,
      { wrapper: TrpcProvider },
    );

    await waitFor(() => {
      expect(screen.getAllByText('Fourth Chronologically').length).toBeGreaterThan(0);
    });

    const titles = getDesktopEventTitles(container);
    expect(titles).toEqual([
      'Fourth Chronologically',
      'Second Chronologically',
      'First Chronologically',
      'Third Chronologically - Featured',
    ]);
  });
});
