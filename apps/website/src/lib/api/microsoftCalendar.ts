// Plain-fetch client for the few Microsoft identity platform and Graph endpoints Calendar Connect uses.

import { decodeJwt } from 'jose';
import { MICROSOFT_SCOPES, getMicrosoftClientCredentials, getMicrosoftRedirectUri } from './calendarConnect';
import type { BusyInterval } from './googleCalendar';

// `common` lets both personal Microsoft accounts and any organisation's work or school accounts sign in
const AUTHORITY = 'https://login.microsoftonline.com/common/oauth2/v2.0';
const AUTH_URL = `${AUTHORITY}/authorize`;
const TOKEN_URL = `${AUTHORITY}/token`;
const CALENDAR_VIEW_URL = 'https://graph.microsoft.com/v1.0/me/calendar/calendarView';
// Only what's needed to tell busy from free. Never subject, body, location or attendees.
const CALENDAR_VIEW_FIELDS = 'start,end,showAs,isCancelled,responseStatus';
const PAGE_SIZE = 100;
// A fortnight of a very busy calendar is a few hundred events; stop well before a runaway loop
const MAX_PAGES = 20;
// Everything except free and workingElsewhere, matching Outlook's own free/busy view. `unknown` errs towards busy.
const FREE_STATUSES = new Set(['free', 'workingElsewhere']);
// Errors that only the person can fix, by signing in again
const RECONNECT_ERRORS = new Set(['invalid_grant', 'interaction_required', 'consent_required']);

/** The refresh token no longer works (revoked, expired, or the organisation now needs sign-in again). Reconnecting is the only fix. */
export class MicrosoftInvalidGrantError extends Error {
  constructor() {
    super('Access was revoked or has expired');
    this.name = 'MicrosoftInvalidGrantError';
  }
}

/** Graph refused the calendar request itself, e.g. the account has no Outlook mailbox. Also needs a reconnect. */
export class MicrosoftCalendarAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MicrosoftCalendarAccessError';
  }
}

export function buildMicrosoftAuthUrl({ state }: { state: string }): string {
  const { clientId } = getMicrosoftClientCredentials();
  const url = new URL(AUTH_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getMicrosoftRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('response_mode', 'query');
  url.searchParams.set('scope', MICROSOFT_SCOPES.join(' '));
  // Not prompt=consent: in organisations where an admin approved the app, forcing user consent can block people
  url.searchParams.set('prompt', 'select_account');
  url.searchParams.set('state', state);
  return url.toString();
}

export type MicrosoftTokenExchange = {
  refreshToken: string;
  scopes: string[];
  accountId: string;
  email: string;
};

type TokenResponse = { access_token?: string; refresh_token?: string; scope?: string; id_token?: string };

async function postToken(params: Record<string, string>): Promise<TokenResponse> {
  const { clientId, clientSecret } = getMicrosoftClientCredentials();
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...params }),
  });
  if (!response.ok) {
    const text = await response.text();
    let error: string | undefined;
    try {
      error = (JSON.parse(text) as { error?: string }).error;
    } catch {
      // Not JSON, so not a reconnect error
    }

    if (response.status === 400 && error && RECONNECT_ERRORS.has(error)) throw new MicrosoftInvalidGrantError();
    throw new Error(`Microsoft token request failed: HTTP ${response.status}${error ? ` ${error}` : ''}`);
  }

  return response.json() as Promise<TokenResponse>;
}

export async function exchangeMicrosoftCode(code: string): Promise<MicrosoftTokenExchange> {
  const { clientId } = getMicrosoftClientCredentials();
  const body = await postToken({
    code,
    redirect_uri: getMicrosoftRedirectUri(),
    grant_type: 'authorization_code',
    scope: MICROSOFT_SCOPES.join(' '),
  });
  if (!body.id_token) throw new Error('Microsoft token exchange returned no id_token');
  if (!body.refresh_token) throw new Error('Microsoft token exchange returned no refresh_token');

  // As with Google, the id_token came straight from the token endpoint over TLS in exchange for our client secret, so
  // OpenID Connect lets us trust it without checking the signature (OIDC Core 3.1.3.7). We still check who it's for.
  const claims = decodeJwt(body.id_token);
  if (claims.aud !== clientId) throw new Error('Microsoft id_token audience mismatch');
  // With the `common` authority the issuer names the person's own directory (a fixed id for personal accounts)
  if (typeof claims.tid !== 'string' || claims.iss !== `https://login.microsoftonline.com/${claims.tid}/v2.0`) {
    throw new Error('Microsoft id_token issuer mismatch');
  }

  if (typeof claims.sub !== 'string' || !claims.sub) throw new Error('Microsoft id_token has no sub');
  const email = [claims.email, claims.preferred_username].find((value): value is string => typeof value === 'string' && value.includes('@'));
  if (!email) throw new Error('Microsoft id_token has no email');

  return {
    refreshToken: body.refresh_token,
    scopes: (body.scope ?? '').split(' ').filter(Boolean),
    accountId: claims.sub,
    email,
  };
}

