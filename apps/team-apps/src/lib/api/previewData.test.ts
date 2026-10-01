import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import {
  fetchApplications, fetchRounds, fetchApplicationHistory, fetchRoundStats, writeOpinions, resetOpinion, moveApplicationToCourse, undoMoveToCourse,
  fetchFilterOptions,
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
    expect(applications).toHaveLength(5);
    expect(await fetchApplicationHistory(first.id)).toEqual([]);
    await writeOpinions([{ id: first.id, opinion: 'Strong yes', decision: 'Accept' }]);
    expect((await fetchApplications(rounds[0]!.id)).applications).toHaveLength(4);
    expect(await fetchRoundStats(rounds[0]!.id)).toMatchObject({ evaluated: 1, accepted: 1 });
    await resetOpinion(first.id);
    expect((await fetchApplications(rounds[0]!.id)).applications).toHaveLength(5);
    await moveApplicationToCourse(first.id, rounds[1]!.id, 'AGI Strategy');
    expect((await fetchApplications(rounds[0]!.id)).applications).toHaveLength(4);
    await undoMoveToCourse(first.id, rounds[0]!.id, 'AGI Strategy', 'Technical AI Safety');
    expect((await fetchApplications(rounds[0]!.id)).applications).toHaveLength(5);
    expect(network).not.toHaveBeenCalled();
  });

  test('offers sample queue filters that narrow the synthetic queue', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'true');
    const network = vi.fn(() => {
      throw new Error('Unexpected external request');
    });
    vi.stubGlobal('fetch', network);
    const options = await fetchFilterOptions();
    expect(options.map((option) => option.label)).toEqual(['Sample filter A', 'Sample filter B']);
    const [round] = await fetchRounds();
    const queueIds = async (mode: 'any' | 'all') => (await fetchApplications(round!.id, undefined, 'top', { optionIds: options.map((option) => option.id), mode }))
      .applications.map((application) => application.id);
    expect(await queueIds('any')).toEqual(['recSamplePerson01', 'recSamplePerson02', 'recSamplePerson03']);
    expect(await queueIds('all')).toEqual(['recSamplePerson03']);
    await expect(fetchApplications(round!.id, undefined, 'top', { optionIds: ['recPreviewUnknown'], mode: 'any' })).rejects.toMatchObject({ statusCode: 400 });
    expect(network).not.toHaveBeenCalled();
  });
});
