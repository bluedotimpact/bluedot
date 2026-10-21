import { calendarConnectionTable, userTable } from '@bluedot/db';
import type { NextApiRequest, NextApiResponse } from 'next';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { setupTestDb, testDb } from '../../../__tests__/dbTestUtils';
import { createFakeGoogle, type FakeGoogle } from '../../../__tests__/fakeGoogle';
import {
  createFakeMicrosoft, utc, type FakeGraphEvent, type FakeMicrosoft,
} from '../../../__tests__/fakeMicrosoft';
import { decryptRefreshToken, encryptRefreshToken } from '../../../lib/api/calendarConnect';
import handler from './busy';

vi.mock('../../../lib/api/env', async () => ({ default: (await import('../../../__tests__/fakeGoogle')).TEST_CALENDAR_ENV }));
vi.mock('@bluedot/utils', async (importOriginal) => ({ ...await importOriginal<object>(), slackAlert: vi.fn() }));

setupTestDb();

const WINDOW = { timeMin: '2026-10-19T00:00:00Z', timeMax: '2026-10-26T00:00:00Z' };

let google: FakeGoogle;
let microsoft: FakeMicrosoft;

beforeEach(async () => {
  google = createFakeGoogle();
  microsoft = createFakeMicrosoft({ fallback: google.fetch });
  vi.stubGlobal('fetch', vi.fn(microsoft.fetch));
  await testDb.insert(userTable, { id: 'rec-robin', email: 'robin@bluedot.example', name: 'Robin' });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const seedConnection = async ({
  id, provider, refreshToken, email = `${id}@example.com`, updatedAt = '2026-10-15T00:00:00Z',
}: { id: string; provider: 'google' | 'microsoft'; refreshToken: string; email?: string; updatedAt?: string }) => {
  if (provider === 'google') google.accounts.set(refreshToken, {});
  else microsoft.accounts.set(refreshToken, {});
  await testDb.pg.insert(calendarConnectionTable.pg).values({
    id,
    slackUserId: 'U-ROBIN',
    userId: 'rec-robin',
    provider,
    providerAccountId: `sub-${id}`,
    providerAccountEmail: email,
    encryptedRefreshToken: encryptRefreshToken(refreshToken),
    scopes: '',
    timeZone: 'Europe/London',
    updatedAt,
  });
};

type Robin = { connected: boolean; emails: string[]; busy: { start: string; end: string }[]; errors: string[] };

const call = async () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
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
    setHeader() {},
  };
  await handler({
    method: 'POST', headers: { authorization: 'Bearer busy-secret' }, body: { slackUserIds: ['U-ROBIN'], ...WINDOW }, url: '/api/calendar-connections/busy',
  } as unknown as NextApiRequest, res as unknown as NextApiResponse);
  expect(res.statusCode).toBe(200);
  return (res.body as { users: Record<string, Robin> }).users['U-ROBIN']!;
};

const row = async (id: string) => (await testDb.pg.select().from(calendarConnectionTable.pg)).find((r) => r.id === id)!;

