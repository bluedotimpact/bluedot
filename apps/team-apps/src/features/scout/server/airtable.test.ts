import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';

vi.mock('../../../lib/api/env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-only' } }));
import {
  fetchQueue, inviteForReal, declineForReal, parseWebFacts,
} from './airtable';

const fetchMock = vi.fn<typeof fetch>();
const id = 'recScoutSample001';
const applicationId = 'recAppSample00001';
const untouched = { fld8KD3BUPbCHHHqE: ['recRoundExample01'], fldoKAVy6QPWZmofb: applicationId };
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

test('invites with one write: scouting status plus the send box; the automation owns date and source', async () => {
  expect(await run(inviteForReal(id))).toEqual({ ok: true });
  expect(patches()).toHaveLength(1);
  expect((patches()[0]![0] as string)).toContain(`tblBeMxAM1FAW06n4/${id}`);
  expect(JSON.parse(patches()[0]![1]!.body as string)).toEqual({ fields: { fldr09njoFMHdDD1F: 'Invited', flddylvIrOk9DunGQ: true } });
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

test('leaves out people with an approved career transition grant or a completed evaluation call', async () => {
  const granted = 'recScoutSample003';
  const called = 'recScoutSample004';
  const withEmail = (email: string) => ({ ...untouched, fld9BqZjF67r9Ce6O: email });
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.pathname.endsWith('tblBeMxAM1FAW06n4')) {
      return json({ records: [{ id, fields: withEmail('kept@example.org') }, { id: granted, fields: withEmail('Granted@example.org') }, { id: called, fields: withEmail('called@example.org') }] });
    }
    if (url.pathname.endsWith('tblh5zr4jRdrndKnC')) {
      expect(url.searchParams.get('filterByFormula')).toBe("{Status}='Approve'");
      return json({ records: [{ id: 'recGrant', fields: { fldAIKWJz3O3IzyH2: 'granted@example.org' } }] });
    }
    if (url.pathname.endsWith('tblVstbJehu8wew93')) {
      expect(url.searchParams.get('filterByFormula')).toBe("{Status}='Call complete'");
      return json({ records: [{ id: 'recCall', fields: { fldCigDwg47QHQiM8: 'called@example.org' } }] });
    }

    return reads(input, init);
  });
  expect((await run(fetchQueue())).map((item) => item.id)).toEqual([id]);
});

test('does not automatically retry ambiguous write failures that could resend an email', async () => {
  fetchMock.mockImplementation(async (input, init) => (init?.method === 'PATCH' ? json({}, 503) : reads(input, init)));
  await expect(run(inviteForReal(id))).rejects.toMatchObject({ statusCode: 503 });
  expect(patches()).toHaveLength(1);
});

test('web facts: malformed cells read as not looked up, stray nulls are dropped, good data survives', () => {
  expect(parseWebFacts(undefined)).toBeUndefined();
  expect(parseWebFacts('')).toBeUndefined();
  expect(parseWebFacts('not json')).toBeUndefined();
  expect(parseWebFacts('[1,2]')).toBeUndefined();

  const sloppy = parseWebFacts(JSON.stringify({
    identity: { confident: 'yes', matched_on: ['url', 7], note: null },
    links: [null, { url: 'https://github.com/alice', kind: 'github', confidence: 'high' }, { kind: 'website' }],
    sources: [{
      url: 'https://github.com/alice', kind: 'github', confidence: 'high', read: 'page', facts: { recent: [null, { name: 'evals' }] }, other: ['line', 3],
    }, 'junk'],
  }));
  expect(sloppy?.identity).toEqual({ confident: false, matched_on: ['url'], note: '' });
  expect(sloppy?.links).toEqual([{ url: 'https://github.com/alice', kind: 'github', confidence: 'high' }]);
  expect(sloppy?.sources).toHaveLength(1);
  expect(sloppy?.sources[0]?.facts.recent).toEqual([{ name: 'evals' }]);

  // Object-valued scalars and items missing their key field are dropped, not rendered
  const typed = parseWebFacts(JSON.stringify({
    identity: { confident: true, matched_on: [], note: '' },
    links: [],
    sources: [{
      url: 'https://x.org', kind: 'website', confidence: 'high', read: 'page',
      facts: {
        headline: { value: 'x' }, about: 'fine', posts: [{ title: { nested: true } }, { title: 'ok', date: 2026 }], languages: ['ts', 4],
      },
    }],
  }));
  expect(typed?.sources[0]?.facts).toEqual({ about: 'fine', posts: [{ title: 'ok', date: 2026 }], languages: ['ts'] });
  expect(sloppy?.sources[0]?.other).toEqual(['line']);

  const good = parseWebFacts(JSON.stringify({
    identity: { confident: true, matched_on: ['profile URL'], note: '' },
    links: [{ url: 'https://www.linkedin.com/in/alice', kind: 'linkedin', confidence: 'high' }],
    sources: [],
    meta: { searches: 3, all_urls_seen: ['https://www.linkedin.com/in/alice'] },
  }));
  expect(good?.identity.confident).toBe(true);
  expect(good?.meta.searches).toBe(3);
});
