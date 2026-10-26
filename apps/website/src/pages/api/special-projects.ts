import type { NextApiRequest, NextApiResponse } from 'next';
import { AirtableInsertReplicationError, specialProjectSubmissionTable } from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import createHttpError from 'http-errors';
import { z } from 'zod';
import db from '../../lib/api/db';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { specialProjectSubmissionSchema } from '../../lib/special-projects';

export const config = { api: { bodyParser: { sizeLimit: '64kb' } } };

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
let windowStartedAtMs = 0;
let requestsInWindow = 0;

// A plain JSON endpoint lets external agents use the same intake as the browser form.
const submit = makeApiRoute({
  requireAuth: false,
  requestBody: specialProjectSubmissionSchema,
  responseBody: z.object({ received: z.literal(true), reference: z.string() }),
}, async (submission, { raw: { res } }) => {
  // This aggregate write cap protects Airtable; invalid bodies must not consume it.
  // Per-client limiting needs a trusted proxy identity, which this route does not have.
  const nowMs = Date.now();
  if (nowMs - windowStartedAtMs >= WINDOW_MS) {
    windowStartedAtMs = nowMs;
    requestsInWindow = 0;
  }

  if (requestsInWindow >= MAX_REQUESTS_PER_WINDOW) {
    res.setHeader('Retry-After', Math.max(1, Math.ceil((windowStartedAtMs + WINDOW_MS - nowMs) / 1000)));
    throw new createHttpError.TooManyRequests('Too many submissions. Please try again after the Retry-After delay.');
  }

  requestsInWindow += 1;
  try {
    const record = await db.insert(specialProjectSubmissionTable, {
      ...submission,
      title: submission.outcome.replace(/\s+/g, ' ').slice(0, 160),
      submitterType: submission.submitterType === 'agent' ? 'AI agent' : 'Person',
      submittedAtSeconds: Math.floor(nowMs / 1000),
      status: 'New',
    });
    return { received: true as const, reference: record.id };
  } catch (error) {
    if (!(error instanceof AirtableInsertReplicationError)) throw error;

    // The review inbox is Airtable. Its sync service can repair the mirror; do not invite a duplicate insert.
    logger.error(`Special Projects submission ${error.recordId} saved in Airtable; Postgres replication failed.`);
    return { received: true as const, reference: error.recordId };
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Submit a project using POST with a JSON body. See /special-projects#agents.' });
    return;
  }

  if (req.headers['content-type']?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    res.status(415).json({ error: 'Use Content-Type: application/json.' });
    return;
  }

  await submit(req, res);
}
