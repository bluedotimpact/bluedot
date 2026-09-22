import { createMocks } from 'node-mocks-http';
import { type NextApiRequest, type NextApiResponse } from 'next';
import {
  beforeEach, expect, test, vi,
} from 'vitest';

const {
  verify, fetchQueue, fetchInvitedThisWeek, fetchPerson, recordDecision,
} = vi.hoisted(() => ({
  verify: vi.fn(), fetchQueue: vi.fn(), fetchInvitedThisWeek: vi.fn(async () => ({})), fetchPerson: vi.fn(), recordDecision: vi.fn(),
}));
vi.mock('@bluedot/ui', () => ({ loginPresets: { googleBlueDot: { verifyAndDecodeToken: verify } } }));
vi.mock('./index', () => ({
  fetchQueue, fetchInvitedThisWeek, fetchPerson, recordDecision,
}));
import queue from '../../../pages/api/scout/queue';
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
  expect(recordDecision).toHaveBeenCalledWith('recScoutSample001', 'invite');
});

test('rejects non-staff identities, wrong methods and invalid decisions', async () => {
  verify.mockRejectedValueOnce(new Error('Not a verified bluedot.org account'));
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
