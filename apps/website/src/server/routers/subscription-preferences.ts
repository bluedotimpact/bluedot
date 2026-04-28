import { createHmac, timingSafeEqual } from 'crypto';
import { TRPCError } from '@trpc/server';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import env from '../../lib/api/env';

const CIO_API_BASE = 'https://api-eu.customer.io/v1';
const CIO_TRACK_BASE = 'https://track-eu.customer.io/api/v1';

const HIRING_TOPIC_ID = 16;
const HIRING_SEGMENT_ID = 365;

function verifyToken(customerId: string, token: string): boolean {
  if (!env.CIO_HMAC_SECRET) {
    return false;
  }

  const expected = createHmac('sha256', env.CIO_HMAC_SECRET)
    .update(customerId)
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

async function fetchSegmentPage(segmentId: number, headers: Record<string, string>, cursor?: string) {
  const url = new URL(`${CIO_API_BASE}/segments/${segmentId}/membership`);
  if (cursor) url.searchParams.set('next', cursor);

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch segment membership' });
  }

  return res.json() as Promise<{ identifiers: { cio_id: string }[]; next: string }>;
}

const MAX_SEGMENT_PAGES = 50;

async function getSegmentMemberCioIds(segmentId: number, headers: Record<string, string>): Promise<string[]> {
  const cioIds: string[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < MAX_SEGMENT_PAGES; page++) {
    // Each page depends on the cursor from the previous page
    const data = await fetchSegmentPage(segmentId, headers, cursor); // eslint-disable-line no-await-in-loop
    cioIds.push(...(data.identifiers ?? []).map((c) => c.cio_id));
    cursor = data.next || undefined;
    if (!cursor) break;
  }

  if (cursor) {
    await slackAlert(env, [`[CIO] Segment ${segmentId} membership exceeded ${MAX_SEGMENT_PAGES} pages — results may be incomplete`]);
  }

  return cioIds;
}

// Shape returned by GET /v1/customers/{id}/subscription_preferences
type CioTopic = {
  id: number;
  subscribed: boolean;
  name: string;
  description: string;
};

export type SubscriptionTopic = {
  id: number;
  name: string;
  description: string;
  subscribed: boolean;
};

export const subscriptionPreferencesRouter = router({
  getPreferences: publicProcedure
    .input(z.object({ cid: z.string().min(1), token: z.string().min(1) }))
    .query(async ({ input }) => {
      if (!verifyToken(input.cid, input.token)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired link' });
      }

      const apiKey = env.CIO_APP_API_KEY;
      if (!apiKey) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Not configured' });

      const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

      // Fetch preferences and segment membership in parallel.
      // The preferences endpoint returns all topics with name, description and subscribed status,
      // so no separate subscription_topics call is needed.
      const [prefsRes, segmentMemberIds] = await Promise.all([
        fetch(`${CIO_API_BASE}/customers/${input.cid}/subscription_preferences`, { headers }),
        getSegmentMemberCioIds(HIRING_SEGMENT_ID, headers),
      ]);

      if (!prefsRes.ok) {
        if (prefsRes.status === 404) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
        }

        await slackAlert(env, [`[CIO] Failed to fetch subscription preferences: HTTP ${prefsRes.status}`]);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch preferences' });
      }

      const prefsData = await prefsRes.json() as { customer: { topics: CioTopic[] } };

      const isHiringManager = segmentMemberIds.includes(input.cid);

      const allTopics: SubscriptionTopic[] = prefsData.customer.topics;

      const visibleTopics = allTopics.filter((topic) => {
        if (topic.id === HIRING_TOPIC_ID) return isHiringManager || topic.subscribed;
        return true;
      });

      return { topics: visibleTopics };
    }),

  savePreferences: publicProcedure
    .input(z.object({
      cid: z.string().min(1),
      token: z.string().min(1),
      // Record of topic_<id> -> boolean, only for topics shown to the user.
      // Never send false for hidden topics (e.g. hiring topic for non-hiring managers).
      preferences: z.record(z.boolean()),
    }))
    .mutation(async ({ input }) => {
      if (!verifyToken(input.cid, input.token)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired link' });
      }

      const trackApiKey = env.CIO_TRACK_API_KEY;
      if (!trackApiKey) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Not configured' });

      let res: Response;
      try {
        res = await fetch(`${CIO_TRACK_BASE}/customers/cio_${input.cid}`, {
          method: 'PUT',
          headers: {
            Authorization: `Basic ${Buffer.from(trackApiKey).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cio_subscription_preferences: { topics: input.preferences },
          }),
        });
      } catch (error) {
        await slackAlert(env, [`[CIO] Network error saving subscription preferences: ${error instanceof Error ? error.message : String(error)}`]);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save preferences', cause: error });
      }

      if (!res.ok) {
        await slackAlert(env, [`[CIO] Failed to save subscription preferences: HTTP ${res.status}`]);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save preferences' });
      }

      return { success: true };
    }),
});
