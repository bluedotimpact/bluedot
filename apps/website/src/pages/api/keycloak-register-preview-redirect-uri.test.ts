import createHttpError from 'http-errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerPreviewRedirectUri } from '../../lib/api/keycloak';
import handler from './keycloak-register-preview-redirect-uri';

vi.mock('../../lib/api/keycloak', () => ({
  registerPreviewRedirectUri: vi.fn().mockResolvedValue({ added: true, cleaned: 0 }),
}));

const mockedRegister = vi.mocked(registerPreviewRedirectUri);

vi.mock('../../lib/api/env', () => ({
  default: {
    KEYCLOAK_PREVIEW_AUTH_TOKEN: 'test-secret-token',
    KEYCLOAK_CLIENT_ID: 'fake',
    KEYCLOAK_CLIENT_SECRET: 'fake',
    KEYCLOAK_PREVIEW_CLIENT_ID: 'preview-client',
    KEYCLOAK_PREVIEW_CLIENT_SECRET: 'preview-secret',
  },
}));

function createMockReqRes(overrides: Partial<NextApiRequest> = {}) {
  const req = {
    method: 'POST',
    body: { redirectUri: 'https://bluedot-website-pr-42.onrender.com/*', token: 'test-secret-token' },
    ...overrides,
  } as NextApiRequest;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as NextApiResponse;

  return { req, res };
}

describe('keycloak-register-preview-redirect-uri', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 405 for non-POST requests', async () => {
    const { req, res } = createMockReqRes({ method: 'GET' });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });

  it('returns 401 for wrong token', async () => {
    const { req, res } = createMockReqRes({
      body: { redirectUri: 'https://bluedot-website-pr-42.onrender.com/*', token: 'wrong' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 400 for missing fields', async () => {
    const { req, res } = createMockReqRes({ body: {} });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 for redirect URI that is not onrender.com', async () => {
    const { req, res } = createMockReqRes({
      body: { redirectUri: 'https://evil.com/*', token: 'test-secret-token' },
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 200 with result for valid request', async () => {
    const { req, res } = createMockReqRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ added: true, cleaned: 0 });
  });

  it('maps an HttpError from the lib to its status code', async () => {
    mockedRegister.mockRejectedValueOnce(
      createHttpError.ServiceUnavailable('Authentication service is currently unavailable. Please try again later.'),
    );
    const { req, res } = createMockReqRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Authentication service is currently unavailable. Please try again later.',
    });
  });

  it('returns a generic 500 for non-HttpError failures', async () => {
    mockedRegister.mockRejectedValueOnce(new Error('unexpected'));
    const { req, res } = createMockReqRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
