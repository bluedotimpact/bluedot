import { createHmac, timingSafeEqual } from 'crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../trpc';
import env from '../../lib/api/env';

const CIO_API_BASE = 'https://api-eu.customer.io/v1';
const CIO_TRACK_BASE = 'https://track-eu.customer.io/api/v1';

const HIRING_TOPIC_ID = 16;
const HIRING_SEGMENT_ID = 365;

function verifyToken(customerId: string, token: string): boolean {
  if (!env.CIO_HMAC_SECRET) return false;
  const expected = createHmac('sha256', env.CIO_HMAC_SECRET)
    .update(customerId)
    .digest('hex');
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
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
    .input(z.object({ cid: z.string(), token: z.string() }))
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
      // Segment endpoint: GET /v1/segments/{id}/membership returns identifiers[].cio_id
      const [prefsRes, segmentRes] = await Promise.all([
        fetch(`${CIO_API_BASE}/customers/${input.cid}/subscription_preferences`, { headers }),
        fetch(`${CIO_API_BASE}/segments/${HIRING_SEGMENT_ID}/membership`, { headers }),
      ]);

      if (!prefsRes.ok) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
      }

      const [prefsData, segmentData] = await Promise.all([
        prefsRes.json() as Promise<{ customer: { topics: CioTopic[] } }>,
        segmentRes.json() as Promise<{ identifiers: { cio_id: string }[] }>,
      ]);

      const isHiringManager = (segmentData.identifiers ?? []).some((c) => c.cio_id === input.cid);

      const allTopics: SubscriptionTopic[] = prefsData.customer.topics;

      const visibleTopics = allTopics.filter((topic) => {
        if (topic.id === HIRING_TOPIC_ID) return isHiringManager || topic.subscribed;
        return true;
      });

      return { topics: visibleTopics };
    }),

  savePreferences: publicProcedure
    .input(z.object({
      cid: z.string(),
      token: z.string(),
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
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save preferences' });
      }

      if (!res.ok) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save preferences' });
      }

      return { success: true };
    }),
});
