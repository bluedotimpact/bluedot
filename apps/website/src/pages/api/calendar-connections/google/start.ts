import createHttpError from 'http-errors';
import { z } from 'zod';
import {
  createOAuthState, isValidTimeZone, newNonce, stateCookie, verifyConnectTokenFromEnv,
} from '../../../../lib/api/calendarConnect';
import { getSlackUserIdForUser } from '../../../../lib/api/calendarConnections';
import { buildGoogleAuthUrl } from '../../../../lib/api/googleCalendar';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { getUserFromAuth } from '../../../../server/trpc';

// A plain API route rather than tRPC because it sets the httpOnly cookie that the callback checks.
export default makeApiRoute({
  requestBody: z.object({
    // The signed link from Slack. Optional once the account already has a connection to reuse the Slack member from.
    connectToken: z.string().max(2000).nullish(),
    timeZone: z.string().max(100).nullish(),
  }),
  responseBody: z.object({ authUrl: z.string() }),
}, async (body, { auth, raw: { req, res } }) => {
  if (req.method !== 'POST') {
    throw new createHttpError.MethodNotAllowed('Method not allowed');
  }

  const user = await getUserFromAuth(auth);
  if (!user) {
    throw new createHttpError.Unauthorized('No user record for this account. Please log in again.');
  }

  let slackUserId: string | null;
  if (body.connectToken) {
    slackUserId = verifyConnectTokenFromEnv(body.connectToken)?.slackUserId ?? null;
    if (!slackUserId) {
      throw new createHttpError.BadRequest('This link has expired or is invalid. Please use the latest link we sent you on Slack.');
    }
  } else {
    slackUserId = await getSlackUserIdForUser(user.id);
    if (!slackUserId) {
      throw new createHttpError.BadRequest('Please use the link we sent you on Slack to connect your first calendar.');
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
