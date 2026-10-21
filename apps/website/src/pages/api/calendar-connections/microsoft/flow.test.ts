import { calendarConnectionTable, userTable } from '@bluedot/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { setupTestDb, testDb } from '../../../../__tests__/dbTestUtils';
import { TEST_CALENDAR_ENV } from '../../../../__tests__/fakeGoogle';
import { createFakeMicrosoft, type FakeMicrosoft } from '../../../../__tests__/fakeMicrosoft';
import { decryptRefreshToken } from '../../../../lib/api/calendarConnect';
import callbackHandler from './callback';
import startHandler from './start';

vi.mock('../../../../lib/api/env', async () => ({ default: (await import('../../../../__tests__/fakeGoogle')).TEST_CALENDAR_ENV }));
vi.mock('@bluedot/utils', async (importOriginal) => ({ ...await importOriginal<object>(), slackAlert: vi.fn() }));
// A bearer token "sub:<keycloak sub>" logs in as that sub, standing in for Keycloak
vi.mock('../../../../lib/api/makeApiRoute', async () => {
  const { makeMakeApiRoute } = await import('@bluedot/ui/src/api');
  const { TEST_CALENDAR_ENV: env } = await import('../../../../__tests__/fakeGoogle');
  const { InvalidTokenError } = await import('@bluedot/ui/src/utils/InvalidTokenError');
  return {
    makeApiRoute: makeMakeApiRoute({
      env,
      verifyAndDecodeToken: (token: string) => {
        if (!token.startsWith('sub:')) throw new InvalidTokenError('bad token');
        return { sub: token.slice(4), email: 'x@example.com' };
      },
    }),
  };
});

setupTestDb();

// Signed with "shared-secret" for U0BASQRM0H2, valid until 2026-11-02T15:00:00Z (the dot-to-dot test vector)
const CONNECT_TOKEN = 'eyJzbGFja1VzZXJJZCI6IlUwQkFTUVJNMEgyIiwiZXhwIjoxNzkzNjMxNjAwfQ.gabhH5XDv7HFecF9TNf3n9uWychdt-swSFaS5Gv8wm4';
// Personal accounts tend to get bare scope names back, work accounts full URIs
const PERSONAL_SCOPE = 'openid email profile offline_access Calendars.ReadBasic';
const WORK_SCOPE = 'https://graph.microsoft.com/Calendars.ReadBasic openid email profile';
const WORK_TENANT = '72f988bf-86f1-41af-91ab-2d7cd011db47';

let microsoft: FakeMicrosoft;

