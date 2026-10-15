import createHttpError from 'http-errors';
import { z } from 'zod';
import { getBusyApiSecret, secretsMatch } from '../../../lib/api/calendarConnect';
import { getBusyTimes } from '../../../lib/api/calendarConnections';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

const MAX_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const intervalSchema = z.object({ start: z.string(), end: z.string() });

const requestSchema = z.object({
  slackUserIds: z.array(z.string().min(1).max(50)).max(500),
  timeMin: z.string().datetime({ offset: true }),
  timeMax: z.string().datetime({ offset: true }),
});

// Private endpoint for Dot-to-Dot (bluedotimpact/dot-to-dot src/bluedot.ts). Authenticated by a shared bearer secret,
// not a user login. Returns only busy intervals; tokens never leave the website.
export default makeApiRoute({
  requireAuth: false,
  // Parsed below, after the secret check, so unauthenticated callers learn nothing about the shape
  requestBody: z.unknown(),
  responseBody: z.object({
    users: z.record(z.string(), z.object({
      connected: z.boolean(),
      timeZone: z.string().nullable(),
      email: z.string().nullable(),
      busy: z.array(intervalSchema),
      errors: z.array(z.string()),
    })),
  }),
}, async (rawBody, { raw: { req, res } }) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    throw new createHttpError.MethodNotAllowed('Method not allowed');
  }

  const secret = getBusyApiSecret();
  const authHeader = req.headers.authorization ?? '';
  const given = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!given || !secretsMatch(given, secret)) {
    throw new createHttpError.Unauthorized('Invalid token');
  }

  const parsed = requestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new createHttpError.BadRequest(`Invalid request body: ${parsed.error.message}`);
  }

  const body = parsed.data;
  const timeMinMs = Date.parse(body.timeMin);
  const timeMaxMs = Date.parse(body.timeMax);
  if (timeMaxMs <= timeMinMs) {
    throw new createHttpError.BadRequest('timeMax must be after timeMin');
  }

  if (timeMaxMs - timeMinMs > MAX_WINDOW_MS) {
    throw new createHttpError.BadRequest('The window can be at most 14 days');
  }

  const users = await getBusyTimes({
    slackUserIds: body.slackUserIds,
    timeMin: new Date(timeMinMs).toISOString(),
    timeMax: new Date(timeMaxMs).toISOString(),
  });
  return { users };
});