/** Graph lists scopes either as full URIs or bare names, depending on the account type */
export function hasMicrosoftCalendarScope(scopes: string[]): boolean {
  return scopes.some((scope) => scope.toLowerCase().replace(/^https:\/\/graph\.microsoft\.com\//, '') === 'calendars.readbasic');
}

export type MicrosoftAccessToken = {
  accessToken: string;
  // Microsoft hands out a new refresh token on every refresh. The old one keeps working until it expires,
  // but the new one should be stored so the connection doesn't age out.
  refreshToken: string | null;
};

export async function refreshMicrosoftAccessToken(refreshToken: string): Promise<MicrosoftAccessToken> {
  const body = await postToken({
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
    scope: MICROSOFT_SCOPES.join(' '),
  });
  if (!body.access_token) throw new Error('Microsoft token refresh returned no access_token');
  return { accessToken: body.access_token, refreshToken: body.refresh_token ?? null };
}

type GraphEvent = {
  start?: { dateTime?: string; timeZone?: string };
  end?: { dateTime?: string; timeZone?: string };
  showAs?: string;
  isCancelled?: boolean;
  responseStatus?: { response?: string };
};

/** Busy times on the person's default calendar, the Outlook equivalent of Google's primary calendar. */
export async function getMicrosoftDefaultBusy({ accessToken, timeMin, timeMax }: { accessToken: string; timeMin: string; timeMax: string }): Promise<BusyInterval[]> {
  const first = new URL(CALENDAR_VIEW_URL);
  first.searchParams.set('startDateTime', timeMin);
  first.searchParams.set('endDateTime', timeMax);
  first.searchParams.set('$select', CALENDAR_VIEW_FIELDS);
  first.searchParams.set('$top', String(PAGE_SIZE));

  const busy: BusyInterval[] = [];
  let next: string | undefined = first.toString();
  for (let page = 0; next; page += 1) {
    if (page >= MAX_PAGES) throw new Error(`Microsoft calendar had more than ${MAX_PAGES} pages of events`);
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(next, {
      headers: { Authorization: `Bearer ${accessToken}`, Prefer: 'outlook.timezone="UTC"' },
    });
    if (response.status === 401 || response.status === 403 || response.status === 404) {
      throw new MicrosoftCalendarAccessError(`Microsoft refused the calendar request (HTTP ${response.status})`);
    }

    if (!response.ok) {
      throw new Error(`Microsoft calendar request failed: HTTP ${response.status}`);
    }

    // eslint-disable-next-line no-await-in-loop
    const body = await response.json() as { value?: GraphEvent[]; '@odata.nextLink'?: string };
    for (const event of body.value ?? []) {
      const interval = toBusyInterval(event);
      if (interval) busy.push(interval);
    }

    next = body['@odata.nextLink'];
  }

  return busy;
}

function toBusyInterval(event: GraphEvent): BusyInterval | null {
  if (event.isCancelled === true || event.responseStatus?.response === 'declined') return null;
  if (event.showAs && FREE_STATUSES.has(event.showAs)) return null;
  const start = toUtcIso(event.start);
  const end = toUtcIso(event.end);
  return start && end ? { start, end } : null;
}

// Graph returns e.g. { dateTime: '2026-10-20T09:00:00.0000000', timeZone: 'UTC' }, with no offset in the string.
// Anything else would mean the Prefer header was ignored, so fail loudly rather than drop a busy time.
function toUtcIso(value: GraphEvent['start']): string | null {
  if (!value?.dateTime) return null;
  if (value.timeZone !== 'UTC') throw new Error(`Microsoft returned an event time in ${value.timeZone ?? 'no time zone'}, not UTC`);
  const ms = Date.parse(/[zZ]|[+-]\d\d:\d\d$/.test(value.dateTime) ? value.dateTime : `${value.dateTime}Z`);
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}
