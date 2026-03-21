import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { publicProcedure, router } from '../trpc';
import env from '../../lib/api/env';
import { ONE_MINUTE_MS } from '../../lib/constants';
import { isPublicLumaEvent, type LumaEvent } from './luma-utils';

const CACHE_TTL_MS = ONE_MINUTE_MS;
const FAILURE_THRESHOLD = 3;
const EXCLUDED_EVENT_TITLE_SUFFIXES = ['paper reading club', 'paper reading group'];
const MAX_EVENT_PAGES = 20;

export type Event = {
  id: string;
  description?: string;
  descriptionMd?: string;
  startAt: string;
  endAt: string;
  location: string;
  timezone: string;
  title: string;
  url: string;
};

function transformEvent(api_id: string, event: LumaEvent): Event {
  return {
    id: api_id,
    description: event.description,
    descriptionMd: event.description_md,
    startAt: event.start_at,
    endAt: event.end_at,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    location: event.geo_address_json?.city?.toUpperCase() || 'ONLINE',
    timezone: event.timezone,
    title: event.name,
    url: event.url,
  };
}

export type EventStats = {
  totalEvents: number;
  onlineEvents: number;
  cities: number;
  firstEventStartAt: string | null;
};

type LumaListEventsResponse = {
  entries: {
    api_id: string;
    event: LumaEvent;
  }[];
  has_more: boolean;
  next_cursor?: string;
};

let cachedUpcomingEvents: Event[] | null = null;
let upcomingEventsCacheTimestamp: number | null = null;
let cachedEventStats: EventStats | null = null;
let eventStatsCacheTimestamp: number | null = null;
let consecutiveFailures = 0;
let isRefreshingUpcomingEvents = false;
let isRefreshingEventStats = false;
let refreshUpcomingEventsPromise: Promise<Event[]> | null = null;
let refreshEventStatsPromise: Promise<EventStats> | null = null;

export const lumaRouter = router({
  getUpcomingEvents: publicProcedure.query(async (): Promise<Event[]> => {
    const now = Date.now();
    const isCacheFresh = upcomingEventsCacheTimestamp && (now - upcomingEventsCacheTimestamp < CACHE_TTL_MS);

    if (isCacheFresh && cachedUpcomingEvents) {
      return cachedUpcomingEvents;
    }

    if (cachedUpcomingEvents) {
      if (!isRefreshingUpcomingEvents) {
        refreshUpcomingEvents();
      }

      return cachedUpcomingEvents;
    }

    if (refreshUpcomingEventsPromise) {
      return refreshUpcomingEventsPromise;
    }

    return refreshUpcomingEvents();
  }),
  getEventStats: publicProcedure.query(async (): Promise<EventStats> => {
    const now = Date.now();
    const isCacheFresh = eventStatsCacheTimestamp && (now - eventStatsCacheTimestamp < CACHE_TTL_MS);

    if (isCacheFresh && cachedEventStats) {
      return cachedEventStats;
    }

    if (cachedEventStats) {
      if (!isRefreshingEventStats) {
        refreshEventStats();
      }

      return cachedEventStats;
    }

    if (refreshEventStatsPromise) {
      return refreshEventStatsPromise;
    }

    return refreshEventStats();
  }),
});

function buildListEventsUrl({
  after,
  cursor,
}: {
  after?: string;
  cursor?: string;
}) {
  const url = new URL('https://public-api.luma.com/v1/calendar/list-events');
  url.searchParams.set('pagination_limit', '100');
  url.searchParams.set('sort_column', 'start_at');
  url.searchParams.set('sort_direction', 'asc');

  if (after) {
    url.searchParams.set('after', after);
  }

  if (cursor) {
    url.searchParams.set('pagination_cursor', cursor);
  }

  return url;
}

