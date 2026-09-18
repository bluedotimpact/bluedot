import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import {
  fetchApplications, fetchRounds, fetchApplicationHistory, fetchRoundStats, writeOpinions, resetOpinion, moveApplicationToAgisc,
} from './airtable';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('isolated local preview', () => {
  test('reads and writes synthetic records without external requests', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'true');
    const network = vi.fn(() => {
      throw new Error('Unexpected external request');
    });
    vi.stubGlobal('fetch', network);
    const rounds = await fetchRounds();
    const { applications } = await fetchApplications(rounds[0]!.id);
    const first = applications[0]!;
    expect(applications).toHaveLength(4);
    expect(await fetchApplicationHistory(first.id)).toEqual([]);
    await writeOpinions([{ id: first.id, opinion: 'Strong yes', decision: 'Accept' }]);
    expect((await fetchApplications(rounds[0]!.id)).applications).toHaveLength(3);
    expect(await fetchRoundStats(rounds[0]!.id)).toMatchObject({ evaluated: 1, accepted: 1 });
    await resetOpinion(first.id);
    expect((await fetchApplications(rounds[0]!.id)).applications).toHaveLength(4);
    await moveApplicationToAgisc(first.id, rounds[1]!.id);
    expect((await fetchApplications(rounds[0]!.id)).applications).toHaveLength(3);
    expect(network).not.toHaveBeenCalled();
  });
});
