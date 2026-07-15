import { userTable } from '@bluedot/db';
import { loginPresets } from '@bluedot/ui';
import db from '../../lib/api/db';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

vi.mock('../../lib/api/keycloak', () => ({
  verifyKeycloakPassword: vi.fn(),
  updateKeycloakPassword: vi.fn(),
}));

vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
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

beforeEach(() => {
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
      impersonation: { adminEmail: 'admin@example.com', targetEmail: 'test@example.com' },
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
      id: 'u1', email: 'test@example.com', name: 'Old Name',
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
