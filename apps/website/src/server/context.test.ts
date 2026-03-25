import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { userTable } from '@bluedot/db';
import { loginPresets } from '@bluedot/ui';
import { createContext } from './context';
import { setupTestDb, testDb } from '../__tests__/dbTestUtils';
import { ONE_HOUR_SECONDS } from '../lib/constants';

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

  test('admin can impersonate any user', async () => {
    const adminAuth = { ...mockAuth, email: 'admin@example.com' };
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true,
    });
    await testDb.insert(userTable, { id: 'target-id', email: 'target@example.com', name: 'Target User' });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(adminAuth);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'target-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('target@example.com');
    expect(result.impersonation).toEqual({
      adminEmail: 'admin@example.com',
      targetEmail: 'target@example.com',
    });
  });

  test('scoped user can impersonate allowed target', async () => {
    const scopedAuth = { ...mockAuth, email: 'scoped@example.com' };
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped User', allowedImpersonationTargets: ['allowed-id'],
    });
    await testDb.insert(userTable, { id: 'allowed-id', email: 'target@example.com', name: 'Target User' });

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(scopedAuth);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'allowed-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('target@example.com');
    expect(result.impersonation).toEqual({
      adminEmail: 'scoped@example.com',
      targetEmail: 'target@example.com',
    });
  });

  test('scoped user cannot impersonate non-allowed target', async () => {
    const scopedAuth = { ...mockAuth, email: 'scoped@example.com' };
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped User', allowedImpersonationTargets: ['allowed-id'],
    });
    await testDb.insert(userTable, { id: 'other-id', email: 'other@example.com', name: 'Other User' });

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
    await testDb.insert(userTable, { id: 'regular-id', email: 'user@example.com', name: 'Regular User' });

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
    const adminAuth = { ...mockAuth, email: 'admin@example.com' };
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true,
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
