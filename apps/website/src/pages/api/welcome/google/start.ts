import createHttpError from 'http-errors';
import type { NextApiRequest } from 'next';
import { z } from 'zod';
import { isValidTimeZone, newNonce } from '../../../../lib/api/calendarConnect';
import {
  WELCOME_GOOGLE_SCOPES, checkWelcomePassword, createWelcomeState, getWelcomeRedirectUri, welcomeStateCookie,
} from '../../../../lib/api/firstContact/oauth';
import { buildGoogleAuthUrl } from '../../../../lib/api/googleCalendar';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { ONE_MINUTE_MS } from '../../../../lib/constants';

const MAX_ATTEMPTS = 10;
const attemptsByIp = new Map<string, { count: number; resetAtMs: number }>();

// /welcome: checks the shared password, then sends the new hire to Google to share their free/busy times once.
// A plain API route rather than tRPC because it sets the httpOnly cookie that the callback checks.
export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    password: z.string().max(200),
    timeZone: z.string().max(100).nullish(),
  }),
  responseBody: z.object({ authUrl: z.string() }),
}, async (body, { raw: { req, res } }) => {
  if (req.method !== 'POST') {
    throw new createHttpError.MethodNotAllowed('Method not allowed');
  }

  const ip = clientIp(req);
  const nowMs = Date.now();
  let attempts = attemptsByIp.get(ip);
  if (!attempts || nowMs > attempts.resetAtMs) {
    attempts = { count: 0, resetAtMs: nowMs + ONE_MINUTE_MS };
    attemptsByIp.set(ip, attempts);
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    throw new createHttpError.TooManyRequests('Too many tries. Wait a minute, then try again.');
  }

  if (!checkWelcomePassword(body.password)) {
    attempts.count += 1;
    throw new createHttpError.Unauthorized('That password isn\'t right. You\'ll find it in your welcome email.');
  }

  const nonce = newNonce();
  const state = await createWelcomeState({
    nonce,
    timeZone: body.timeZone && isValidTimeZone(body.timeZone) ? body.timeZone : 'America/Los_Angeles',
  });

  res.setHeader('Set-Cookie', welcomeStateCookie({ nonce }));
  return {
    authUrl: buildGoogleAuthUrl({
      state, redirectUri: getWelcomeRedirectUri(), scopes: WELCOME_GOOGLE_SCOPES, offline: false,
    }),
  };
});

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]!.trim();
  return req.socket?.remoteAddress ?? 'unknown';
}
