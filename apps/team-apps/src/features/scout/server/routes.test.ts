import { createMocks } from 'node-mocks-http';
import { type NextApiRequest, type NextApiResponse } from 'next';
import { InvalidTokenError } from '@bluedot/ui/src/api';
import {
  beforeEach, expect, test, vi,
} from 'vitest';

const {
  verify, fetchQueue, fetchInvitedThisWeek, fetchLead, fetchPerson, recordDecision,
} = vi.hoisted(() => ({
  verify: vi.fn(), fetchQueue: vi.fn(), fetchInvitedThisWeek: vi.fn(async () => ({})), fetchLead: vi.fn(async (_email: string): Promise<{ courses: string[]; firstName?: string }> => ({ courses: [] })), fetchPerson: vi.fn(), recordDecision: vi.fn(),
}));
vi.mock('@bluedot/ui/src/server/verifyToken', () => ({ verifyGoogleBlueDotToken: verify }));
vi.mock('./index', () => ({
  fetchQueue, fetchInvitedThisWeek, fetchLead, fetchPerson, recordDecision, startSupportedCheck: vi.fn(async () => new Set()), warmRounds: vi.fn(),
}));
vi.mock('../../../lib/api/env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-only', AIRTABLE_AUTOMATION_TOKEN: 'automation-secret', ALERTS_SLACK_BOT_TOKEN: 'IGNORE_SLACK_ALERTS' } }));
const { lookUpPeople, idsToLookUp, assess } = vi.hoisted(() => ({
  lookUpPeople: vi.fn(async () => undefined),
  idsToLookUp: vi.fn(async (body: { ids?: string[] }) => body.ids ?? []),
  assess: vi.fn(async () => ({ decision: 'yes', reasoning: 'Shipped something real.' })),
}));
vi.mock('../../../features/scout/server/lookup', () => ({ lookUpPeople, idsToLookUp }));
vi.mock('../../../features/scout/server/assess', () => ({ assess }));
import lookup from '../../../pages/api/scout/lookup';
import assessRoute from '../../../pages/api/scout/assess';
import queue from '../../../pages/api/scout/queue';
import counts from '../../../pages/api/scout/counts';
import person from '../../../pages/api/scout/person/[id]';
import decision from '../../../pages/api/scout/decision';

beforeEach(() => {
  vi.clearAllMocks();
  verify.mockResolvedValue({ email: 'staff@bluedot.org', sub: 'staff' });
  fetchQueue.mockResolvedValue([]);
  fetchPerson.mockResolvedValue({ id: 'recScoutSample001', name: 'Synthetic participant' });
  recordDecision.mockResolvedValue({ ok: true });
});
const headers = { authorization: 'Bearer verified-staff' };

test('rejects unauthenticated reads and writes before accessing any records', async () => {
  for (const [handler, method] of [[queue, 'GET'], [person, 'GET'], [decision, 'POST']] as const) {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method });
    // eslint-disable-next-line no-await-in-loop
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  }

  expect(fetchQueue).not.toHaveBeenCalled();
  expect(fetchPerson).not.toHaveBeenCalled();
  expect(recordDecision).not.toHaveBeenCalled();
});

test('any verified staff member can read and decide without an admin role', async () => {
  const reads = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers });
  await queue(reads.req, reads.res);
  expect(reads.res._getStatusCode()).toBe(200);
  expect(reads.res._getHeaders()['cache-control']).toBe('no-store');
  const writes = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers, body: { id: 'recScoutSample001', decision: 'invite' } });
  await decision(writes.req, writes.res);
  expect(writes.res._getStatusCode()).toBe(200);
  expect(recordDecision).toHaveBeenCalledWith('recScoutSample001', 'invite', undefined);
});

test('the queue carries the courses led by the signed-in email and their first name', async () => {
  fetchLead.mockResolvedValueOnce({ courses: ['Biosecurity'], firstName: 'Sample' });
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers });
  await queue(req, res);
  expect(res._getStatusCode()).toBe(200);
  expect(fetchLead).toHaveBeenCalledWith('staff@bluedot.org');
  expect(res._getJSONData()).toMatchObject({ leadCourses: ['Biosecurity'], leadName: 'Sample' });
  // The lead's own shortlist first; the page asks for their backlog and the other courses next
  expect(fetchQueue).toHaveBeenLastCalledWith(['Biosecurity'], 'shortlist', expect.any(Promise));
  expect(res._getJSONData().later).toEqual([
    { courses: ['Biosecurity'], part: 'backlog' },
    { courses: ['Technical AI Safety', 'Technical AI Safety Project', 'AGI Strategy', 'Frontier AI Governance'], part: 'all' },
  ]);
  const rest = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers, query: { courses: 'AGI Strategy,Not a course', part: 'backlog' } });
  await queue(rest.req, rest.res);
  expect(fetchQueue).toHaveBeenLastCalledWith(['AGI Strategy'], 'backlog');
  expect(rest.res._getJSONData().later).toEqual([]);

  const viewing = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers, query: { viewAs: 'lead@example.org' } });
  await queue(viewing.req, viewing.res);
  expect(fetchLead).toHaveBeenLastCalledWith('lead@example.org');
  const notAnEmail = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers, query: { viewAs: 'not an email' } });
  await queue(notAnEmail.req, notAnEmail.res);
  expect(fetchLead).toHaveBeenLastCalledWith('staff@bluedot.org');
});

