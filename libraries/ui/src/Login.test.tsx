import { render } from '@testing-library/react';
import {
  describe,
  test,
  expect,
  beforeEach,
  vi,
} from 'vitest';
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

const CUSTOM_REDIRECT_PATH = '/custom-path';

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
  });

  test.skip('if not authed, should createSigninRequest with with redirect_to query param', async () => {
    // TODO #720
  });

  test.skip('if not authed and no redirect_to, should createSigninRequest with default redirect path', async () => {
    // TODO #720
  });
});
