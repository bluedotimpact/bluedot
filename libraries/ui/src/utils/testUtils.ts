/**
 * Creates a mock OIDC response for testing login and auth flows.
 * This represents the response from `OidcClient.processSigninResponse()`.
 */
export const createMockOidcResponse = (overrides: Record<string, unknown> = {}) => ({
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  id_token: 'test-id-token',
  refresh_token: 'test-refresh-token',
  profile: {
    email: 'test@example.com',
    sub: 'test-sub',
  },
  userState: {
    redirectTo: '/',
  },
  ...overrides,
});
