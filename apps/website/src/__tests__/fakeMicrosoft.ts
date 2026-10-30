// In-memory stand-in for the Microsoft identity platform and Graph endpoints that Calendar Connect calls.
// Requests it doesn't recognise go to `fallback`, so it can sit in front of the fake Google.

export const MS_PERSONAL_TENANT = '9188040d-6c67-4c5b-b112-36a304b66dad';

export type FakeGraphEvent = {
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  showAs?: string;
  isCancelled?: boolean;
  responseStatus?: { response: string };
};

type FakeMicrosoftAccount = {
  revoked?: boolean;
  events?: FakeGraphEvent[];
  calendarStatus?: number;
  // Returns events this many at a time, with an @odata.nextLink between pages
  pageSize?: number;
};

export type FakeMicrosoft = {
  // refresh token -> account. Rotated tokens point at the same account object.
  accounts: Map<string, FakeMicrosoftAccount>;
  // authorization code -> what the token endpoint returns for it
  codes: Map<string, {
    refreshToken: string; sub: string; tid?: string; email?: string; preferredUsername?: string; scope: string;
  }>;
  tokenRequests: URLSearchParams[];
  calendarRequests: { url: URL; accessToken: string; prefer: string | null }[];
  fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
};

const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const CALENDAR_VIEW_URL = 'https://graph.microsoft.com/v1.0/me/calendar/calendarView';

const unsignedJwt = (claims: Record<string, unknown>) => [
  Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify(claims)).toString('base64url'),
  'signature',
].join('.');

export function createFakeMicrosoft({ fallback }: { fallback?: FakeMicrosoft['fetch'] } = {}): FakeMicrosoft {
  let rotations = 0;
  const fake: FakeMicrosoft = {
    accounts: new Map(),
    codes: new Map(),
    tokenRequests: [],
    calendarRequests: [],
    async fetch(input, init) {
      const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
      const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

      if (url.href === TOKEN_URL) {
        const form = new URLSearchParams(init?.body as string);
        fake.tokenRequests.push(form);
        if (form.get('client_id') !== 'test-ms-client-id' || form.get('client_secret') !== 'test-ms-client-secret') {
          return json(401, { error: 'invalid_client' });
        }

        if (form.get('grant_type') === 'authorization_code') {
          const grant = fake.codes.get(form.get('code') ?? '');
          if (!grant) return json(400, { error: 'invalid_grant', error_description: 'AADSTS70000: The provided authorization code is invalid.' });
          fake.accounts.set(grant.refreshToken, fake.accounts.get(grant.refreshToken) ?? {});
          const tid = grant.tid ?? MS_PERSONAL_TENANT;
          return json(200, {
            access_token: `access:${grant.refreshToken}`,
            refresh_token: grant.refreshToken,
            scope: grant.scope,
            id_token: unsignedJwt({
              iss: `https://login.microsoftonline.com/${tid}/v2.0`,
              aud: 'test-ms-client-id',
              tid,
              sub: grant.sub,
              ...(grant.email ? { email: grant.email } : {}),
              ...(grant.preferredUsername ? { preferred_username: grant.preferredUsername } : {}),
            }),
          });
        }

        const oldToken = form.get('refresh_token') ?? '';
        const account = fake.accounts.get(oldToken);
        if (!account || account.revoked) return json(400, { error: 'invalid_grant', error_description: 'AADSTS700082: The refresh token has expired.' });
        // Microsoft rotates the refresh token on every use
        rotations += 1;
        const newToken = `${oldToken.split('~')[0]}~${rotations}`;
        fake.accounts.set(newToken, account);
        return json(200, { access_token: `access:${newToken}`, refresh_token: newToken });
      }

      if (url.origin + url.pathname === CALENDAR_VIEW_URL) {
        const headers = new Headers(init?.headers);
        const accessToken = String(headers.get('Authorization')).replace('Bearer ', '');
        fake.calendarRequests.push({ url, accessToken, prefer: headers.get('Prefer') });
        const account = fake.accounts.get(accessToken.replace(/^access:/, ''));
        if (!account) return json(401, { error: { code: 'InvalidAuthenticationToken' } });
        if (account.calendarStatus) return json(account.calendarStatus, { error: { code: 'nope' } });

        const events = account.events ?? [];
        const skip = Number(url.searchParams.get('$skip') ?? 0);
        const pageSize = account.pageSize ?? events.length;
        const page = events.slice(skip, skip + pageSize);
        const nextLink = skip + pageSize < events.length ? new URL(url) : null;
        nextLink?.searchParams.set('$skip', String(skip + pageSize));
        return json(200, { value: page, ...(nextLink ? { '@odata.nextLink': nextLink.toString() } : {}) });
      }

      if (fallback) return fallback(input, init);
      throw new Error(`Unexpected fetch: ${init?.method ?? 'GET'} ${url.href}`);
    },
  };
  return fake;
}

export const utc = (dateTime: string) => ({ dateTime, timeZone: 'UTC' });
