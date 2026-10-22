// Plain-fetch client for the few Google endpoints Calendar Connect uses.

import { decodeJwt } from 'jose';
import { GOOGLE_SCOPES, getGoogleClientCredentials, getGoogleRedirectUri } from './calendarConnect';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';
const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com']);

export type BusyInterval = { start: string; end: string };

/** The refresh token no longer works (revoked, expired, or the account was deleted). Reconnecting is the only fix. */
export class GoogleInvalidGrantError extends Error {
  constructor() {
    super('Access was revoked or has expired');
    this.name = 'GoogleInvalidGrantError';
  }
}

/** Google refused the calendar request itself, e.g. the scope was removed. Also needs a reconnect. */
export class GoogleCalendarAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleCalendarAccessError';
  }
}

export function buildGoogleAuthUrl({
  state, redirectUri = getGoogleRedirectUri(), scopes = GOOGLE_SCOPES, offline = true,
}: {
  state: string;
  redirectUri?: string;
  scopes?: string[];
  // Offline + consent so Google always returns a refresh token, even when reconnecting the same account.
  // Online is for one-off reads, like the /welcome page, which never stores a token.
  offline?: boolean;
}): string {
  const { clientId } = getGoogleClientCredentials();
  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', scopes.join(' '));
  url.searchParams.set('access_type', offline ? 'offline' : 'online');
  url.searchParams.set('prompt', offline ? 'consent' : 'select_account');
  url.searchParams.set('include_granted_scopes', 'false');
  url.searchParams.set('state', state);
  return url.toString();
}

export type GoogleTokenExchange = {
  refreshToken: string;
  scopes: string[];
  accountId: string;
  email: string;
};

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenExchange> {
  const body = await requestTokens({ code, redirectUri: getGoogleRedirectUri() });
  if (!body.refresh_token) throw new Error('Google token exchange returned no refresh_token');
  const claims = checkIdToken(body.id_token);

  return {
    refreshToken: body.refresh_token,
    scopes: (body.scope ?? '').split(' ').filter(Boolean),
    accountId: claims.sub,
    email: claims.email,
  };
}

export type GoogleAccessExchange = {
  accessToken: string;
  scopes: string[];
  email: string;
  name: string | null;
};

/** For one-off reads: returns a short-lived access token and who signed in. */
export async function exchangeGoogleCodeForAccess({ code, redirectUri }: { code: string; redirectUri: string }): Promise<GoogleAccessExchange> {
  const body = await requestTokens({ code, redirectUri });
  if (!body.access_token) throw new Error('Google token exchange returned no access_token');
  const claims = checkIdToken(body.id_token);

  return {
    accessToken: body.access_token,
    scopes: (body.scope ?? '').split(' ').filter(Boolean),
    email: claims.email,
    name: claims.name,
  };
}

async function requestTokens({ code, redirectUri }: { code: string; redirectUri: string }) {
  const { clientId, clientSecret } = getGoogleClientCredentials();
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed: HTTP ${response.status} ${await response.text()}`);
  }

  return response.json() as Promise<{ access_token?: string; refresh_token?: string; scope?: string; id_token?: string }>;
}

// The id_token came straight from Google's token endpoint over TLS, in exchange for our client secret, so
// OpenID Connect lets us trust it without checking the signature (OIDC Core 3.1.3.7). We still check who it's for.
function checkIdToken(idToken: string | undefined): { sub: string; email: string; name: string | null } {
  if (!idToken) throw new Error('Google token exchange returned no id_token');
  const claims = decodeJwt(idToken);
  if (claims.aud !== getGoogleClientCredentials().clientId) throw new Error('Google id_token audience mismatch');
  if (typeof claims.iss !== 'string' || !GOOGLE_ISSUERS.has(claims.iss)) throw new Error('Google id_token issuer mismatch');
  if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('Google id_token has no sub');
  if (typeof claims.email !== 'string' || !claims.email) throw new Error('Google id_token has no email');
  return { sub: claims.sub, email: claims.email, name: typeof claims.name === 'string' && claims.name.trim() ? claims.name.trim() : null };
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = getGoogleClientCredentials();
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    if (response.status === 400 && text.includes('invalid_grant')) throw new GoogleInvalidGrantError();
    throw new Error(`Google token refresh failed: HTTP ${response.status}`);
  }

  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error('Google token refresh returned no access_token');
  return body.access_token;
}

export async function getGooglePrimaryBusy({ accessToken, timeMin, timeMax }: { accessToken: string; timeMin: string; timeMax: string }): Promise<BusyInterval[]> {
  const response = await fetch(FREEBUSY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: 'primary' }] }),
  });
  if (response.status === 401 || response.status === 403) {
    throw new GoogleCalendarAccessError(`Google refused the free/busy request (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(`Google free/busy request failed: HTTP ${response.status}`);
  }

  const body = await response.json() as { calendars?: Record<string, { busy?: BusyInterval[]; errors?: { reason?: string }[] }> };
  const primary = body.calendars?.primary;
  if (!primary) throw new Error('Google free/busy response had no primary calendar');
  if (primary.errors?.length) {
    throw new GoogleCalendarAccessError(`Google could not read the primary calendar: ${primary.errors.map((e) => e.reason ?? 'unknown').join(', ')}`);
  }

  return primary.busy ?? [];
}

/** Best effort: the row is deleted whether or not Google accepts this. */
export async function revokeGoogleToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
