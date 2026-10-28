import {
  afterEach, beforeEach, expect, test, vi,
} from 'vitest';

vi.mock('../../../lib/api/env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-only' } }));
import {
  attachPastApplications, dropOutReasons, fetchGrantsUnderOtherEmail, fetchIdsNeedingLookup, fetchLead, fetchLookupState, fetchQueue, inviteForReal, declineForReal, parseLeadCourses, parseWebFacts, pickReasonOf, ratingOutOf, splitGrantApplications, toHistoryRow, writeAiSummary,
} from './airtable';
import type { Application, Registration } from '../types';

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
  if (url.pathname.endsWith('tbliURusTrQTjxtkB')) {
    return json({
      records: [
        { id: 'recGrantSample001', fields: { fldAXvEVzLD4rQiks: 'Sámple Participant ', fldWhnuEt3haRK4KN: 'other.address@example.org' } },
        { id: 'recGrantSample002', fields: { fldAXvEVzLD4rQiks: 'Sample Participant', fldWhnuEt3haRK4KN: 'Sample.Participant@example.org' } },
        { id: 'recGrantSample003', fields: { fldAXvEVzLD4rQiks: 'Someone Else', fldWhnuEt3haRK4KN: 'someone.else@example.org' } },
      ],
    });
  }

  if (url.pathname.endsWith('tblRTbvkM5pMvWoEb')) {
    return json({
      records: [
        { id: 'recReportSample001', fields: { fld2RJ0EwPPpo1uSr: 'Strong yes', fldE7HnjsEN7hq1VP: 'Earlier note.' } },
        { id: 'recReportSample002', fields: { fld2RJ0EwPPpo1uSr: 'Weak yes' } },
      ],
    });
  }

  if (url.pathname.endsWith('tblYavwHtMMcn8Wt1')) return json({ records: [{ id: 'recLeadExample01', fields: { fldybLwD2UCqXFeb8: 'Lead@example.org', fldwPw2PCIDfn1ZqE: 'Biosecurity, Pandemics', fldYo8haU379WYYt0: ' Sample  Lead\n' } }] });
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

test('a note goes to the endorsing report only and lands before the status so the facilitator email sees it', async () => {
  currentFields = { ...untouched, fldhnrkUUKFyv6hGe: ['recReportSample001', 'recReportSample002'] };
  expect(await run(declineForReal(id, '  Sharp on mechanisms, but no research experience yet.  '))).toEqual({ ok: true });
  expect(patches().map(([url]) => (url as string).split('/').slice(-2).join('/'))).toEqual(['tblRTbvkM5pMvWoEb/recReportSample001', `tblBeMxAM1FAW06n4/${id}`]);
  expect(JSON.parse(patches()[0]![1]!.body as string)).toEqual({ fields: { fldE7HnjsEN7hq1VP: 'Sharp on mechanisms, but no research experience yet.' } });
  // No reports, or an empty note: the registration write is the only one
  currentFields = { ...untouched };
  fetchMock.mockClear();
  expect(await run(inviteForReal(id, '   '))).toEqual({ ok: true });
  expect(patches()).toHaveLength(1);
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

test('a refusal says what was already done and when, so the lead can be told', async () => {
  currentFields = { ...untouched, fld9YWOaYvSauL5sV: '2026-10-12' };
  expect(await run(inviteForReal(id))).toMatchObject({ ok: false, already: 'Invited', on: '2026-10-12' });
  currentFields = { ...untouched, fldr09njoFMHdDD1F: 'Pass', fldM7qsx4bwtPwno4: '2026-10-14T09:00:00.000Z' };
  expect(await run(declineForReal(id))).toMatchObject({ ok: false, already: 'Pass', on: '2026-10-14T09:00:00.000Z' });
});

test('refuses a participant who has left the locked view', async () => {
  eligible = false;
  expect(await run(inviteForReal(id))).toMatchObject({ ok: false, reason: expect.stringContaining('no longer') });
  expect(patches()).toHaveLength(0);
});

test('a person marked Waiting for review can still be invited or passed; any other status refuses the write', async () => {
  currentFields = { ...untouched, fldr09njoFMHdDD1F: 'Waiting for review' };
  expect(await run(inviteForReal(id))).toEqual({ ok: true });
  expect(JSON.parse(patches()[0]![1]!.body as string)).toEqual({ fields: { fldr09njoFMHdDD1F: 'Invited', flddylvIrOk9DunGQ: true } });

  currentFields = { ...untouched, fldr09njoFMHdDD1F: 'Waiting for review' };
  expect(await run(declineForReal(id))).toEqual({ ok: true });
  expect(JSON.parse(patches()[1]![1]!.body as string)).toEqual({ fields: { fldr09njoFMHdDD1F: 'Pass' } });

  currentFields = { ...untouched, fldr09njoFMHdDD1F: 'Below bar' };
  expect(await run(inviteForReal(id))).toMatchObject({ ok: false, reason: expect.stringContaining('Below bar') });
  expect(patches()).toHaveLength(2);
});

test('preserves queue order from Airtable, follows pagination, and reads must look from the formula field', async () => {
  const first = 'recScoutSample002';
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.pathname.endsWith('tblBeMxAM1FAW06n4')) {
      expect(url.searchParams.get('view')).toBe('viwbqIzi8JU9oQ6DT');
      expect(url.searchParams.getAll('fields[]')).toContain('fldcs9jnQrVcOMkwf');
      // One read per course; only this course has anyone
      if (url.searchParams.get('filterByFormula') !== 'ARRAYJOIN({[>] Course text})=\'Technical AI Safety\'') return json({ records: [] });
      return json(url.searchParams.has('offset') ? { records: [{ id, fields: untouched }] } : { records: [{ id: first, fields: { ...untouched, fldcs9jnQrVcOMkwf: 1, fldAOii0tbRfD1210: [10] } }], offset: 'next-page' });
    }

    return reads(input, init);
  });
  const items = await run(fetchQueue());
  expect(items.map((item) => item.id)).toEqual([first, id]);
  expect(items.map((item) => item.mustLook)).toEqual([true, false]);
  expect(items.map((item) => item.pickReason)).toEqual(['top score', undefined]);
  expect(items.map((item) => item.topScore)).toEqual([10, undefined]);
});