test('rejects non-staff identities, wrong methods and invalid decisions', async () => {
  verify.mockRejectedValueOnce(new InvalidTokenError('Not a verified bluedot.org account'));
  const denied = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers });
  await queue(denied.req, denied.res);
  expect(denied.res._getStatusCode()).toBe(401);
  const wrongMethod = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers });
  await decision(wrongMethod.req, wrongMethod.res);
  expect(wrongMethod.res._getStatusCode()).toBe(405);
  const invalid = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers, body: { id: 'recScoutSample001', decision: 'delete' } });
  await decision(invalid.req, invalid.res);
  expect(invalid.res._getStatusCode()).toBe(400);
  expect(recordDecision).not.toHaveBeenCalled();
});

test('validates participant IDs and reports missing records', async () => {
  const invalid = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers, query: { id: 'wrong-id' } });
  await person(invalid.req, invalid.res);
  expect(invalid.res._getStatusCode()).toBe(400);
  expect(fetchPerson).not.toHaveBeenCalled();
  fetchPerson.mockResolvedValue(undefined);
  const missing = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers, query: { id: 'recScoutSample001' } });
  await person(missing.req, missing.res);
  expect(missing.res._getStatusCode()).toBe(404);
});

test('returns actionable save errors without exposing underlying credentials or records', async () => {
  recordDecision.mockRejectedValue(new Error('Private upstream details'));
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers, body: { id: 'recScoutSample001', decision: 'decline' } });
  await decision(req, res);
  expect(res._getStatusCode()).toBe(503);
  expect(res._getJSONData().error).toContain('Could not confirm the save');
  expect(res._getJSONData().error).not.toContain('Private upstream details');
});

test('the lookup route accepts only the Airtable automation token and answers before the lookups run', async () => {
  const body = { ids: ['recScoutSample001', 'recScoutSample002'] };
  const denied = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers: { authorization: 'Bearer verified-staff' }, body });
  await lookup(denied.req, denied.res);
  expect(denied.res._getStatusCode()).toBe(401);
  expect(lookUpPeople).not.toHaveBeenCalled();

  const ok = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers: { authorization: 'Bearer automation-secret' }, body });
  await lookup(ok.req, ok.res);
  expect(ok.res._getStatusCode()).toBe(200);
  expect(ok.res._getJSONData()).toEqual({ accepted: 2 });
  expect(lookUpPeople).toHaveBeenCalledWith(body.ids);
});

test('the assess route accepts only the automation token, assesses the loaded person with the given prompt, and answers in the same request', async () => {
  const body = { id: 'recScoutSample001', prompt: 'Say whether this person is worth a course lead\'s look.' };
  const denied = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers, body });
  await assessRoute(denied.req, denied.res);
  expect(denied.res._getStatusCode()).toBe(401);
  expect(assess).not.toHaveBeenCalled();

  const ok = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers: { authorization: 'Bearer automation-secret' }, body });
  await assessRoute(ok.req, ok.res);
  expect(ok.res._getStatusCode()).toBe(200);
  expect(ok.res._getJSONData()).toEqual({ decision: 'yes', reasoning: 'Shipped something real.' });
  expect(assess).toHaveBeenCalledWith(expect.objectContaining({ id: 'recScoutSample001' }), body.prompt);

  fetchPerson.mockResolvedValueOnce(undefined);
  const missing = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers: { authorization: 'Bearer automation-secret' }, body });
  await assessRoute(missing.req, missing.res);
  expect(missing.res._getStatusCode()).toBe(404);
});

test('the counts route accepts only the automation token and returns the round picker numbers per course', async () => {
  const denied = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers });
  await counts(denied.req, denied.res);
  expect(denied.res._getStatusCode()).toBe(401);
  expect(fetchQueue).not.toHaveBeenCalled();

  fetchQueue.mockResolvedValueOnce([{ id: 'recScoutSample001', course: 'Biosecurity' }, { id: 'recScoutSample002', course: 'Biosecurity' }, { id: 'recScoutSample003', course: 'AGI Strategy' }]);
  fetchInvitedThisWeek.mockResolvedValueOnce({ Biosecurity: { total: 3, viaApp: 2 } });
  const ok = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers: { authorization: 'Bearer automation-secret' } });
  await counts(ok.req, ok.res);
  expect(ok.res._getStatusCode()).toBe(200);
  const data = ok.res._getJSONData();
  expect(data.toReview).toMatchObject({ Biosecurity: 2, 'AGI Strategy': 1 });
  expect(data.invitedThisWeek).toEqual({ Biosecurity: { total: 3, viaApp: 2 } });
});
