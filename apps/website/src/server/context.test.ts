import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { userTable } from '@bluedot/db';
import { loginPresets } from '@bluedot/ui/src/Login';
import { createContext } from './context';
import { setupTestDb, testDb } from '../__tests__/dbTestUtils';
import { ONE_HOUR_SECONDS } from '../lib/constants';

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

const mockAuth = {
  email: 'user@example.com',
  sub: 'user-sub-123',
  iss: 'https://auth.example.com',
  aud: 'client-id',
  exp: Date.now() / 1000 + ONE_HOUR_SECONDS,
  email_verified: true,
};

const createMockReq = (headers: Record<string, string>) => ({
  headers,
}) as unknown as Parameters<typeof createContext>[0]['req'];

describe('createContext: Happy path', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('returns authenticated user when valid token is provided', async () => {
    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(mockAuth);

    const req = createMockReq({ authorization: 'Bearer valid-token' });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth).toEqual(mockAuth);
    expect(result.impersonation).toBeNull();
    expect(loginPresets.keycloak.verifyAndDecodeToken).toHaveBeenCalledWith('valid-token');
  });
});

describe('createContext: User impersonation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('admin can impersonate any user, and the context carries the target\'s sub not the admin\'s', async () => {
    const adminAuth = { ...mockAuth, email: 'admin@example.com', sub: 'admin-sub' };
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
    });
    await testDb.insert(userTable, {
      id: 'target-id', email: 'target@example.com', name: 'Target User', keycloakIdentifier: 'target-sub',
    });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(adminAuth);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'target-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('target@example.com');
    expect(result.auth?.sub).toBe('target-sub');
    expect(result.impersonation).toEqual({
      adminEmail: 'admin@example.com',
      adminSub: 'admin-sub',
      targetEmail: 'target@example.com',
    });
  });

  test('impersonating a not-yet-backfilled target (no keycloakIdentifier) is blocked', async () => {
    const adminAuth = { ...mockAuth, email: 'admin@example.com', sub: 'admin-sub' };
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
    });
    // Target has no keycloakIdentifier yet (e.g. hasn't logged in since the backfill).
    await testDb.insert(userTable, { id: 'target-id', email: 'target@example.com', name: 'Target User' });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(adminAuth);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'target-id',
    });

    await expect(createContext({ req } as Parameters<typeof createContext>[0]))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('scoped user can impersonate allowed target', async () => {
    const scopedAuth = { ...mockAuth, email: 'scoped@example.com', sub: 'scoped-sub' };
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped User', keycloakIdentifier: 'scoped-sub', allowedImpersonationTargets: ['allowed-id'],
    });
    await testDb.insert(userTable, {
      id: 'allowed-id', email: 'target@example.com', name: 'Target User', keycloakIdentifier: 'target-sub',
    });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(scopedAuth);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'allowed-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('target@example.com');
    expect(result.impersonation).toEqual({
      adminEmail: 'scoped@example.com',
      adminSub: 'scoped-sub',
      targetEmail: 'target@example.com',
    });
  });

  test('scoped user cannot impersonate non-allowed target', async () => {
    const scopedAuth = { ...mockAuth, email: 'scoped@example.com', sub: 'scoped-sub' };
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped User', keycloakIdentifier: 'scoped-sub', allowedImpersonationTargets: ['allowed-id'],
    });
    await testDb.insert(userTable, {
      id: 'other-id', email: 'other@example.com', name: 'Other User', keycloakIdentifier: 'other-sub',
    });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(scopedAuth);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'other-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('scoped@example.com');
    expect(result.impersonation).toBeNull();
  });

  test('user with no impersonation access is rejected', async () => {
    // mockAuth.sub is 'user-sub-123'
    await testDb.insert(userTable, {
      id: 'regular-id', email: 'user@example.com', name: 'Regular User', keycloakIdentifier: 'user-sub-123',
    });
    await testDb.insert(userTable, {
      id: 'some-target-id', email: 'target@example.com', name: 'Target User', keycloakIdentifier: 'target-sub',
    });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(mockAuth);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'some-target-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('user@example.com');
    expect(result.impersonation).toBeNull();
  });

  test('impersonation falls back to normal user when target user not found', async () => {
    const adminAuth = { ...mockAuth, email: 'admin@example.com', sub: 'admin-sub' };
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true, keycloakIdentifier: 'admin-sub',
    });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(adminAuth);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'nonexistent-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('admin@example.com');
    expect(result.impersonation).toBeNull();
  });
});