test.each([
  ['shortlist', 'AND(ARRAYJOIN({[>] Course text})=\'Technical AI Safety\',{[*] Talent scouting must look})'],
  ['backlog', 'AND(ARRAYJOIN({[>] Course text})=\'Technical AI Safety\',NOT({[*] Talent scouting must look}))'],
] as const)('the %s read narrows the course to that part of the queue and still leaves out people already supported', async (part, formula) => {
  const called = 'recScoutSample004';
  const formulas: string[] = [];
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.pathname.endsWith('tblBeMxAM1FAW06n4')) {
      expect(url.searchParams.get('view')).toBe('viwbqIzi8JU9oQ6DT');
      formulas.push(url.searchParams.get('filterByFormula') ?? '');
      const fields = { ...untouched, fldcs9jnQrVcOMkwf: part === 'shortlist' ? 1 : 0 };
      return json({ records: [{ id, fields: { ...fields, fld9BqZjF67r9Ce6O: 'kept@example.org' } }, { id: called, fields: { ...fields, fld9BqZjF67r9Ce6O: 'called@example.org' } }] });
    }

    if (url.pathname.endsWith('tblVstbJehu8wew93')) return json({ records: [{ id: 'recCall', fields: { fldCigDwg47QHQiM8: 'called@example.org' } }] });
    if (url.pathname.endsWith('tblh5zr4jRdrndKnC')) return json({ records: [] });
    return reads(input, init);
  });
  expect((await run(fetchQueue(['Technical AI Safety'], part))).map((item) => item.id)).toEqual([id]);
  expect(formulas).toEqual([formula]);
});

