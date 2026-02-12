import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { z } from 'zod';
import { type NextApiRequest, type NextApiResponse } from 'next';
import createHttpError from 'http-errors';
import { makeMakeApiRoute } from './makeMakeApiRoute';

const mockEnv = {
  APP_NAME: 'test-app',
  ALERTS_SLACK_BOT_TOKEN: 'mock-token',
  ALERTS_SLACK_CHANNEL_ID: 'mock-channel',
  INFO_SLACK_CHANNEL_ID: 'mock-info-channel',
};

const mockVerifyToken = vi.fn().mockImplementation((token: string) => {
  if (token === 'valid-token') {
    return { sub: 'test123', email: 'test@bluedot.org' };
  }

  throw new Error('bah');
});

const createMockReq = (overrides?: Partial<NextApiRequest>): NextApiRequest => ({
  headers: {},
  body: null,
  method: 'POST',
  url: '/api/test',
  ...overrides,
}) as NextApiRequest;

const createMockRes = (): NextApiResponse => {
  const callCounts = {
    status: 0,
    json: 0,
    end: 0,
  };

  const res = {
    status: vi.fn().mockImplementation(() => {
      callCounts.status += 1;
      if (callCounts.status > 1) {
        throw new Error('status() may only be called once, but it was called more than once');
      }

      return res;
    }),
    json: vi.fn().mockImplementation(() => {
      callCounts.json += 1;
      if (callCounts.json > 1) {
        throw new Error('json() may only be called once, but it was called more than once');
      }

      if (callCounts.end > 1) {
        throw new Error('only one of json() and end() may be called, but both were called');
      }

      if (callCounts.status !== 1) {
        throw new Error('json() must be called after status(), but status() had not been called');
      }

      return res;
    }),
    end: vi.fn().mockImplementation(() => {
      callCounts.end += 1;
      if (callCounts.end > 1) {
        throw new Error('end() may only be called once, but it was called more than once');
      }

      if (callCounts.json > 1) {
        throw new Error('only one of json() and end() may be called, but both were called');
      }

      if (callCounts.status !== 1) {
        throw new Error('end() must be called after status(), but status() had not been called');
      }

      return res;
    }),
  };
  return res as unknown as NextApiResponse;
};

