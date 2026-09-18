import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { requestCandidateEngine } from './candidateEngine';

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.stubEnv('CANDIDATE_SOURCING_URL', 'http://127.0.0.1:8769');
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

describe('candidate engine boundary', () => {
  test('keeps engine tokens out of browser responses', async () => {
    fetchMock.mockResolvedValue(response({ token: 'private-engine-token', configured: true }));
    await expect(requestCandidateEngine({ route: 'searches' })).resolves.toEqual({ configured: true });
  });
  test('forwards writes to the selected search with its own engine token and origin', async () => {
    fetchMock.mockResolvedValueOnce(response({ token: 'search-specific-token' })).mockResolvedValueOnce(response({ notes: 'Saved', version: 2 }));
    const body = { person_key: 'person-0', version: 1, patch: { notes: 'Saved' } };
    await requestCandidateEngine({ searchId: 'second-search', route: 'review', body });
    expect((fetchMock.mock.calls[0]?.[0] as URL).href).toBe('http://127.0.0.1:8769/search/second-search/api/searches');
    expect((fetchMock.mock.calls[1]?.[0] as URL).href).toBe('http://127.0.0.1:8769/search/second-search/api/review');
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      method: 'POST', headers: { Origin: 'http://127.0.0.1:8769', 'X-Review-Token': 'search-specific-token' }, body: JSON.stringify(body), cache: 'no-store',
    });
  });
  test('preserves optimistic-concurrency errors for draft recovery', async () => {
    fetchMock.mockResolvedValueOnce(response({ token: 'secret' })).mockResolvedValueOnce(response({ error: 'This review changed in another tab.' }, 409));
    await expect(requestCandidateEngine({ route: 'review', body: {} })).rejects.toMatchObject({ code: 'CONFLICT', message: 'This review changed in another tab.' });
  });
  test('preview identities cannot access a real engine', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'true');
    fetchMock.mockResolvedValue(response({ ok: true, synthetic: false }));
    await expect(requestCandidateEngine({ route: 'ashby/lead', body: {} })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((fetchMock.mock.calls[0]?.[0] as URL).href).toBe('http://127.0.0.1:8769/api/health');
  });
  test('preview permits only an explicitly synthetic engine', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'true');
    fetchMock.mockResolvedValueOnce(response({ ok: true, synthetic: true })).mockResolvedValueOnce(response({ people: [] }));
    await expect(requestCandidateEngine({ route: 'data' })).resolves.toEqual({ people: [] });
  });
  test('fails before fetching an unconfigured or non-local engine', async () => {
    vi.stubEnv('CANDIDATE_SOURCING_URL', '');
    await expect(requestCandidateEngine({ route: 'data' })).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    vi.stubEnv('CANDIDATE_SOURCING_URL', 'https://example.invalid');
    await expect(requestCandidateEngine({ route: 'data' })).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  test('connection failures give a recovery message without exposing runtime details', async () => {
    fetchMock.mockRejectedValue(new Error('private runtime error'));
    await expect(requestCandidateEngine({ route: 'data' })).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE', message: expect.stringContaining('Your saved work is kept') });
  });
});
