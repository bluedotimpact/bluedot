import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { courseTable } from '@bluedot/db';
import { addUsageMarker, removeUsageMarker, syncFieldUsageMarkers } from './field-usage-markers';

vi.mock('@bluedot/utils/src/slackNotifications', () => ({ slackAlert: vi.fn() }));
vi.mock('./pg-sync', () => ({ rateLimiter: { acquire: vi.fn() } }));

const TODAY = '2026-09-10';
const MARKER = `Consider deletion on: Never (used in code as of ${TODAY})`;

describe('addUsageMarker', () => {
  test('given an empty description, returns just the marker', () => {
    expect(addUsageMarker('', TODAY)).toBe(MARKER);
  });

  test('given a description without a deletion line, appends the marker on its own line', () => {
    expect(addUsageMarker('Owner: someone@bluedot.org\n\nDescription: Thing.\n', TODAY))
      .toBe(`Owner: someone@bluedot.org\n\nDescription: Thing.\n${MARKER}`);
  });

  test('given an existing human deletion line, replaces it in place', () => {
    expect(addUsageMarker('Description: Thing.\n\nLast reviewed: 2024-06-17\nConsider deletion on: 2025-01-01 ', TODAY))
      .toBe(`Description: Thing.\n\nLast reviewed: 2024-06-17\n${MARKER}`);
  });

  test('given today\'s marker, leaves the description untouched', () => {
    const description = `Description: Thing.\n${MARKER}`;
    expect(addUsageMarker(description, TODAY)).toBe(description);
  });

  test('given an older marker, refreshes the date', () => {
    expect(addUsageMarker('Description: Thing.\nConsider deletion on: Never (used in code as of 2026-09-09)', TODAY))
      .toBe(`Description: Thing.\n${MARKER}`);
  });
});

describe('removeUsageMarker', () => {
  test('given a description ending in the marker, removes only that line', () => {
    expect(removeUsageMarker(`Owner: someone@bluedot.org\n\nDescription: Thing.\n${MARKER}`)).toBe('Owner: someone@bluedot.org\n\nDescription: Thing.');
  });

  test('given only the marker, returns an empty description', () => {
    expect(removeUsageMarker(MARKER)).toBe('');
  });

  test('given a human deletion line, leaves it alone', () => {
    const description = 'Description: Thing.\nConsider deletion on: Never';
    expect(removeUsageMarker(description)).toBe(description);
  });

  test('given untidy whitespace but no marker, leaves it alone', () => {
    const description = '\n\n\nDescription: Thing.\n\n\n';
    expect(removeUsageMarker(description)).toBe(description);
  });
});

