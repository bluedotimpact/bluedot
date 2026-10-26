import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import type * as Utils from '@bluedot/utils';
import { createMocks } from 'node-mocks-http';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import db from '../../lib/api/db';
import { specialProjectSubmissionTable } from '@bluedot/db';

vi.mock('../../lib/api/db', () => ({ default: { insert: vi.fn() } }));
vi.mock('@bluedot/utils', async (importOriginal) => ({
  ...await importOriginal<typeof Utils>(),
  slackAlert: vi.fn(),
}));

const pitch = {
  outcome: '  More people doing useful AI safety work.  ',
  whyItMatters: 'It addresses an important gap.',
  approach: 'Build a useful resource.',
};

let handler: NextApiHandler;

beforeEach(async () => {
  vi.resetModules();
  vi.mocked(db.insert).mockReset().mockResolvedValue({ id: 'recSaved' } as never);
  handler = (await import('./special-projects')).default;
});

const request = async (body: Record<string, unknown> = pitch, method = 'POST', contentType = 'application/json') => {
  const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
    method: method as 'POST',
    headers: { 'content-type': contentType },
    body,
  });
  await handler(req, res);
  return res;
};

describe('Special Projects intake', () => {
  test('stores an anonymous idea and returns a receipt only after persistence', async () => {
    const res = await request();
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ received: true, reference: 'recSaved' });
    expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({ airtable: specialProjectSubmissionTable.airtable }), expect.objectContaining({
      title: 'More people doing useful AI safety work.',
      outcome: 'More people doing useful AI safety work.',
      whyItMatters: pitch.whyItMatters,
      approach: pitch.approach,
      submitterType: 'Person',
      status: 'New',
      submittedAtSeconds: expect.any(Number),
    }));
  });

  test('accepts agent submissions and preserves optional contact and context', async () => {
    const res = await request({
      ...pitch, submitterType: 'agent', contact: 'owner@example.com', context: 'https://example.com/research',
    });
    expect(res._getStatusCode()).toBe(200);
    expect(db.insert).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ submitterType: 'AI agent', contact: 'owner@example.com' }));
  });

  test.each([
    { ...pitch, outcome: ' ' },
    { ...pitch, outcome: 'x'.repeat(8001) },
    { ...pitch, approach: undefined },
    { ...pitch, approach: 'x'.repeat(8001) },
    { ...pitch, whyItMatters: null },
    { ...pitch, contact: ['unexpected', 'array'] },
    { ...pitch, status: 'Exploring' },
    { ...pitch, submitterType: 'administrator' },
  ])('rejects invalid or privileged fields before writing', async (body) => {
    const res = await request(body);
    expect(res._getStatusCode()).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
  });

  test('GET requests cannot create submissions', async () => {
    const res = await request(pitch, 'GET');
    expect(res._getStatusCode()).toBe(405);
    expect(res.getHeader('Allow')).toBe('POST');
    expect(db.insert).not.toHaveBeenCalled();
  });

  test('rejects non-JSON requests', async () => {
    const res = await request(pitch, 'POST', 'text/plain');
    expect(res._getStatusCode()).toBe(415);
    expect(db.insert).not.toHaveBeenCalled();
  });

  test('does not return a receipt when persistence fails', async () => {
    vi.mocked(db.insert).mockRejectedValue(new Error('Database unavailable'));
    const res = await request();
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).not.toHaveProperty('reference');
  });

  test('bounds intake and returns an actionable retry delay', async () => {
    for (let i = 0; i < 20; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      expect((await request())._getStatusCode()).toBe(200);
    }

    const limited = await request();
    expect(limited._getStatusCode()).toBe(429);
    expect(Number(limited.getHeader('Retry-After'))).toBeGreaterThan(0);
    expect(db.insert).toHaveBeenCalledTimes(20);
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
    expect((await request())._getStatusCode()).toBe(200);
    now.mockRestore();
  });
});
