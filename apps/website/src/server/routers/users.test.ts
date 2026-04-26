import { userTable } from '@bluedot/db';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { updateKeycloakPassword, verifyKeycloakPassword } from '../../lib/api/keycloak';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

vi.mock('../../lib/api/keycloak', () => ({
  verifyKeycloakPassword: vi.fn(),
  updateKeycloakPassword: vi.fn(),
}));

setupTestDb();

beforeEach(() => {
  vi.mocked(verifyKeycloakPassword).mockReset();
  vi.mocked(updateKeycloakPassword).mockReset();
});

describe('users.getUser', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).users.getUser())
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws NOT_FOUND when no user record exists for the authed email', async () => {
    await expect(createCaller(testAuthContextLoggedIn).users.getUser())
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
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
    vi.mocked(verifyKeycloakPassword).mockResolvedValue(false);

    await expect(createCaller(testAuthContextLoggedIn).users.changePassword(validInput))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });

    expect(vi.mocked(updateKeycloakPassword)).not.toHaveBeenCalled();
  });

  test('rejects new passwords shorter than 8 chars at the schema layer', async () => {
    await expect(createCaller(testAuthContextLoggedIn).users.changePassword({
      currentPassword: 'old-pw',
      newPassword: 'short',
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });

    expect(vi.mocked(verifyKeycloakPassword)).not.toHaveBeenCalled();
  });

  test('updates Keycloak when current password verifies', async () => {
    vi.mocked(verifyKeycloakPassword).mockResolvedValue(true);
    vi.mocked(updateKeycloakPassword).mockResolvedValue(undefined);

    const result = await createCaller(testAuthContextLoggedIn).users.changePassword(validInput);

    expect(result).toEqual({ message: 'Password updated successfully' });
    expect(vi.mocked(verifyKeycloakPassword)).toHaveBeenCalledWith('test@example.com', 'old-pw');
    expect(vi.mocked(updateKeycloakPassword)).toHaveBeenCalledWith('test-sub', 'NewPassword12345');
  });
});

describe('users.ensureExists', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).users.ensureExists(undefined))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
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
    const result = await createCaller(testAuthContextLoggedIn).users.ensureExists({
      initialUtmSource: 'should-be-ignored',
    });

    expect(result).toEqual({ isNewUser: false });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user.utmSource).toBe('original-source');
    expect(new Date(user.lastSeenAt!).getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe('users.updateName', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).users.updateName({ name: 'New' }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws NOT_FOUND when the authed user has no record', async () => {
    await expect(createCaller(testAuthContextLoggedIn).users.updateName({ name: 'New' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('updates name on an existing user', async () => {
    await testDb.insert(userTable, {
      id: 'u1', email: 'test@example.com', name: 'Old Name',
    });

    const result = await createCaller(testAuthContextLoggedIn).users.updateName({ name: 'New Name' });
    expect(result.name).toBe('New Name');
  });

  test('rejects empty names at the schema layer', async () => {
    await expect(createCaller(testAuthContextLoggedIn).users.updateName({ name: '   ' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('rejects names longer than 50 characters at the schema layer', async () => {
    await expect(createCaller(testAuthContextLoggedIn).users.updateName({
      name: 'x'.repeat(51),
    })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