describe('makeMakeApiRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('request and response validation', () => {
    test('should allow valid request body to be accepted', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });
      const requestSchema = z.object({ name: z.string() });

      const handler = makeApiRoute(
        { requestBody: requestSchema, requireAuth: false },
        async (body) => {
          // Check the types work correctly
          const nameAsString: string = body.name;

          // @ts-expect-error: should be a string, not a number
          const nameAsNumber: number = body.name;
          // @ts-expect-error: not on the schema
          const ageAsNumber: number = body.age;

          if (nameAsString.length === ageAsNumber && nameAsNumber > 5) {
            throw new createHttpError.BadRequest('Invalid params');
          }
        },
      );

      const req = createMockReq({ body: { name: 'test' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.json).not.toHaveBeenCalled();
    });

    test('should return 400 for invalid request body', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });
      const requestSchema = z.object({ name: z.string() });

      const handler = makeApiRoute(
        { requestBody: requestSchema, requireAuth: false },
        async () => {},
      );

      const req = createMockReq({ body: { name: 123 } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringContaining('Invalid request body'),
      });
    });

    test('should allow valid response body to be returned', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });
      const responseSchema = z.object({ success: z.boolean() });

      const handler = makeApiRoute(
        { responseBody: responseSchema, requireAuth: false },
        async () => ({ success: true }),
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('should allow valid request and response body', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });
      const requestSchema = z.object({ name: z.string() });
      const responseSchema = z.object({ success: z.boolean() });

      const handler = makeApiRoute(
        { requestBody: requestSchema, responseBody: responseSchema, requireAuth: false },
        async () => ({ success: true }),
      );

      const req = createMockReq({ body: { name: 'test' } });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });

    test('should return 204 for null response', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });

      const handler = makeApiRoute(
        { requireAuth: false },
        async () => null,
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });

    test('should return 500 for returning nothing when response body set', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });

      const handler = makeApiRoute(
        { requireAuth: false, responseBody: z.object({ a: z.boolean() }) },
        // @ts-expect-error
        async () => null,
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
      });
    });

    test('should return 500 for returning something of wrong shape', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });

      const handler = makeApiRoute(
        { requireAuth: false, responseBody: z.object({ a: z.boolean() }) },
        // @ts-expect-error
        async () => ({ b: true }),
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
      });
    });

    test('should return 500 for returning something when not expected', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });

      const handler = makeApiRoute(
        { requireAuth: false },
        // @ts-expect-error
        async () => {
          return { success: true };
        },
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
      });
    });

    // Skipped by default as this is slow
    // If this test fails, you've probably introduced a memory leak into makeMakeApiRoute
    const REQUEST_COUNT = 1_000_000;
    test.skip(`should handle ${REQUEST_COUNT.toLocaleString()} requests without crash`, async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });
      const responseSchema = z.object({ counter: z.number() });

      const handler = makeApiRoute(
        { responseBody: responseSchema, requireAuth: false },
        async () => ({ counter: 1 }),
      );

      const req = createMockReq();
      // We create a mock without vitest to avoid vitest memory leaks (as it saves mock call data each time)
      const res = {
        status: () => res,
        json: () => res,
        end: () => res,
      } as unknown as NextApiResponse;
      for (let i = 0; i < REQUEST_COUNT; i++) {
        // eslint-disable-next-line no-await-in-loop
        await handler(req, res);
      }
    });
  });

  describe('authentication', () => {
    test('should require auth token when requireAuth is true', async () => {
      const makeApiRoute = makeMakeApiRoute({
        env: mockEnv,
        verifyAndDecodeToken: mockVerifyToken,
      });

      const handler = makeApiRoute(
        { requireAuth: true, responseBody: z.object({ userId: z.string() }) },
        async (_, { auth }) => ({ userId: auth.sub }),
      );

      const req = createMockReq({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ userId: 'test123' });
    });

    test('should return 401 when auth token is missing', async () => {
      const makeApiRoute = makeMakeApiRoute({
        env: mockEnv,
        verifyAndDecodeToken: mockVerifyToken,
      });

      const handler = makeApiRoute(
        { requireAuth: true, responseBody: z.object({ userId: z.string() }) },
        async (_, { auth }) => ({ userId: auth.sub }),
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing access token' });
    });

    test('should return 401 when auth token is invalid', async () => {
      const makeApiRoute = makeMakeApiRoute({
        env: mockEnv,
        verifyAndDecodeToken: mockVerifyToken,
      });

      const handler = makeApiRoute(
        { requireAuth: true, responseBody: z.object({ userId: z.string() }) },
        async (_, { auth }) => ({ userId: auth.sub }),
      );

      const req = createMockReq({
        headers: { authorization: 'Bearer invalid-token' },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid access token',
      });
    });

    test.each(['', 'short', 'does not match any format', 'Bearer', 'Bearer '])('should return 401 when auth token header is corrupted: `%s`', async (authHeaderValue) => {
      const makeApiRoute = makeMakeApiRoute({
        env: mockEnv,
        verifyAndDecodeToken: mockVerifyToken,
      });

      const handler = makeApiRoute(
        { requireAuth: true, responseBody: z.object({ userId: z.string() }) },
        async (_, { auth }) => ({ userId: auth.sub }),
      );

      const req = createMockReq({
        headers: { authorization: authHeaderValue },
      });
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: expect.stringMatching(/^(Invalid|Missing) access token$/),
      });
    });
  });

  describe('error handling', () => {
    test('should handle HttpErrors with proper status codes', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });

      const handler = makeApiRoute(
        { requireAuth: false },
        async () => {
          throw new createHttpError.NotFound('Resource not found');
        },
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Resource not found',
      });
    });

    test('should mask unknown errors as 500', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });

      const handler = makeApiRoute(
        { requireAuth: false },
        async () => {
          throw new Error('Unknown error');
        },
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
      });
    });

    test('should mask non-exposed errors', async () => {
      const makeApiRoute = makeMakeApiRoute({ env: mockEnv });

      const handler = makeApiRoute(
        { requireAuth: false },
        async () => {
          const err = new createHttpError.NotFound('Resource not found');
          err.expose = false;
          throw err;
        },
      );

      const req = createMockReq();
      const res = createMockRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
      });
    });
  });
});
