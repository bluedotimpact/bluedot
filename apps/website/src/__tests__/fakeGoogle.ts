// In-memory stand-in for the Google OAuth and Calendar endpoints that Calendar Connect calls.

export const TEST_CALENDAR_ENV = {
  APP_NAME: 'website',
  PG_URL: 'postgresql://fake',
  AIRTABLE_PERSONAL_ACCESS_TOKEN: 'fake',
  ALERTS_SLACK_CHANNEL_ID: 'C',
  CLIENT_ERRORS_SLACK_CHANNEL_ID: 'C',
  ALERTS_SLACK_BOT_TOKEN: 'fake',
  KEYCLOAK_CLIENT_ID: 'fake',
  KEYCLOAK_CLIENT_SECRET: 'fake',
  GOOGLE_CALENDAR_CLIENT_ID: 'test-client-id',
  GOOGLE_CALENDAR_CLIENT_SECRET: 'test-client-secret',
  MICROSOFT_CALENDAR_CLIENT_ID: 'test-ms-client-id',
  MICROSOFT_CALENDAR_CLIENT_SECRET: 'test-ms-client-secret',
  CALENDAR_CONNECT_LINK_SECRET: 'shared-secret',
  CALENDAR_CONNECT_ENCRYPTION_KEY: 'MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY=',
  CALENDAR_CONNECT_BUSY_API_SECRET: 'busy-secret',
  VITEST: 'true',
};

type FakeAccount = {
  // refresh token -> state
  revoked?: boolean;
  busy?: { start: string; end: string }[];
  freeBusyStatus?: number;
};

export type FakeGoogle = {
  accounts: Map<string, FakeAccount>;
  // authorization code -> what the token endpoint returns for it
  codes: Map<string, { refreshToken: string; sub: string; email: string; scope: string }>;
  revokedTokens: string[];
  freeBusyRequests: { accessToken: string; body: unknown }[];
  fetch: (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
};

const unsignedJwt = (claims: Record<string, unknown>) => [
  Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify(claims)).toString('base64url'),
  'signature',
].join('.');

export function createFakeGoogle(): FakeGoogle {
  const fake: FakeGoogle = {
    accounts: new Map(),
    codes: new Map(),
    revokedTokens: [],
    freeBusyRequests: [],
    async fetch(input, init) {
      const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
      const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

      if (url.href === 'https://oauth2.googleapis.com/token') {
        const form = new URLSearchParams(init?.body as string);
        if (form.get('client_id') !== 'test-client-id' || form.get('client_secret') !== 'test-client-secret') {
          return json(401, { error: 'invalid_client' });
        }

        if (form.get('grant_type') === 'authorization_code') {
          const grant = fake.codes.get(form.get('code') ?? '');
          if (!grant) return json(400, { error: 'invalid_grant' });
          fake.accounts.set(grant.refreshToken, fake.accounts.get(grant.refreshToken) ?? {});
          return json(200, {
            access_token: 'access',
            refresh_token: grant.refreshToken,
            scope: grant.scope,
            id_token: unsignedJwt({
              iss: 'https://accounts.google.com', aud: 'test-client-id', sub: grant.sub, email: grant.email,
            }),
          });
        }

        const account = fake.accounts.get(form.get('refresh_token') ?? '');
        if (!account || account.revoked) return json(400, { error: 'invalid_grant', error_description: 'Token has been expired or revoked.' });
        return json(200, { access_token: `access:${form.get('refresh_token')}` });
      }

      if (url.href === 'https://www.googleapis.com/calendar/v3/freeBusy') {
        const accessToken = String(new Headers(init?.headers).get('Authorization')).replace('Bearer ', '');
        const body = JSON.parse(init?.body as string) as unknown;
        fake.freeBusyRequests.push({ accessToken, body });
        const account = fake.accounts.get(accessToken.replace(/^access:/, ''));
        if (account?.freeBusyStatus) return json(account.freeBusyStatus, { error: { message: 'nope' } });
        return json(200, { calendars: { primary: { busy: account?.busy ?? [] } } });
      }

      if (url.href === 'https://oauth2.googleapis.com/revoke') {
        const token = new URLSearchParams(init?.body as string).get('token') ?? '';
        fake.revokedTokens.push(token);
        const account = fake.accounts.get(token);
        if (account) account.revoked = true;
        return new Response('', { status: 200 });
      }

      throw new Error(`Unexpected fetch: ${init?.method ?? 'GET'} ${url.href}`);
    },
  };
  return fake;
}
