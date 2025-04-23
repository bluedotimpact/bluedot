import {
  describe, test, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { OidcClient, OidcClientSettings } from 'oidc-client-ts';
import { Auth, useAuthStore, withAuth } from './auth';
import { render } from '@testing-library/react';
import * as React from 'react';

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

// Helper to create auth object
const createAuth = (overrides?: Partial<Auth>): Auth => ({
  token: 'test-token',
  expiresAt: Date.now() + 3600_000, // 1 hour from now
  refreshToken: 'test-refresh-token',
  oidcSettings: {
    authority: 'https://auth.example.com',
    client_id: 'test-client',
    redirect_uri: 'http://localhost:3000/callback',
  },
  ...overrides,
});

// Helper to create mock OIDC response
const createMockOidcResponse = (overrides?: Partial<any>) => ({
  access_token: 'new-test-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'new-refresh-token',
  ...overrides,
});

// Helper to setup mocked OIDC client
const setupMockOidcClient = (success = true, response?: any) => {
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
      expect(currentAuth?.expiresAt).toBe(newAuth.expiresAt)
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
      const newToken = 'refreshed-token';
      setupMockOidcClient(true, createMockOidcResponse({
        access_token: newToken,
      }));

      const auth = createAuth({
        expiresAt: Date.now() + 70_000,
      });

      useAuthStore.getState().setAuth(auth);

      // Wait for automatic refresh
      vi.advanceTimersByTime(10000);
      await vi.runOnlyPendingTimersAsync();

      expect(useAuthStore.getState().auth?.token).toBe(newToken);
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
      const newToken = 'refreshed-token';
      const { mockUseRefreshToken } = setupMockOidcClient(true, createMockOidcResponse({
        access_token: newToken,
      }));

      // Create auth that expires in 70 seconds
      const auth = createAuth({
        expiresAt: Date.now() + 70_000,
        token: 'current-token',
        refreshToken: 'valid-refresh-token',
      });

      // Reset store and restore session
      useAuthStore.setState({ auth: null });
      useAuthStore.getState().setAuth(auth);
      
      // Should restore immediately with current token
      expect(useAuthStore.getState().auth?.token).toBe('current-token');
      
      // Advance to refresh time
      vi.advanceTimersByTime(10000);
      await vi.runOnlyPendingTimersAsync();
      
      // Should have refreshed to new token
      expect(mockUseRefreshToken).toHaveBeenCalled();
      expect(useAuthStore.getState().auth?.token).toBe(newToken);
    });
    
    test('should refresh expired session on restore', async () => {
      // Set up OIDC client to return new token
      const newToken = 'refreshed-token';
      const expiresAtSeconds = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const { mockUseRefreshToken } = setupMockOidcClient(true, createMockOidcResponse({
        access_token: newToken,
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