describe('syncFieldUsageMarkers', () => {
  const { baseId, tableId } = courseTable.airtable;
  const fieldIdsInSchema = [...courseTable.airtableFieldMap.values()].slice(0, 8);
  const fieldUrl = (fieldId: string) => `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${tableId}/fields/${fieldId}`;
  let descriptions: Record<string, string>;
  let patches: { url: string; description: string }[];
  let listRequests: number;
  let failingUrls: RegExp | undefined;
  let listResponse: () => Response;

  beforeEach(() => {
    descriptions = {
      [fieldIdsInSchema[0]!]: 'Description: Course title.',
      fldRemovedFromSchema: `Description: Gone from schema.\n${MARKER}`,
      fldNeverInSchema: 'Consider deletion on: Never',
    };
    patches = [];
    listRequests = 0;
    failingUrls = undefined;
    listResponse = () => Response.json({
      tables: [{
        id: tableId,
        name: 'Course',
        fields: [...fieldIdsInSchema, 'fldRemovedFromSchema', 'fldNeverInSchema'].map((id) => ({ id, name: id, description: descriptions[id] })),
      }],
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = input instanceof Request ? input.url : input.toString();
      if (failingUrls?.test(url)) return new Response('nope', { status: 403 });
      if (init?.method === 'PATCH') {
        const { description } = JSON.parse(init.body as string) as { description: string };
        descriptions[url.split('/').pop()!] = description;
        patches.push({ url, description });
        return Response.json({});
      }

      // Other bases in the schema are empty in this fixture
      if (!url.includes(`/bases/${baseId}/tables`)) return Response.json({ tables: [] });
      listRequests += 1;
      return listResponse();
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(slackAlert).mockClear();
  });

  test('marks fields in the schema, unmarks fields that left it, and ignores everything else', async () => {
    const result = await syncFieldUsageMarkers(TODAY);

    expect(result).toEqual({ updated: fieldIdsInSchema.length + 1, failures: [] });
    expect(patches).toContainEqual({ url: fieldUrl(fieldIdsInSchema[0]!), description: `Description: Course title.\n${MARKER}` });
    expect(patches).toContainEqual({ url: fieldUrl(fieldIdsInSchema[1]!), description: MARKER });
    expect(patches).toContainEqual({ url: fieldUrl('fldRemovedFromSchema'), description: 'Description: Gone from schema.' });
    expect(patches.map((p) => p.url)).not.toContain(fieldUrl('fldNeverInSchema'));
    expect(slackAlert).not.toHaveBeenCalled();
  });

  test('re-reads the base after writing, and stops once nothing is left to change', async () => {
    await syncFieldUsageMarkers(TODAY);

    expect(listRequests).toBe(2);
  });

  test('given a second run on the same day, reads but writes nothing', async () => {
    await syncFieldUsageMarkers(TODAY);
    patches = [];
    listRequests = 0;

    const result = await syncFieldUsageMarkers(TODAY);

    expect(result).toEqual({ updated: 0, failures: [] });
    expect(patches).toEqual([]);
    expect(listRequests).toBe(1);
  });

  test('given a run on a later day, rewrites the date on every marked field', async () => {
    await syncFieldUsageMarkers(TODAY);
    patches = [];

    const result = await syncFieldUsageMarkers('2026-09-11');

    expect(result).toEqual({ updated: fieldIdsInSchema.length, failures: [] });
    expect(patches[0]!.description).toContain('used in code as of 2026-09-11');
  });

  test('given a base the token cannot read, reports it to Slack and still processes the others', async () => {
    failingUrls = new RegExp(`/bases/${baseId}/tables$`);

    const result = await syncFieldUsageMarkers(TODAY);

    expect(result).toEqual({ updated: 0, failures: [`list base ${baseId}: HTTP 403`] });
    expect(slackAlert).toHaveBeenCalledTimes(1);
    expect(vi.mocked(slackAlert).mock.calls[0]![1][0]).toContain('HTTP 403');
  });

  test('given one field that cannot be updated, continues with the remaining fields', async () => {
    failingUrls = new RegExp(`/fields/${fieldIdsInSchema[0]}$`);

    const result = await syncFieldUsageMarkers(TODAY);

    expect(result).toEqual({ updated: fieldIdsInSchema.length, failures: [`update Course / ${fieldIdsInSchema[0]}: HTTP 403`] });
    expect(slackAlert).toHaveBeenCalledTimes(1);
  });

  test('given every update failing, stops after a few consecutive failures', async () => {
    failingUrls = /\/fields\//;

    const result = await syncFieldUsageMarkers(TODAY);

    expect(result.updated).toBe(0);
    expect(result.failures).toHaveLength(6);
    expect(result.failures.at(-1)).toBe('Stopped after 5 consecutive failures');
    expect(slackAlert).toHaveBeenCalledTimes(1);
  });

  test('given an unexpected response shape, resolves with a failure instead of throwing', async () => {
    listResponse = () => Response.json({ tables: [{ id: tableId, name: 'Course' }] });

    const result = await syncFieldUsageMarkers(TODAY);

    expect(result.updated).toBe(0);
    expect(result.failures).toHaveLength(1);
    expect(slackAlert).toHaveBeenCalledTimes(1);
  });
});