function filterAndTransformEvents(entries: LumaListEventsResponse['entries']) {
  return (entries ?? [])
    .filter(({ event }) => isPublicLumaEvent(event))
    .map(({ api_id, event }) => transformEvent(api_id, event))
    .filter((event) => {
      const titleLower = event.title.toLowerCase();
      return !EXCLUDED_EVENT_TITLE_SUFFIXES.some((suffix) => titleLower.endsWith(suffix));
    });
}

function summarizeEvents(events: Event[]): EventStats {
  const cities = new Set(events.filter((event) => event.location !== 'ONLINE').map((event) => event.location)).size;

  const firstEventStartAt = events.reduce<string | null>((earliest, event) => {
    if (!earliest || event.startAt < earliest) {
      return event.startAt;
    }

    return earliest;
  }, null);

  return {
    totalEvents: events.length,
    onlineEvents: events.filter((event) => event.location === 'ONLINE').length,
    cities,
    firstEventStartAt,
  };
}

async function fetchPublicEvents({ after }: { after?: string } = {}): Promise<Event[]> {
  const apiKey = env.LUMA_API_KEY;

  if (!apiKey) {
    return [];
  }

  const events: Event[] = [];
  let cursor: string | undefined;
  let pagesFetched = 0;

  do {
    // Cursor-based pagination is sequential: each request depends on the previous page's cursor.
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(buildListEventsUrl({ after, cursor }).toString(), {
      headers: {
        accept: 'application/json',
        'x-luma-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Luma API returned ${response.status}: ${response.statusText}`);
    }

    // eslint-disable-next-line no-await-in-loop
    const data = await response.json() as LumaListEventsResponse;
    events.push(...filterAndTransformEvents(data.entries));
    cursor = data.has_more ? data.next_cursor : undefined;
    pagesFetched += 1;
  } while (cursor && pagesFetched < MAX_EVENT_PAGES);

  return events;
}

async function handleRefreshFailure<T>(error: unknown, fallbackValue: T): Promise<T> {
  consecutiveFailures += 1;
  // eslint-disable-next-line no-console
  console.error('Failed to fetch Luma events:', error);

  if (consecutiveFailures >= FAILURE_THRESHOLD) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await slackAlert(env, [`[LUMA] Failed to fetch events from Luma API ${consecutiveFailures} times: ${errorMessage}`], { batchKey: 'luma-api-errors' });
  }

  return fallbackValue;
}

async function refreshUpcomingEvents(): Promise<Event[]> {
  if (refreshUpcomingEventsPromise) {
    return refreshUpcomingEventsPromise;
  }

  isRefreshingUpcomingEvents = true;

  refreshUpcomingEventsPromise = (async () => {
    try {
      const events = await fetchPublicEvents({ after: new Date().toISOString() });

      cachedUpcomingEvents = events;
      upcomingEventsCacheTimestamp = Date.now();
      consecutiveFailures = 0;

      return events;
    } catch (error) {
      return await handleRefreshFailure(error, cachedUpcomingEvents ?? []);
    } finally {
      isRefreshingUpcomingEvents = false;
      refreshUpcomingEventsPromise = null;
    }
  })();

  return refreshUpcomingEventsPromise;
}

async function refreshEventStats(): Promise<EventStats> {
  if (refreshEventStatsPromise) {
    return refreshEventStatsPromise;
  }

  isRefreshingEventStats = true;

  refreshEventStatsPromise = (async () => {
    try {
      const events = await fetchPublicEvents();
      const stats = summarizeEvents(events);

      cachedEventStats = stats;
      eventStatsCacheTimestamp = Date.now();
      consecutiveFailures = 0;

      return stats;
    } catch (error) {
      return await handleRefreshFailure(error, cachedEventStats ?? {
        totalEvents: 0,
        onlineEvents: 0,
        cities: 0,
        firstEventStartAt: null,
      });
    } finally {
      isRefreshingEventStats = false;
      refreshEventStatsPromise = null;
    }
  })();

  return refreshEventStatsPromise;
}
