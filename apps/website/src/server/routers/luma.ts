import { publicProcedure, router } from '../trpc';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import env from '../../lib/api/env';

type Event = {
  id: string;
  month: string;
  day: string;
  location: string;
  title: string;
  time: string;
  url: string;
};

export const lumaRouter = router({
  getUpcomingEvents: publicProcedure.query(async (): Promise<Event[]> => {
    const apiKey = env.LUMA_API_KEY;

    if (!apiKey) {
      console.warn('LUMA_API_KEY not configured - no events will be displayed');
      return [];
    }

    try {
      const now = new Date().toISOString();
      const url = new URL('https://public-api.luma.com/v1/calendar/list-events');
      url.searchParams.set('after', now);
      url.searchParams.set('pagination_limit', '4');
      url.searchParams.set('sort_column', 'start_at');
      url.searchParams.set('sort_direction', 'asc');

      const response = await fetch(url.toString(), {
        headers: {
          'accept': 'application/json',
          'x-luma-api-key': apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Luma API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as {
        entries: Array<{
          api_id: string;
          event: {
            name: string;
            start_at: string;
            end_at: string;
            geo_address_info?: {
              city?: string;
            };
            url: string;
          };
        }>;
        has_more: boolean;
        next_cursor?: string;
      };

      return (data.entries || []).map(({ api_id, event }) => ({
        id: api_id,
        month: new Date(event.start_at).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: new Date(event.start_at).getDate().toString(),
        location: event.geo_address_info?.city?.toUpperCase() || 'REMOTE',
        title: event.name,
        time: formatStartAndEndTime(event.start_at, event.end_at),
        url: event.url,
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to fetch Luma events:', error);

      await slackAlert(env, [
        `[LUMA] Failed to fetch events from Luma API: ${errorMessage}`,
      ]);

      return [];
    }
  }),
});

function formatStartAndEndTime(startAt: string, endAt: string): string {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${startTime} - ${endTime}`;
}
