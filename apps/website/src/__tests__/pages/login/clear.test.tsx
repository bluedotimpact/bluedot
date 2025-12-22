import {
  describe, test, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Auth } from '@bluedot/ui';
import LogoutPage from '../../../pages/login/clear';

// Mock dependencies
vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    Navigate: ({ url }: { url: string }) => <div data-testid="navigate" data-url={url}>{url}</div>,
    useAuthStore: vi.fn(),
  };
});

vi.mock('next/router', () => ({
  useRouter: vi.fn(),
}));

vi.mock('../../../lib/routes', () => ({
  shouldRedirectBackAfterLogout: vi.fn(),
}));

const { useAuthStore } = await import('@bluedot/ui');
const { useRouter } = await import('next/router');
const { shouldRedirectBackAfterLogout } = await import('../../../lib/routes');

const mockedUseAuthStore = vi.mocked(useAuthStore);
const mockedUseRouter = vi.mocked(useRouter);
const mockedShouldRedirectBackAfterLogout = vi.mocked(shouldRedirectBackAfterLogout);

describe('Logout Page - Redirect Logic', () => {
  const mockAuth: Auth = {
    token: 'mock-token-123',
    expiresAt: Date.now() + 3600000,
    email: 'test@example.com',
  };

  const mockSetAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: user is logged in
    mockedUseAuthStore.mockImplementation((selector) => selector({
      auth: mockAuth,
      setAuth: mockSetAuth,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any));

    // Default router with no redirect_to
    mockedUseRouter.mockReturnValue({
      query: {},
      pathname: '/login/clear',
      push: vi.fn(),
      replace: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Default: allow redirects (public pages)
    mockedShouldRedirectBackAfterLogout.mockReturnValue(true);
  });

  test('redirects back to public pages with full URL preserved', () => {
    mockedUseRouter.mockReturnValue({
      query: { redirect_to: '/courses/governance?tab=week1#section2' },
      pathname: '/login/clear',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockedShouldRedirectBackAfterLogout.mockReturnValue(true);

    render(<LogoutPage />);

    const navigate = screen.getByTestId('navigate');
    const url = navigate.getAttribute('data-url');

    // Verifies: public page redirect, query params, hash fragments all preserved
    expect(url).toContain('https://login.bluedot.org');
    expect(url).toContain('post_logout_redirect_uri=');
    expect(decodeURIComponent(url!)).toContain('/courses/governance?tab=week1#section2');
    expect(mockSetAuth).toHaveBeenCalledWith(null);
  });

  test('redirects to home for auth-required pages', () => {
    // Test multiple auth-required paths
    const authRequiredPaths = ['/settings/account', '/profile'];

    authRequiredPaths.forEach((path) => {
      cleanup();
      vi.clearAllMocks();
      mockedUseRouter.mockReturnValue({
        query: { redirect_to: path },
        pathname: '/login/clear',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      mockedShouldRedirectBackAfterLogout.mockReturnValue(false);

      render(<LogoutPage />);

      const navigate = screen.getByTestId('navigate');
      const url = navigate.getAttribute('data-url');

      // Should not include the auth-required path in post_logout_redirect_uri
      const decodedUrl = decodeURIComponent(url!);
      const postLogoutUri = decodedUrl.split('post_logout_redirect_uri=')[1];
      expect(postLogoutUri).not.toContain(path);
      expect(mockSetAuth).toHaveBeenCalledWith(null);
    });
  });

  test('blocks malicious redirects (security)', () => {
    const maliciousInputs = [
      'https://evil.com',
      '//evil.com',
      ['multiple', 'values'],
    ];

    maliciousInputs.forEach((maliciousRedirect) => {
      cleanup();
      vi.clearAllMocks();
      mockedUseRouter.mockReturnValue({
        query: { redirect_to: maliciousRedirect },
        pathname: '/login/clear',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<LogoutPage />);

      const navigate = screen.getByTestId('navigate');
      const url = navigate.getAttribute('data-url');

      // Should not redirect to evil.com
      expect(url).not.toContain('evil.com');
      expect(url).toContain('post_logout_redirect_uri=http');
    });
  });

  test('handles missing or invalid redirect_to parameter', () => {
    const invalidInputs = [undefined, '', null];

    invalidInputs.forEach((invalidRedirect) => {
      cleanup();
      vi.clearAllMocks();
      mockedUseRouter.mockReturnValue({
        query: invalidRedirect === undefined ? {} : { redirect_to: invalidRedirect },
        pathname: '/login/clear',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<LogoutPage />);

      const navigate = screen.getByTestId('navigate');
      const url = navigate.getAttribute('data-url');

      // Should default to home
      expect(url).toContain('post_logout_redirect_uri=http');
      expect(decodeURIComponent(url!)).not.toContain('undefined');
      expect(decodeURIComponent(url!)).not.toContain('null');
    });
  });

  test('handles already logged out state correctly', () => {
    mockedUseAuthStore.mockImplementation((selector) => selector({
      auth: null,
      setAuth: mockSetAuth,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any));

    // Safe redirect when logged out
    mockedUseRouter.mockReturnValue({
      query: { redirect_to: '/courses' },
      pathname: '/login/clear',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<LogoutPage />);
    let navigate = screen.getByTestId('navigate');
    expect(navigate.getAttribute('data-url')).toBe('/courses');

    // Malicious redirect when logged out
    cleanup();
    vi.clearAllMocks();
    mockedUseRouter.mockReturnValue({
      query: { redirect_to: '//evil.com' },
      pathname: '/login/clear',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<LogoutPage />);
    navigate = screen.getByTestId('navigate');
    expect(navigate.getAttribute('data-url')).toBe('/');

    // Auth-required page when logged out (should also redirect to home)
    cleanup();
    vi.clearAllMocks();
    mockedShouldRedirectBackAfterLogout.mockReturnValue(false);
    mockedUseRouter.mockReturnValue({
      query: { redirect_to: '/settings/account' },
      pathname: '/login/clear',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(<LogoutPage />);
    navigate = screen.getByTestId('navigate');
    expect(navigate.getAttribute('data-url')).toBe('/');
  });
});
