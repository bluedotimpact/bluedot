import type { NextApiRequest, NextApiResponse } from 'next';
import {
  describe, it, expect, vi,
} from 'vitest';
import handler from './health';

describe('health', () => {
  it('returns 200 so a booted app passes the readiness probe', () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    } as unknown as NextApiResponse;

    handler({} as NextApiRequest, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});
