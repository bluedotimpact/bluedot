import { calendarConnectionTable, userTable } from '@bluedot/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { setupTestDb, testDb } from '../../../../__tests__/dbTestUtils';
import { createFakeGoogle, type FakeGoogle } from '../../../../__tests__/fakeGoogle';
import { createOAuthState, decryptRefreshToken, GOOGLE_FREEBUSY_SCOPE } from '../../../../lib/api/calendarConnect';
import callbackHandler from './callback';
import startHandler from './start';

vi.mock('../../../../lib/api/env', async () => ({ default: (await import('../../../../__tests__/fakeGoogle')).TEST_CALENDAR_ENV }));
vi.mock('@bluedot/utils', async (importOriginal) => ({ ...await importOriginal<object>(), slackAlert: vi.fn() }));
// A bearer token "sub:<keycloak sub>" logs in as that sub, standing in for Keycloak
vi.mock('../../../../lib/api/makeApiRoute', async () => {
  const { makeMakeApiRoute } = await import('@bluedot/ui/src/api');
  const { TEST_CALENDAR_ENV } = await import('../../../../__tests__/fakeGoogle');
  const { InvalidTokenError } = await import('@bluedot/ui/src/utils/InvalidTokenError');
  return {
    makeApiRoute: makeMakeApiRoute({
      env: TEST_CALENDAR_ENV,
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
const FULL_SCOPE = `openid ${GOOGLE_FREEBUSY_SCOPE} https://www.googleapis.com/auth/userinfo.email`;

let google: FakeGoogle;

beforeEach(async () => {
  vi.useFakeTimers({ now: Date.parse('2026-10-19T15:00:00Z'), toFake: ['Date'] });
  google = createFakeGoogle();
  vi.stubGlobal('fetch', vi.fn(google.fetch));
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

const mockRes = () => {
  const res = {
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
  };
  return res;
};

const start = async ({ body, authorization = 'Bearer sub:kc-robin', impersonate }: { body: unknown; authorization?: string; impersonate?: string }) => {
  const res = mockRes();
  await startHandler({
    method: 'POST', headers: { authorization, ...(impersonate ? { 'x-impersonate-user': impersonate } : {}) }, body, url: '/api/calendar-connections/google/start',
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

/** Runs start, then returns what the browser would carry back to the callback. */
const startFlow = async (body: unknown = { connectToken: CONNECT_TOKEN, timeZone: 'Europe/Berlin' }) => {
  const res = await start({ body });
  expect(res.statusCode).toBe(200);
  const authUrl = new URL((res.body as { authUrl: string }).authUrl);
  const cookie = /calendar_connect_state=([^;]+)/.exec(res.headers['Set-Cookie']!)![1]!;
  return { authUrl, state: authUrl.searchParams.get('state')!, cookie };
};

const connections = () => testDb.pg.select().from(calendarConnectionTable.pg);

const seedExisting = ({
  id = 'existing', userId = 'rec-robin', slackUserId, providerAccountId = 'sub-existing',
}: { id?: string; userId?: string; slackUserId: string | null; providerAccountId?: string }) => testDb.pg.insert(calendarConnectionTable.pg).values({
  id,
  slackUserId,
  userId,
  provider: 'google',
  providerAccountId,
  providerAccountEmail: `${id}@gmail.example`,
  encryptedRefreshToken: 'v1.x.y.z',
  scopes: FULL_SCOPE,
});

describe('start', () => {
  test('builds the Google consent URL and sets an httpOnly state cookie', async () => {
    const { authUrl } = await startFlow();
    expect(authUrl.origin + authUrl.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(authUrl.searchParams)).toMatchObject({
      client_id: 'test-client-id',
      // NEXT_PUBLIC_SITE_URL is unset in tests, so this is the production fallback
      redirect_uri: 'https://bluedot.org/api/calendar-connections/google/callback',
      response_type: 'code',
      scope: `openid email ${GOOGLE_FREEBUSY_SCOPE}`,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'false',
    });

    const res = await start({ body: { connectToken: CONNECT_TOKEN } });
    expect(res.headers['Set-Cookie']).toMatch(/HttpOnly; SameSite=Lax/);
  });

  test('is blocked while impersonating, so an admin can\'t attach a calendar to their own account by mistake', async () => {
    const res = await start({ body: { connectToken: CONNECT_TOKEN }, impersonate: 'rec-someone' });
    expect(res.statusCode).toBe(403);
    expect(res.headers['Set-Cookie']).toBeUndefined();
  });

  test('requires login', async () => {
    expect((await start({ body: { connectToken: CONNECT_TOKEN }, authorization: '' })).statusCode).toBe(401);
  });

  test('rejects an expired or forged link', async () => {
    vi.setSystemTime(Date.parse('2026-11-03T00:00:00Z'));
    expect((await start({ body: { connectToken: CONNECT_TOKEN } })).statusCode).toBe(400);
    vi.setSystemTime(Date.parse('2026-10-19T15:00:00Z'));
    expect((await start({ body: { connectToken: `${CONNECT_TOKEN.split('.')[0]}.forged` } })).statusCode).toBe(400);
  });

  test('works without a link, leaving the calendar unlinked for email matching', async () => {
    google.codes.set('code-1', {
      refreshToken: 'rt-personal', sub: 'sub-1', email: 'robin@gmail.example', scope: FULL_SCOPE,
    });
    const { state, cookie } = await startFlow({ timeZone: 'Europe/Berlin' });
    const res = await callback({ query: { code: 'code-1', state }, cookie });
    expect(res.redirectedTo).toBe('/account/calendars?calendar=connected');
    expect((await connections())[0]).toMatchObject({ userId: 'rec-robin', slackUserId: null, timeZone: 'Europe/Berlin' });
  });

  test('without a link, a new calendar takes the Slack member the user\'s other calendars are linked to', async () => {
    await seedExisting({ slackUserId: 'U-EXISTING' });
    google.codes.set('code-work', {
      refreshToken: 'rt-work', sub: 'sub-work', email: 'robin@work.example', scope: FULL_SCOPE,
    });

    const { state, cookie } = await startFlow({});
    await callback({ query: { code: 'code-work', state }, cookie });
    expect((await connections()).find((c) => c.providerAccountId === 'sub-work')?.slackUserId).toBe('U-EXISTING');
  });

  test('with a link, claims the Slack member for all the user\'s calendars and takes it off anyone else\'s', async () => {
    await seedExisting({ id: 'robin-old', slackUserId: null });
    await testDb.insert(userTable, { id: 'rec-other', email: 'other@bluedot.example', name: 'Other' });
    await seedExisting({
      id: 'other-row', userId: 'rec-other', slackUserId: 'U0BASQRM0H2', providerAccountId: 'sub-other',
    });
    google.codes.set('code-1', {
      refreshToken: 'rt-new', sub: 'sub-new', email: 'robin@work.example', scope: FULL_SCOPE,
    });

    const { state, cookie } = await startFlow();
    await callback({ query: { code: 'code-1', state }, cookie });

    const rows = await connections();
    expect(rows.filter((r) => r.userId === 'rec-robin').map((r) => r.slackUserId)).toEqual(['U0BASQRM0H2', 'U0BASQRM0H2']);
    expect(rows.find((r) => r.id === 'other-row')?.slackUserId).toBeNull();
  });

  test('if saving fails, the Slack member stays with whoever had it', async () => {
    await testDb.insert(userTable, { id: 'rec-other', email: 'other@bluedot.example', name: 'Other' });
    await seedExisting({
      id: 'other-row', userId: 'rec-other', slackUserId: 'U0BASQRM0H2', providerAccountId: 'sub-other',
    });
    google.codes.set('code-1', {
      refreshToken: 'rt-new', sub: 'sub-new', email: 'robin@work.example', scope: FULL_SCOPE,
    });
    const { state, cookie } = await startFlow();
    // Let the claim updates run inside the transaction, then make the insert fail
    const realTransaction = testDb.pg.transaction.bind(testDb.pg);
    vi.spyOn(testDb.pg, 'transaction').mockImplementationOnce(((fn: (tx: object) => Promise<unknown>) => realTransaction((tx) => fn(new Proxy(tx, {
      get(target, prop) {
        if (prop === 'insert') {
          return () => {
            throw new Error('insert failed');
          };
        }

        const value = Reflect.get(target, prop) as unknown;
        return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
      },
    })))) as never);

    const res = await callback({ query: { code: 'code-1', state }, cookie });

    expect(res.redirectedTo).toBe(`/account/calendars?error=failed&s=${CONNECT_TOKEN}`);
    const rows = await connections();
    expect(rows.find((r) => r.id === 'other-row')?.slackUserId).toBe('U0BASQRM0H2');
    expect(rows.filter((r) => r.userId === 'rec-robin')).toEqual([]);
  });
});

describe('callback', () => {
  test('stores the connection with an encrypted refresh token, then sends the member to /account/calendars', async () => {
    google.codes.set('code-1', {
      refreshToken: 'rt-personal', sub: 'google-sub-1', email: 'robin@gmail.example', scope: FULL_SCOPE,
    });
    const { state, cookie } = await startFlow();

    const res = await callback({ query: { code: 'code-1', state }, cookie });

    expect(res.statusCode).toBe(303);
    expect(res.redirectedTo).toBe('/account/calendars?calendar=connected');
    expect(res.headers['Set-Cookie']).toContain('Max-Age=0');
    const [row, ...rest] = await connections();
    expect(rest).toEqual([]);
    expect(row).toMatchObject({
      slackUserId: 'U0BASQRM0H2',
      userId: 'rec-robin',
      provider: 'google',
      providerAccountId: 'google-sub-1',
      providerAccountEmail: 'robin@gmail.example',
      scopes: FULL_SCOPE,
      timeZone: 'Europe/Berlin',
    });
    expect(row!.encryptedRefreshToken).not.toContain('rt-personal');
    expect(decryptRefreshToken(row!.encryptedRefreshToken)).toBe('rt-personal');
  });

  test('reconnecting the same Google account updates its row', async () => {
    google.codes.set('code-1', {
      refreshToken: 'rt-old', sub: 'google-sub-1', email: 'robin@gmail.example', scope: FULL_SCOPE,
    });
    google.codes.set('code-2', {
      refreshToken: 'rt-new', sub: 'google-sub-1', email: 'robin.renamed@gmail.example', scope: FULL_SCOPE,
    });

    const first = await startFlow();
    await callback({ query: { code: 'code-1', state: first.state }, cookie: first.cookie });
    await testDb.pg.update(calendarConnectionTable.pg).set({ lastError: 'invalid_grant', lastErrorAt: '2026-10-19T00:00:00Z' });
    const second = await startFlow();
    await callback({ query: { code: 'code-2', state: second.state }, cookie: second.cookie });

    const rows = await connections();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.providerAccountEmail).toBe('robin.renamed@gmail.example');
    expect(decryptRefreshToken(rows[0]!.encryptedRefreshToken)).toBe('rt-new');
    expect(rows[0]!.lastError).toBeNull();
  });

  test('rejects a state from another browser (no or wrong cookie)', async () => {
    google.codes.set('code-1', {
      refreshToken: 'rt', sub: 's', email: 'e@example.com', scope: FULL_SCOPE,
    });
    const { state } = await startFlow();

    const noCookie = await callback({ query: { code: 'code-1', state } });
    expect(noCookie.redirectedTo).toBe('/account/calendars?error=failed');
    const wrongCookie = await callback({ query: { code: 'code-1', state }, cookie: 'someone-elses-nonce' });
    expect(wrongCookie.redirectedTo).toBe('/account/calendars?error=failed');
    expect(await connections()).toEqual([]);
  });

  test('rejects missing, forged and expired state', async () => {
    expect((await callback({ query: { code: 'c' } })).redirectedTo).toBe('/account/calendars?error=failed');
    expect((await callback({ query: { code: 'c', state: 'forged' }, cookie: 'n' })).redirectedTo).toBe('/account/calendars?error=failed');

    const { state, cookie } = await startFlow();
    vi.setSystemTime(Date.parse('2026-10-19T15:11:00Z'));
    expect((await callback({ query: { code: 'c', state }, cookie })).redirectedTo).toBe('/account/calendars?error=expired');
  });

  test('rejects a state naming a user who no longer exists', async () => {
    const state = await createOAuthState({
      userId: 'rec-deleted', slackUserId: 'U1', timeZone: null, nonce: 'n', connectToken: null,
    });
    google.codes.set('code-1', {
      refreshToken: 'rt', sub: 's', email: 'e@example.com', scope: FULL_SCOPE,
    });
    expect((await callback({ query: { code: 'code-1', state }, cookie: 'n' })).redirectedTo).toBe('/account/calendars?error=failed');
    expect(await connections()).toEqual([]);
  });

  test('sends the member back with their link when they unticked the calendar permission', async () => {
    google.codes.set('code-1', {
      refreshToken: 'rt', sub: 's', email: 'e@example.com', scope: 'openid https://www.googleapis.com/auth/userinfo.email',
    });
    const { state, cookie } = await startFlow();

    const res = await callback({ query: { code: 'code-1', state }, cookie });

    expect(res.redirectedTo).toBe(`/account/calendars?error=missing_scope&s=${CONNECT_TOKEN}`);
    expect(await connections()).toEqual([]);
  });

  test('handles cancelling on the Google screen', async () => {
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { error: 'access_denied', state }, cookie });
    expect(res.redirectedTo).toBe(`/account/calendars?error=cancelled&s=${CONNECT_TOKEN}`);
  });

  test('handles a code Google rejects', async () => {
    const { state, cookie } = await startFlow();
    const res = await callback({ query: { code: 'unknown-code', state }, cookie });
    expect(res.redirectedTo).toBe(`/account/calendars?error=failed&s=${CONNECT_TOKEN}`);
  });
});
