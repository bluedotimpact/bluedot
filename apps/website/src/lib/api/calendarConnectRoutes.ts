// The start and callback routes for each calendar provider. Google and Microsoft differ only in their OAuth details.

import { userTable, type CalendarProvider } from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import createHttpError from 'http-errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getUserFromAuth } from '../../server/trpc';
import {
  CALENDARS_PAGE_PATH, InvalidOAuthStateError, STATE_COOKIE_NAME, clearStateCookie, createOAuthState, isValidTimeZone,
  newNonce, stateCookie, verifyConnectTokenFromEnv, verifyOAuthState,
} from './calendarConnect';
import { saveConnection, type ProviderTokenExchange } from './calendarConnections';
import db from './db';
import { makeApiRoute } from './makeApiRoute';

// Shown on /account/calendars (ERROR_MESSAGES in pages/account/calendars/index.tsx)
export type CalendarConnectError = 'cancelled' | 'missing_scope' | 'needs_admin' | 'expired' | 'failed';

const PROVIDER_LABELS: Record<CalendarProvider, string> = { google: 'Google', microsoft: 'Microsoft' };

// A plain API route rather than tRPC because it sets the httpOnly cookie that the callback checks.
export function makeCalendarStartRoute({ buildAuthUrl }: { buildAuthUrl: (args: { state: string }) => string }) {
  return makeApiRoute({
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

    // Built before setting the cookie, so a provider that isn't configured here fails cleanly
    const authUrl = buildAuthUrl({ state });
    res.setHeader('Set-Cookie', stateCookie({ nonce }));
    return { authUrl };
  });
}

export type CalendarCallbackConfig = {
  provider: CalendarProvider;
  exchangeCode: (code: string) => Promise<ProviderTokenExchange>;
  hasCalendarScope: (scopes: string[]) => boolean;
  /** Maps the provider's `error` redirect (and its description) to what we show the person */
  classifyProviderError: (args: { error: string; description: string | undefined }) => CalendarConnectError;
};

// The provider redirects the browser here, so there's no BlueDot bearer token. Instead the encrypted `state` names the
// BlueDot user who started the flow (an authenticated request), and the httpOnly cookie proves it's the same browser.
export function makeCalendarCallbackHandler({
  provider, exchangeCode, hasCalendarScope, classifyProviderError,
}: CalendarCallbackConfig) {
  const label = PROVIDER_LABELS[provider];

  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    res.setHeader('Set-Cookie', clearStateCookie());
    const {
      code, state: rawState, error: providerError, error_description: providerErrorDescription,
    } = req.query;

    if (typeof rawState !== 'string') {
      res.redirect(303, calendarsPageUrl({ error: 'failed', connectToken: null }));
      return;
    }

    let state;
    try {
      state = await verifyOAuthState({ state: rawState, cookieNonce: req.cookies[STATE_COOKIE_NAME] });
    } catch (error) {
      if (!(error instanceof InvalidOAuthStateError)) throw error;
      logger.warn(`[CalendarConnect] Rejected ${label} OAuth state: ${error.message}`);
      res.redirect(303, calendarsPageUrl({ error: error.message === 'expired' ? 'expired' : 'failed', connectToken: null }));
      return;
    }

    const fail = (error: CalendarConnectError) => res.redirect(303, calendarsPageUrl({ error, connectToken: state.connectToken }));

    if (providerError !== undefined || typeof code !== 'string') {
      if (typeof providerError === 'string') {
        const description = typeof providerErrorDescription === 'string' ? providerErrorDescription : undefined;
        logger.warn(`[CalendarConnect] ${label} sign-in returned ${providerError}${description ? `: ${description}` : ''}`);
        fail(classifyProviderError({ error: providerError, description }));
      } else {
        fail('failed');
      }

      return;
    }

    const user = await db.getFirst(userTable, { filter: { id: state.userId } });
    if (!user) {
      fail('failed');
      return;
    }

    try {
      const exchange = await exchangeCode(code);
      // People can untick the calendar permission (Google's granular consent) and still sign in
      if (!hasCalendarScope(exchange.scopes)) {
        fail('missing_scope');
        return;
      }

      await saveConnection({
        provider, userId: user.id, linkedSlackUserId: state.slackUserId, timeZone: state.timeZone, exchange,
      });
    } catch (error) {
      logger.error(`[CalendarConnect] ${label} callback failed`, error);
      fail('failed');
      return;
    }

    res.redirect(303, `${CALENDARS_PAGE_PATH}?calendar=connected`);
  };
}

function calendarsPageUrl({ error, connectToken }: { error: CalendarConnectError; connectToken: string | null }): string {
  const params = new URLSearchParams({ error });
  if (connectToken) params.set('s', connectToken);
  return `${CALENDARS_PAGE_PATH}?${params.toString()}`;
}
