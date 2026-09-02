import { courseRegistrationTable, userTable } from '@bluedot/db';
import type { TRPCError } from '@trpc/server';
import { loginPresets } from '@bluedot/ui/src/Login';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import db from '../../lib/api/db';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { sendEmailChangeRequestedNotice, sendEmailChangeVerification, updateCustomerIoEmail } from '../../lib/api/customerio';
import { resetEmailChangeRateLimits } from './users';
import { createEmailChangeToken, verifyEmailChangeToken } from '../../lib/api/emailChangeToken';
import {
  adminRequest, unlinkStaleGoogleIdentities, updateKeycloakEmail, updateKeycloakPassword, verifyKeycloakPassword,
} from '../../lib/api/keycloak';
import env from '../../lib/api/env';
import { ROUTES } from '../../lib/routes';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

vi.mock('../../lib/api/keycloak', () => ({
  verifyKeycloakPassword: vi.fn(),
  updateKeycloakPassword: vi.fn(),
  updateKeycloakEmail: vi.fn(),
  adminRequest: vi.fn(),
  unlinkStaleGoogleIdentities: vi.fn(),
  registerPreviewRedirectUri: vi.fn(),
}));

vi.mock('../../lib/api/customerio', () => ({
  updateCustomerIoEmail: vi.fn(),
  sendEmailChangeVerification: vi.fn(),
  sendEmailChangeRequestedNotice: vi.fn(),
}));

vi.mock('@bluedot/utils/src/slackNotifications', () => ({
  slackAlert: vi.fn(),
}));

vi.mock('@bluedot/ui/src/Login', async () => {
  const actual = await vi.importActual('@bluedot/ui/src/Login');
  return {
    ...actual,
    loginPresets: {
      keycloak: {
        verifyAndDecodeToken: vi.fn(),
      },
    },
  };
});

setupTestDb();

const mutableEnv = env as { EMAIL_CHANGE_TOKEN_SECRET?: string };