beforeEach(async () => {
  vi.useFakeTimers({ now: Date.parse('2026-10-19T15:00:00Z'), toFake: ['Date'] });
  microsoft = createFakeMicrosoft();
  vi.stubGlobal('fetch', vi.fn(microsoft.fetch));
  await testDb.insert(userTable, {
    id: 'rec-robin', email: 'robin@bluedot.example', name: 'Robin', keycloakIdentifier: 'kc-robin',
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

type MockRes = {
  statusCode: number;
  body: unknown;
  redirectedTo: string | null;
  headers: Record<string, string>;
};

const mockRes = () => ({
  statusCode: 0,
  body: undefined as unknown,
  redirectedTo: null as string | null,
  headers: {} as Record<string, string>,
  status(code: number) {
    this.statusCode = code;
    return this;
  },
  json(payload: unknown) {
    this.body = payload;
    return this;
  },
  end() {
    return this;
  },
  setHeader(name: string, value: string) {
    this.headers[name] = value;
  },
  redirect(code: number, url: string) {
    this.statusCode = code;
    this.redirectedTo = url;
  },
});

const start = async (body: unknown) => {
  const res = mockRes();
  await startHandler({
    method: 'POST', headers: { authorization: 'Bearer sub:kc-robin' }, body, url: '/api/calendar-connections/microsoft/start',
  } as unknown as NextApiRequest, res as unknown as NextApiResponse);
  return res as MockRes;
};

const callback = async ({ query, cookie }: { query: Record<string, string>; cookie?: string }) => {
  const res = mockRes();
  await callbackHandler({
    method: 'GET', query, cookies: cookie ? { calendar_connect_state: cookie } : {}, headers: {},
  } as unknown as NextApiRequest, res as unknown as NextApiResponse);
  return res as MockRes;
};

const startFlow = async (body: unknown = { connectToken: CONNECT_TOKEN, timeZone: 'America/New_York' }) => {
  const res = await start(body);
  expect(res.statusCode).toBe(200);
  const authUrl = new URL((res.body as { authUrl: string }).authUrl);
  const cookie = /calendar_connect_state=([^;]+)/.exec(res.headers['Set-Cookie']!)![1]!;
  return { authUrl, state: authUrl.searchParams.get('state')!, cookie };
};

const connections = () => testDb.pg.select().from(calendarConnectionTable.pg);

describe('start', () => {
  test('builds the Microsoft consent URL for personal and work accounts, asking only to read basic calendar details', async () => {
    const { authUrl } = await startFlow();
    expect(authUrl.origin + authUrl.pathname).toBe('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    expect(Object.fromEntries(authUrl.searchParams)).toMatchObject({
      client_id: 'test-ms-client-id',
      redirect_uri: 'https://bluedot.org/api/calendar-connections/microsoft/callback',
      response_type: 'code',
      response_mode: 'query',
      scope: 'openid email profile offline_access https://graph.microsoft.com/Calendars.ReadBasic',
      prompt: 'select_account',
    });
    expect(authUrl.searchParams.get('scope')).not.toMatch(/User\.Read|Calendars\.Read( |$)/);
  });

  test('the state cookie is sent back to the Microsoft callback too', async () => {
    const res = await start({});
    expect(res.headers['Set-Cookie']).toMatch(/Path=\/api\/calendar-connections;.*HttpOnly; SameSite=Lax/);
  });

  test('fails without setting a cookie when Outlook isn\'t configured here', async () => {
    const saved = TEST_CALENDAR_ENV.MICROSOFT_CALENDAR_CLIENT_ID;
    // @ts-expect-error removing a key the type says is there
    delete TEST_CALENDAR_ENV.MICROSOFT_CALENDAR_CLIENT_ID;
    try {
      const res = await start({});
      expect(res.statusCode).toBe(500);
      expect(res.headers['Set-Cookie']).toBeUndefined();
    } finally {
      TEST_CALENDAR_ENV.MICROSOFT_CALENDAR_CLIENT_ID = saved;
    }
  });
});

describe('callback', () => {
  test('stores a personal Outlook.com account with an encrypted refresh token', async () => {
    microsoft.codes.set('code-1', {
      refreshToken: 'rt-outlook', sub: 'ms-sub-1', email: 'robin@outlook.example', scope: PERSONAL_SCOPE,
    });
    const { state, cookie } = await startFlow();

    const res = await callback({ query: { code: 'code-1', state }, cookie });

    expect(res.redirectedTo).toBe('/account/calendars?calendar=connected');
    const [row, ...rest] = await connections();
    expect(rest).toEqual([]);
    expect(row).toMatchObject({
      slackUserId: 'U0BASQRM0H2',
      userId: 'rec-robin',
      provider: 'microsoft',
      providerAccountId: 'ms-sub-1',
      providerAccountEmail: 'robin@outlook.example',
      scopes: PERSONAL_SCOPE,
      timeZone: 'America/New_York',
    });
    expect(row!.encryptedRefreshToken).not.toContain('rt-outlook');
    expect(decryptRefreshToken(row!.encryptedRefreshToken)).toBe('rt-outlook');
    expect(microsoft.tokenRequests[0]!.get('redirect_uri')).toBe('https://bluedot.org/api/calendar-connections/microsoft/callback');
  });

  test('accepts a work account whose token has no email claim, using its username instead', async () => {
    microsoft.codes.set('code-work', {
      refreshToken: 'rt-work', sub: 'ms-sub-work', tid: WORK_TENANT, preferredUsername: 'robin@contoso.example', scope: WORK_SCOPE,
    });
    const { state, cookie } = await startFlow({});

    expect((await callback({ query: { code: 'code-work', state }, cookie })).redirectedTo).toBe('/account/calendars?calendar=connected');
    expect((await connections())[0]).toMatchObject({ provider: 'microsoft', providerAccountEmail: 'robin@contoso.example' });
  });

  test('keeps a Google and a Microsoft connection side by side', async () => {
    await testDb.pg.insert(calendarConnectionTable.pg).values({
      id: 'google-row', userId: 'rec-robin', provider: 'google', providerAccountId: 'ms-sub-1', providerAccountEmail: 'robin@gmail.example', encryptedRefreshToken: 'v1.x.y.z', scopes: '',
    });
    microsoft.codes.set('code-1', {
      refreshToken: 'rt-outlook', sub: 'ms-sub-1', email: 'robin@outlook.example', scope: PERSONAL_SCOPE,
    });
    const { state, cookie } = await startFlow({});
    await callback({ query: { code: 'code-1', state }, cookie });

    expect((await connections()).map((c) => c.provider).sort()).toEqual(['google', 'microsoft']);
  });

  test('sends the member back when the calendar permission is missing', async () => {
    microsoft.codes.set('code-1', {
      refreshToken: 'rt', sub: 's', email: 'e@outlook.example', scope: 'openid email profile',
    });
    const { state, cookie } = await startFlow();

    expect((await callback({ query: { code: 'code-1', state }, cookie })).redirectedTo).toBe(`/account/calendars?error=missing_scope&s=${CONNECT_TOKEN}`);
    expect(await connections()).toEqual([]);
  });

  test('handles cancelling on the Microsoft screen', async () => {
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { error: 'access_denied', error_description: 'AADSTS65004: User declined to consent to access the app.', state }, cookie });
    expect(res.redirectedTo).toBe(`/account/calendars?error=cancelled&s=${CONNECT_TOKEN}`);
  });

  test('explains when the person\'s organisation needs an admin to approve the app', async () => {
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { error: 'access_denied', error_description: 'AADSTS90094: Admin consent is required for the permissions requested by this application.', state }, cookie });
    expect(res.redirectedTo).toBe(`/account/calendars?error=needs_admin&s=${CONNECT_TOKEN}`);
  });

  test('rejects a Microsoft token for a different app or from an unexpected issuer', async () => {
    const realFetch = microsoft.fetch;
    const forge = (claims: Record<string, unknown>) => vi.stubGlobal('fetch', vi.fn(async (input: string, init?: RequestInit) => {
      const response = await realFetch(input, init);
      if (!String(input).endsWith('/token')) return response;
      const body = await response.json() as { id_token: string };
      const [header, payload] = body.id_token.split('.');
      const merged = { ...JSON.parse(Buffer.from(payload!, 'base64url').toString()) as object, ...claims };
      return new Response(JSON.stringify({ ...body, id_token: `${header}.${Buffer.from(JSON.stringify(merged)).toString('base64url')}.sig` }));
    }));
    microsoft.codes.set('code-1', {
      refreshToken: 'rt', sub: 's', email: 'e@outlook.example', scope: PERSONAL_SCOPE,
    });

    for (const claims of [{ aud: 'someone-elses-app' }, { iss: 'https://evil.example/v2.0' }, { iss: `https://login.microsoftonline.com/${WORK_TENANT}/v2.0` }]) {
      forge(claims);
      // eslint-disable-next-line no-await-in-loop
      const { state, cookie } = await startFlow({});
      // eslint-disable-next-line no-await-in-loop
      expect((await callback({ query: { code: 'code-1', state }, cookie })).redirectedTo).toBe('/account/calendars?error=failed');
    }

    expect(await connections()).toEqual([]);
  });

  test('rejects a state from another browser', async () => {
    microsoft.codes.set('code-1', {
      refreshToken: 'rt', sub: 's', email: 'e@outlook.example', scope: PERSONAL_SCOPE,
    });
    const { state } = await startFlow();
    expect((await callback({ query: { code: 'code-1', state }, cookie: 'someone-elses-nonce' })).redirectedTo).toBe('/account/calendars?error=failed');
    expect(await connections()).toEqual([]);
  });
});
