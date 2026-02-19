import axios from 'axios';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { registerPreviewRedirectUri } from './keycloak';

vi.mock('axios');
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

    await expect(registerPreviewRedirectUri('https://bluedot-website-pr-42.onrender.com/*'))
      .rejects.toThrow('Client \'bluedot-web-apps\' not found');
  });
});