beforeEach(() => {
  vi.clearAllMocks();
  resetEmailChangeRateLimits();
  mutableEnv.EMAIL_CHANGE_TOKEN_SECRET = 'test-secret';
  vi.mocked(verifyKeycloakPassword).mockReset();
  vi.mocked(updateKeycloakPassword).mockReset();
  vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockReset();
  vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue({
    sub: 'test-sub',
    email: 'test@example.com',
    iss: 'test-issuer',
    aud: 'test-audience',
    exp: Math.floor(Date.now() / 1000) + 3600,
    email_verified: true,
  });
  vi.mocked(updateKeycloakEmail).mockResolvedValue(undefined);
  vi.mocked(adminRequest).mockResolvedValue([]);
  vi.mocked(updateCustomerIoEmail).mockResolvedValue(undefined);
  vi.mocked(sendEmailChangeVerification).mockResolvedValue(undefined);
  vi.mocked(sendEmailChangeRequestedNotice).mockResolvedValue(undefined);
  vi.mocked(unlinkStaleGoogleIdentities).mockResolvedValue({ hasPassword: true, hasGoogleLogin: false });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('users.getUser', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).users.getUser())
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('rejects with UNAUTHORIZED when the authed user has no row (ensureExists not run)', async () => {
    await expect(createCaller(testAuthContextLoggedIn).users.getUser())
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('returns the user and bumps lastSeenAt', async () => {
    await testDb.insert(userTable, {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
      keycloakIdentifier: 'test-sub',
      lastSeenAt: '2020-01-01T00:00:00.000Z',
    });

    const before = Date.now();
    const result = await createCaller(testAuthContextLoggedIn).users.getUser();

    expect(result.email).toBe('test@example.com');
    expect(result.name).toBe('Test User');
    expect(new Date(result.lastSeenAt!).getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe('users.changePassword', () => {
  const validInput = { currentPassword: 'old-pw', newPassword: 'NewPassword12345' };

  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).users.changePassword(validInput))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('blocks password change while impersonating another user', async () => {
    await seedLoggedInUser();
    const caller = createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, email: 'test@example.com' },
      impersonation: { adminEmail: 'admin@example.com', adminSub: 'admin-sub', targetEmail: 'test@example.com' },
    });

    await expect(caller.users.changePassword(validInput))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });

    expect(vi.mocked(verifyKeycloakPassword)).not.toHaveBeenCalled();
    expect(vi.mocked(updateKeycloakPassword)).not.toHaveBeenCalled();
  });

  test('throws UNAUTHORIZED when current password is wrong, and does not update', async () => {
    await seedLoggedInUser();
    vi.mocked(verifyKeycloakPassword).mockResolvedValue(false);

    await expect(createCaller(testAuthContextLoggedIn).users.changePassword(validInput))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    expect(vi.mocked(updateKeycloakPassword)).not.toHaveBeenCalled();
  });

  test('rejects new passwords shorter than 8 chars at the schema layer', async () => {
    await seedLoggedInUser();
    await expect(createCaller(testAuthContextLoggedIn).users.changePassword({
      currentPassword: 'old-pw',
      newPassword: 'short',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    expect(vi.mocked(verifyKeycloakPassword)).not.toHaveBeenCalled();
  });

  test('updates Keycloak when current password verifies', async () => {
    await seedLoggedInUser();
    vi.mocked(verifyKeycloakPassword).mockResolvedValue(true);
    vi.mocked(updateKeycloakPassword).mockResolvedValue(undefined);

    const result = await createCaller(testAuthContextLoggedIn).users.changePassword(validInput);

    expect(result).toEqual({ message: 'Password updated successfully' });
    expect(vi.mocked(verifyKeycloakPassword)).toHaveBeenCalledWith('test@example.com', 'old-pw');
    expect(vi.mocked(updateKeycloakPassword)).toHaveBeenCalledWith('test-sub', 'NewPassword12345');
  });
});

describe('users.ensureExists', () => {
  test('rejects invalid tokens with UNAUTHORIZED', async () => {
    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockRejectedValue(new Error('bad token'));

    await expect(createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'bad-token' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('creates a new user and persists initial UTM fields', async () => {
    const result = await createCaller(testAuthContextLoggedOut).users.ensureExists({
      token: 'valid-token',
      initialUtmSource: 'twitter',
      initialUtmCampaign: 'launch',
      initialUtmContent: 'thread',
    });

    expect(result).toEqual({ isNewUser: true });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.utmSource).toBe('twitter');
    expect(user.utmCampaign).toBe('launch');
    expect(user.utmContent).toBe('thread');
    expect(user.keycloakIdentifier).toBe('test-sub');
    expect(user.lastSeenAt).toBeTruthy();
  });

  test('does not send an explicit name when creating the user', async () => {
    // Writing name: '' puts the Airtable cell in an "explicitly empty" state, which makes
    // lookups of the field return [null] instead of omitting it, breaking record mapping
    // downstream (see #2763). The field must be left out of the insert payload entirely.
    const insertSpy = vi.spyOn(db.airtableClient, 'insert');

    await createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'valid-token' });

    expect(insertSpy).toHaveBeenCalledTimes(1);
    expect(insertSpy.mock.calls[0]?.[1]).not.toHaveProperty('name');
    insertSpy.mockRestore();
  });

  test('writes the name from the token when creating a new user', async () => {
    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue({
      sub: 'test-sub',
      email: 'test@example.com',
      name: 'John Doe',
      iss: 'test-issuer',
      aud: 'test-audience',
      exp: Math.floor(Date.now() / 1000) + 3600,
      email_verified: true,
    });

    await createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'valid-token' });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.name).toBe('John Doe');
  });

  test('backfills an empty name from the token on a user matched by email (no keycloakIdentifier yet)', async () => {
    await testDb.insert(userTable, { id: 'u1', email: 'test@example.com' });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue({
      sub: 'test-sub',
      email: 'test@example.com',
      name: 'John Doe',
      iss: 'test-issuer',
      aud: 'test-audience',
      exp: Math.floor(Date.now() / 1000) + 3600,
      email_verified: true,
    });

    await createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'valid-token' });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.name).toBe('John Doe');
  });

  test('backfills an empty name from the token on a returning user matched by keycloakIdentifier', async () => {
    await testDb.insert(userTable, { id: 'u1', email: 'test@example.com', keycloakIdentifier: 'test-sub' });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue({
      sub: 'test-sub',
      email: 'test@example.com',
      name: 'John Doe',
      iss: 'test-issuer',
      aud: 'test-audience',
      exp: Math.floor(Date.now() / 1000) + 3600,
      email_verified: true,
    });

    await createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'valid-token' });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.name).toBe('John Doe');
  });

  test('does not overwrite a name the user already has', async () => {
    await testDb.insert(userTable, {
      id: 'u1', email: 'test@example.com', name: 'Manual Name', keycloakIdentifier: 'test-sub',
    });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue({
      sub: 'test-sub',
      email: 'test@example.com',
      name: 'Google Name',
      iss: 'test-issuer',
      aud: 'test-audience',
      exp: Math.floor(Date.now() / 1000) + 3600,
      email_verified: true,
    });

    await createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'valid-token' });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.name).toBe('Manual Name');
  });

  test('is idempotent: a second call reports isNewUser false and creates no extra row', async () => {
    const caller = createCaller(testAuthContextLoggedOut);

    await caller.users.ensureExists({ token: 'valid-token' });
    const second = await caller.users.ensureExists({ token: 'valid-token' });

    expect(second).toEqual({ isNewUser: false });

    const users = await testDb.scan(userTable);
    expect(users).toHaveLength(1);
  });

  test('updates lastSeenAt on an existing user without overwriting their UTM fields', async () => {
    await testDb.insert(userTable, {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
      utmSource: 'original-source',
      lastSeenAt: '2020-01-01T00:00:00.000Z',
    });

    const before = Date.now();
    const result = await createCaller(testAuthContextLoggedOut).users.ensureExists({
      token: 'valid-token',
      initialUtmSource: 'should-be-ignored',
    });

    expect(result).toEqual({ isNewUser: false });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.utmSource).toBe('original-source');
    expect(new Date(user.lastSeenAt!).getTime()).toBeGreaterThanOrEqual(before);
  });

  test('writes initial UTM fields on first login for an applicant row (email exists, no keycloakIdentifier)', async () => {
    // Row auto-created when the person applied (#2163): has an email but never logged in, so no
    // keycloakIdentifier and no UTM. Their first login carries the UTM params in `input`.
    await testDb.insert(userTable, {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
    });

    const result = await createCaller(testAuthContextLoggedOut).users.ensureExists({
      token: 'valid-token',
      initialUtmSource: 'twitter',
      initialUtmCampaign: 'launch',
      initialUtmContent: 'thread',
    });

    expect(result).toEqual({ isNewUser: false });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.keycloakIdentifier).toBe('test-sub');
    expect(user.utmSource).toBe('twitter');
    expect(user.utmCampaign).toBe('launch');
    expect(user.utmContent).toBe('thread');
  });

  test('does not write UTM fields on first login when no UTM params are supplied', async () => {
    await testDb.insert(userTable, {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
    });

    const result = await createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'valid-token' });

    expect(result).toEqual({ isNewUser: false });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.keycloakIdentifier).toBe('test-sub');
    expect(user.utmSource).toBeNull();
    expect(user.utmCampaign).toBeNull();
    expect(user.utmContent).toBeNull();
  });

  test('does not touch UTM fields for an email-matched user that already has a keycloakIdentifier (not their first login)', async () => {
    await testDb.insert(userTable, {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
      keycloakIdentifier: 'other-sub',
      utmSource: 'original-source',
    });

    const result = await createCaller(testAuthContextLoggedOut).users.ensureExists({
      token: 'valid-token',
      initialUtmSource: 'should-be-ignored',
      initialUtmCampaign: 'should-be-ignored',
    });

    expect(result).toEqual({ isNewUser: false });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.utmSource).toBe('original-source');
    expect(user.utmCampaign).toBeNull();
  });

  test('backfills keycloakIdentifier on login for a user that already existed without one (e.g. created by an Airtable automation), and does not report them as new', async () => {
    await testDb.insert(userTable, {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
    });

    const result = await createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'valid-token' });

    expect(result).toEqual({ isNewUser: false });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.keycloakIdentifier).toBe('test-sub');
  });

  test('does not write an empty keycloakIdentifier when the token has an empty sub', async () => {
    await testDb.insert(userTable, {
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
    });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue({
      sub: '',
      email: 'test@example.com',
      iss: 'test-issuer',
      aud: 'test-audience',
      exp: Math.floor(Date.now() / 1000) + 3600,
      email_verified: true,
    });
    const result = await createCaller(testAuthContextLoggedOut).users.ensureExists({ token: 'valid-token' });

    expect(result).toEqual({ isNewUser: false });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.keycloakIdentifier).toBeNull();
  });
});

