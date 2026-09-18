import { createMocks } from 'node-mocks-http';
import { type NextApiRequest, type NextApiResponse } from 'next';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

const { verify, fetchRounds, writeOpinions } = vi.hoisted(() => ({ verify: vi.fn(), fetchRounds: vi.fn(), writeOpinions: vi.fn() }));
vi.mock('@bluedot/ui', () => ({ loginPresets: { googleBlueDot: { verifyAndDecodeToken: verify } } }));
vi.mock('./airtable', () => ({ fetchRounds, writeOpinions }));

import rounds from '../../pages/api/rounds';
import decisions from '../../pages/api/decisions';
import { verifyStaffToken } from './makeApiRoute';
import { PREVIEW_TOKEN } from '../preview';

beforeEach(() => {
  vi.clearAllMocks();
  verify.mockResolvedValue({ email: 'teammate@bluedot.org', sub: 'staff' });
  fetchRounds.mockResolvedValue([{ id: 'recRound', name: 'Sample', course: 'AGI Strategy' }]);
  writeOpinions.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('staff access', () => {
  test('rejects unauthenticated reads', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await rounds(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(fetchRounds).not.toHaveBeenCalled();
  });
  test('rejects a token that Google verification rejects', async () => {
    verify.mockRejectedValue(new Error('Not a verified bluedot.org account'));
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers: { authorization: 'Bearer personal-account' } });
    await rounds(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(fetchRounds).not.toHaveBeenCalled();
  });
  test('allows verified staff without website admin roles', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers: { authorization: 'Bearer staff-token' } });
    await rounds(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(verify).toHaveBeenCalledWith('staff-token');
    expect(res._getJSONData().rounds).toHaveLength(1);
  });
  test('protects writes and validates ratings', async () => {
    const opinions = [{ id: 'recSamplePerson01', opinion: 'Weak yes', decision: 'Accept' }];
    const denied = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', body: { opinions } });
    await decisions(denied.req, denied.res);
    expect(denied.res._getStatusCode()).toBe(401);
    expect(writeOpinions).not.toHaveBeenCalled();
    const invalid = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers: { authorization: 'Bearer staff-token' }, body: { opinions: [{ ...opinions[0], decision: 'Invalid' }] } });
    await decisions(invalid.req, invalid.res);
    expect(invalid.res._getStatusCode()).toBe(400);
    expect(writeOpinions).not.toHaveBeenCalled();
    const allowed = createMocks<NextApiRequest, NextApiResponse>({ method: 'POST', headers: { authorization: 'Bearer staff-token' }, body: { opinions } });
    await decisions(allowed.req, allowed.res);
    expect(allowed.res._getStatusCode()).toBe(204);
    expect(writeOpinions).toHaveBeenCalledWith(opinions);
  });
  test('rejects preview tokens in production even with the flag set', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'true');
    verify.mockRejectedValue(new Error('Invalid token'));
    await expect(verifyStaffToken(PREVIEW_TOKEN)).rejects.toThrow('Invalid token');
    expect(verify).toHaveBeenCalledWith(PREVIEW_TOKEN);
  });
  test('requires explicit development opt-in', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'false');
    verify.mockRejectedValue(new Error('Invalid token'));
    await expect(verifyStaffToken(PREVIEW_TOKEN)).rejects.toThrow();
  });
  test('allows the synthetic identity in the development preview', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'true');
    await expect(verifyStaffToken(PREVIEW_TOKEN)).resolves.toEqual({ email: 'preview@bluedot.org', sub: 'local-preview' });
    expect(verify).not.toHaveBeenCalled();
  });
});
