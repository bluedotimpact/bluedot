import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { loginPresets } from '@bluedot/ui';
import { createContext } from './context';
import { checkAdminAccess } from './trpc';
import db from '../lib/api/db';

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

vi.mock('./trpc', () => ({
  checkAdminAccess: vi.fn(),
}));

vi.mock('../lib/api/db', () => ({
  default: {
    getFirst: vi.fn(),
  },
}));

const mockAuth = {
  email: 'user@example.com',
  sub: 'user-sub-123',
  iss: 'https://auth.example.com',
  aud: 'client-id',
  exp: Date.now() / 1000 + 3600,
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

  test('impersonation works when admin with valid target user', async () => {
    const adminAuth = { ...mockAuth, email: 'admin@example.com' };
    const targetUser = { id: 'target-user-id', email: 'target@example.com', name: 'Target User' };

    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(adminAuth);
    vi.mocked(checkAdminAccess).mockResolvedValue(true);
    vi.mocked(db.getFirst).mockResolvedValue(targetUser);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'target-user-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('target@example.com');
    expect(result.impersonation).toEqual({
      adminEmail: 'admin@example.com',
      targetEmail: 'target@example.com',
    });
    expect(checkAdminAccess).toHaveBeenCalledWith('admin@example.com');
  });

  test('impersonation falls back to normal user when admin check fails', async () => {
    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(mockAuth);
    vi.mocked(checkAdminAccess).mockResolvedValue(false);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'target-user-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('user@example.com');
    expect(result.impersonation).toBeNull();
    expect(db.getFirst).not.toHaveBeenCalled();
  });

  test('impersonation falls back to normal user when target user not found', async () => {
    vi.mocked(loginPresets.keycloak.verifyAndDecodeToken).mockResolvedValue(mockAuth);
    vi.mocked(checkAdminAccess).mockResolvedValue(true);
    vi.mocked(db.getFirst).mockResolvedValue(null);

    const req = createMockReq({
      authorization: 'Bearer valid-token',
      'x-impersonate-user': 'nonexistent-user-id',
    });
    const result = await createContext({ req } as Parameters<typeof createContext>[0]);

    expect(result.auth?.email).toBe('user@example.com');
    expect(result.impersonation).toBeNull();
  });
});