describe('users.updateName', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).users.updateName({ name: 'New' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('rejects with UNAUTHORIZED when the authed user has no row (ensureExists not run)', async () => {
    await expect(createCaller(testAuthContextLoggedIn).users.updateName({ name: 'New' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('updates name on an existing user', async () => {
    await testDb.insert(userTable, {
      id: 'u1', email: 'test@example.com', name: 'Old Name', keycloakIdentifier: 'test-sub',
    });

    const result = await createCaller(testAuthContextLoggedIn).users.updateName({ name: 'New Name' });
    expect(result.name).toBe('New Name');
  });

  test('rejects empty names at the schema layer', async () => {
    await seedLoggedInUser();
    await expect(createCaller(testAuthContextLoggedIn).users.updateName({ name: '   ' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('rejects names longer than 50 characters at the schema layer', async () => {
    await seedLoggedInUser();
    await expect(createCaller(testAuthContextLoggedIn).users.updateName({
      name: 'x'.repeat(51),
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

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

  test('rejects a new email held by a stub user with no login account, until #2831 adds adoption', async () => {
    await seedAdmin();
    await seedTarget();
    await testDb.insert(userTable, { id: 'stub-id', email: 'new@example.com', name: 'Stub' });

    await expect(callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('rejects a new email already held by a Keycloak account without a user row', async () => {
    await seedAdmin();
    await seedTarget();
    vi.mocked(adminRequest).mockResolvedValue([{ id: 'squatter-sub' }]);

    await expect(callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(adminRequest).toHaveBeenCalledWith({ method: 'get', path: '/users?email=new%40example.com&exact=true' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('allows a new email when the only Keycloak match is the user themselves', async () => {
    await seedAdmin();
    await seedTarget();
    vi.mocked(adminRequest).mockResolvedValue([{ id: 'target-sub' }]);

    const result = await callerAs('admin-sub').users.requestEmailChange({ userId: 'target-id', newEmail: 'new@example.com' });

    expect(result).toEqual({ sentTo: 'new@example.com' });
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

describe('users.requestOwnEmailChange', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(anonCaller().users.requestOwnEmailChange({ newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('rejects callers with no user row', async () => {
    await expect(createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('blocks the request while impersonating another user', async () => {
    await seedLoggedInUser();

    await expect(createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth! },
      impersonation: { adminEmail: 'admin@example.com', adminSub: 'admin-sub', targetEmail: 'test@example.com' },
    }).users.requestOwnEmailChange({ newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('impersonating') });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('rejects malformed emails', async () => {
    await seedLoggedInUser();

    await expect(createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: 'not-an-email' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('rejects a new email equal to the current one, case-insensitively', async () => {
    await seedLoggedInUser();

    await expect(createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: ' TEST@Example.com ' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: expect.stringContaining('same as the current email') });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('rejects a new email already held by another user, case-insensitively', async () => {
    await seedLoggedInUser();
    await testDb.insert(userTable, {
      id: 'other-id', email: 'taken@example.com', name: 'Other', keycloakIdentifier: 'other-sub',
    });

    await expect(createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: 'Taken@Example.com' }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('sends a verification email for the caller\'s own account, and changes nothing', async () => {
    await seedLoggedInUser();

    const result = await createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: ' New@Example.com ' });

    expect(result).toEqual({ sentTo: 'new@example.com' });
    expect(updateKeycloakEmail).not.toHaveBeenCalled();
    expect(updateCustomerIoEmail).not.toHaveBeenCalled();
    expect((await testDb.get(userTable, { id: 'test-user' })).email).toBe('test@example.com');

    expect(sendEmailChangeVerification).toHaveBeenCalledTimes(1);
    const call = vi.mocked(sendEmailChangeVerification).mock.calls[0]![0];
    expect(call.oldEmail).toBe('test@example.com');
    expect(call.newEmail).toBe('new@example.com');
    expect(call.confirmUrl).toContain(`${ROUTES.confirmEmailChange.url}?token=`);

    expect(sendEmailChangeRequestedNotice).toHaveBeenCalledWith({ oldEmail: 'test@example.com', newEmail: 'new@example.com' });
  });

  test('mints a token bound to the caller, never to another user who happens to be seeded', async () => {
    await seedLoggedInUser();
    await testDb.insert(userTable, {
      id: 'other-id', email: 'other@example.com', name: 'Other', keycloakIdentifier: 'other-sub',
    });

    await createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: 'new@example.com' });

    const { confirmUrl } = vi.mocked(sendEmailChangeVerification).mock.calls[0]![0];
    const payload = await verifyEmailChangeToken(decodeURIComponent(confirmUrl.split('token=')[1]!));
    expect(payload).toMatchObject({ userId: 'test-user', oldEmail: 'test@example.com', newEmail: 'new@example.com' });
  });

  test('the token it mints is accepted by confirmEmailChange', async () => {
    await seedLoggedInUser();

    await createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: 'new@example.com' });
    const { confirmUrl } = vi.mocked(sendEmailChangeVerification).mock.calls[0]![0];
    const token = decodeURIComponent(confirmUrl.split('token=')[1]!);

    const result = await anonCaller().users.confirmEmailChange({ token });

    expect(result).toEqual({ newEmail: 'new@example.com', loginMethods: { hasPassword: true, hasGoogleLogin: false } });
    expect(updateKeycloakEmail).toHaveBeenCalledWith('test-sub', 'new@example.com');
    expect((await testDb.get(userTable, { id: 'test-user' })).email).toBe('new@example.com');
  });

  test('the flow works when the stored email is not normalised', async () => {
    await testDb.insert(userTable, { id: 'test-user', email: '  MiXeD.Case@Example.COM ', keycloakIdentifier: 'test-sub' });

    await createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: 'new@example.com' });
    const { confirmUrl } = vi.mocked(sendEmailChangeVerification).mock.calls[0]![0];
    const token = decodeURIComponent(confirmUrl.split('token=')[1]!);

    const result = await anonCaller().users.confirmEmailChange({ token });

    expect(result).toMatchObject({ newEmail: 'new@example.com' });
    expect((await testDb.get(userTable, { id: 'test-user' })).email).toBe('new@example.com');
  });

  test('surfaces a send failure to the user', async () => {
    await seedLoggedInUser();
    vi.mocked(sendEmailChangeVerification).mockRejectedValue(new Error('send failed'));

    await expect(createCaller(testAuthContextLoggedIn).users.requestOwnEmailChange({ newEmail: 'new@example.com' }))
      .rejects.toMatchObject({ message: expect.stringContaining('send failed') });
  });
});

describe('users.requestOwnEmailChange rate limiting', () => {
  const ownCaller = () => createCaller(testAuthContextLoggedIn);

  const attemptOwnEmailChange = (newEmail: string): Promise<string> => ownCaller()
    .users.requestOwnEmailChange({ newEmail })
    .then(() => 'SENT')
    .catch((error: unknown) => (error as TRPCError).code);

  test('allows three attempts per window, then rejects with the wait time and sends nothing', async () => {
    await seedLoggedInUser();

    expect(await attemptOwnEmailChange('one@example.com')).toBe('SENT');
    expect(await attemptOwnEmailChange('two@example.com')).toBe('SENT');
    expect(await attemptOwnEmailChange('three@example.com')).toBe('SENT');

    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(Date.now() + 20 * 60 * 1000);
    vi.mocked(sendEmailChangeVerification).mockClear();

    await expect(ownCaller().users.requestOwnEmailChange({ newEmail: 'four@example.com' }))
      .rejects.toMatchObject({
        code: 'TOO_MANY_REQUESTS',
        message: expect.stringContaining('You\'ve tried to change your email 3 times in the last 30 minutes. If you\'re waiting for a confirmation email, check your spam folder, or try again in about 10 minutes.'),
      });
    expect(sendEmailChangeVerification).not.toHaveBeenCalled();
  });

  test('failed attempts count toward the limit', async () => {
    await seedLoggedInUser();
    await testDb.insert(userTable, {
      id: 'holder-id', email: 'taken@example.com', name: 'Holder', keycloakIdentifier: 'holder-sub',
    });

    expect(await attemptOwnEmailChange('taken@example.com')).toBe('CONFLICT');
    expect(await attemptOwnEmailChange('taken@example.com')).toBe('CONFLICT');
    expect(await attemptOwnEmailChange('taken@example.com')).toBe('CONFLICT');
    expect(await attemptOwnEmailChange('new@example.com')).toBe('TOO_MANY_REQUESTS');
  });

  test('attempts that fail on our own infra are refunded and do not count toward the limit', async () => {
    await seedLoggedInUser();
    vi.mocked(sendEmailChangeVerification).mockRejectedValue(new Error('customer.io is down'));

    expect(await attemptOwnEmailChange('new@example.com')).toBe('INTERNAL_SERVER_ERROR');
    expect(await attemptOwnEmailChange('new@example.com')).toBe('INTERNAL_SERVER_ERROR');
    expect(await attemptOwnEmailChange('new@example.com')).toBe('INTERNAL_SERVER_ERROR');

    vi.mocked(sendEmailChangeVerification).mockResolvedValue(undefined);
    expect(await attemptOwnEmailChange('new@example.com')).toBe('SENT');
  });

  test('a blocked request is allowed again once the window has passed', async () => {
    await seedLoggedInUser();

    expect(await attemptOwnEmailChange('one@example.com')).toBe('SENT');
    expect(await attemptOwnEmailChange('two@example.com')).toBe('SENT');
    expect(await attemptOwnEmailChange('three@example.com')).toBe('SENT');
    expect(await attemptOwnEmailChange('four@example.com')).toBe('TOO_MANY_REQUESTS');

    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(Date.now() + 31 * 60 * 1000);

    expect(await attemptOwnEmailChange('four@example.com')).toBe('SENT');
  });

  test('limits each user separately', async () => {
    await seedLoggedInUser();
    await testDb.insert(userTable, {
      id: 'other-id', email: 'other@example.com', name: 'Other', keycloakIdentifier: 'other-sub',
    });

    expect(await attemptOwnEmailChange('one@example.com')).toBe('SENT');
    expect(await attemptOwnEmailChange('two@example.com')).toBe('SENT');
    expect(await attemptOwnEmailChange('three@example.com')).toBe('SENT');
    expect(await attemptOwnEmailChange('four@example.com')).toBe('TOO_MANY_REQUESTS');

    await expect(callerAs('other-sub').users.requestOwnEmailChange({ newEmail: 'four@example.com' }))
      .resolves.toEqual({ sentTo: 'four@example.com' });
  });

  test('does not limit the admin requestEmailChange procedure', async () => {
    await seedAdmin();
    await seedTarget();
    const admin = callerAs('admin-sub');

    await admin.users.requestEmailChange({ userId: 'target-id', newEmail: 'one@example.com' });
    await admin.users.requestEmailChange({ userId: 'target-id', newEmail: 'two@example.com' });
    await admin.users.requestEmailChange({ userId: 'target-id', newEmail: 'three@example.com' });
    await admin.users.requestEmailChange({ userId: 'target-id', newEmail: 'four@example.com' });

    await expect(admin.users.requestEmailChange({ userId: 'target-id', newEmail: 'five@example.com' }))
      .resolves.toEqual({ sentTo: 'five@example.com' });
    expect(sendEmailChangeVerification).toHaveBeenCalledTimes(5);
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

  test('rejects when a stub user with no login account holds the new email, until #2831 adds adoption', async () => {
    await seedTarget();
    await testDb.insert(userTable, { id: 'stub-id', email: 'new@example.com', name: 'Stub' });

    await expect(anonCaller().users.confirmEmailChange({ token: await mintToken() }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(updateKeycloakEmail).not.toHaveBeenCalled();
  });

  test('rejects when a Keycloak account without a user row claimed the new email since the request', async () => {
    await seedTarget();
    vi.mocked(adminRequest).mockResolvedValue([{ id: 'squatter-sub' }]);

    await expect(anonCaller().users.confirmEmailChange({ token: await mintToken() }))
      .rejects.toMatchObject({ code: 'CONFLICT' });
    expect(adminRequest).toHaveBeenCalledWith({ method: 'get', path: '/users?email=new%40example.com&exact=true' });
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
      .rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'We could not update your email right now. Please try again later.' });

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

  test('succeeds and alerts when the identity cleanup fails on all attempts', async () => {
    await seedTarget();
    vi.mocked(unlinkStaleGoogleIdentities).mockRejectedValue(new Error('kc down'));

    const result = await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    expect(result).toEqual({ newEmail: 'new@example.com', loginMethods: null });
    expect(unlinkStaleGoogleIdentities).toHaveBeenCalledTimes(3);
    expect(slackAlert).toHaveBeenCalledWith(expect.anything(), [expect.stringContaining('Email for user target-id changed successfully to new@example.com, but stale Google identity cleanup failed')]);
    expect((await testDb.get(userTable, { id: 'target-id' })).email).toBe('new@example.com');
  });

  test('propagates the new email to the user\'s course registrations', async () => {
    await seedTarget();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1', userId: 'target-id', email: 'old@example.com', courseId: 'course-1',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-2', userId: 'target-id', email: 'personal@example.com', courseId: 'course-2',
    });

    const result = await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    expect(result.newEmail).toBe('new@example.com');
    await vi.waitFor(async () => {
      expect((await testDb.get(courseRegistrationTable, { id: 'reg-1' })).email).toBe('new@example.com');
      expect((await testDb.get(courseRegistrationTable, { id: 'reg-2' })).email).toBe('new@example.com');
    });
  });

  test('leaves registrations with an empty email untouched', async () => {
    await seedTarget();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-empty', userId: 'target-id', email: '', courseId: 'course-1',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-stale', userId: 'target-id', email: 'old@example.com', courseId: 'course-2',
    });

    await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    await vi.waitFor(async () => {
      expect((await testDb.get(courseRegistrationTable, { id: 'reg-stale' })).email).toBe('new@example.com');
    });
    expect((await testDb.get(courseRegistrationTable, { id: 'reg-empty' })).email).toBe('');
  });

  test('leaves other users\' registrations untouched', async () => {
    await seedTarget();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-mine', userId: 'target-id', email: 'old@example.com', courseId: 'course-1',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-other', userId: 'other-id', email: 'old@example.com', courseId: 'course-1',
    });

    await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    await vi.waitFor(async () => {
      expect((await testDb.get(courseRegistrationTable, { id: 'reg-mine' })).email).toBe('new@example.com');
    });
    expect((await testDb.get(courseRegistrationTable, { id: 'reg-other' })).email).toBe('old@example.com');
  });

  test('does not write to registrations already at the new email', async () => {
    await seedTarget();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-current', userId: 'target-id', email: 'new@example.com', courseId: 'course-1',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-stale', userId: 'target-id', email: 'old@example.com', courseId: 'course-2',
    });
    const updateSpy = vi.spyOn(db, 'update');

    await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    await vi.waitFor(async () => {
      expect((await testDb.get(courseRegistrationTable, { id: 'reg-stale' })).email).toBe('new@example.com');
    });
    const registrationUpdates = updateSpy.mock.calls.filter(([table]) => (table as unknown) === courseRegistrationTable);
    expect(registrationUpdates).toEqual([[courseRegistrationTable, { id: 'reg-stale', email: 'new@example.com' }]]);
    updateSpy.mockRestore();
  });

  test('succeeds and alerts when the registration propagation fails', async () => {
    await seedTarget();
    const scanSpy = vi.spyOn(db, 'scan').mockRejectedValue(new Error('pg down'));

    const result = await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    expect(result.newEmail).toBe('new@example.com');
    await vi.waitFor(() => {
      expect(slackAlert).toHaveBeenCalledWith(expect.anything(), [expect.stringContaining('course registration email propagation failed for user target-id: pg down')]);
    });
    scanSpy.mockRestore();
  });

  test('retries the identity cleanup once and does not alert if the retry succeeds', async () => {
    await seedTarget();
    vi.mocked(unlinkStaleGoogleIdentities)
      .mockRejectedValueOnce(new Error('kc blip'))
      .mockResolvedValueOnce({ hasPassword: true, hasGoogleLogin: false });

    const result = await anonCaller().users.confirmEmailChange({ token: await mintToken() });

    expect(result).toEqual({ newEmail: 'new@example.com', loginMethods: { hasPassword: true, hasGoogleLogin: false } });
    expect(unlinkStaleGoogleIdentities).toHaveBeenCalledTimes(2);
    expect(slackAlert).not.toHaveBeenCalled();
  });
});
