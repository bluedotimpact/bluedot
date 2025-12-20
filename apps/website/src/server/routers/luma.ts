import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { publicProcedure, router } from '../trpc';
import env from '../../lib/api/env';

// In-memory cache for Luma API responses - reduces API calls, improves response time, and handles intermittent API failures
const CACHE_TTL_MS = 60_000; // 1 minute
const FAILURE_THRESHOLD = 3; // Alert after N consecutive failures
const SLACK_ALERT_COOLDOWN_MS = 60_000; // Max 1 alert per minute

type LumaEvent = {
  name: string;
  start_at: string; // ISO 8601 Datetime, already in UTC
  end_at: string; // ISO 8601 Datetime, already in UTC
  geo_address_json?: {
    city?: string;
  };
  timezone: string; // IANA timezone, e.g. "America/New_York"
  url: string;
};

function transformEvent(api_id: string, event: LumaEvent) {
  return {
    id: api_id,
    startAt: event.start_at,
    endAt: event.end_at,
    location: event.geo_address_json?.city?.toUpperCase() || 'ONLINE',
    timezone: event.timezone,
    title: event.name,
    url: event.url,
  };
}

export type Event = ReturnType<typeof transformEvent>;

// In-memory cache state
let cachedEvents: Event[] | null = null;
let cacheTimestamp: number | null = null;
let consecutiveFailures = 0;
let lastSlackAlert: number | null = null;
let isRefreshing = false;
let refreshPromise: Promise<Event[]> | null = null;

export const lumaRouter = router({
  getUpcomingEvents: publicProcedure.query(async (): Promise<Event[]> => {
    const now = Date.now();
    const isCacheFresh = cacheTimestamp && (now - cacheTimestamp < CACHE_TTL_MS);

    // Fast path: return fresh cache
    if (isCacheFresh && cachedEvents) {
      return cachedEvents;
    }

    // Stale cache: return it, trigger background refresh if not already running
    if (cachedEvents) {
      if (!isRefreshing) {
        refreshCache();
      }
      return cachedEvents;
    }

    // No cache: wait for first fetch (reuse in-flight promise if exists)
    if (refreshPromise) {
      return refreshPromise;
    }
    return refreshCache();
  }),
});

async function refreshCache(): Promise<Event[]> {
  // If already refreshing, return the in-flight promise
  if (refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const apiKey = env.LUMA_API_KEY;

      if (!apiKey) {
        return [];
      }

      const now = new Date().toISOString();
      const url = new URL('https://public-api.luma.com/v1/calendar/list-events');
      url.searchParams.set('after', now);
      url.searchParams.set('pagination_limit', '40');
      url.searchParams.set('sort_column', 'start_at');
      url.searchParams.set('sort_direction', 'asc');

      const response = await fetch(url.toString(), {
        headers: {
          accept: 'application/json',
          'x-luma-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Luma API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as {
        entries: {
          api_id: string;
          event: LumaEvent;
        }[];
        has_more: boolean;
        next_cursor?: string;
      };

      const events = (data.entries || []).map(({ api_id, event }) => transformEvent(api_id, event));

      // Success: update cache and reset failure counter
      cachedEvents = events;
      cacheTimestamp = Date.now();
      consecutiveFailures = 0;

      return events;
    } catch (error) {
      consecutiveFailures += 1;
      // eslint-disable-next-line no-console
      console.error('Failed to fetch Luma events:', error);

      if (consecutiveFailures >= FAILURE_THRESHOLD) {
        await sendSlackAlertIfNeeded(error);
      }

      return cachedEvents || [];
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function sendSlackAlertIfNeeded(error: unknown): Promise<void> {
  const now = Date.now();

  // Rate limit: only send if last alert was > 1 minute ago
  if (lastSlackAlert && (now - lastSlackAlert < SLACK_ALERT_COOLDOWN_MS)) {
    return;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  await slackAlert(env, [
    `[LUMA] Failed to fetch events from Luma API ${consecutiveFailures} times: ${errorMessage}`,
  ]);

  lastSlackAlert = now;
}
