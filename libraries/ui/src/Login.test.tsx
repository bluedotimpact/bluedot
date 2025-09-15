import { render, waitFor } from '@testing-library/react';
import {
  describe,
  test,
  expect,
  beforeEach,
  vi,
} from 'vitest';
import { OidcClient } from 'oidc-client-ts';
import { LoginRedirectPage, loginPresets } from './Login';
import { Navigate } from './Navigate';
import { useAuthStore } from './utils/auth';
import { getQueryParam } from './utils/getQueryParam';

vi.mock('./utils/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('./Navigate', () => ({
  Navigate: vi.fn(() => null),
}));

vi.mock('./utils/getQueryParam', () => ({
  getQueryParam: vi.fn(),
}));

const mockCreateSigninRequest = vi.fn(() => Promise.resolve({
  url: OIDC_PROVIDER_URL,
}));

vi.mock('oidc-client-ts', () => {
  return {
    OidcClient: vi.fn().mockImplementation(() => ({
      createSigninRequest: mockCreateSigninRequest,
      processSigninResponse: vi.fn(),
    })),
  };
});

const CUSTOM_REDIRECT_PATH = '/custom-path';
const OIDC_PROVIDER_URL = 'https://mock-oidc-provider.com/';

describe('LoginRedirectPage', () => {
  const mockLoginPreset = loginPresets.keycloak;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should navigate to the redirect_to value when auth is present', () => {
    vi.mocked(useAuthStore).mockReturnValue({ auth: { token: 'test-token' } });
    vi.mocked(getQueryParam).mockReturnValue(CUSTOM_REDIRECT_PATH);

    render(<LoginRedirectPage loginPreset={mockLoginPreset} />);

    expect(Navigate).toHaveBeenCalledWith({
      url: CUSTOM_REDIRECT_PATH,
    }, expect.anything());

    expect(OidcClient).not.toHaveBeenCalled();
  });

  test('if not authed, should createSigninRequest with redirect_to query param', async () => {
    vi.mocked(useAuthStore).mockReturnValue(null);
    vi.mocked(getQueryParam).mockImplementation((_url, param) => {
      if (param === 'redirect_to') {
        return CUSTOM_REDIRECT_PATH;
      }
      return null;
    });

    render(<LoginRedirectPage loginPreset={mockLoginPreset} />);

    // `waitFor` is needed because createSigninRequest is called in a useEffect
    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
      expect(OidcClient).toHaveBeenCalledWith(mockLoginPreset.oidcSettings);

      expect(mockCreateSigninRequest).toHaveBeenCalledTimes(1);
      expect(mockCreateSigninRequest).toHaveBeenCalledWith({
        request_type: 'si:r',
        state: {
          redirectTo: CUSTOM_REDIRECT_PATH,
          attribution: expect.any(Object),
        },
      });

      expect(window.location.href).toBe(OIDC_PROVIDER_URL);
    });
  });

  test.skip('if not authed and no redirect_to, should createSigninRequest with default redirect path', async () => {
    // TODO #720
  });
});
