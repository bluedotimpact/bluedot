import { userTable } from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  CALENDARS_PAGE_PATH, GOOGLE_FREEBUSY_SCOPE, InvalidOAuthStateError, STATE_COOKIE_NAME, clearStateCookie, verifyOAuthState,
} from '../../../../lib/api/calendarConnect';
import { saveGoogleConnection } from '../../../../lib/api/calendarConnections';
import db from '../../../../lib/api/db';
import { exchangeGoogleCode } from '../../../../lib/api/googleCalendar';

export type CalendarConnectError = 'cancelled' | 'missing_scope' | 'expired' | 'failed';

// Google redirects the browser here, so there's no BlueDot bearer token. Instead the encrypted `state` names the
// BlueDot user who started the flow (an authenticated request), and the httpOnly cookie proves it's the same browser.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('Set-Cookie', clearStateCookie());
  const { code, state: rawState, error: googleError } = req.query;

  if (typeof rawState !== 'string') {
    res.redirect(303, calendarsPageUrl({ error: 'failed', connectToken: null }));
    return;
  }

  let state;
  try {
    state = await verifyOAuthState({ state: rawState, cookieNonce: req.cookies[STATE_COOKIE_NAME] });
  } catch (error) {
    if (!(error instanceof InvalidOAuthStateError)) throw error;
    logger.warn(`[CalendarConnect] Rejected OAuth state: ${error.message}`);
    res.redirect(303, calendarsPageUrl({ error: error.message === 'expired' ? 'expired' : 'failed', connectToken: null }));
    return;
  }

  const fail = (error: CalendarConnectError) => res.redirect(303, calendarsPageUrl({ error, connectToken: state.connectToken }));

  if (googleError !== undefined || typeof code !== 'string') {
    fail(googleError === 'access_denied' ? 'cancelled' : 'failed');
    return;
  }

  const user = await db.getFirst(userTable, { filter: { id: state.userId } });
  if (!user) {
    fail('failed');
    return;
  }

  try {
    const exchange = await exchangeGoogleCode(code);
    // With granular consent, people can untick the calendar permission and still sign in
    if (!exchange.scopes.includes(GOOGLE_FREEBUSY_SCOPE)) {
      fail('missing_scope');
      return;
    }

    await saveGoogleConnection({
      userId: user.id, linkedSlackUserId: state.slackUserId, timeZone: state.timeZone, exchange,
    });
  } catch (error) {
    logger.error('[CalendarConnect] Google callback failed', error);
    fail('failed');
    return;
  }

  res.redirect(303, `${CALENDARS_PAGE_PATH}?calendar=connected`);
}

function calendarsPageUrl({ error, connectToken }: { error: CalendarConnectError; connectToken: string | null }): string {
  const params = new URLSearchParams({ error });
  if (connectToken) params.set('s', connectToken);
  return `${CALENDARS_PAGE_PATH}?${params.toString()}`;
}
