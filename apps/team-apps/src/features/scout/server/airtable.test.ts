import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';

vi.mock('../../../lib/api/env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-only' } }));
import { fetchQueue, inviteForReal, declineForReal } from './airtable';

const fetchMock = vi.fn<typeof fetch>();
const id = 'recScoutSample001';
const untouched = { fld8KD3BUPbCHHHqE: ['recRoundExample01'] };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
let currentFields: Record<string, unknown>;
let eligible = true;
const reads = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  if (init?.method === 'PATCH') return json({ id, fields: JSON.parse(init.body as string).fields });
  if (url.pathname.endsWith(id)) return json({ id, fields: currentFields });
  if (url.pathname.endsWith('tblu6u7F2NHfCMgsk')) return json({ records: [{ id: 'recRoundExample01', fields: { fldEBVjEF9l2IEyG7: 'Test round', fldvorW4UVmRTihB9: ['Technical AI Safety'] } }] });
  return json({ records: eligible ? [{ id, fields: untouched }] : [] });
};

const patches = () => fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH');
const run = async <T>(work: Promise<T>): Promise<T> => {
  // Attach a rejection handler while advancing the rate-limiter's timers.
  const settled = work.then((value) => ({ value }), (error: unknown) => ({ error }));
  await vi.runAllTimersAsync();
  const result = await settled;
  if ('error' in result) throw result.error;
  return result.value;
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset().mockImplementation(reads);
  currentFields = { ...untouched };
  eligible = true;
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

test('invites using one write with the existing email trigger and source', async () => {
  expect(await run(inviteForReal(id))).toEqual({ ok: true });
  expect(patches()).toHaveLength(1);
  expect(JSON.parse(patches()[0]![1]!.body as string)).toEqual({
    fields: {
      fldr09njoFMHdDD1F: 'Invited', fldCWl2plmCdiykLb: 'Talent scouting app', flddylvIrOk9DunGQ: true,
    },
  });
});

test('declines only by setting the scouting status, without triggering email', async () => {
  expect(await run(declineForReal(id))).toEqual({ ok: true });
  expect(JSON.parse(patches()[0]![1]!.body as string)).toEqual({ fields: { fldr09njoFMHdDD1F: 'Pass' } });
});

test.each(['fld9YWOaYvSauL5sV', 'fldTuKceN6K8fDrvH', 'fldBPgPLpZ1oL4KiT', 'flddylvIrOk9DunGQ', 'fldr09njoFMHdDD1F'])('refuses a fresh decision when contact/status field %s is already set', async (field) => {
  currentFields[field] = field === 'fldr09njoFMHdDD1F' ? 'Pass' : true;
  expect(await run(inviteForReal(id))).toMatchObject({ ok: false });
  expect(await run(declineForReal(id))).toMatchObject({ ok: false });
  expect(patches()).toHaveLength(0);
});

test('refuses a participant who has left the locked view', async () => {
  eligible = false;
  expect(await run(inviteForReal(id))).toMatchObject({ ok: false, reason: expect.stringContaining('no longer') });
  expect(patches()).toHaveLength(0);
});

test('preserves queue order from Airtable and follows pagination', async () => {
  const first = 'recScoutSample002';
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.pathname.endsWith('tblBeMxAM1FAW06n4')) {
      expect(url.searchParams.get('view')).toBe('viwbqIzi8JU9oQ6DT');
      return json(url.searchParams.has('offset') ? { records: [{ id, fields: untouched }] } : { records: [{ id: first, fields: untouched }], offset: 'next-page' });
    }

    return reads(input, init);
  });
  expect((await run(fetchQueue())).map((item) => item.id)).toEqual([first, id]);
});

test('does not automatically retry ambiguous write failures that could resend an email', async () => {
  fetchMock.mockImplementation(async (input, init) => (init?.method === 'PATCH' ? json({}, 503) : reads(input, init)));
  await expect(run(inviteForReal(id))).rejects.toMatchObject({ statusCode: 503 });
  expect(patches()).toHaveLength(1);
});
