import createHttpError from 'http-errors';
import { z } from 'zod';
import {
  createOAuthState, isValidTimeZone, newNonce, stateCookie, verifyConnectTokenFromEnv,
} from '../../../../lib/api/calendarConnect';
import { buildGoogleAuthUrl } from '../../../../lib/api/googleCalendar';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { getUserFromAuth } from '../../../../server/trpc';

// A plain API route rather than tRPC because it sets the httpOnly cookie that the callback checks.
export default makeApiRoute({
  requestBody: z.object({
    // Optional signed link from Slack. Links this account to that Slack member, for people whose emails don't match.
    connectToken: z.string().max(2000).nullish(),
    timeZone: z.string().max(100).nullish(),
  }),
  responseBody: z.object({ authUrl: z.string() }),
}, async (body, { auth, raw: { req, res } }) => {
  if (req.method !== 'POST') {
    throw new createHttpError.MethodNotAllowed('Method not allowed');
  }

  // This route only sees the real login, not tRPC's impersonation, so it would attach the calendar to the admin
  if (req.headers['x-impersonate-user']) {
    throw new createHttpError.Forbidden('You can\'t connect calendars while impersonating someone');
  }

  const user = await getUserFromAuth(auth);
  if (!user) {
    throw new createHttpError.Unauthorized('No user record for this account. Please log in again.');
  }

  let slackUserId: string | null = null;
  if (body.connectToken) {
    slackUserId = verifyConnectTokenFromEnv(body.connectToken)?.slackUserId ?? null;
    if (!slackUserId) {
      throw new createHttpError.BadRequest('This link has expired or is invalid. Please use the latest link we sent you on Slack.');
    }
  }

  const nonce = newNonce();
  const state = await createOAuthState({
    userId: user.id,
    slackUserId,
    timeZone: body.timeZone && isValidTimeZone(body.timeZone) ? body.timeZone : null,
    nonce,
    connectToken: body.connectToken ?? null,
  });

  res.setHeader('Set-Cookie', stateCookie({ nonce }));
  return { authUrl: buildGoogleAuthUrl({ state }) };
});
