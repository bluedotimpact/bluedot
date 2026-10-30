import type { CalendarProvider } from '@bluedot/db';
import { getHeadersWithValidToken } from '../utils/trpc';

/** Asks the server for the provider's consent URL (which also sets the state cookie), then sends the browser there. */
export async function startCalendarConnect({ provider, connectToken }: { provider: CalendarProvider; connectToken: string | null }): Promise<void> {
  const headers = await getHeadersWithValidToken();
  const response = await fetch(`/api/calendar-connections/${provider}/start`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      connectToken,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });

  const body = await response.json().catch(() => ({})) as { authUrl?: string; error?: string };
  if (!response.ok || !body.authUrl) {
    throw new Error(body.error ?? 'Something went wrong. Please try again.');
  }

  window.location.assign(body.authUrl);
}
