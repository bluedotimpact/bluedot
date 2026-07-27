import { userTable } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { sendEmailChangeVerification, updateCustomerIoEmail } from '../../lib/api/customerio';
import { unlinkStaleGoogleIdentities, updateKeycloakEmail } from '../../lib/api/keycloak';
import { createEmailChangeToken, verifyEmailChangeToken } from '../../lib/api/emailChangeToken';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { ROUTES } from '../../lib/routes';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

vi.mock('../../lib/api/keycloak', () => ({
  verifyKeycloakPassword: vi.fn(),
  updateKeycloakPassword: vi.fn(),
  updateKeycloakEmail: vi.fn(),
  unlinkStaleGoogleIdentities: vi.fn(),
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
const anonCaller = () => createCaller(testAuthContextLoggedOut);

const seedAdmin = () => testDb.insert(userTable, {
  id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
});
const seedTarget = (email = 'old@example.com') => testDb.insert(userTable, {
  id: 'target-id', email, name: 'Target', keycloakIdentifier: 'target-sub',
});

const mintToken = () => createEmailChangeToken({ userId: 'target-id', oldEmail: 'old@example.com', newEmail: 'new@example.com' });

beforeEach(() => {
  vi.clearAllMocks();
  mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = 'test-secret';
  vi.mocked(updateKeycloakEmail).mockResolvedValue(undefined);
  vi.mocked(updateCustomerIoEmail).mockResolvedValue(undefined);
  vi.mocked(sendEmailChangeVerification).mockResolvedValue(undefined);
  vi.mocked(unlinkStaleGoogleIdentities).mockResolvedValue({ hasPassword: true, hasGoogleLogin: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('users.requestEmailChange', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(anonCaller().users.requestEmailChange({ userId: 'target-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('rejects non-admin callers', async () => {
    await testDb.insert(userTable, {
      id: 'regular-id', email: 'regular@example.com', name: 'Regular', keycloakIdentifier: 'regular-sub',
    });

    await expect(callerAs('regular-sub').users.requestEmailChange({ userId: 'regular-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('rejects malformed emails', async () => {
    await seedAdmin();
    await seedTarget();

    await expect(callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: 'not-an-email' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('rejects unknown users', async () => {
    await seedAdmin();

    await expect(callerAs('admin-sub').users.requestEmailChange({ userId: 'missing-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('rejects users with no linked login account', async () => {
    await seedAdmin();
    await testDb.insert(userTable, { id: 'target-id', email: 'old@example.com', name: 'Target' });

    await expect(callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('no linked login account') });
  });

  test('rejects a new email equal to the current one, case-insensitively', async () => {
    await seedAdmin();
    await seedTarget();

    await expect(callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: ' OLD@Example.com ' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('same as the current email') });
  });

  test('rejects a new email already held by another user, case-insensitively', async () => {
    await seedAdmin();
    await seedTarget();
    await testDb.insert(userTable, {
      id: 'other-id', email: 'taken@example.com', name: 'Other', keycloakIdentifier: 'other-sub',
    });

    await expect(callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: 'Taken@Example.com' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('sends a verification email keyed by the old address, and changes nothing', async () => {
    await seedAdmin();
    await seedTarget();

    const result = await callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: ' New@Example.com ' });

    expect(result).toEqual({ sentTo: 'new@example.com' });
    expect(updateKeycloakEmail).not.toHaveBeenCalled();
    expect(updateCustomerIoEmail).not.toHaveBeenCalled();
    expect((await testDb.get(userTable, { id: 'target-id' })).email).toBe('old@example.com');

    expect(sendEmailChangeVerification).toHaveBeenCalledTimes(1);
    const call = vi.mocked(sendEmailChangeVerification).mock.calls[0]![0];
    expect(call.oldEmail).toBe('old@example.com');
    expect(call.newEmail).toBe('new@example.com');
    expect(call.confirmUrl).toContain(`${ROUTES.confirmEmailChange.url}?token=`);

    const payload = await verifyEmailChangeToken(decodeURIComponent(call.confirmUrl.split('token=')[1]!));
    expect(payload).toMatchObject({ userId: 'target-id', oldEmail: 'old@example.com', newEmail: 'new@example.com' });
  });

  test('surfaces a send failure to the admin', async () => {
    await seedAdmin();
    await seedTarget();
    vi.mocked(sendEmailChangeVerification).mockRejectedValue(new Error('send failed'));

    await expect(callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ message: expect.stringContaining('send failed') });
  });
});

describe('users.confirmEmailChange', () => {
  test('rejects an invalid token', async () => {
    await expect(anonCaller().users.confirmEmailChange({ token: 'garbage' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link is invalid' });
  });

  test('rejects an expired token', async () => {
    await seedTarget();
    const token = await mintToken();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(Date.now() + 49 * 60 * 60 * 1000);

    await expect(anonCaller().users.confirmEmailChange({ token }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link has expired' });
    expect(updateKeycloakEmail).not.toHaveBeenCalled();
  });

  test('rejects when the user no longer exists', async () => {
    await expect(anonCaller().users.confirmEmailChange({ token: await mintToken() }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });
  });

  test('rejects when the user has no linked login account', async () => {
    await testDb.insert(userTable, { id: 'target-id', email: 'old@example.com', name: 'Target' });

    await expect(anonCaller().users.confirmEmailChange({ token: await mintToken() }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });
  });

  test('rejects when the current email no longer matches the token', async () => {
    await seedTarget('different@example.com');

    await expect(anonCaller().users.confirmEmailChange({ token: await mintToken() }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'This link is no longer valid' });
    expect(updateKeycloakEmail).not.toHaveBeenCalled();
  });

  test('rejects when another user claimed the new email since the request', async () => {
    await seedTarget();
    await testDb.insert(userTable, {
      id: 'other-id', email: 'new@example.com', name: 'Other', keycloakIdentifier: 'other-sub',
    });

    await expect(anonCaller().users.confirmEmailChange({ token: await mintToken() }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(updateKeycloakEmail).not.toHaveBeenCalled();
  });

  test('updates Keycloak and the user row, then fires the customer.io rename', async () => {
    await seedTarget();

    const result = await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    expect(result).toEqual({ newEmail: 'new@example.com', loginMethods: { hasPassword: true, hasGoogleLogin: false } });
    expect(updateKeycloakEmail).toHaveBeenCalledWith('target-sub', 'new@example.com');
    expect((await testDb.get(userTable, { id: 'target-id' })).email).toBe('new@example.com');
    expect(updateCustomerIoEmail).toHaveBeenCalledWith({ userId: 'target-id', oldEmail: 'old@example.com', newEmail: 'new@example.com' });
  });

  test('leaves the database and customer.io untouched when Keycloak fails', async () => {
    await seedTarget();
    vi.mocked(updateKeycloakEmail).mockRejectedValue(new Error('Keycloak rejected the email update.'));

    await expect(anonCaller().users.confirmEmailChange({ token: await mintToken() }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('Email change failed') });

    expect((await testDb.get(userTable, { id: 'target-id' })).email).toBe('old@example.com');
    expect(updateCustomerIoEmail).not.toHaveBeenCalled();
  });

  test('alerts and rethrows when Keycloak succeeded but the user table update fails', async () => {
    await seedTarget();
    const updateSpy = vi.spyOn(db, 'update').mockRejectedValueOnce(new Error('airtable down'));

    await expect(anonCaller().users.confirmEmailChange({ token: await mintToken() }))
      .rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });

    expect(updateKeycloakEmail).toHaveBeenCalledWith('target-sub', 'new@example.com');
    expect(slackAlert).toHaveBeenCalledWith(expect.anything(), [expect.stringContaining('user table update failed')]);
    expect(updateCustomerIoEmail).not.toHaveBeenCalled();
    updateSpy.mockRestore();
  });

  test('succeeds and alerts when the customer.io rename fails', async () => {
    await seedTarget();
    vi.mocked(updateCustomerIoEmail).mockRejectedValue(new Error('cio down'));

    const result = await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    expect(result.newEmail).toBe('new@example.com');
    await vi.waitFor(() => {
      expect(slackAlert).toHaveBeenCalledWith(expect.anything(), [expect.stringContaining('cio down')]);
    });
  });

  test('a second click on the same link does not re-run the change', async () => {
    await seedTarget();
    const token = await mintToken();

    await anonCaller().users.confirmEmailChange({ token });
    vi.mocked(updateKeycloakEmail).mockClear();
    vi.mocked(updateCustomerIoEmail).mockClear();
    vi.mocked(unlinkStaleGoogleIdentities).mockClear();

    const result = await anonCaller().users.confirmEmailChange({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', loginMethods: null });
    expect(updateKeycloakEmail).not.toHaveBeenCalled();
    expect(updateCustomerIoEmail).not.toHaveBeenCalled();
    expect(unlinkStaleGoogleIdentities).not.toHaveBeenCalled();
  });

  test('reports success without side effects when the change was already applied', async () => {
    await seedTarget('new@example.com');

    const result = await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    expect(result).toEqual({ newEmail: 'new@example.com', loginMethods: null });
    expect(updateKeycloakEmail).not.toHaveBeenCalled();
    expect(unlinkStaleGoogleIdentities).not.toHaveBeenCalled();
  });

  test('succeeds and alerts when the identity cleanup fails', async () => {
    await seedTarget();
    vi.mocked(unlinkStaleGoogleIdentities).mockRejectedValue(new Error('kc down'));

    const result = await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    expect(result).toEqual({ newEmail: 'new@example.com', loginMethods: null });
    expect(slackAlert).toHaveBeenCalledWith(expect.anything(), [expect.stringContaining('unlink stale google identities for user target-id')]);
    expect((await testDb.get(userTable, { id: 'target-id' })).email).toBe('new@example.com');
  });
});
