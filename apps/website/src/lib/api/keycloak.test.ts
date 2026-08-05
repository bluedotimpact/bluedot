import axios from 'axios';
import { logger } from '@bluedot/ui/src/api';
import { isHttpError } from 'http-errors';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import {
  deleteKeycloakUser, keycloakUserExists, registerPreviewRedirectUri, unlinkStaleGoogleIdentities,
} from './keycloak';

vi.mock('axios');
vi.mock('@bluedot/ui/src/api', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('./env', () => ({
  default: {
    KEYCLOAK_CLIENT_ID: 'fake',
    KEYCLOAK_CLIENT_SECRET: 'fake',
    KEYCLOAK_PREVIEW_CLIENT_ID: 'preview-client',
    KEYCLOAK_PREVIEW_CLIENT_SECRET: 'preview-secret',
  },
}));

const mockedAxios = vi.mocked(axios, { deep: true });

const FAKE_TOKEN_RESPONSE = {
  data: { access_token: 'fake-admin-token', expires_in: 300 },
};

const makeClient = (redirectUris: string[]) => ({
  id: 'client-uuid-123',
  clientId: 'bluedot-web-apps',
  redirectUris,
});

function setupMocks(existingUris: string[], prStates: Record<number, 'open' | 'closed' | 'not-found'> = {}) {
  // token request
  mockedAxios.post.mockResolvedValueOnce(FAKE_TOKEN_RESPONSE);

  // get clients
  mockedAxios.get.mockResolvedValueOnce({ data: [makeClient(existingUris)] });

  // isPrOpen calls
  for (const uri of existingUris) {
    const match = (/-pr-(\d+)/).exec(uri);
    if (!match) continue;

    const state = prStates[Number(match[1])];
    if (state === 'not-found') {
      mockedAxios.get.mockResolvedValueOnce({ status: 404 });
    } else if (state === 'closed') {
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { state: 'closed' } });
    } else {
      mockedAxios.get.mockResolvedValueOnce({ status: 200, data: { state: 'open' } });
    }
  }

  // PUT to update client
  mockedAxios.put.mockResolvedValueOnce({ data: {} });
}

const PERMANENT_URIS = [
  'https://frontend-example.k8s.bluedot.org/*',
  'https://app-template.k8s.bluedot.org/*',
  'https://website-staging.k8s.bluedot.org/*',
  'https://bluedot.org/*',
  'http://localhost:8000/*',
];

describe('registerPreviewRedirectUri', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('adds a new redirect URI', async () => {
    setupMocks([...PERMANENT_URIS]);

    const result = await registerPreviewRedirectUri('https://bluedot-website-pr-42.onrender.com/*');

    expect(result).toEqual({ added: true, cleaned: 0 });
    expect(mockedAxios.put).toHaveBeenCalledOnce();
    const putBody = mockedAxios.put.mock.calls[0]![1] as { redirectUris: string[] };
    expect(putBody.redirectUris).toContain('https://bluedot-website-pr-42.onrender.com/*');
  });

  it('returns added: false when URI already exists and nothing to clean', async () => {
    const uri = 'https://bluedot-website-pr-42.onrender.com/*';
    setupMocks([...PERMANENT_URIS, uri], { 42: 'open' });

    const result = await registerPreviewRedirectUri(uri);

    expect(result).toEqual({ added: false, cleaned: 0 });
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  it('cleans up URIs for closed PRs', async () => {
    const closedUri = 'https://bluedot-website-pr-10.onrender.com/*';
    setupMocks([...PERMANENT_URIS, closedUri], { 10: 'closed' });

    const result = await registerPreviewRedirectUri('https://bluedot-website-pr-99.onrender.com/*');

    expect(result).toEqual({ added: true, cleaned: 1 });
    const putBody = mockedAxios.put.mock.calls[0]![1] as { redirectUris: string[] };
    expect(putBody.redirectUris).not.toContain(closedUri);
    expect(putBody.redirectUris).toContain('https://bluedot-website-pr-99.onrender.com/*');
  });

  it('cleans up URIs for PRs that return 404', async () => {
    const staleUri = 'https://bluedot-website-pr-5.onrender.com/*';
    setupMocks([...PERMANENT_URIS, staleUri], { 5: 'not-found' });

    const result = await registerPreviewRedirectUri('https://bluedot-website-pr-99.onrender.com/*');

    expect(result).toEqual({ added: true, cleaned: 1 });
    const putBody = mockedAxios.put.mock.calls[0]![1] as { redirectUris: string[] };
    expect(putBody.redirectUris).not.toContain(staleUri);
  });

  it('never removes permanent URIs', async () => {
    setupMocks([...PERMANENT_URIS]);

    const result = await registerPreviewRedirectUri('https://bluedot-website-pr-42.onrender.com/*');

    const putBody = mockedAxios.put.mock.calls[0]![1] as { redirectUris: string[] };
    for (const uri of PERMANENT_URIS) {
      expect(putBody.redirectUris).toContain(uri);
    }

    expect(result.added).toBe(true);
  });

  it('throws when client is not found', async () => {
    mockedAxios.post.mockResolvedValueOnce(FAKE_TOKEN_RESPONSE);
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    await expect(registerPreviewRedirectUri('https://bluedot-website-pr-42.onrender.com/*')).rejects.toThrow('Client \'bluedot-web-apps\' not found');
  });

  it('does not leak client_secret or admin token when Keycloak errors', async () => {
    const CLIENT_SECRET = 'preview-secret';
    const ADMIN_TOKEN = 'super-secret-admin-token';

    // A realistic axios error embeds the request body (with client_secret) in
    // config.data and the bearer token in config.headers.Authorization.
    const axiosError = Object.assign(new Error('Request failed with status code 401'), {
      isAxiosError: true,
      code: 'ERR_BAD_REQUEST',
      config: {
        data: `grant_type=client_credentials&client_id=preview-client&client_secret=${CLIENT_SECRET}`,
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
      },
      response: { status: 401, data: { error: 'invalid_client' } },
    });
    mockedAxios.post.mockRejectedValueOnce(axiosError);
    mockedAxios.isAxiosError.mockReturnValue(true);

    const caught: unknown = await registerPreviewRedirectUri('https://bluedot-website-pr-42.onrender.com/*').catch((error: unknown) => error);

    if (!isHttpError(caught)) {
      throw new Error('expected an HttpError');
    }

    expect(caught.statusCode).toBe(503);

    const serialised = JSON.stringify(caught) + caught.message + (caught.stack ?? '');
    expect(serialised).not.toContain(CLIENT_SECRET);
    expect(serialised).not.toContain(ADMIN_TOKEN);

    // Safe diagnostics are logged; secrets are not.
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Keycloak request failed'), {
      status: 401,
      code: 'ERR_BAD_REQUEST',
    });
    const loggedArgs = JSON.stringify(vi.mocked(logger.error).mock.calls);
    expect(loggedArgs).not.toContain(CLIENT_SECRET);
    expect(loggedArgs).not.toContain(ADMIN_TOKEN);
  });
});

