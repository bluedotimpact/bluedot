import createHttpError from 'http-errors';
import { z } from 'zod';
import { getBusyApiSecret, secretsMatch } from '../../../lib/api/calendarConnect';
import { getBusyTimes } from '../../../lib/api/calendarConnections';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

const MAX_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

const intervalSchema = z.object({ start: z.string(), end: z.string() });

const MAX_MEMBERS = 500;
const slackUserIdSchema = z.string().min(1).max(50);
const windowSchema = {
  timeMin: z.string().datetime({ offset: true }),
  timeMax: z.string().datetime({ offset: true }),
};

// `members` carries each Slack member's email for matching. The older `slackUserIds` shape still works, with no email.
const requestSchema = z.union([
  z.object({
    members: z.array(z.object({ slackUserId: slackUserIdSchema, email: z.string().max(320).nullable() }))
      .max(MAX_MEMBERS)
      .refine((members) => new Set(members.map((m) => m.slackUserId)).size === members.length, 'Each slackUserId may appear only once'),
    ...windowSchema,
  }),
  z.object({ slackUserIds: z.array(slackUserIdSchema).max(MAX_MEMBERS), ...windowSchema })
    .transform(({ slackUserIds, ...rest }) => ({ members: slackUserIds.map((slackUserId) => ({ slackUserId, email: null })), ...rest })),
]);

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
      // How the calendars were found, for Dot-to-Dot's logs
      matchedBy: z.enum(['slack', 'email']).nullable(),
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
    members: body.members,
    timeMin: new Date(timeMinMs).toISOString(),
    timeMax: new Date(timeMaxMs).toISOString(),
  });
  return { users };
});
