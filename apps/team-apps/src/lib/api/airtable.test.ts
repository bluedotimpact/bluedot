import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

vi.mock('./env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-airtable-credential' } }));

import {
  fetchApplications, fetchRounds, writeOpinions, resetOpinion, moveApplicationToAgisc,
} from './airtable';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'false');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const bodyAt = (index: number) => JSON.parse(fetchMock.mock.calls[index]?.[1]?.body as string);

describe('real-data Airtable adapter', () => {
  test('loads and maps the selected round from Airtable rather than sample records', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      records: [
        {
          id: 'recLiveApplicant', fields: {
            fldYaHSLqnvBXyjur: ['recLiveRound'], fld1rOZGAHBRcdJcM: 'Test applicant', fldEPZ0UfYoypB1mp: 9, fldRXdZQ0rnuVOcl7: 'Test summary',
          },
        },
        { id: 'recOtherRoundApplicant', fields: { fldYaHSLqnvBXyjur: ['recOtherRound'] } },
      ],
    })));
    const result = await fetchApplications('recLiveRound', undefined, 'bottom');
    expect(result.applications).toEqual([expect.objectContaining({
      id: 'recLiveApplicant', name: 'Test applicant', totalScore: 9, aiSummary: 'Test summary',
    })]);
    const request = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(request.pathname).toBe('/v0/appnJbsG1eWbAdEvf/tblXKnWoXK3R63F6D');
    expect(request.searchParams.get('sort[0][direction]')).toBe('asc');
    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({ Authorization: 'Bearer test-airtable-credential' });
  });

  test('loads round names, courses, and dates using consistent Airtable field IDs', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      records: [{
        id: 'recFutureRound',
        fields: { fldvOk9j9FbDV5aLl: 'AGI Strategy (test)', fldfi2ZKsbSK6NVTV: ['recCourse'], fldLQNa0te7r3GpBU: '2100-01-01' },
      }],
    })));
    expect(await fetchRounds()).toEqual([expect.objectContaining({ id: 'recFutureRound', name: 'AGI Strategy (test)', course: 'recCourse' })]);
    const request = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(request.searchParams.get('returnFieldsByFieldId')).toBe('true');
    expect(request.searchParams.getAll('fields[]')).toContain('fldfi2ZKsbSK6NVTV');
  });

  test('writes ratings using Airtable field IDs and its ten-record batch limit', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ records: [] })));
    await writeOpinions(Array.from({ length: 11 }, (_, index) => ({ id: `recTest${index}`, opinion: 'Strong yes', decision: 'Accept' })));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.every((call) => call[1]?.method === 'PATCH')).toBe(true);
    expect(bodyAt(0).records).toHaveLength(10);
    expect(bodyAt(1).records).toEqual([{ id: 'recTest10', fields: { fldOm6fJcqhq78M71: 'Strong yes', fldWVKY5EFAGSRcDT: 'Accept' } }]);
  });

  test('rejects failed real writes so the UI can preserve the current application', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ error: { type: 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND' } }), { status: 403 }));
    await expect(writeOpinions([{ id: 'recTest', opinion: 'Weak yes', decision: 'Accept' }])).rejects.toMatchObject({ statusCode: 503, expose: true, message: expect.stringContaining('write access') });
  });

  test('resets the rating and decision together for rerating', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ records: [] })));
    await resetOpinion('recTest');
    expect(bodyAt(0).records).toEqual([{ id: 'recTest', fields: { fldOm6fJcqhq78M71: 'TODO', fldWVKY5EFAGSRcDT: null } }]);
  });

  test('moves course, round, and derived course link in one write', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ records: [] })));
    await moveApplicationToAgisc('recTest', 'recNewRound');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bodyAt(0).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'AGI Strategy', fldYaHSLqnvBXyjur: ['recNewRound'], fldPkqPbeoIhERqSY: [] },
    }]);
  });

  test('does not clear the course link when the course move fails', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 403 }));
    await expect(moveApplicationToAgisc('recTest', 'recNewRound')).rejects.toMatchObject({ statusCode: 503, expose: true, message: expect.stringContaining('write access') });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
