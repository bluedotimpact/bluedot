import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';

vi.mock('./env', () => ({ default: { AIRTABLE_PERSONAL_ACCESS_TOKEN: 'test-airtable-credential' } }));

import { logger } from '@bluedot/ui/src/api';
import {
  fetchApplications, fetchRounds, writeOpinions, resetOpinion, moveApplicationToCourse, undoMoveToCourse,
  fetchDecisionEmailCounts, flagDecisionEmails, fetchFilterOptions,
} from './airtable';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_LOCAL_PREVIEW', 'false');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
  // Requests a test doesn't set up (such as the tile config read) see an empty table.
  fetchMock.mockImplementation(async () => new Response(JSON.stringify({ records: [] })));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const bodyAt = (index: number) => JSON.parse(fetchMock.mock.calls[index]?.[1]?.body as string);

describe('real-data Airtable adapter', () => {
  test('loads and maps the selected round from Airtable rather than sample records', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({
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

  test('serves unscored applications after the scored queue is exhausted', async () => {
    // Scored phase: one match, no further pages; unscored phase: one match.
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      records: [{
        id: 'recScored', fields: {
          fldYaHSLqnvBXyjur: ['recLiveRound'], fld1rOZGAHBRcdJcM: 'Scored applicant', fldEPZ0UfYoypB1mp: 9, fldRXdZQ0rnuVOcl7: 'Summary',
        },
      }],
    })));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      records: [{ id: 'recUnscored', fields: { fldYaHSLqnvBXyjur: ['recLiveRound'], fld1rOZGAHBRcdJcM: 'Unscored applicant' } }],
    })));
    const result = await fetchApplications('recLiveRound');
    expect(result.applications.map((a) => a.name)).toEqual(['Scored applicant', 'Unscored applicant']);
    expect(result.nextOffset).toBeUndefined();

    const scoredRequest = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(scoredRequest.searchParams.get('filterByFormula')).toContain('{fldEPZ0UfYoypB1mp} != BLANK()');
    expect(scoredRequest.searchParams.get('sort[0][field]')).toBe('fldEPZ0UfYoypB1mp');
    const unscoredRequest = new URL(fetchMock.mock.calls[1]?.[0] as string);
    expect(unscoredRequest.searchParams.get('filterByFormula')).toContain('OR({fldRXdZQ0rnuVOcl7} = "", {fldEPZ0UfYoypB1mp} = BLANK())');
    expect(unscoredRequest.searchParams.get('sort[0][field]')).toBeNull();
  });

  test('a scored page that fills exactly hands the phase switch to the next request', async () => {
    // 20 scored matches (one response page) and no further Airtable offset.
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      records: Array.from({ length: 20 }, (_, index) => ({
        id: `recScored${index}`,
        fields: {
          fldYaHSLqnvBXyjur: ['recLiveRound'], fld1rOZGAHBRcdJcM: `Applicant ${index}`, fldEPZ0UfYoypB1mp: index, fldRXdZQ0rnuVOcl7: 'Summary',
        },
      })),
    })));
    const firstPage = await fetchApplications('recLiveRound');
    expect(firstPage.applications).toHaveLength(20);
    expect(firstPage.nextOffset).toBe('unscored:');

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      records: [{ id: 'recUnscored', fields: { fldYaHSLqnvBXyjur: ['recLiveRound'], fld1rOZGAHBRcdJcM: 'Unscored applicant' } }],
    })));
    const secondPage = await fetchApplications('recLiveRound', firstPage.nextOffset);
    expect(secondPage.applications.map((a) => a.name)).toEqual(['Unscored applicant']);
    const request = fetchMock.mock.calls.map(([input]) => new URL(input as string)).filter((url) => url.pathname.endsWith('/tblXKnWoXK3R63F6D'))[1]!;
    expect(request.searchParams.get('filterByFormula')).toContain('OR({fldRXdZQ0rnuVOcl7} = "", {fldEPZ0UfYoypB1mp} = BLANK())');
    expect(request.searchParams.get('offset')).toBeNull();
  });

  test('an unscored-phase offset resumes the unscored query', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [] })));
    await fetchApplications('recLiveRound', 'unscored:itrToken/recCursor');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(request.searchParams.get('filterByFormula')).toContain('OR({fldRXdZQ0rnuVOcl7} = "", {fldEPZ0UfYoypB1mp} = BLANK())');
    expect(request.searchParams.get('offset')).toBe('itrToken/recCursor');
  });

  test('filters applications to the selected round inside the Airtable query', async () => {
    fetchMock.mockImplementation(async () => new Response(JSON.stringify({ records: [] })));
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

  const roundNamed = (name: string) => JSON.stringify({ records: [{ id: 'recRound', fields: { fldvOk9j9FbDV5aLl: name } }] });

  test('moves course, round, and derived course link in one write after verifying the round', async () => {
    fetchMock.mockResolvedValueOnce(new Response(roundNamed('AGI Strategy (2026 Nov W48) - Intensive')));
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ records: [] })));
    await moveApplicationToCourse('recTest', 'recNewRound', 'AGI Strategy');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodyAt(1).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'AGI Strategy', fldYaHSLqnvBXyjur: ['recNewRound'], fldPkqPbeoIhERqSY: [] },
    }]);
  });

  test('refuses a move whose round belongs to a different course', async () => {
    fetchMock.mockResolvedValueOnce(new Response(roundNamed('Technical AI Safety Project (2026 Nov W47) - Part-time')));
    await expect(moveApplicationToCourse('recTest', 'recNewRound', 'Technical AI Safety')).rejects.toMatchObject({ statusCode: 400, expose: true, message: expect.stringContaining('not a Technical AI Safety round') });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('moves a project-round application to Technical AI Safety and undoes it back', async () => {
    fetchMock.mockResolvedValueOnce(new Response(roundNamed('Technical AI Safety (2026 Oct W44) - Part-time')));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [] })));
    await moveApplicationToCourse('recTest', 'recTaisRound', 'Technical AI Safety');
    expect(bodyAt(1).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety', fldYaHSLqnvBXyjur: ['recTaisRound'], fldPkqPbeoIhERqSY: [] },
    }]);

    fetchMock.mockResolvedValueOnce(new Response(roundNamed('Technical AI Safety Project (2026 Nov W47) - Part-time')));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [{ id: 'recTest', fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety' } }] })));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [] })));
    await undoMoveToCourse('recTest', 'recProjectRound', 'Technical AI Safety', 'Technical AI Safety Project');
    expect(bodyAt(4).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety Project', fldYaHSLqnvBXyjur: ['recProjectRound'], fldPkqPbeoIhERqSY: [] },
    }]);
  });

  test('does not clear the course link when the course move fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response(roundNamed('AGI Strategy (2026 Nov W48) - Intensive')));
    fetchMock.mockResolvedValue(new Response('{}', { status: 403 }));
    await expect(moveApplicationToCourse('recTest', 'recNewRound', 'AGI Strategy')).rejects.toMatchObject({ statusCode: 503, expose: true, message: expect.stringContaining('write access') });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  const movedRecord = JSON.stringify({ records: [{ id: 'recTest', fields: { fldkEQ0zBUhqpIuJn: 'AGI Strategy' } }] });
  const taisRound = 'Technical AI Safety (2026 Oct W44) - Part-time';

  test('undoing a move restores course, round, and derived course link in one write', async () => {
    fetchMock.mockResolvedValueOnce(new Response(roundNamed(taisRound)));
    fetchMock.mockResolvedValueOnce(new Response(movedRecord));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [] })));
    await undoMoveToCourse('recTest', 'recOriginalRound', 'AGI Strategy', 'Technical AI Safety');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(bodyAt(2).records).toEqual([{
      id: 'recTest',
      fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety', fldYaHSLqnvBXyjur: ['recOriginalRound'], fldPkqPbeoIhERqSY: [] },
    }]);
  });

  test('refuses to undo an application that is not currently in AGI Strategy', async () => {
    fetchMock.mockResolvedValueOnce(new Response(roundNamed(taisRound)));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ records: [{ id: 'recTest', fields: { fldkEQ0zBUhqpIuJn: 'Technical AI Safety' } }] })));
    await expect(undoMoveToCourse('recTest', 'recOriginalRound', 'AGI Strategy', 'Technical AI Safety')).rejects.toMatchObject({ statusCode: 409, expose: true, message: expect.stringContaining('not currently moved') });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test('rejects a failed undo so the UI keeps the application in the moved list', async () => {
    fetchMock.mockResolvedValueOnce(new Response(roundNamed(taisRound)));
    fetchMock.mockResolvedValueOnce(new Response(movedRecord));
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 403 }));
    await expect(undoMoveToCourse('recTest', 'recOriginalRound', 'AGI Strategy', 'Technical AI Safety')).rejects.toMatchObject({ statusCode: 503, expose: true, message: expect.stringContaining('write access') });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe('queue filters', () => {
  // The unfiltered formulas as they were before queue filters existed.
  const SCORED_FORMULA = 'AND(FIND("recLiveRound", {fldrmNLS764z8WEbR} & ""), AND({fldWVKY5EFAGSRcDT} = "", SEARCH("Participant", {fld7fzQNFhb7Oyy90}), NOT({fld1KQjHFGoDZKf94}), {fldRXdZQ0rnuVOcl7} != "", {fldEPZ0UfYoypB1mp} != BLANK()))';
  const UNSCORED_FORMULA = 'AND(FIND("recLiveRound", {fldrmNLS764z8WEbR} & ""), AND({fldWVKY5EFAGSRcDT} = "", SEARCH("Participant", {fld7fzQNFhb7Oyy90}), NOT({fld1KQjHFGoDZKf94}), OR({fldRXdZQ0rnuVOcl7} = "", {fldEPZ0UfYoypB1mp} = BLANK())))';
  const withQueueFilter = (formula: string, queueFilter: string) => `${formula.slice(0, -1)}, ${queueFilter})`;

  const configRow = (id: string, label: string, fieldId: string, matchType: string, value?: string, extra: Record<string, unknown> = {}) => ({
    id,
    fields: {
      flduOM83yebFthjm2: label, fldBal237GLenUbp0: fieldId, fldh5gt8w7cIHLfAO: matchType, ...(value === undefined ? {} : { fldZlRJXr9bUtOS4y: value }), ...extra,
    },
  });
  const configRows = [
    configRow('recSampleTicked', 'Sample filter A', 'fldSampleTarget01', 'Checkbox is ticked'),
    configRow('recSampleValue', 'Sample filter B', 'fldSampleTarget02', 'Has value', 'Sample "quoted" \\ value'),
    configRow('recSampleNumber', 'Sample filter C', 'fldSampleTarget03', 'Number is at least', ' 2.5 '),
    configRow('recSampleBadField', 'Sample filter D', 'fldTooShort', 'Checkbox is ticked'),
    configRow('recSampleBadType', 'Sample filter E', 'fldSampleTarget01', 'Sample unknown type'),
    configRow('recSampleNoValue', 'Sample filter F', 'fldSampleTarget02', 'Has value', ''),
    configRow('recSampleNotNumber', 'Sample filter G', 'fldSampleTarget03', 'Number is at least', 'not a number'),
  ];

  beforeEach(() => {
    fetchMock.mockImplementation(async (input) => new Response(JSON.stringify({
      records: (input as string).includes('/tblqMbr9KxusIrWA6') ? configRows : [],
    })));
  });

  const formulas = () => fetchMock.mock.calls
    .map(([input]) => new URL(input as string))
    .filter((request) => request.pathname.endsWith('/tblXKnWoXK3R63F6D'))
    .map((request) => request.searchParams.get('filterByFormula'));

  test('offers enabled, well-formed options in Airtable order with only their record ID and label', async () => {
    expect(await fetchFilterOptions()).toEqual([
      { id: 'recSampleTicked', label: 'Sample filter A' },
      { id: 'recSampleValue', label: 'Sample filter B' },
      { id: 'recSampleNumber', label: 'Sample filter C' },
    ]);
    const request = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(request.pathname).toBe('/v0/appnJbsG1eWbAdEvf/tblqMbr9KxusIrWA6');
    expect(request.searchParams.get('filterByFormula')).toBe('{fldf5DndPnkmoE732}');
    expect(request.searchParams.get('sort[0][field]')).toBe('fldMt36keyZHntBDL');
    expect(request.searchParams.get('sort[0][direction]')).toBe('asc');
  });

  test('no filters leaves both round formulas byte-for-byte unchanged', async () => {
    await fetchApplications('recLiveRound');
    await fetchApplications('recLiveRound', undefined, 'top', { optionIds: [], mode: 'all' });
    expect(formulas()).toEqual([SCORED_FORMULA, UNSCORED_FORMULA, SCORED_FORMULA, UNSCORED_FORMULA]);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  test('a checkbox option is ANDed into both the scored and unscored round filters', async () => {
    await fetchApplications('recLiveRound', undefined, 'top', { optionIds: ['recSampleTicked'], mode: 'any' });
    expect(formulas()).toEqual([
      withQueueFilter(SCORED_FORMULA, 'OR({fldSampleTarget01})'),
      withQueueFilter(UNSCORED_FORMULA, 'OR({fldSampleTarget01})'),
    ]);
  });

  test('a has-value option escapes backslashes and quotes in its value', async () => {
    await fetchApplications('recLiveRound', undefined, 'top', { optionIds: ['recSampleValue'], mode: 'any' });
    expect(formulas()[0]).toBe(withQueueFilter(SCORED_FORMULA, 'OR(FIND("Sample \\"quoted\\" \\\\ value", {fldSampleTarget02} & ""))'));
  });

  test('a number option writes the parsed threshold as a numeric literal', async () => {
    await fetchApplications('recLiveRound', undefined, 'top', { optionIds: ['recSampleNumber'], mode: 'any' });
    expect(formulas()[0]).toBe(withQueueFilter(SCORED_FORMULA, 'OR({fldSampleTarget03} >= 2.5)'));
  });

  test('any combines options with OR, all with AND, in the same order however they were sent', async () => {
    await fetchApplications('recLiveRound', undefined, 'top', { optionIds: ['recSampleTicked', 'recSampleNumber'], mode: 'any' });
    await fetchApplications('recLiveRound', undefined, 'top', { optionIds: ['recSampleNumber', 'recSampleTicked'], mode: 'all' });
    const [anyScored, , allScored] = formulas();
    expect(anyScored).toBe(withQueueFilter(SCORED_FORMULA, 'OR({fldSampleTarget03} >= 2.5, {fldSampleTarget01})'));
    expect(allScored).toBe(withQueueFilter(SCORED_FORMULA, 'AND({fldSampleTarget03} >= 2.5, {fldSampleTarget01})'));
  });

  test('a filtered unscored-phase offset resumes with the same filter', async () => {
    await fetchApplications('recLiveRound', 'unscored:itrToken/recCursor', 'top', { optionIds: ['recSampleTicked'], mode: 'any' });
    const request = new URL(fetchMock.mock.calls[1]?.[0] as string);
    expect(request.searchParams.get('filterByFormula')).toBe(withQueueFilter(UNSCORED_FORMULA, 'OR({fldSampleTarget01})'));
    expect(request.searchParams.get('offset')).toBe('itrToken/recCursor');
  });

  test.each([
    ['an unknown option', 'recSampleUnknown'],
    ['an option with a malformed field ID', 'recSampleBadField'],
    ['an option with an unknown match type', 'recSampleBadType'],
    ['a has-value option without a value', 'recSampleNoValue'],
    ['a number option whose value is not a number', 'recSampleNotNumber'],
  ])('rejects %s without querying applications', async (_, optionId) => {
    await expect(fetchApplications('recLiveRound', undefined, 'top', { optionIds: ['recSampleTicked', optionId], mode: 'any' }))
      .rejects.toMatchObject({ statusCode: 400, expose: true });
    expect(formulas()).toEqual([]);
  });

  describe('tiles', () => {
    const tileConfig = [
      configRow('recSampleTileA', 'Sample filter A', 'fldSampleTarget01', 'Checkbox is ticked', undefined, { fldMnS4j40MkMRmsl: true, fldZj8C8XDVpTR8qh: 'Caution' }),
      configRow('recSampleTileB', 'Sample filter B', 'fldSampleTarget02', 'Has value', 'Sample value', { fldMnS4j40MkMRmsl: true, fldZj8C8XDVpTR8qh: 'Positive' }),
      configRow('recSampleTileC', 'Sample filter C', 'fldSampleTarget03', 'Number is at least', '2.5', { fldMnS4j40MkMRmsl: true }),
      configRow('recSampleFilterOnly', 'Sample filter D', 'fldSampleTarget04', 'Checkbox is ticked'),
    ];
    const inRound = (id: string, name: string) => ({ id, fields: { fldYaHSLqnvBXyjur: ['recLiveRound'], fld1rOZGAHBRcdJcM: name } });
    const tileValues = [
      { id: 'recApplicantOne', fields: { fldSampleTarget01: true, fldSampleTarget02: ['Sample other', 'Sample value'], fldSampleTarget03: 3 } },
      { id: 'recApplicantTwo', fields: { fldSampleTarget02: 'Sample other', fldSampleTarget03: 2 } },
    ];
    const isTileValuesRequest = (url: URL) => url.searchParams.get('filterByFormula')?.startsWith('OR(RECORD_ID()') ?? false;

    beforeEach(() => {
      vi.spyOn(logger, 'warn').mockImplementation(() => logger);
      fetchMock.mockImplementation(async (input) => {
        const url = new URL(input as string);
        if (url.pathname.endsWith('/tblqMbr9KxusIrWA6')) return new Response(JSON.stringify({ records: tileConfig }));
        if (isTileValuesRequest(url)) return new Response(JSON.stringify({ records: tileValues }));
        return new Response(JSON.stringify({ records: [inRound('recApplicantOne', 'First applicant'), inRound('recApplicantTwo', 'Second applicant')] }));
      });
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const requests = () => fetchMock.mock.calls.map(([input]) => new URL(input as string));

    test('each application gets its matching tile options as label and tone only', async () => {
      const result = await fetchApplications('recLiveRound');
      expect(result.applications.map((application) => application.tiles)).toEqual([
        [
          { id: 'recSampleTileA', label: 'Sample filter A', tone: 'caution' },
          { id: 'recSampleTileB', label: 'Sample filter B', tone: 'positive' },
          { id: 'recSampleTileC', label: 'Sample filter C', tone: 'neutral' },
        ],
        undefined,
      ]);

      const valuesRequest = requests().find(isTileValuesRequest)!;
      expect(valuesRequest.searchParams.get('filterByFormula')).toBe('OR(RECORD_ID() = "recApplicantOne", RECORD_ID() = "recApplicantTwo")');
      // Only tile options' fields are read; the filter-only option's is not.
      expect(valuesRequest.searchParams.getAll('fields[]')).toEqual(['fldSampleTarget01', 'fldSampleTarget02', 'fldSampleTarget03']);

      // The queue request itself is unchanged, and no field value reaches the response.
      const queueRequest = requests().find((url) => url.pathname.endsWith('/tblXKnWoXK3R63F6D'))!;
      expect(queueRequest.searchParams.get('filterByFormula')).toBe(SCORED_FORMULA);
      expect(queueRequest.searchParams.getAll('fields[]').some((field) => field.startsWith('fldSampleTarget'))).toBe(false);
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain('fldSampleTarget');
      expect(serialized).not.toContain('Sample other');
    });

    test('a failure working out tiles still loads the queue, without tiles', async () => {
      fetchMock.mockImplementation(async (input) => {
        const url = new URL(input as string);
        if (url.pathname.endsWith('/tblqMbr9KxusIrWA6')) return new Response('{}', { status: 500 });
        return new Response(JSON.stringify({ records: [inRound('recApplicantOne', 'First applicant')] }));
      });
      const result = await fetchApplications('recLiveRound');
      expect(result.applications).toEqual([expect.objectContaining({ id: 'recApplicantOne' })]);
      expect(result.applications[0]!.tiles).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('could not work out tiles'));
    });

    test('logs, by ID only, a filtered application the tile evaluation would not have matched', async () => {
      await fetchApplications('recLiveRound', undefined, 'top', { optionIds: ['recSampleFilterOnly'], mode: 'any' });
      const valuesRequest = requests().find(isTileValuesRequest)!;
      expect(valuesRequest.searchParams.getAll('fields[]')).toContain('fldSampleTarget04');
      const messages = vi.mocked(logger.warn).mock.calls.map(([message]) => (typeof message === 'string' ? message : ''));
      expect(messages).toEqual([
        expect.stringContaining('recApplicantOne'),
        expect.stringContaining('recApplicantTwo'),
      ]);
      expect(messages.every((message) => message.includes('recSampleFilterOnly') && !message.includes('fldSampleTarget'))).toBe(true);
    });
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
      reviewed: 5, alreadySent: 2, confirmedSent: 1, pending: 3, pendingAccepted: 2, pendingRejected: 1,
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
