import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { OidcClient } from 'oidc-client-ts';
import { Auth, useAuthStore } from '@bluedot/ui';
import { getHeadersWithValidToken } from './trpc';
import { createMockOidcResponse } from '../__tests__/testUtils';

vi.mock('oidc-client-ts', () => ({
  OidcClient: vi.fn(),
  OidcClientSettings: vi.fn(),
}));

const createAuth = (overrides?: Partial<Auth>): Auth => ({
  token: `test-token-${Math.random()}`,
  expiresAt: Date.now() + 3600_000, // 1 hour from now
  refreshToken: 'test-refresh-token',
  oidcSettings: {
    authority: 'https://auth.example.com',
    client_id: 'test-client',
    redirect_uri: 'http://localhost:3000/callback',
  },
  email: 'test+auth@bluedot.org',
  ...overrides,
});

const setupMockOidcClient = (success = true, response?: Record<string, unknown>) => {
  const mockUseRefreshToken = vi.fn().mockImplementation(() => {
    if (!success) throw new Error('Refresh failed');
    return response || createMockOidcResponse();
  });

  (OidcClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
    useRefreshToken: mockUseRefreshToken,
  }));

  return { mockUseRefreshToken };
};

describe('getHeadersWithValidToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset auth store
    useAuthStore.getState().setAuth(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    useAuthStore.getState().setAuth(null);
  });

  it('should return bearer token when auth is valid and not near expiry', async () => {
    // Given: auth with token that expires in 2 hours (well beyond REFRESH_BEFORE_EXPIRY_MS - 10s)
    const auth = createAuth({
      token: 'valid-token',
      expiresAt: Date.now() + 7200_000, // 2 hours from now
    });
    useAuthStore.getState().setAuth(auth);

    const { mockUseRefreshToken } = setupMockOidcClient();

    // When: we get headers
    const result = await getHeadersWithValidToken();

    // Then: should return bearer token without refreshing
    expect(result).toEqual({ authorization: 'Bearer valid-token' });
    expect(mockUseRefreshToken).not.toHaveBeenCalled();
  });

  it('should refresh token when auth is near expiry and return new token', async () => {
    // Given: auth with token that expires in 40 seconds (less than REFRESH_BEFORE_EXPIRY_MS - 10s = 50s)
    const auth = createAuth({
      token: 'old-access-token',
      expiresAt: Date.now() + 40_000, // 40 seconds from now
    });
    useAuthStore.getState().setAuth(auth);

    const refreshResponse = createMockOidcResponse({
      id_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    const { mockUseRefreshToken } = setupMockOidcClient(true, refreshResponse);

    // When: we get headers (this should trigger refresh)
    // The await here waits for the refresh to complete (which is synchronous with mocked OIDC)
    const result = await getHeadersWithValidToken();

    // Then: should have called refresh
    expect(mockUseRefreshToken).toHaveBeenCalledTimes(1);

    expect(result).toEqual({ authorization: 'Bearer new-access-token' });
    const currentAuth = useAuthStore.getState().auth;
    expect(currentAuth?.token).toBe('new-access-token');
    expect(currentAuth?.refreshToken).toBe('new-refresh-token');
  });
});