describe('unlinkStaleGoogleIdentities', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedAxios.post.mockResolvedValue(FAKE_TOKEN_RESPONSE);
  });

  const googleIdentity = (userName: string) => ({ identityProvider: 'google', userId: 'google-sub', userName });

  const mockKeycloakUser = ({ identities = [], credentials = [] }: {
    identities?: { identityProvider: string; userId: string; userName: string }[];
    credentials?: { type?: string }[];
  }) => {
    mockedAxios.request.mockImplementation(async ({ url }: { url?: string }) => {
      if (String(url).endsWith('/federated-identity')) return { data: identities };
      if (String(url).endsWith('/credentials')) return { data: credentials };
      return { data: {} };
    });
  };

  const unlinkedProviders = () => mockedAxios.request.mock.calls
    .filter((call) => call[0].method === 'delete')
    .map((call) => String(call[0].url).split('/federated-identity/')[1]);

  it('unlinks a Google identity tied to the old address', async () => {
    mockKeycloakUser({ identities: [googleIdentity('old@example.com')], credentials: [{ type: 'password' }] });

    const result = await unlinkStaleGoogleIdentities('user-sub', 'new@example.com');

    expect(unlinkedProviders()).toEqual(['google']);
    expect(result).toEqual({ hasPassword: true, hasGoogleLogin: false });
  });

  it('reports no login methods when the stale Google link was the only one', async () => {
    mockKeycloakUser({ identities: [googleIdentity('old@example.com')] });

    const result = await unlinkStaleGoogleIdentities('user-sub', 'new@example.com');

    expect(result).toEqual({ hasPassword: false, hasGoogleLogin: false });
  });

  it('keeps a Google identity that already matches the new address, case-insensitively', async () => {
    mockKeycloakUser({ identities: [googleIdentity('New@Example.com')], credentials: [{ type: 'password' }] });

    const result = await unlinkStaleGoogleIdentities('user-sub', 'new@example.com');

    expect(unlinkedProviders()).toEqual([]);
    expect(result).toEqual({ hasPassword: true, hasGoogleLogin: true });
  });

  it('reports a password login for an account with no federated identities', async () => {
    mockKeycloakUser({ credentials: [{ type: 'password' }] });

    const result = await unlinkStaleGoogleIdentities('user-sub', 'new@example.com');

    expect(result).toEqual({ hasPassword: true, hasGoogleLogin: false });
  });

  it('leaves identities from other providers linked', async () => {
    mockKeycloakUser({
      identities: [googleIdentity('old@example.com'), { identityProvider: 'github', userId: 'github-sub', userName: 'old@example.com' }],
    });

    await unlinkStaleGoogleIdentities('user-sub', 'new@example.com');

    expect(unlinkedProviders()).toEqual(['google']);
  });
});

describe('deleteKeycloakUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedAxios.post.mockResolvedValue(FAKE_TOKEN_RESPONSE);
  });

  const notFound = () => Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    response: { status: 404 },
  });

  it('deletes the account', async () => {
    mockedAxios.request.mockResolvedValue({ data: {} });

    await deleteKeycloakUser('user-sub');

    expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
      method: 'delete',
      url: expect.stringContaining('/users/user-sub'),
    }));
  });

  it('treats an account that is already gone as deleted, so a retry does not fail', async () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.request.mockRejectedValue(notFound());

    await expect(deleteKeycloakUser('user-sub')).resolves.toBeUndefined();
  });

  it('propagates other failures rather than reporting a deletion that did not happen', async () => {
    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.request.mockRejectedValue(Object.assign(new Error('boom'), {
      isAxiosError: true,
      response: { status: 500 },
    }));

    await expect(deleteKeycloakUser('user-sub')).rejects.toSatisfy(isHttpError);
  });

  it('reports whether the account still exists', async () => {
    mockedAxios.request.mockResolvedValue({ data: { id: 'user-sub' } });
    await expect(keycloakUserExists('user-sub')).resolves.toBe(true);

    mockedAxios.isAxiosError.mockReturnValue(true);
    mockedAxios.request.mockRejectedValue(notFound());
    await expect(keycloakUserExists('user-sub')).resolves.toBe(false);
  });
});