test.each(['shortlist', 'backlog'] as const)('if Airtable refuses the %s filter, the whole course is read and split here', async (part) => {
  const shortlisted = 'recScoutSample005';
  const formulas: string[] = [];
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.pathname.endsWith('tblBeMxAM1FAW06n4')) {
      const formula = url.searchParams.get('filterByFormula') ?? '';
      formulas.push(formula);
      if (formula.startsWith('AND(')) return json({ error: { type: 'INVALID_FILTER_BY_FORMULA' } }, 422);
      return json({ records: [{ id: shortlisted, fields: { ...untouched, fldcs9jnQrVcOMkwf: 1 } }, { id, fields: untouched }] });
    }

    return reads(input, init);
  });
  expect((await run(fetchQueue(['Technical AI Safety'], part))).map((item) => item.id)).toEqual([part === 'shortlist' ? shortlisted : id]);
  expect(formulas.at(-1)).toBe('ARRAYJOIN({[>] Course text})=\'Technical AI Safety\'');
});

test('leaves out people with an approved career transition grant or a completed evaluation call', async () => {
  const granted = 'recScoutSample003';
  const called = 'recScoutSample004';
  const withEmail = (email: string) => ({ ...untouched, fld9BqZjF67r9Ce6O: email });
  fetchMock.mockImplementation(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : input.toString());
    if (url.pathname.endsWith('tblBeMxAM1FAW06n4')) {
      if (!url.searchParams.get('filterByFormula')?.endsWith('\'Technical AI Safety\'')) return json({ records: [] });
      return json({ records: [{ id, fields: withEmail('kept@example.org') }, { id: granted, fields: withEmail('Granted@example.org') }, { id: called, fields: withEmail('called@example.org') }] });
    }

    if (url.pathname.endsWith('tbliURusTrQTjxtkB')) {
      expect(url.searchParams.get('filterByFormula')).toBe('AND({Program code}=\'CTG\',{Decision}=\'Approve\')');
      return json({ records: [{ id: 'recGrant', fields: { fldWhnuEt3haRK4KN: 'granted@example.org' } }] });
    }

    if (url.pathname.endsWith('tblVstbJehu8wew93')) {
      expect(url.searchParams.get('filterByFormula')).toBe('{Status}=\'Call complete\'');
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

test('past registrations get their own application attached; the current one and rows without an application id are left alone', () => {
  const reg = (id: string, applicationId: string | undefined, isCurrent: boolean): Registration => ({
    id, course: 'Biosecurity', roundName: 'Biosecurity (2026 Jan W02) - Part-time', facilitated: false, hasCertificate: true, droppedOut: false, applicationId, isCurrent,
  });
  const app = (id: string): Application => ({ id, skills: `skills from ${id}` });
  const history = [reg('recCurrent00000001', 'recAppCurrent00001', true), reg('recPast000000000001', 'recAppPast00000001', false), reg('recPast000000000002', undefined, false)];
  const attached = attachPastApplications(history, new Map([['recAppPast00000001', app('recAppPast00000001')], ['recAppCurrent00001', app('recAppCurrent00001')]]));
  expect(attached[0]!.application).toBeUndefined();
  expect(attached[1]!.application?.skills).toBe('skills from recAppPast00000001');
  expect(attached[2]!.application).toBeUndefined();
});

test('a history row carries the sessions attended and expected when the registration has them', () => {
  const rounds = new Map([['recRoundExample01', { name: 'Test round', course: 'Biosecurity', start: '2026-06-01' }]]);
  const counted = { ...untouched, fldObmJR3eMFoSIfF: 4, fldPq8IHeoXBkD8nE: 5 };
  const withCounts = toHistoryRow({ id, fields: counted }, rounds, 'recOther');
  expect(withCounts).toMatchObject({
    course: 'Biosecurity', roundStart: '2026-06-01', attended: 4, expected: 5, isCurrent: false,
  });
  const withoutCounts = toHistoryRow({ id, fields: untouched }, rounds, id);
  expect(withoutCounts.attended).toBeUndefined();
  expect(withoutCounts.expected).toBeUndefined();
  expect(withoutCounts.isCurrent).toBe(true);
});

test('lead: only scouted courses count, matched by email regardless of case, plus a first name; nobody known means none', async () => {
  expect(parseLeadCourses('Biosecurity, Pandemics, AGI Strategy ')).toEqual(['Biosecurity', 'AGI Strategy']);
  expect(parseLeadCourses(undefined)).toEqual([]);
  expect(await run(fetchLead('lead@EXAMPLE.org'))).toEqual({ courses: ['Biosecurity'], firstName: 'Sample' });
  expect(await run(fetchLead('someone.else@example.org'))).toEqual({ courses: [], firstName: undefined });
});

test('the summary is one write; the lookup state reads both fields; the sweep asks for anyone missing either', async () => {
  await run(writeAiSummary(id, 'Built a thing.'));
  expect(JSON.parse(patches()[0]![1]!.body as string)).toEqual({ fields: { fldFtE1TGgUVNOeCd: 'Built a thing.' } });
  expect(await run(fetchLookupState(id))).toEqual({ lookedUpOn: undefined, summarised: false });
  currentFields = { ...untouched, fldaqAtUqaY0A1wO6: '2026-10-01', fldFtE1TGgUVNOeCd: 'Built a thing.' };
  expect(await run(fetchLookupState(id))).toEqual({ lookedUpOn: '2026-10-01', summarised: true });
  await run(fetchIdsNeedingLookup());
  const sweep = decodeURIComponent((fetchMock.mock.calls.at(-1)![0] as string).replace(/\+/g, ' '));
  expect(sweep).toContain('{Talent scouting looked up on}=BLANK()');
  expect(sweep).toContain('TRIM({Talent scouting AI summary})=""');
});

test('grants under another email: same full name ignoring accents, case and spacing, and only when the email differs', async () => {
  expect(await run(fetchGrantsUnderOtherEmail('Sample  participant', 'sample.participant@example.org'))).toEqual([
    { recordUrl: 'https://airtable.com/apppOzz9fPg59PxLa/tbliURusTrQTjxtkB/recGrantSample001', email: 'other.address@example.org' },
  ]);
  expect(await run(fetchGrantsUnderOtherEmail('Nobody Here', 'nobody@example.org'))).toEqual([]);
});

test('facilitator ratings are out of 10 only when the two sub-scores exist, otherwise out of 5', () => {
  expect(ratingOutOf({ fldPpQJJWyWvNP97T: 8, fldNXTpmIxyKvYdZH: 4, fldUBSY6rZ1Oyf1bd: 4 })).toBe(10);
  expect(ratingOutOf({ fldPpQJJWyWvNP97T: 5, fldRpafPvaOloutyP: 5 })).toBe(5);
});

test('the drop-out reason is the latest drop-out on the application, never a deferral or a placeholder', () => {
  const applications = [
    { id: 'recAppSample00001', fields: { fldaEk9K3m25Hs4Ga: ['recDropSample0001', 'recDropSample0002', 'recDropSample0003'] } },
    { id: 'recAppSample00002', fields: { fldaEk9K3m25Hs4Ga: ['recDropSample0004'] } },
    { id: 'recAppSample00003', fields: {} },
  ];
  const dropOuts = [
    { id: 'recDropSample0001', fields: { fldDiWfBa7r9x3C1B: 'Drop out', fld46PnSM2D9naqtK: 'Busy at work', fld3p5UUEwIg0eTPQ: '2026-05-01T10:00:00.000Z' } },
    { id: 'recDropSample0002', fields: { fldDiWfBa7r9x3C1B: 'Drop out', fld46PnSM2D9naqtK: 'Started a new job', fld3p5UUEwIg0eTPQ: '2026-06-01T10:00:00.000Z' } },
    { id: 'recDropSample0003', fields: { fldDiWfBa7r9x3C1B: 'Deferral', fld46PnSM2D9naqtK: 'Travelling', fld3p5UUEwIg0eTPQ: '2026-07-01T10:00:00.000Z' } },
    { id: 'recDropSample0004', fields: { fldDiWfBa7r9x3C1B: 'Drop out', fld46PnSM2D9naqtK: '-', fld3p5UUEwIg0eTPQ: '2026-07-01T10:00:00.000Z' } },
  ];
  const reasons = dropOutReasons(applications, dropOuts);
  expect(reasons.get('recAppSample00001')).toBe('Started a new job');
  expect(reasons.has('recAppSample00002')).toBe(false);
  expect(reasons.has('recAppSample00003')).toBe(false);
});

test('a top pick gets one reason, in the order the picker counts them', () => {
  const ten = { fldAOii0tbRfD1210: [10, 6] };
  expect(pickReasonOf({ ...ten, fldoLlp0mb3G1Cjrs: 'Strong yes', fldH4kT9DA79mlzBg: ['Weak yes'] })).toBe('strong yes');
  expect(pickReasonOf({ fldoLlp0mb3G1Cjrs: 'Strong yes', fldAOii0tbRfD1210: [9] })).toBe('strong yes');
  expect(pickReasonOf({ fldoLlp0mb3G1Cjrs: 'Strong yes', fldAOii0tbRfD1210: [8] })).toBe('strong yes');
  expect(pickReasonOf({ ...ten, fldoLlp0mb3G1Cjrs: 'Weak yes', fldH4kT9DA79mlzBg: ['Strong yes'] })).toBe('endorsement');
  expect(pickReasonOf({ ...ten, fldoLlp0mb3G1Cjrs: 'Strong yes', fldH4kT9DA79mlzBg: ['Strong yes'] })).toBe('endorsement');
  expect(pickReasonOf({ ...ten, fldoLlp0mb3G1Cjrs: 'Neutral', fldH4kT9DA79mlzBg: ['Weak yes'] })).toBe('top score');
  expect(pickReasonOf({ fldoLlp0mb3G1Cjrs: 'Neutral', fldAOii0tbRfD1210: [8], fld1rY5FPzVWrzyGM: [5] })).toBe('top score');
  expect(pickReasonOf({ fldoLlp0mb3G1Cjrs: 'Neutral', fldAOii0tbRfD1210: [8], fld1rY5FPzVWrzyGM: [4] })).toBeUndefined();
});

test('grant applications: CTGs and other programs split by program code, mapped from the CRM sync', () => {
  const { grants, rapidGrants } = splitGrantApplications([
    {
      id: 'recGrantSample010',
      fields: {
        fldzelzvDtfuMXspL: 'RG', fldKFGJDLiWfuKOiI: '2026-10-20T10:00:00.000Z', fldqUTdas8sW9C0Kl: 'Decline', fldguPWX60DREd8lt: 'Evals sprint', fldNEqii9jsT2eJbU: 3000, fld6GDmgwtpkR3AVM: '\n github.com/example/evals \nhttps://example.org/second', fld7Chg5AaKdHtyhr: 'reviewer@example.org',
      },
    },
    {
      id: 'recGrantSample011',
      fields: {
        fldzelzvDtfuMXspL: 'CTG', fldKFGJDLiWfuKOiI: '2026-10-21T10:00:00.000Z', fldqUTdas8sW9C0Kl: 'Approve', fldNEqii9jsT2eJbU: 40000, fld6mpfrtcHDeyJmF: 30000, fldJuqSsUChqKI6UI: 'Strong track record.', fldyTTOD43D4PQvW8: 'Shipped an eval.', fld9Cnp2l6CHKUkkf: 'Old answers',
      },
    },
    { id: 'recGrantSample012', fields: { fldzelzvDtfuMXspL: 'CTG', fldKFGJDLiWfuKOiI: '2026-07-01T10:00:00.000Z', fld9Cnp2l6CHKUkkf: 'Old answers' } },
    { id: 'recGrantSample013', fields: { fldzelzvDtfuMXspL: 'SEED', fldKFGJDLiWfuKOiI: '2026-10-01T10:00:00.000Z' } },
  ]);

  expect(grants.map((g) => g.id)).toEqual(['recGrantSample012', 'recGrantSample011']);
  expect(grants[1]).toMatchObject({
    status: 'Approve', amountRequestedUsd: 40000, amountUsd: 30000, reasoning: 'Strong track record.', currentSituation: 'Shipped an eval.',
    recordUrl: 'https://airtable.com/apppOzz9fPg59PxLa/tbliURusTrQTjxtkB/recGrantSample011',
  });
  expect(grants[0]!.currentSituation).toBe('Old answers');
  expect(grants[0]!.amountUsd).toBeUndefined();

  expect(rapidGrants.map((g) => [g.id, g.program])).toEqual([['recGrantSample013', 'SEED'], ['recGrantSample010', 'RG']]);
  expect(rapidGrants[1]).toMatchObject({
    decision: 'Decline', projectTitle: 'Evals sprint', amountRequestedUsd: 3000, projectUrl: 'https://github.com/example/evals', madeBy: 'reviewer@example.org',
  });
});
