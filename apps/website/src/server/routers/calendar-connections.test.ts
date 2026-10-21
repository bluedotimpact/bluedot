import { calendarConnectionTable, calendarPairWithoutCalendarTable } from '@bluedot/db';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';
import { createFakeGoogle, type FakeGoogle } from '../../__tests__/fakeGoogle';
import { encryptRefreshToken } from '../../lib/api/calendarConnect';

vi.mock('../../lib/api/env', async () => ({ default: (await import('../../__tests__/fakeGoogle')).TEST_CALENDAR_ENV }));

setupTestDb();

const VECTOR = 'eyJzbGFja1VzZXJJZCI6IlUwQkFTUVJNMEgyIiwiZXhwIjoxNzkzNjMxNjAwfQ.gabhH5XDv7HFecF9TNf3n9uWychdt-swSFaS5Gv8wm4';

let google: FakeGoogle;

beforeEach(async () => {
  google = createFakeGoogle();
  vi.stubGlobal('fetch', vi.fn(google.fetch));
  await seedLoggedInUser();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const seed = (row: { id: string; userId?: string; slackUserId?: string; providerAccountId?: string; refreshToken?: string; lastError?: string }) => testDb.pg
  .insert(calendarConnectionTable.pg).values({
    id: row.id,
    slackUserId: row.slackUserId ?? 'U1',
    userId: row.userId ?? 'test-user',
    provider: 'google',
    providerAccountId: row.providerAccountId ?? `sub-${row.id}`,
    providerAccountEmail: `${row.id}@gmail.example`,
    encryptedRefreshToken: encryptRefreshToken(row.refreshToken ?? `rt-${row.id}`),
    scopes: 'openid email',
    lastError: row.lastError ?? null,
    createdAt: '2026-10-15T10:00:00Z',
  });

const ids = async () => (await testDb.pg.select().from(calendarConnectionTable.pg)).map((r) => r.id).sort();

describe('calendarConnections.list', () => {
  test('requires login', async () => {
    await expect(createCaller(testAuthContextLoggedOut).calendarConnections.list()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('returns only the caller\'s connections, without tokens', async () => {
    await seed({ id: 'mine', lastError: 'invalid_grant' });
    await seed({ id: 'theirs', userId: 'someone-else' });

    const result = await createCaller(testAuthContextLoggedIn).calendarConnections.list();

    expect(result).toEqual([{
      id: 'mine', provider: 'google', email: 'mine@gmail.example', connectedAt: expect.any(String), needsReconnect: true,
    }]);
    expect(JSON.stringify(result)).not.toContain('v1.');
  });
});

describe('calendarConnections.checkConnectLink', () => {
  test('reports whether a link is genuine and unexpired', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-19T15:00:00Z'), toFake: ['Date'] });
    const caller = createCaller(testAuthContextLoggedIn);
    await expect(caller.calendarConnections.checkConnectLink({ token: VECTOR })).resolves.toEqual({ valid: true });
    await expect(caller.calendarConnections.checkConnectLink({ token: `${VECTOR}x` })).resolves.toEqual({ valid: false });
  });
});

describe('calendarConnections.disconnect', () => {
  test('deletes the row and revokes the Google grant', async () => {
    await seed({ id: 'mine' });
    await createCaller(testAuthContextLoggedIn).calendarConnections.disconnect({ id: 'mine' });
    expect(await ids()).toEqual([]);
    expect(google.revokedTokens).toEqual(['rt-mine']);
  });

  test('can\'t touch someone else\'s connection', async () => {
    await seed({ id: 'theirs', userId: 'someone-else' });
    await expect(createCaller(testAuthContextLoggedIn).calendarConnections.disconnect({ id: 'theirs' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(await ids()).toEqual(['theirs']);
    expect(google.revokedTokens).toEqual([]);
  });

  test('leaves the grant alone while the same Google account is still connected for another Slack member', async () => {
    await seed({ id: 'mine', providerAccountId: 'shared-sub' });
    await seed({
      id: 'other-slack', userId: 'someone-else', slackUserId: 'U2', providerAccountId: 'shared-sub', refreshToken: 'rt-other',
    });
    await createCaller(testAuthContextLoggedIn).calendarConnections.disconnect({ id: 'mine' });
    expect(await ids()).toEqual(['other-slack']);
    expect(google.revokedTokens).toEqual([]);
  });

  test('still deletes when Google is down', async () => {
    await seed({ id: 'mine' });
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));
    await createCaller(testAuthContextLoggedIn).calendarConnections.disconnect({ id: 'mine' });
    expect(await ids()).toEqual([]);
  });

  test('is blocked while impersonating', async () => {
    await seed({ id: 'mine' });
    await expect(createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, email: 'test@example.com' },
      impersonation: { adminEmail: 'admin@example.com', adminSub: 'admin-sub', targetEmail: 'test@example.com' },
    }).calendarConnections.disconnect({ id: 'mine' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await ids()).toEqual(['mine']);
  });
});

describe('calendarConnections pair without a calendar', () => {
  const rows = async () => (await testDb.pg.select().from(calendarPairWithoutCalendarTable.pg))
    .map(({ userId, slackUserId }) => ({ userId, slackUserId }))
    .sort((a, b) => a.userId.localeCompare(b.userId));
  const impersonating = {
    ...testAuthContextLoggedIn,
    auth: { ...testAuthContextLoggedIn.auth!, email: 'test@example.com' },
    impersonation: { adminEmail: 'admin@example.com', adminSub: 'admin-sub', targetEmail: 'test@example.com' },
  };

  test('requires login', async () => {
    const caller = createCaller(testAuthContextLoggedOut);
    await expect(caller.calendarConnections.pairWithoutCalendarStatus()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller.calendarConnections.pairWithoutCalendar({ token: null })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(caller.calendarConnections.stopPairWithoutCalendar()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('turns on and off for the caller only', async () => {
    await testDb.pg.insert(calendarPairWithoutCalendarTable.pg).values({ userId: 'someone-else', slackUserId: null });
    const caller = createCaller(testAuthContextLoggedIn);

    await expect(caller.calendarConnections.pairWithoutCalendarStatus()).resolves.toEqual({ on: false });
    await caller.calendarConnections.pairWithoutCalendar({ token: null });
    await caller.calendarConnections.pairWithoutCalendar({ token: null });
    await expect(caller.calendarConnections.pairWithoutCalendarStatus()).resolves.toEqual({ on: true });
    expect(await rows()).toEqual([{ userId: 'someone-else', slackUserId: null }, { userId: 'test-user', slackUserId: null }]);

    await caller.calendarConnections.stopPairWithoutCalendar();
    await expect(caller.calendarConnections.pairWithoutCalendarStatus()).resolves.toEqual({ on: false });
    expect(await rows()).toEqual([{ userId: 'someone-else', slackUserId: null }]);
  });

  test('a valid Slack link claims that Slack member, and an invalid one is ignored', async () => {
    vi.useFakeTimers({ now: Date.parse('2026-10-19T15:00:00Z'), toFake: ['Date'] });
    await testDb.pg.insert(calendarPairWithoutCalendarTable.pg).values({ userId: 'someone-else', slackUserId: 'U0BASQRM0H2' });
    const caller = createCaller(testAuthContextLoggedIn);

    await caller.calendarConnections.pairWithoutCalendar({ token: `${VECTOR}x` });
    expect(await rows()).toEqual([{ userId: 'someone-else', slackUserId: 'U0BASQRM0H2' }, { userId: 'test-user', slackUserId: null }]);

    await caller.calendarConnections.pairWithoutCalendar({ token: VECTOR });
    expect(await rows()).toEqual([{ userId: 'someone-else', slackUserId: null }, { userId: 'test-user', slackUserId: 'U0BASQRM0H2' }]);

    // Turning it on again without a link keeps the link
    await caller.calendarConnections.pairWithoutCalendar({ token: null });
    expect(await rows()).toContainEqual({ userId: 'test-user', slackUserId: 'U0BASQRM0H2' });
  });

  test('without a link, reuses the Slack member their calendars are linked to', async () => {
    await seed({ id: 'mine', slackUserId: 'U-MINE' });
    await createCaller(testAuthContextLoggedIn).calendarConnections.pairWithoutCalendar({ token: null });
    expect(await rows()).toEqual([{ userId: 'test-user', slackUserId: 'U-MINE' }]);
  });

  test('is blocked while impersonating', async () => {
    await testDb.pg.insert(calendarPairWithoutCalendarTable.pg).values({ userId: 'test-user', slackUserId: null });
    const caller = createCaller(impersonating);
    await expect(caller.calendarConnections.pairWithoutCalendar({ token: null })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(caller.calendarConnections.stopPairWithoutCalendar()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(await rows()).toEqual([{ userId: 'test-user', slackUserId: null }]);
  });
});
