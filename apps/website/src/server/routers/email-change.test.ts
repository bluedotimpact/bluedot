import { userTable } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { sendEmailChangeVerification, updateCustomerIoEmail } from '../../lib/api/customerio';
import {
  getKeycloakFederatedIdentities, hasKeycloakPasswordCredential, removeKeycloakFederatedIdentity, updateKeycloakEmail,
} from '../../lib/api/keycloak';
import { createEmailChangeToken, verifyEmailChangeToken } from '../../lib/api/emailChangeToken';
import env from '../../lib/api/env';
import { ROUTES } from '../../lib/routes';
import {
  setupTestDb, createCaller, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

vi.mock('../../lib/api/keycloak', () => ({
  verifyKeycloakPassword: vi.fn(),
  updateKeycloakPassword: vi.fn(),
  updateKeycloakEmail: vi.fn(),
  getKeycloakFederatedIdentities: vi.fn(),
  removeKeycloakFederatedIdentity: vi.fn(),
  hasKeycloakPasswordCredential: vi.fn(),
  registerPreviewRedirectUri: vi.fn(),
}));

vi.mock('../../lib/api/customerio', () => ({
  updateCustomerIoEmail: vi.fn(),
  sendEmailChangeVerification: vi.fn(),
}));

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

setupTestDb();

const mutableEnv = env as { EMAIL_CHANGE_TOKEN_SECRET?: string };

const callerAs = (sub: string) => createCaller({
  ...testAuthContextLoggedIn,
  auth: { ...testAuthContextLoggedIn.auth!, sub },
});

const seedAdmin = () => testDb.insert(userTable, {
  id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
});
const seedTarget = () => testDb.insert(userTable, {
  id: 'target-id', email: 'old@example.com', name: 'Target', keycloakIdentifier: 'target-sub',
});

beforeEach(() => {
  vi.clearAllMocks();
  mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = 'test-secret';
  vi.mocked(updateKeycloakEmail).mockResolvedValue(undefined);
  vi.mocked(updateCustomerIoEmail).mockResolvedValue(undefined);
  vi.mocked(sendEmailChangeVerification).mockResolvedValue(undefined);
  vi.mocked(getKeycloakFederatedIdentities).mockResolvedValue([]);
  vi.mocked(removeKeycloakFederatedIdentity).mockResolvedValue(undefined);
  vi.mocked(hasKeycloakPasswordCredential).mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('emailChange.request', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).emailChange.request({ userId: 'target-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('rejects non-admin users', async () => {
    await testDb.insert(userTable, {
      id: 'regular-id', email: 'regular@example.com', name: 'Regular', keycloakIdentifier: 'regular-sub',
    });

    await expect(callerAs('regular-sub').emailChange.request({ userId: 'regular-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(vi.mocked(sendEmailChangeVerification)).not.toHaveBeenCalled();
  });

  test('rejects invalid emails at the schema layer', async () => {
    await seedAdmin();

    await expect(callerAs('admin-sub').emailChange.request({ userId: 'target-id', newEmail: 'not-an-email' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(vi.mocked(sendEmailChangeVerification)).not.toHaveBeenCalled();
  });

  test('rejects unknown users', async () => {
    await seedAdmin();

    await expect(callerAs('admin-sub').emailChange.request({ userId: 'missing-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('rejects users that have never logged in', async () => {
    await seedAdmin();
    await testDb.insert(userTable, { id: 'target-id', email: 'old@example.com', name: 'Target' });

    await expect(callerAs('admin-sub').emailChange.request({ userId: 'target-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('no linked login account') });
  });

  test('rejects when the new email matches the current email, case-insensitively', async () => {
    await seedAdmin();
    await seedTarget();

    await expect(callerAs('admin-sub').emailChange.request({ userId: 'target-id', newEmail: ' OLD@Example.com ' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('same as the current email') });
  });

  test('rejects when another user already has the new email, case-insensitively', async () => {
    await seedAdmin();
    await seedTarget();
    await testDb.insert(userTable, {
      id: 'other-id', email: 'taken@example.com', name: 'Other', keycloakIdentifier: 'other-sub',
    });

    await expect(callerAs('admin-sub').emailChange.request({ userId: 'target-id', newEmail: 'Taken@Example.com' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(vi.mocked(sendEmailChangeVerification)).not.toHaveBeenCalled();
  });

  test('sends a verification email carrying a valid confirm link, without changing anything', async () => {
    await seedAdmin();
    await seedTarget();

    const result = await callerAs('admin-sub').emailChange.request({ userId: 'target-id', newEmail: ' New@Example.com ' });

    expect(result).toEqual({ sentTo: 'new@example.com' });
    expect(vi.mocked(updateKeycloakEmail)).not.toHaveBeenCalled();
    expect(vi.mocked(updateCustomerIoEmail)).not.toHaveBeenCalled();

    const user = await testDb.get(userTable, { id: 'target-id' });
    expect(user.email).toBe('old@example.com');

    expect(vi.mocked(sendEmailChangeVerification)).toHaveBeenCalledTimes(1);
    const call = vi.mocked(sendEmailChangeVerification).mock.calls[0]![0];
    expect(call.userId).toBe('target-id');
    expect(call.newEmail).toBe('new@example.com');
    expect(call.confirmUrl).toContain(`${ROUTES.confirmEmailChange.url}?token=`);

    const token = decodeURIComponent(call.confirmUrl.split('token=')[1]!);
    const payload = verifyEmailChangeToken(token);
    expect(payload).toMatchObject({ userId: 'target-id', oldEmail: 'old@example.com', newEmail: 'new@example.com' });
  });

  test('propagates a send failure to the admin', async () => {
    await seedAdmin();
    await seedTarget();
    vi.mocked(sendEmailChangeVerification).mockRejectedValue(new Error('send failed'));

    await expect(callerAs('admin-sub').emailChange.request({ userId: 'target-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ message: expect.stringContaining('send failed') });
  });
});

describe('emailChange.confirm', () => {
  const mintToken = () => createEmailChangeToken({ userId: 'target-id', oldEmail: 'old@example.com', newEmail: 'new@example.com' });

  test('rejects an invalid token', async () => {
    await expect(createCaller(testAuthContextLoggedOut).emailChange.confirm({ token: 'garbage' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link is invalid' });
  });

  test('rejects an expired token', async () => {
    await seedTarget();
    const token = mintToken();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(Date.now() + 49 * 60 * 60 * 1000);

    await expect(createCaller(testAuthContextLoggedOut).emailChange.confirm({ token }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link has expired' });
  });

  test('rejects when the user no longer exists', async () => {
    const token = mintToken();

    await expect(createCaller(testAuthContextLoggedOut).emailChange.confirm({ token }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });
  });

  test('rejects when the user email no longer matches the token', async () => {
    await testDb.insert(userTable, {
      id: 'target-id', email: 'different@example.com', name: 'Target', keycloakIdentifier: 'target-sub',
    });
    const token = mintToken();

    await expect(createCaller(testAuthContextLoggedOut).emailChange.confirm({ token }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });
    expect(vi.mocked(updateKeycloakEmail)).not.toHaveBeenCalled();
  });

  test('succeeds idempotently when the change has already been applied', async () => {
    await testDb.insert(userTable, {
      id: 'target-id', email: 'new@example.com', name: 'Target', keycloakIdentifier: 'target-sub',
    });
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', passwordSetupNeeded: false });
    expect(vi.mocked(updateKeycloakEmail)).not.toHaveBeenCalled();
    expect(vi.mocked(updateCustomerIoEmail)).not.toHaveBeenCalled();
  });

  test('the idempotent path recomputes the password flag and unlinks stale identities from current state', async () => {
    await testDb.insert(userTable, {
      id: 'target-id', email: 'new@example.com', name: 'Target', keycloakIdentifier: 'target-sub',
    });
    vi.mocked(getKeycloakFederatedIdentities).mockResolvedValue([
      { identityProvider: 'google', userId: 'google-sub', userName: 'old@example.com' },
    ]);
    vi.mocked(hasKeycloakPasswordCredential).mockResolvedValue(false);
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', passwordSetupNeeded: true });
    expect(vi.mocked(updateKeycloakEmail)).not.toHaveBeenCalled();
    expect(vi.mocked(removeKeycloakFederatedIdentity)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(removeKeycloakFederatedIdentity)).toHaveBeenCalledWith('target-sub', 'google');
  });

  test('rejects when another user claimed the email since the request', async () => {
    await seedTarget();
    await testDb.insert(userTable, {
      id: 'other-id', email: 'new@example.com', name: 'Other', keycloakIdentifier: 'other-sub',
    });
    const token = mintToken();

    await expect(createCaller(testAuthContextLoggedOut).emailChange.confirm({ token }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(vi.mocked(updateKeycloakEmail)).not.toHaveBeenCalled();
  });

  test('aborts without touching the database or customer.io when Keycloak fails', async () => {
    await seedTarget();
    vi.mocked(updateKeycloakEmail).mockRejectedValue(new Error('Keycloak rejected the email update.'));
    const token = mintToken();

    await expect(createCaller(testAuthContextLoggedOut).emailChange.confirm({ token }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('Email change failed') });

    const user = await testDb.get(userTable, { id: 'target-id' });
    expect(user.email).toBe('old@example.com');
    expect(vi.mocked(updateCustomerIoEmail)).not.toHaveBeenCalled();
  });

  test('updates Keycloak and the user row, then fires the customer.io side effect', async () => {
    await seedTarget();
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', passwordSetupNeeded: false });
    expect(vi.mocked(updateKeycloakEmail)).toHaveBeenCalledWith('target-sub', 'new@example.com');

    const user = await testDb.get(userTable, { id: 'target-id' });
    expect(user.email).toBe('new@example.com');
    expect(vi.mocked(updateCustomerIoEmail)).toHaveBeenCalledWith('target-id', 'old@example.com', 'new@example.com');
  });

  test('a second confirm with the same link succeeds without re-running the change', async () => {
    await seedTarget();
    const token = mintToken();

    await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });
    vi.mocked(updateKeycloakEmail).mockClear();
    vi.mocked(updateCustomerIoEmail).mockClear();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', passwordSetupNeeded: false });
    expect(vi.mocked(updateKeycloakEmail)).not.toHaveBeenCalled();
    expect(vi.mocked(updateCustomerIoEmail)).not.toHaveBeenCalled();
  });

  test('still succeeds when the customer.io side effect fails, and alerts', async () => {
    await seedTarget();
    vi.mocked(updateCustomerIoEmail).mockRejectedValue(new Error('cio down'));
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result.newEmail).toBe('new@example.com');
    await vi.waitFor(() => {
      expect(vi.mocked(slackAlert)).toHaveBeenCalledWith(expect.anything(), [expect.stringContaining('cio down')]);
    });
  });

  test('removes a Google identity tied to the old email exactly once', async () => {
    await seedTarget();
    vi.mocked(getKeycloakFederatedIdentities).mockResolvedValue([
      { identityProvider: 'google', userId: 'google-sub', userName: 'OLD@Example.com' },
    ]);
    const token = mintToken();

    await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(vi.mocked(removeKeycloakFederatedIdentity)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(removeKeycloakFederatedIdentity)).toHaveBeenCalledWith('target-sub', 'google');
  });

  test('keeps a Google identity that matches the new email, and reports no password setup needed', async () => {
    await seedTarget();
    vi.mocked(getKeycloakFederatedIdentities).mockResolvedValue([
      { identityProvider: 'google', userId: 'google-sub', userName: 'New@Example.com' },
    ]);
    vi.mocked(hasKeycloakPasswordCredential).mockResolvedValue(false);
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(vi.mocked(removeKeycloakFederatedIdentity)).not.toHaveBeenCalled();
    expect(result.passwordSetupNeeded).toBe(false);
    expect(vi.mocked(hasKeycloakPasswordCredential)).not.toHaveBeenCalled();
  });

  test('only removes the stale Google identity when other providers are linked', async () => {
    await seedTarget();
    vi.mocked(getKeycloakFederatedIdentities).mockResolvedValue([
      { identityProvider: 'google', userId: 'google-sub', userName: 'old@example.com' },
      { identityProvider: 'github', userId: 'github-sub', userName: 'old@example.com' },
    ]);
    vi.mocked(hasKeycloakPasswordCredential).mockResolvedValue(false);
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(vi.mocked(removeKeycloakFederatedIdentity)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(removeKeycloakFederatedIdentity)).toHaveBeenCalledWith('target-sub', 'google');
    expect(result.passwordSetupNeeded).toBe(false);
  });

  test('reports password setup needed when no password and no identities remain', async () => {
    await seedTarget();
    vi.mocked(getKeycloakFederatedIdentities).mockResolvedValue([
      { identityProvider: 'google', userId: 'google-sub', userName: 'old@example.com' },
    ]);
    vi.mocked(hasKeycloakPasswordCredential).mockResolvedValue(false);
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', passwordSetupNeeded: true });
  });

  test('reports no password setup needed when a password credential exists', async () => {
    await seedTarget();
    vi.mocked(getKeycloakFederatedIdentities).mockResolvedValue([
      { identityProvider: 'google', userId: 'google-sub', userName: 'old@example.com' },
    ]);
    vi.mocked(hasKeycloakPasswordCredential).mockResolvedValue(true);
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result.passwordSetupNeeded).toBe(false);
  });

  test('still succeeds and alerts when the unlink step fails', async () => {
    await seedTarget();
    vi.mocked(removeKeycloakFederatedIdentity).mockRejectedValue(new Error('kc down'));
    vi.mocked(getKeycloakFederatedIdentities).mockResolvedValue([
      { identityProvider: 'google', userId: 'google-sub', userName: 'old@example.com' },
    ]);
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', passwordSetupNeeded: false });
    expect(vi.mocked(slackAlert)).toHaveBeenCalledWith(expect.anything(), [expect.stringContaining('unlink stale google identity for user target-id')]);

    const user = await testDb.get(userTable, { id: 'target-id' });
    expect(user.email).toBe('new@example.com');
  });

  test('still succeeds and alerts when the password credential check fails', async () => {
    await seedTarget();
    vi.mocked(hasKeycloakPasswordCredential).mockRejectedValue(new Error('kc down'));
    const token = mintToken();

    const result = await createCaller(testAuthContextLoggedOut).emailChange.confirm({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', passwordSetupNeeded: false });
    expect(vi.mocked(slackAlert)).toHaveBeenCalledWith(expect.anything(), [expect.stringContaining('check password credential for user target-id')]);
  });
});
