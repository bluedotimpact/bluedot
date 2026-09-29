import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

vi.mock('./env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-airtable-credential' } }));

import {
  fetchApplications, fetchRounds, writeOpinions, resetOpinion, moveApplicationToCourse, undoMoveToCourse,
  fetchDecisionEmailCounts, flagDecisionEmails,
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

  test('filters applications to the selected round inside the Airtable query', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ records: [] })));
    await fetchApplications('recLiveRound');
    const request = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(request.searchParams.get('filterByFormula')).toContain('FIND("recLiveRound", {fldrmNLS764z8WEbR} & "")');
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
    await moveApplicationToCourse('recTest', 'recNewRound', 'AGI Strategy');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(bodyAt(0).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'AGI Strategy', fldYaHSLqnvBXyjur: ['recNewRound'], fldPkqPbeoIhERqSY: [] },
    }]);
  });

  test('moves a project-round application to Technical AI Safety and undoes it back', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [] })));
    await moveApplicationToCourse('recTest', 'recTaisRound', 'Technical AI Safety');
    expect(bodyAt(0).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety', fldYaHSLqnvBXyjur: ['recTaisRound'], fldPkqPbeoIhERqSY: [] },
    }]);

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [{ id: 'recTest', fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety' } }] })));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [] })));
    await undoMoveToCourse('recTest', 'recProjectRound', 'Technical AI Safety', 'Technical AI Safety Project');
    expect(bodyAt(2).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety Project', fldYaHSLqnvBXyjur: ['recProjectRound'], fldPkqPbeoIhERqSY: [] },
    }]);
  });

  test('does not clear the course link when the course move fails', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 403 }));
    await expect(moveApplicationToCourse('recTest', 'recNewRound', 'AGI Strategy')).rejects.toMatchObject({ statusCode: 503, expose: true, message: expect.stringContaining('write access') });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  const movedRecord = JSON.stringify({ records: [{ id: 'recTest', fields: { fldkEQ0zBUhqpIuJn: 'AGI Strategy' } }] });

  test('undoing a move restores course, round, and derived course link in one write', async () => {
    fetchMock.mockResolvedValueOnce(new Response(movedRecord));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [] })));
    await undoMoveToCourse('recTest', 'recOriginalRound', 'AGI Strategy', 'Technical AI Safety');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodyAt(1).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety', fldYaHSLqnvBXyjur: ['recOriginalRound'], fldPkqPbeoIhERqSY: [] },
    }]);
  });

  test('refuses to undo an application that is not currently in AGI Strategy', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [{ id: 'recTest', fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety' } }] })));
    await expect(undoMoveToCourse('recTest', 'recOriginalRound', 'AGI Strategy', 'Technical AI Safety')).rejects.toMatchObject({ statusCode: 409, expose: true, message: expect.stringContaining('not currently moved') });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('rejects a failed undo so the UI keeps the application in the moved list', async () => {
    fetchMock.mockResolvedValueOnce(new Response(movedRecord));
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 403 }));
    await expect(undoMoveToCourse('recTest', 'recOriginalRound', 'AGI Strategy', 'Technical AI Safety')).rejects.toMatchObject({ statusCode: 503, expose: true, message: expect.stringContaining('write access') });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('decision emails', () => {
  // The participant role mirrors the server-side filter: Airtable would never
  // return a record without "Participant" in [a] Role. Dual-role records
  // override the role key below.
  const inRound = { fldYaHSLqnvBXyjur: ['recRound'], fld7fzQNFhb7Oyy90: ['Participant'] };
  const reviewedRecords = JSON.stringify({
    records: [
      { id: 'recSentAlready', fields: { ...inRound, fldWVKY5EFAGSRcDT: 'Accept', fldgseNhrqlQQesiA: true } },
      { id: 'recFlaggedUnsent', fields: { ...inRound, fldWVKY5EFAGSRcDT: 'Accept', fldYNTRHyWNGM0DtS: true } },
      { id: 'recPlainReject', fields: { ...inRound, fldWVKY5EFAGSRcDT: 'Reject' } },
      {
        id: 'recDualTodo',
        fields: {
          ...inRound, fldWVKY5EFAGSRcDT: 'Accept', fld7fzQNFhb7Oyy90: ['Participant', 'Facilitator'], fld52Y2AyWV8tECDy: 'TODO',
        },
      },
      {
        id: 'recDualResolved',
        fields: {
          ...inRound, fldWVKY5EFAGSRcDT: 'Accept', fld7fzQNFhb7Oyy90: ['Participant', 'Facilitator'], fld52Y2AyWV8tECDy: 'Facilitator',
        },
      },
      { id: 'recOtherRound', fields: { fldYaHSLqnvBXyjur: ['recRoundOther'], fldWVKY5EFAGSRcDT: 'Accept' } },
    ],
  });

  test('counts reviewed applications in the round, treating flagged-but-unsent as sent', async () => {
    fetchMock.mockResolvedValue(new Response(reviewedRecords));
    expect(await fetchDecisionEmailCounts('recRound')).toEqual({
      reviewed: 5, alreadySent: 2, pending: 3, pendingAccepted: 2, pendingRejected: 1,
    });
    const request = new URL(fetchMock.mock.calls[0]?.[0] as string);
    const formula = request.searchParams.get('filterByFormula');
    expect(formula).toContain('FIND("recRound", {fldrmNLS764z8WEbR} & "")');
    // Facilitator applications in the round have decisions too, but their
    // emails are the facilitator process's to send.
    expect(formula).toContain('SEARCH("Participant", {fld7fzQNFhb7Oyy90})');
    expect(formula).toContain('OR({fldWVKY5EFAGSRcDT} = "Accept", {fldWVKY5EFAGSRcDT} = "Reject")');
    expect(formula).toContain('NOT({fld1KQjHFGoDZKf94})');
  });

  test('flags unsent applications and resolves dual-role TODO applicants to Participant', async () => {
    fetchMock.mockResolvedValueOnce(new Response(reviewedRecords));
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ records: [] })));
    expect(await flagDecisionEmails('recRound')).toEqual({ flagged: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('PATCH');
    expect(bodyAt(1).records).toEqual([
      { id: 'recPlainReject', fields: { fldYNTRHyWNGM0DtS: true } },
      { id: 'recDualTodo', fields: { fldYNTRHyWNGM0DtS: true, fld52Y2AyWV8tECDy: 'Participant' } },
      { id: 'recDualResolved', fields: { fldYNTRHyWNGM0DtS: true } },
    ]);
  });

  test('session scope flags only the given applications and skips already-sent ones', async () => {
    fetchMock.mockResolvedValueOnce(new Response(reviewedRecords));
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ records: [] })));
    expect(await flagDecisionEmails('recRound', ['recDualTodo', 'recSentAlready', 'recNotInRound'])).toEqual({ flagged: 1 });
    expect(bodyAt(1).records).toEqual([
      { id: 'recDualTodo', fields: { fldYNTRHyWNGM0DtS: true, fld52Y2AyWV8tECDy: 'Participant' } },
    ]);
  });

  test('splits flag writes into ten-record batches', async () => {
    const manyPending = JSON.stringify({
      records: Array.from({ length: 11 }, (_, index) => ({ id: `recPending${index}`, fields: { ...inRound, fldWVKY5EFAGSRcDT: 'Accept' } })),
    });
    fetchMock.mockResolvedValueOnce(new Response(manyPending));
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ records: [] })));
    expect(await flagDecisionEmails('recRound')).toEqual({ flagged: 11 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(bodyAt(1).records).toHaveLength(10);
    expect(bodyAt(2).records).toHaveLength(1);
  });

  test('rejects failed flag writes so the UI does not report success', async () => {
    fetchMock.mockResolvedValueOnce(new Response(reviewedRecords));
    fetchMock.mockResolvedValue(new Response('{}', { status: 403 }));
    await expect(flagDecisionEmails('recRound')).rejects.toMatchObject({ statusCode: 503, expose: true, message: expect.stringContaining('write access') });
  });
});