describe('busy times from Outlook calendars', () => {
  test('counts busy, tentative, out-of-office and unknown events, and skips free, working elsewhere, cancelled and declined ones', async () => {
    await seedConnection({ id: 'outlook', provider: 'microsoft', refreshToken: 'rt-outlook' });
    const event = (hour: number, extra: Partial<FakeGraphEvent>): FakeGraphEvent => ({
      start: utc(`2026-10-20T${String(hour).padStart(2, '0')}:00:00.0000000`),
      end: utc(`2026-10-20T${String(hour).padStart(2, '0')}:30:00.0000000`),
      showAs: 'busy',
      responseStatus: { response: 'accepted' },
      ...extra,
    });
    microsoft.accounts.get('rt-outlook')!.events = [
      event(9, {}),
      event(10, { showAs: 'tentative' }),
      event(11, { showAs: 'oof' }),
      event(12, { showAs: 'unknown' }),
      event(13, { showAs: 'free' }),
      event(14, { showAs: 'workingElsewhere' }),
      event(15, { isCancelled: true }),
      event(16, { responseStatus: { response: 'declined' } }),
    ];

    const robin = await call();

    expect(robin.errors).toEqual([]);
    expect(robin.connected).toBe(true);
    expect(robin.busy).toEqual([9, 10, 11, 12].map((h) => ({
      start: `2026-10-20T${String(h).padStart(2, '0')}:00:00.000Z`, end: `2026-10-20T${String(h).padStart(2, '0')}:30:00.000Z`,
    })));
  });

  test('asks Graph only for times and status on the default calendar, in UTC', async () => {
    await seedConnection({ id: 'outlook', provider: 'microsoft', refreshToken: 'rt-outlook' });

    await call();

    const [request] = microsoft.calendarRequests;
    expect(request!.url.origin + request!.url.pathname).toBe('https://graph.microsoft.com/v1.0/me/calendar/calendarView');
    expect(Object.fromEntries(request!.url.searchParams)).toMatchObject({
      startDateTime: '2026-10-19T00:00:00.000Z',
      endDateTime: '2026-10-26T00:00:00.000Z',
      $select: 'start,end,showAs,isCancelled,responseStatus',
    });
    expect(request!.prefer).toBe('outlook.timezone="UTC"');
  });

  test('follows every page of results', async () => {
    await seedConnection({ id: 'outlook', provider: 'microsoft', refreshToken: 'rt-outlook' });
    const account = microsoft.accounts.get('rt-outlook')!;
    account.pageSize = 2;
    account.events = [1, 2, 3, 4, 5].map((day) => ({
      start: utc(`2026-10-2${day}T09:00:00.0000000`), end: utc(`2026-10-2${day}T10:00:00.0000000`), showAs: 'busy',
    }));

    const robin = await call();

    expect(microsoft.calendarRequests).toHaveLength(3);
    expect(robin.busy).toHaveLength(5);
  });

  test('stores the rotated refresh token after each lookup, keeping "when they last connected"', async () => {
    await seedConnection({ id: 'outlook', provider: 'microsoft', refreshToken: 'rt-outlook' });

    await call();
    const afterFirst = await row('outlook');
    expect(decryptRefreshToken(afterFirst.encryptedRefreshToken)).toBe('rt-outlook~1');
    expect(afterFirst.updatedAt).toBe('2026-10-15 00:00:00+00');

    await call();
    expect(decryptRefreshToken((await row('outlook')).encryptedRefreshToken)).toBe('rt-outlook~2');
    // The second lookup used the token the first one stored
    expect(microsoft.tokenRequests.map((r) => r.get('refresh_token'))).toEqual(['rt-outlook', 'rt-outlook~1']);
  });

  test('merges Outlook and Google busy times, and invites both accounts', async () => {
    await seedConnection({
      id: 'gmail', provider: 'google', refreshToken: 'rt-google', email: 'robin@gmail.example',
    });
    await seedConnection({
      id: 'outlook', provider: 'microsoft', refreshToken: 'rt-outlook', email: 'robin@outlook.example', updatedAt: '2026-10-16T00:00:00Z',
    });
    google.accounts.get('rt-google')!.busy = [{ start: '2026-10-20T09:00:00Z', end: '2026-10-20T10:00:00Z' }];
    microsoft.accounts.get('rt-outlook')!.events = [
      { start: utc('2026-10-20T09:30:00.0000000'), end: utc('2026-10-20T11:00:00.0000000'), showAs: 'busy' },
    ];

    const robin = await call();

    expect(robin.busy).toEqual([{ start: '2026-10-20T09:00:00.000Z', end: '2026-10-20T11:00:00.000Z' }]);
    expect(robin.emails).toEqual(['robin@bluedot.example', 'robin@outlook.example', 'robin@gmail.example']);
  });

  test('a revoked Outlook connection is flagged for reconnecting', async () => {
    await seedConnection({
      id: 'outlook', provider: 'microsoft', refreshToken: 'rt-outlook', email: 'robin@outlook.example',
    });
    microsoft.accounts.get('rt-outlook')!.revoked = true;

    const robin = await call();

    expect(robin.connected).toBe(false);
    expect(robin.errors[0]).toContain('robin@outlook.example (microsoft)');
    expect(robin.errors[0]).toContain('reconnect');
    expect((await row('outlook')).lastError).toBe('invalid_grant');
  });

  test('an account Graph refuses (e.g. no Outlook mailbox) is flagged; a Graph outage is not', async () => {
    await seedConnection({ id: 'outlook', provider: 'microsoft', refreshToken: 'rt-outlook' });
    microsoft.accounts.get('rt-outlook')!.calendarStatus = 404;
    await call();
    expect((await row('outlook')).lastError).toContain('HTTP 404');

    await testDb.pg.update(calendarConnectionTable.pg).set({ lastError: null });
    microsoft.accounts.get('rt-outlook')!.calendarStatus = 503;
    const robin = await call();
    expect(robin.errors[0]).toContain('lookup failed');
    expect((await row('outlook')).lastError).toBeNull();
  });

  test('fails loudly rather than misreading an event time that isn\'t in UTC', async () => {
    await seedConnection({ id: 'outlook', provider: 'microsoft', refreshToken: 'rt-outlook' });
    microsoft.accounts.get('rt-outlook')!.events = [
      { start: { dateTime: '2026-10-20T09:00:00.0000000', timeZone: 'Pacific Standard Time' }, end: utc('2026-10-20T10:00:00.0000000'), showAs: 'busy' },
    ];

    const robin = await call();

    expect(robin.connected).toBe(false);
    expect(robin.errors[0]).toContain('not UTC');
  });
});
