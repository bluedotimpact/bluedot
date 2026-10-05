import { createMocks } from 'node-mocks-http';
import { type NextApiRequest, type NextApiResponse } from 'next';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

const {
  verify, fetchRounds, writeOpinions, fetchApplications, fetchFilterOptions,
} = vi.hoisted(() => ({
  verify: vi.fn(), fetchRounds: vi.fn(), writeOpinions: vi.fn(), fetchApplications: vi.fn(), fetchFilterOptions: vi.fn(),
}));
vi.mock('@bluedot/ui/src/server/verifyToken', () => ({ verifyGoogleBlueDotToken: verify }));
vi.mock('./airtable', () => ({
  fetchRounds, writeOpinions, fetchApplications, fetchFilterOptions,
}));

import rounds from '../../pages/api/rounds';
import decisions from '../../pages/api/decisions';
import applications from '../../pages/api/applications';
import filterOptions from '../../pages/api/filter-options';
import { verifyStaffToken } from './makeApiRoute';
import { PREVIEW_TOKEN } from '../preview';

beforeEach(() => {
  vi.clearAllMocks();
  verify.mockResolvedValue({ email: 'teammate@bluedot.org', sub: 'staff' });
  fetchRounds.mockResolvedValue([{ id: 'recRound', name: 'Sample', course: 'AGI Strategy' }]);
  writeOpinions.mockResolvedValue(undefined);
  fetchApplications.mockResolvedValue({ applications: [] });
  fetchFilterOptions.mockResolvedValue([{ id: 'recSampleFilterA', label: 'Sample filter A' }]);
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

describe('queue filter requests', () => {
  const staffGet = (query: Record<string, string> = {}) => createMocks<NextApiRequest, NextApiResponse>({ method: 'GET', headers: { authorization: 'Bearer staff-token' }, query });

  test('lists filter options for staff only', async () => {
    const denied = createMocks<NextApiRequest, NextApiResponse>({ method: 'GET' });
    await filterOptions(denied.req, denied.res);
    expect(denied.res._getStatusCode()).toBe(401);
    expect(fetchFilterOptions).not.toHaveBeenCalled();
    const allowed = staffGet();
    await filterOptions(allowed.req, allowed.res);
    expect(allowed.res._getStatusCode()).toBe(200);
    expect(allowed.res._getJSONData()).toEqual({ options: [{ id: 'recSampleFilterA', label: 'Sample filter A' }] });
  });

  test('passes the selected option IDs and match mode through, defaulting to any', async () => {
    const all = staffGet({ round: 'recRound', filters: 'recSampleFilterA,recSampleFilterB', match: 'all' });
    await applications(all.req, all.res);
    expect(all.res._getStatusCode()).toBe(200);
    expect(fetchApplications).toHaveBeenLastCalledWith('recRound', undefined, 'top', { optionIds: ['recSampleFilterA', 'recSampleFilterB'], mode: 'all' });
    const any = staffGet({ round: 'recRound', filters: 'recSampleFilterA' });
    await applications(any.req, any.res);
    expect(fetchApplications).toHaveBeenLastCalledWith('recRound', undefined, 'top', { optionIds: ['recSampleFilterA'], mode: 'any' });
    const unfiltered = staffGet({ round: 'recRound' });
    await applications(unfiltered.req, unfiltered.res);
    expect(fetchApplications).toHaveBeenLastCalledWith('recRound', undefined, 'top', undefined);
  });

  test.each([
    ['an ID that is not a record ID', { filters: 'recSampleFilterA,{fldSampleTarget01}' }],
    ['an empty ID', { filters: 'recSampleFilterA,' }],
    ['more than 20 filters', { filters: Array.from({ length: 21 }, (_, index) => `recSampleFilter${index}`).join(',') }],
    ['an unknown match mode', { filters: 'recSampleFilterA', match: 'some' }],
  ])('rejects %s', async (_, query) => {
    const { req, res } = staffGet({ round: 'recRound', ...query });
    await applications(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(fetchApplications).not.toHaveBeenCalled();
  });

  test('an expired offset restarts the same filtered query', async () => {
    fetchApplications.mockRejectedValueOnce(new Error('Airtable error: 422 Unprocessable Entity — LIST_RECORDS_ITERATOR_NOT_AVAILABLE'));
    const { req, res } = staffGet({ round: 'recRound', offset: 'itrStale/recCursor', filters: 'recSampleFilterA' });
    await applications(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(fetchApplications).toHaveBeenNthCalledWith(1, 'recRound', 'itrStale/recCursor', 'top', { optionIds: ['recSampleFilterA'], mode: 'any' });
    expect(fetchApplications).toHaveBeenNthCalledWith(2, 'recRound', undefined, 'top', { optionIds: ['recSampleFilterA'], mode: 'any' });
  });
});
