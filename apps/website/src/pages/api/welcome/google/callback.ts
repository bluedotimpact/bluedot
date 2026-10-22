import { logger } from '@bluedot/ui/src/api';
import type { NextApiRequest, NextApiResponse } from 'next';
import { GOOGLE_FREEBUSY_SCOPE } from '../../../../lib/api/calendarConnect';
import { bookFirstContactChats } from '../../../../lib/api/firstContact/book';
import {
  WELCOME_PAGE_PATH, WELCOME_STATE_COOKIE_NAME, getWelcomeRedirectUri, verifyWelcomeState, welcomeStateCookie,
} from '../../../../lib/api/firstContact/oauth';
import { searchWindow } from '../../../../lib/api/firstContact/slots';
import { exchangeGoogleCodeForAccess, getGooglePrimaryBusy, revokeGoogleToken } from '../../../../lib/api/googleCalendar';

export type WelcomeError = 'cancelled' | 'missing_scope' | 'expired' | 'failed';

// Google sends the new hire back here. We read their free/busy times once, book their chats, forget the token,
// and show them who they're meeting.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  res.setHeader('Set-Cookie', welcomeStateCookie({ nonce: '', maxAgeSeconds: 0 }));
  const fail = (error: WelcomeError) => res.redirect(303, `${WELCOME_PAGE_PATH}?${new URLSearchParams({ error })}`);
  const { code, state: rawState, error: googleError } = req.query;

  let state;
  try {
    if (typeof rawState !== 'string') throw new Error('invalid');
    state = await verifyWelcomeState({ state: rawState, cookieNonce: req.cookies[WELCOME_STATE_COOKIE_NAME] });
  } catch (error) {
    logger.warn(`[FirstContact] Rejected OAuth state: ${error instanceof Error ? error.message : String(error)}`);
    fail(error instanceof Error && error.message === 'expired' ? 'expired' : 'failed');
    return;
  }

  if (googleError !== undefined || typeof code !== 'string') {
    fail(googleError === 'access_denied' ? 'cancelled' : 'failed');
    return;
  }

  try {
    const google = await exchangeGoogleCodeForAccess({ code, redirectUri: getWelcomeRedirectUri() });
    // With granular consent, people can untick the calendar permission and still sign in
    if (!google.scopes.includes(GOOGLE_FREEBUSY_SCOPE)) {
      fail('missing_scope');
      return;
    }

    const nowMs = Date.now();
    const window = searchWindow({ nowMs });
    let busy;
    try {
      busy = await getGooglePrimaryBusy({ accessToken: google.accessToken, timeMin: window.start.toISOString(), timeMax: window.end.toISOString() });
    } finally {
      await revokeGoogleToken(google.accessToken);
    }

    const result = await bookFirstContactChats({
      hire: {
        email: google.email,
        name: google.name ?? google.email.split('@')[0]!,
        timeZone: state.timeZone,
        busy: busy.map((interval) => ({ start: new Date(interval.start), end: new Date(interval.end) })),
      },
      nowMs,
    });

    const params = new URLSearchParams({
      chats: JSON.stringify(result.chats.map((chat) => ({ name: chat.teammateName, start: chat.start }))),
      missing: String(result.missing),
    });
    res.redirect(303, `${WELCOME_PAGE_PATH}?${params}`);
  } catch (error) {
    logger.error('[FirstContact] Welcome callback failed', error);
    fail('failed');
  }
}
