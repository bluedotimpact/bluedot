import {
  describe, test, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { OidcClient } from 'oidc-client-ts';
import { render } from '@testing-library/react';
import * as React from 'react';
import { Auth, useAuthStore, withAuth } from './auth';
import { createMockOidcResponse } from './testUtils';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock OIDC client
vi.mock('oidc-client-ts', () => ({
  OidcClient: vi.fn(),
  OidcClientSettings: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    identify: vi.fn(),
    reset: vi.fn(),
  },
}));

// Helper to create auth object
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

// Helper to setup mocked OIDC client
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

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('useAuthStore', () => {
    test('should start with no authentication', () => {
      const { auth } = useAuthStore.getState();
      expect(auth).toBeNull();
    });

    test('should store authentication details', () => {
      const auth = createAuth();
      useAuthStore.getState().setAuth(auth);

      const state = useAuthStore.getState();
      expect(state.auth).toEqual(auth);
    });

    test('should keep new token when replacing soon-to-expire token', () => {
      setupMockOidcClient(); // Set up OIDC client for potential refresh attempts

      // Set initial auth that expires in 30 seconds
      const initialAuth = createAuth({
        expiresAt: Date.now() + 30_000,
        token: 'initial-token',
      });
      useAuthStore.getState().setAuth(initialAuth);

      // Advance 20 seconds (10 seconds before initial token expires)
      vi.advanceTimersByTime(20_000);

      // Set new auth with fresh expiry
      const newAuth = createAuth({
        expiresAt: Date.now() + 3600_000, // 1 hour
        token: 'new-token',
      });
      useAuthStore.getState().setAuth(newAuth);

      // Advance 10 seconds (past when initial token would have expired)
      vi.advanceTimersByTime(10_000);

      // Should still have the new token (old expiry timer should have been cancelled)
      const currentAuth = useAuthStore.getState().auth;
      expect(currentAuth?.token).toBe('new-token');
      expect(currentAuth?.expiresAt).toBe(newAuth.expiresAt);
      expect(currentAuth?.expiresAt).toBeGreaterThan(Date.now()); // Should not be expired
    });

    test('should clear authentication when logging out', () => {
      const auth = createAuth();
      const { setAuth } = useAuthStore.getState();

      setAuth(auth);
      setAuth(null);

      expect(useAuthStore.getState().auth).toBeNull();
    });
  });

  describe('token lifecycle', () => {
    test('should automatically refresh token before expiry', async () => {
      // Given auth expires in 70 seconds
      const auth = createAuth({
        token: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: Date.now() + 70_000,
      });
      useAuthStore.getState().setAuth(auth);

      const refreshResponse = createMockOidcResponse({
        id_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });
      const { mockUseRefreshToken } = setupMockOidcClient(true, refreshResponse);

      // When 10 seconds pass, we should be 60 seconds from expiry and therefore expect the refresh timer to trigger
      await vi.advanceTimersByTimeAsync(10000);

      // Verify the refresh was called exactly once
      expect(mockUseRefreshToken).toHaveBeenCalledTimes(1);

      // Verify the token was updated
      expect(useAuthStore.getState().auth?.token).toBe(refreshResponse.id_token);
      expect(useAuthStore.getState().auth?.refreshToken).toBe(refreshResponse.refresh_token);
      expect(useAuthStore.getState().auth?.expiresAt).toBe(refreshResponse.expires_at * 1000);

      // Advancing more time, before the new token is due refreshing, should not try to refresh it again
      await vi.advanceTimersByTimeAsync(60000);
      expect(mockUseRefreshToken).toHaveBeenCalledTimes(1);
    });

    test('should log out when refresh fails', async () => {
      setupMockOidcClient(false);
      const auth = createAuth({
        expiresAt: Date.now() + 70_000,
      });

      useAuthStore.getState().setAuth(auth);

      // Wait for refresh attempt
      vi.advanceTimersByTime(10000);
      await vi.runAllTimersAsync();

      expect(useAuthStore.getState().auth).toBeNull();
    });

    test('should retry refresh up to 3 times with backoff before giving up', async () => {
      let attemptCount = 0;
      const mockUseRefreshToken = vi.fn().mockImplementation(() => {
        attemptCount += 1;
        if (attemptCount < 3) {
          throw new Error('Refresh failed temporarily');
        }
        // Succeed on third attempt
        return createMockOidcResponse({
          id_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
        });
      });

      (OidcClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        useRefreshToken: mockUseRefreshToken,
      }));

      const auth = createAuth({
        expiresAt: Date.now() + 70_000,
        token: 'old-access-token',
      });

      useAuthStore.getState().setAuth(auth);

      // Wait for refresh timer to trigger
      vi.advanceTimersByTime(10000);
      // Run the initial refresh attempt
      await vi.runOnlyPendingTimersAsync();
      // Advance time for first backoff (1000ms)
      await vi.advanceTimersByTimeAsync(1000);
      // Advance time for second backoff (2000ms)
      await vi.advanceTimersByTimeAsync(2000);

      // Verify the refresh was called 3 times
      expect(mockUseRefreshToken).toHaveBeenCalledTimes(3);

      // Verify the token was successfully updated on the third attempt
      const currentAuth = useAuthStore.getState().auth;
      expect(currentAuth?.token).toBe('new-access-token');
      expect(currentAuth?.refreshToken).toBe('new-refresh-token');
    });

    test('should log out when all 3 refresh retries fail', async () => {
      const mockUseRefreshToken = vi.fn().mockImplementation(() => {
        throw new Error('Refresh failed');
      });

      (OidcClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        useRefreshToken: mockUseRefreshToken,
      }));

      const auth = createAuth({
        expiresAt: Date.now() + 70_000,
      });

      useAuthStore.getState().setAuth(auth);

      // Wait for refresh timer to trigger
      vi.advanceTimersByTime(10000);
      await vi.runOnlyPendingTimersAsync();

      // Advance through all backoff periods
      await vi.advanceTimersByTimeAsync(1000); // First backoff
      await vi.advanceTimersByTimeAsync(2000); // Second backoff

      // Verify the refresh was attempted 3 times
      expect(mockUseRefreshToken).toHaveBeenCalledTimes(3);

      // Should be logged out after all retries fail
      expect(useAuthStore.getState().auth).toBeNull();
    });

    test('should log out when token expires without refresh token', () => {
      const auth = createAuth({
        expiresAt: Date.now() + 5_000,
        refreshToken: undefined,
      });

      useAuthStore.getState().setAuth(auth);

      // Wait for expiration
      vi.advanceTimersByTime(5000);
      expect(useAuthStore.getState().auth).toBeNull();
    });
  });

  describe('session persistence', () => {
    test('should restore valid session and refresh before expiry', async () => {
      // Given auth expires in 70 seconds
      const auth = createAuth({
        token: 'old-access-token',
        refreshToken: 'old-refresh-token',
        expiresAt: Date.now() + 70_000,
      });

      // Reset store and restore session
      useAuthStore.setState({ auth: null });
      useAuthStore.getState().setAuth(auth);

      const refreshResponse = createMockOidcResponse({
        id_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      });
      const { mockUseRefreshToken } = setupMockOidcClient(true, refreshResponse);

      // When 10 seconds pass, we should be 60 seconds from expiry and therefore expect the refresh timer to trigger
      await vi.advanceTimersByTimeAsync(10000);

      // Verify the refresh was called exactly once
      expect(mockUseRefreshToken).toHaveBeenCalledTimes(1);

      // Verify the token was updated
      expect(useAuthStore.getState().auth?.token).toBe(refreshResponse.id_token);
      expect(useAuthStore.getState().auth?.refreshToken).toBe(refreshResponse.refresh_token);
      expect(useAuthStore.getState().auth?.expiresAt).toBe(refreshResponse.expires_at * 1000);

      // Advancing more time, before the new token is due refreshing, should not try to refresh it again
      await vi.advanceTimersByTimeAsync(60000);
      expect(mockUseRefreshToken).toHaveBeenCalledTimes(1);
    });

    test('should refresh expired session on restore', async () => {
      // Set up OIDC client to return new token
      const newToken = 'refreshed-token';
      const expiresAtSeconds = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const { mockUseRefreshToken } = setupMockOidcClient(true, createMockOidcResponse({
        id_token: newToken,
        expires_at: expiresAtSeconds,
      }));

      // Create expired auth with valid refresh token
      const auth = createAuth({
        expiresAt: Date.now() - 3600_000, // Expired 1 hour ago
        token: 'expired-token',
        refreshToken: 'valid-refresh-token',
      });

      // Reset store and set expired auth
      useAuthStore.setState({ auth: null });
      useAuthStore.getState().setAuth(auth);

      // Wait for next tick to allow refresh to be triggered
      await vi.advanceTimersByTimeAsync(0);

      // Should have attempted refresh
      expect(mockUseRefreshToken).toHaveBeenCalled();

      // Should have new token
      const currentAuth = useAuthStore.getState().auth;
      expect(currentAuth?.token).toBe(newToken);
      expect(currentAuth?.expiresAt).toBe(expiresAtSeconds * 1000);
    });

    test('should not restore expired session when refresh fails', async () => {
      setupMockOidcClient(false);

      // Create expired auth with invalid refresh token
      const auth = createAuth({
        expiresAt: Date.now() - 3600_000, // Expired 1 hour ago
        token: 'expired-token',
        refreshToken: 'invalid-refresh-token',
      });

      // Reset store and attempt to restore session
      useAuthStore.setState({ auth: null });
      useAuthStore.getState().setAuth(auth);

      // Allow refresh attempt to complete
      await vi.runAllTimersAsync();

      expect(useAuthStore.getState().auth).toBeNull();
    });

    test('should not restore expired session without refresh token', () => {
      // Create expired auth with no refresh token
      const auth = createAuth({
        expiresAt: Date.now() - 3600_000, // Expired 1 hour ago
        token: 'expired-token',
        refreshToken: undefined,
      });

      // Reset store and attempt to restore session
      useAuthStore.setState({ auth: null });
      useAuthStore.getState().setAuth(auth);
      vi.advanceTimersByTime(1000);

      expect(useAuthStore.getState().auth).toBeNull();
    });
  });

  describe('protected routes', () => {
    const ProtectedPage: React.FC<{ auth: Auth, setAuth: (s: Auth | null) => void }> = () => <div>Protected Content</div>;

    test('should show protected content when logged in', () => {
      const auth = createAuth();
      useAuthStore.getState().setAuth(auth);

      const SecurePage = withAuth(ProtectedPage);
      const { container } = render(<SecurePage />);

      expect(container.innerHTML).toContain('Protected Content');
    });

    test('should redirect to login page when not logged in', () => {
      useAuthStore.getState().setAuth(null);

      const SecurePage = withAuth(ProtectedPage);
      render(<SecurePage />);

      expect(mockPush).toHaveBeenCalledWith('/login?redirect_to=%2F');
    });

    test('should support custom login pages', () => {
      useAuthStore.getState().setAuth(null);

      const SecurePage = withAuth(ProtectedPage, '/custom-login');
      render(<SecurePage />);

      expect(mockPush).toHaveBeenCalledWith('/custom-login?redirect_to=%2F');
    });
  });
});
