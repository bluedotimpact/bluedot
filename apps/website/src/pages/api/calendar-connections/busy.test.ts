import { calendarConnectionTable, userTable } from '@bluedot/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { setupTestDb, testDb } from '../../../__tests__/dbTestUtils';
import { createFakeGoogle, type FakeGoogle } from '../../../__tests__/fakeGoogle';
import { encryptRefreshToken } from '../../../lib/api/calendarConnect';
import handler from './busy';

vi.mock('../../../lib/api/env', async () => ({ default: (await import('../../../__tests__/fakeGoogle')).TEST_CALENDAR_ENV }));
vi.mock('@bluedot/utils', async (importOriginal) => ({ ...await importOriginal<object>(), slackAlert: vi.fn() }));

setupTestDb();

const WINDOW = { timeMin: '2026-10-19T00:00:00Z', timeMax: '2026-10-26T00:00:00Z' };

let google: FakeGoogle;

beforeEach(async () => {
  google = createFakeGoogle();
  vi.stubGlobal('fetch', vi.fn(google.fetch));
  await testDb.insert(userTable, { id: 'rec-robin', email: 'robin@bluedot.example', name: 'Robin' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const seedConnection = async ({
  id, slackUserId = 'U-ROBIN', userId = 'rec-robin', refreshToken, email = `${id}@gmail.example`, timeZone = 'Europe/Berlin', updatedAt = '2026-10-15T00:00:00Z',
}: { id: string; slackUserId?: string | null; userId?: string; refreshToken: string; email?: string; timeZone?: string | null; updatedAt?: string }) => {
  google.accounts.set(refreshToken, google.accounts.get(refreshToken) ?? {});
  await testDb.pg.insert(calendarConnectionTable.pg).values({
    id,
    slackUserId,
    userId,
    provider: 'google',
    providerAccountId: `sub-${id}`,
    providerAccountEmail: email,
    encryptedRefreshToken: encryptRefreshToken(refreshToken),
    scopes: 'openid email https://www.googleapis.com/auth/calendar.freebusy',
    timeZone,
    updatedAt,
  });
};

const call = async ({ body = { slackUserIds: ['U-ROBIN'], ...WINDOW } as unknown, authorization = 'Bearer busy-secret', method = 'POST' } = {}) => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
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
  };
  await handler({
    method, headers: { authorization }, body, url: '/api/calendar-connections/busy',
  } as unknown as NextApiRequest, res as unknown as NextApiResponse);
  return res;
};

describe('POST /api/calendar-connections/busy', () => {
  test('rejects a missing or wrong secret before looking at the body', async () => {
    expect((await call({ authorization: '' })).statusCode).toBe(401);
    expect((await call({ authorization: 'Bearer wrong' })).statusCode).toBe(401);
    expect((await call({ authorization: 'Bearer wrong', body: { nonsense: true } })).statusCode).toBe(401);
    expect(google.freeBusyRequests).toEqual([]);
  });

  test('rejects bad bodies and windows', async () => {
    expect((await call({ body: { slackUserIds: 'U1', ...WINDOW } })).statusCode).toBe(400);
    expect((await call({ body: { slackUserIds: ['U1'], timeMin: 'soon', timeMax: WINDOW.timeMax } })).statusCode).toBe(400);
    expect((await call({ body: { slackUserIds: ['U1'], timeMin: WINDOW.timeMax, timeMax: WINDOW.timeMin } })).statusCode).toBe(400);
    expect((await call({ body: { slackUserIds: ['U1'], timeMin: '2026-10-01T00:00:00Z', timeMax: '2026-10-16T00:00:00Z' } })).statusCode).toBe(400);
    expect((await call({ method: 'GET' })).statusCode).toBe(405);
  });

  test('merges busy times across every calendar a member connected, and never returns tokens', async () => {
    await seedConnection({ id: 'personal', refreshToken: 'rt-personal' });
    await seedConnection({
      id: 'work', refreshToken: 'rt-work', timeZone: 'America/New_York', updatedAt: '2026-10-16T00:00:00Z',
    });
    google.accounts.get('rt-personal')!.busy = [
      { start: '2026-10-20T09:00:00Z', end: '2026-10-20T10:00:00Z' },
      { start: '2026-10-21T15:00:00Z', end: '2026-10-21T16:00:00Z' },
    ];
    google.accounts.get('rt-work')!.busy = [
      { start: '2026-10-20T09:30:00Z', end: '2026-10-20T11:00:00Z' },
      { start: '2026-10-20T11:00:00Z', end: '2026-10-20T11:30:00Z' },
    ];

    const res = await call({ body: { slackUserIds: ['U-ROBIN', 'U-NOBODY'], ...WINDOW } });

    expect(res.statusCode).toBe(200);
    expect(res.headers['Cache-Control']).toBe('no-store');
    expect(res.body).toEqual({
      users: {
        'U-ROBIN': {
          connected: true,
          // From the most recently connected calendar
          timeZone: 'America/New_York',
          email: 'robin@bluedot.example',
          busy: [
            { start: '2026-10-20T09:00:00.000Z', end: '2026-10-20T11:30:00.000Z' },
            { start: '2026-10-21T15:00:00.000Z', end: '2026-10-21T16:00:00.000Z' },
          ],
          errors: [],
          matchedBy: 'slack',
        },
        'U-NOBODY': {
          connected: false, timeZone: null, email: null, busy: [], errors: [], matchedBy: null,
        },
      },
    });
    expect(JSON.stringify(res.body)).not.toContain('rt-');
    expect(google.freeBusyRequests.map((r) => r.body)).toEqual([
      { timeMin: '2026-10-19T00:00:00.000Z', timeMax: '2026-10-26T00:00:00.000Z', items: [{ id: 'primary' }] },
      { timeMin: '2026-10-19T00:00:00.000Z', timeMax: '2026-10-26T00:00:00.000Z', items: [{ id: 'primary' }] },
    ]);
  });

  test('a revoked calendar is reported and flagged for reconnecting, and the others still count', async () => {
    await seedConnection({ id: 'personal', refreshToken: 'rt-personal', email: 'robin@gmail.example' });
    await seedConnection({ id: 'work', refreshToken: 'rt-work' });
    google.accounts.get('rt-personal')!.revoked = true;
    google.accounts.get('rt-work')!.busy = [{ start: '2026-10-20T09:00:00Z', end: '2026-10-20T10:00:00Z' }];

    const res = await call();
    const robin = (res.body as { users: Record<string, { connected: boolean; busy: unknown[]; errors: string[] }> }).users['U-ROBIN']!;

    expect(robin.connected).toBe(true);
    expect(robin.busy).toEqual([{ start: '2026-10-20T09:00:00.000Z', end: '2026-10-20T10:00:00.000Z' }]);
    expect(robin.errors).toHaveLength(1);
    expect(robin.errors[0]).toContain('robin@gmail.example');
    expect(robin.errors[0]).toContain('revoked');

    const personal = (await testDb.pg.select().from(calendarConnectionTable.pg)).find((row) => row.id === 'personal');
    expect(personal?.lastError).toBe('invalid_grant');
    expect(personal?.lastErrorAt).toBeTruthy();
  });

  test('a member whose only calendar is revoked is not connected', async () => {
    await seedConnection({ id: 'personal', refreshToken: 'rt-personal' });
    google.accounts.get('rt-personal')!.revoked = true;

    const res = await call();
    const robin = (res.body as { users: Record<string, { connected: boolean; errors: string[] }> }).users['U-ROBIN']!;
    expect(robin.connected).toBe(false);
    expect(robin.errors).toHaveLength(1);
  });

  test('a successful lookup clears an old error', async () => {
    await seedConnection({ id: 'personal', refreshToken: 'rt-personal' });
    await testDb.pg.update(calendarConnectionTable.pg).set({ lastError: 'invalid_grant', lastErrorAt: '2026-10-01T00:00:00Z' });

    await call();

    const [row] = await testDb.pg.select().from(calendarConnectionTable.pg);
    expect(row?.lastError).toBeNull();
    expect(row?.lastErrorAt).toBeNull();
  });

  test('a temporary Google failure is reported without flagging the calendar', async () => {
    await seedConnection({ id: 'personal', refreshToken: 'rt-personal' });
    google.accounts.get('rt-personal')!.freeBusyStatus = 503;

    const res = await call();
    const robin = (res.body as { users: Record<string, { connected: boolean; errors: string[] }> }).users['U-ROBIN']!;
    expect(robin.connected).toBe(false);
    expect(robin.errors[0]).toContain('lookup failed');

    const [row] = await testDb.pg.select().from(calendarConnectionTable.pg);
    expect(row?.lastError).toBeNull();
  });

  describe('matching by email', () => {
    const members = (list: { slackUserId: string; email: string | null }[]) => ({ members: list, ...WINDOW });
    type Users = { users: Record<string, { connected: boolean; email: string | null; busy: unknown[]; matchedBy: string | null }> };

    beforeEach(async () => {
      await testDb.insert(userTable, { id: 'rec-wey', email: 'Wey@BlueDot.example', name: 'Wey' });
    });

    test('finds an unlinked calendar by account email, ignoring case and spaces', async () => {
      await seedConnection({
        id: 'wey', userId: 'rec-wey', slackUserId: null, refreshToken: 'rt-wey',
      });
      google.accounts.get('rt-wey')!.busy = [{ start: '2026-10-20T09:00:00Z', end: '2026-10-20T10:00:00Z' }];

      const res = await call({ body: members([{ slackUserId: 'U-WEY', email: '  wey@bluedot.EXAMPLE ' }]) });

      expect(res.statusCode).toBe(200);
      expect((res.body as Users).users['U-WEY']).toEqual({
        connected: true,
        timeZone: 'Europe/Berlin',
        email: 'Wey@BlueDot.example',
        busy: [{ start: '2026-10-20T09:00:00.000Z', end: '2026-10-20T10:00:00.000Z' }],
        errors: [],
        matchedBy: 'email',
      });
    });

    test('a Slack link wins over email', async () => {
      // Robin's calendar is linked to U-WEY's Slack ID; Wey's own unlinked calendar must not be used for U-WEY
      await seedConnection({ id: 'robin', slackUserId: 'U-WEY', refreshToken: 'rt-robin' });
      await seedConnection({
        id: 'wey', userId: 'rec-wey', slackUserId: null, refreshToken: 'rt-wey',
      });

      const res = await call({ body: members([{ slackUserId: 'U-WEY', email: 'wey@bluedot.example' }]) });
      const wey = (res.body as Users).users['U-WEY']!;

      expect(wey.matchedBy).toBe('slack');
      expect(wey.email).toBe('robin@bluedot.example');
      expect(google.freeBusyRequests.map((r) => r.accessToken)).toEqual(['access:rt-robin']);
    });

    test('ignores calendars already linked to a different Slack member', async () => {
      await seedConnection({
        id: 'wey', userId: 'rec-wey', slackUserId: 'U-SOMEONE-ELSE', refreshToken: 'rt-wey',
      });

      const res = await call({ body: members([{ slackUserId: 'U-WEY', email: 'wey@bluedot.example' }]) });

      expect((res.body as Users).users['U-WEY']).toMatchObject({ connected: false, matchedBy: null, email: null });
      expect(google.freeBusyRequests).toEqual([]);
    });

    test('a null or unknown email matches nothing', async () => {
      await seedConnection({
        id: 'wey', userId: 'rec-wey', slackUserId: null, refreshToken: 'rt-wey',
      });

      const res = await call({
        body: members([{ slackUserId: 'U-A', email: null }, { slackUserId: 'U-B', email: 'nobody@example.com' }]),
      });

      expect((res.body as Users).users).toMatchObject({
        'U-A': { connected: false, matchedBy: null },
        'U-B': { connected: false, matchedBy: null },
      });
    });

    test('rejects a member without an email field, too many members, and repeated members', async () => {
      expect((await call({ body: { members: [{ slackUserId: 'U1' }], ...WINDOW } })).statusCode).toBe(400);
      const many = Array.from({ length: 501 }, (_, i) => ({ slackUserId: `U${i}`, email: null }));
      expect((await call({ body: members(many) })).statusCode).toBe(400);
      expect((await call({ body: members([{ slackUserId: 'U1', email: 'a@x.com' }, { slackUserId: 'U1', email: 'b@x.com' }]) })).statusCode).toBe(400);
    });
  });
});
