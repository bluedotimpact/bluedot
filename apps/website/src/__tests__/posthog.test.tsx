import React from 'react';
import { render, renderHook, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import posthog from 'posthog-js';
import {
  describe, it, expect, beforeEach, vi, afterEach,
} from 'vitest';
import { LatestUtmParamsProvider, useLatestUtmParams } from '@bluedot/ui/src/hooks/useLatestUtmParams';
import { LoginRedirectPage, loginPresets } from '@bluedot/ui';
import { getQueryParam } from '@bluedot/ui/src/utils/getQueryParam';
import OauthCallbackPage from '../pages/login/oauth-callback';

vi.mock('posthog-js', () => ({
  default: {
    capture: vi.fn(),
    identify: vi.fn(),
  },
}));

const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

// Mock OIDC client
const mockProcessSigninResponse = vi.fn();
const mockCreateSigninRequest = vi.fn(() => Promise.resolve({ url: 'https://mock-oidc-provider.com/' }));
vi.mock('oidc-client-ts', () => ({
  OidcClient: vi.fn().mockImplementation(() => ({
    processSigninResponse: mockProcessSigninResponse,
    createSigninRequest: mockCreateSigninRequest,
  })),
}));

// Mock getQueryParam for LoginRedirectPage
vi.mock('@bluedot/ui/src/utils/getQueryParam', () => ({
  getQueryParam: vi.fn(),
}));

// Mock auth store
const mockSetAuth = vi.fn();
vi.mock('@bluedot/ui/src/utils/auth', () => ({
  useAuthStore: vi.fn((selector) => selector({
    auth: null,
    setAuth: mockSetAuth,
  })),
}));

// Mock trpc
const mockMutateAsync = vi.fn();
vi.mock('../utils/trpc', () => ({
  trpc: {
    users: {
      ensureExists: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
        }),
      },
    },
  },
}));

const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;
const mockPosthogCapture = posthog.capture as ReturnType<typeof vi.fn>;

const createMockUser = (redirectTo: string) => ({
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  id_token: 'test-id-token',
  refresh_token: 'test-refresh-token',
  profile: {
    email: 'test@example.com',
    sub: 'test-sub',
  },
  userState: {
    redirectTo,
  },
});

describe('PostHog UTM tracking: End-to-end tests of key points where UTM params should be tracked', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should set "latest" UTM params by calling posthog.capture when new UTM params are detected', async () => {
    const query = {
      utm_source: 'test-source',
      utm_campaign: 'test-campaign',
    };

    mockUseRouter.mockReturnValue({
      isReady: true,
      asPath: '/page?utm_source=test-source&utm_campaign=test-campaign',
      query,
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      React.createElement(LatestUtmParamsProvider, null, children)
    );

    renderHook(() => useLatestUtmParams(), { wrapper });

    await waitFor(() => {
      expect(mockPosthogCapture).toHaveBeenCalledWith('$set', {
        $set: {
          utm_source: 'test-source',
          utm_campaign: 'test-campaign',
        },
      });
    });
  });

  it('should set $initial_utm_* when UTM params are on login page URL and new user signs up', async () => {
    // Step 1: User lands on /login?utm_source=x&redirect_to=/courses
    vi.mocked(getQueryParam)
      .mockReturnValueOnce('/courses') // redirect_to
      .mockReturnValueOnce(null) // email
      .mockReturnValueOnce(null); // register

    mockUseRouter.mockReturnValue({
      isReady: true,
      asPath: '/login?redirect_to=/courses&utm_source=direct-login-source&utm_campaign=direct-login-campaign',
      query: {
        redirect_to: '/courses',
        utm_source: 'direct-login-source',
        utm_campaign: 'direct-login-campaign',
      },
      push: mockPush,
    });

    const { unmount } = render(
      <LatestUtmParamsProvider>
        <LoginRedirectPage loginPreset={loginPresets.keycloak} />
      </LatestUtmParamsProvider>,
    );

    // Wait for the OIDC signin request and capture the redirectTo
    await waitFor(() => {
      expect(mockCreateSigninRequest).toHaveBeenCalled();
    });

    // @ts-expect-error
    const redirectToWithUtm = mockCreateSigninRequest.mock.calls[0][0].state.redirectTo;
    expect(redirectToWithUtm).toContain('utm_source=direct-login-source');

    unmount();
    vi.clearAllMocks();

    // Step 2: User completes OAuth and lands on oauth-callback
    // The OIDC response includes the redirectTo with UTM params
    mockProcessSigninResponse.mockResolvedValue(createMockUser(redirectToWithUtm));
    mockMutateAsync.mockResolvedValue({ isNewUser: true });

    render(<OauthCallbackPage />);

    // Verify $initial_utm_* params are set
    await waitFor(() => {
      expect(mockPosthogCapture).toHaveBeenCalledWith('$set', {
        $set: {
          $initial_utm_source: 'direct-login-source',
          $initial_utm_campaign: 'direct-login-campaign',
        },
      });
    });
  });

  it('should set $initial_utm_* when user lands on page with UTM params then navigates to login', async () => {
    // Step 1: User lands on /courses?utm_source=landing-source&utm_campaign=landing-campaign
    mockUseRouter.mockReturnValue({
      isReady: true,
      asPath: '/courses?utm_source=landing-source&utm_campaign=landing-campaign',
      query: {
        utm_source: 'landing-source',
        utm_campaign: 'landing-campaign',
      },
      push: mockPush,
    });

    const { rerender } = render(
      <LatestUtmParamsProvider>
        <div>Landing page</div>
      </LatestUtmParamsProvider>,
    );

    // Wait for UTM params to be captured
    await waitFor(() => {
      expect(mockPosthogCapture).toHaveBeenCalledWith('$set', {
        $set: {
          utm_source: 'landing-source',
          utm_campaign: 'landing-campaign',
        },
      });
    });

    vi.clearAllMocks();

    // Step 2: User navigates to /login (no UTM params on login URL)
    vi.mocked(getQueryParam)
      .mockReturnValueOnce('/courses') // redirect_to
      .mockReturnValueOnce(null) // email
      .mockReturnValueOnce(null); // register

    mockUseRouter.mockReturnValue({
      isReady: true,
      asPath: '/login?redirect_to=/courses',
      query: {
        redirect_to: '/courses',
      },
      push: mockPush,
    });

    // Rerender with LoginRedirectPage: UTM params should be preserved from previous page
    rerender(
      <LatestUtmParamsProvider>
        <LoginRedirectPage loginPreset={loginPresets.keycloak} />
      </LatestUtmParamsProvider>,
    );

    await waitFor(() => {
      expect(mockCreateSigninRequest).toHaveBeenCalled();
    });

    // The redirectTo should include UTM params from the landing page
    // @ts-expect-error
    const redirectToWithUtm = mockCreateSigninRequest.mock.calls[0][0].state.redirectTo;
    expect(redirectToWithUtm).toContain('utm_source=landing-source');
    expect(redirectToWithUtm).toContain('utm_campaign=landing-campaign');

    vi.clearAllMocks();

    // Step 3: User completes OAuth and lands on oauth-callback
    mockProcessSigninResponse.mockResolvedValue(createMockUser(redirectToWithUtm));
    mockMutateAsync.mockResolvedValue({ isNewUser: true });

    render(<OauthCallbackPage />);

    // Verify $initial_utm_* params are set
    await waitFor(() => {
      expect(mockPosthogCapture).toHaveBeenCalledWith('$set', {
        $set: {
          $initial_utm_source: 'landing-source',
          $initial_utm_campaign: 'landing-campaign',
        },
      });
    });
  });
});
