import {
  afterAll, afterEach, beforeAll, beforeEach, describe, expect, test, vi,
} from 'vitest';
// eslint-disable-next-line import/no-extraneous-dependencies -- hoisted from apps/storybook, as in apps/website tests
import { http, HttpResponse } from 'msw';
// eslint-disable-next-line import/no-extraneous-dependencies
import { setupServer } from 'msw/node';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { courseTable, PgAirtableTable } from '@bluedot/db';
import * as schema from '@bluedot/db/src/schema';
import {
  addUsageMarker, removeUsageMarker, syncFieldUsageMarkers, USAGE_MARKER,
} from './field-usage-markers';

vi.mock('@bluedot/utils/src/slackNotifications', () => ({ slackAlert: vi.fn() }));

describe('addUsageMarker', () => {
  test('given an empty description, returns just the marker', () => {
    expect(addUsageMarker('')).toBe(USAGE_MARKER);
  });

  test('given a description without a deletion line, appends the marker on its own line', () => {
    expect(addUsageMarker('Owner: someone@bluedot.org\n\nDescription: Thing.\n'))
      .toBe(`Owner: someone@bluedot.org\n\nDescription: Thing.\n${USAGE_MARKER}`);
  });

  test('given an existing deletion line, replaces it in place', () => {
    expect(addUsageMarker('Description: Thing.\n\nLast reviewed on: 2024-06-17\nConsider deletion on: 2025-01-01 '))
      .toBe(`Description: Thing.\n\nLast reviewed on: 2024-06-17\n${USAGE_MARKER}`);
  });

  test('given an already marked description, returns it unchanged', () => {
    const description = `Description: Thing.\n${USAGE_MARKER}`;
    expect(addUsageMarker(description)).toBe(description);
  });
});

describe('removeUsageMarker', () => {
  test('given a description ending in the marker, removes only that line', () => {
    expect(removeUsageMarker(`Owner: someone@bluedot.org\n\nDescription: Thing.\n${USAGE_MARKER}`))
      .toBe('Owner: someone@bluedot.org\n\nDescription: Thing.');
  });

  test('given only the marker, returns an empty description', () => {
    expect(removeUsageMarker(USAGE_MARKER)).toBe('');
  });

  test('given a human deletion line, leaves it alone', () => {
    const description = 'Description: Thing.\nConsider deletion on: Never';
    expect(removeUsageMarker(description)).toBe(description);
  });

  test('given untidy whitespace but no marker, returns it identical', () => {
    const description = '\n\n\nDescription: Thing.  \n\n\n';
    expect(removeUsageMarker(description)).toBe(description);
  });
});

describe('syncFieldUsageMarkers', () => {
  const META_URL = 'https://api.airtable.com/v0/meta/bases';
  const { baseId, tableId } = courseTable.airtable;
  const schemaFieldIds = [...courseTable.airtableFieldMap.values()];
  if (schemaFieldIds.length < 6) throw new Error('These tests need at least 6 columns on courseTable');
  const [fieldA, fieldB, ...moreSchemaFields] = schemaFieldIds as [string, string, ...string[]];
  const allBaseIds = new Set(Object.values(schema).filter((table) => table instanceof PgAirtableTable).map((table) => table.airtable.baseId));
  const fieldUrl = (fieldId: string) => `${META_URL}/${baseId}/tables/${tableId}/fields/${fieldId}`;

  const server = setupServer();
  let descriptions: Map<string, string>;
  let listedBaseIds: Set<string>;
  let patchCount: number;

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    descriptions = new Map([
      [fieldA, 'Description: Course title.'],
      [fieldB, ''],
      ['fldRemovedFromSchema', `Description: Gone from schema.\n${USAGE_MARKER}`],
      ['fldNeverInSchema', 'Description: Human-owned.\nConsider deletion on: Never'],
    ]);
    listedBaseIds = new Set();
    patchCount = 0;
    vi.mocked(slackAlert).mockClear();

    server.use(
      http.get(`${META_URL}/:baseId/tables`, ({ params }) => {
        listedBaseIds.add(params.baseId as string);
        if (params.baseId !== baseId) return HttpResponse.json({ tables: [] });
        const fields = [...descriptions].map(([id, description]) => ({ id, name: `Field ${id}`, ...(description ? { description } : {}) }));
        return HttpResponse.json({ tables: [{ id: tableId, name: 'Course', fields }] });
      }),
      http.patch(fieldUrl(':fieldId'), async ({ params, request }) => {
        patchCount += 1;
        const { description } = await request.json() as { description: string };
        descriptions.set(params.fieldId as string, description);
        return HttpResponse.json({ id: params.fieldId });
      }),
    );
  });

  test('given fields in and out of the schema, marks the used ones and unmarks the rest', async () => {
    const result = await syncFieldUsageMarkers();

    expect(result).toEqual({ updated: 3, failures: [] });
    expect(descriptions.get(fieldA)).toBe(`Description: Course title.\n${USAGE_MARKER}`);
    expect(descriptions.get(fieldB)).toBe(USAGE_MARKER);
    expect(descriptions.get('fldRemovedFromSchema')).toBe('Description: Gone from schema.');
    expect(descriptions.get('fldNeverInSchema')).toBe('Description: Human-owned.\nConsider deletion on: Never');
    expect(listedBaseIds).toEqual(allBaseIds);
    expect(slackAlert).not.toHaveBeenCalled();
  });

  test('given descriptions already in sync, makes no PATCH requests', async () => {
    await syncFieldUsageMarkers();
    expect(patchCount).toBe(3);

    const result = await syncFieldUsageMarkers();

    expect(result).toEqual({ updated: 0, failures: [] });
    expect(patchCount).toBe(3);
  }, 15_000);

  test('given a base that cannot be listed, reports it and continues with the other bases', async () => {
    server.use(http.get(`${META_URL}/${baseId}/tables`, () => new HttpResponse(null, { status: 403 })));

    const result = await syncFieldUsageMarkers();

    expect(result).toEqual({ updated: 0, failures: [`list base ${baseId}: HTTP 403`] });
    expect(listedBaseIds.size).toBe(allBaseIds.size - 1);
    expect(slackAlert).toHaveBeenCalledTimes(1);
    expect(vi.mocked(slackAlert).mock.calls[0]![1][0]).toBe(`[field-usage-markers] 1 failure(s) updating Airtable field descriptions:\nlist base ${baseId}: HTTP 403`);
  });

  test('given one field that cannot be updated, reports it and still updates the others', async () => {
    server.use(http.patch(fieldUrl(fieldA), () => new HttpResponse(null, { status: 403 })));

    const result = await syncFieldUsageMarkers();

    expect(result).toEqual({ updated: 2, failures: [`update Course / Field ${fieldA}: HTTP 403`] });
    expect(descriptions.get(fieldA)).toBe('Description: Course title.');
    expect(descriptions.get(fieldB)).toBe(USAGE_MARKER);
    expect(descriptions.get('fldRemovedFromSchema')).toBe('Description: Gone from schema.');
    expect(slackAlert).toHaveBeenCalledTimes(1);
  });

  test('given every update failing, stops after 5 failures', async () => {
    for (const fieldId of moreSchemaFields.slice(0, 4)) descriptions.set(fieldId, '');
    server.use(http.patch(fieldUrl(':fieldId'), () => new HttpResponse(null, { status: 403 })));

    const result = await syncFieldUsageMarkers();

    expect(result.updated).toBe(0);
    expect(result.failures).toHaveLength(6);
    expect(result.failures.slice(0, 5).every((failure) => failure.startsWith('update Course / Field fld') && failure.endsWith(': HTTP 403'))).toBe(true);
    expect(result.failures[5]).toBe('Stopped after 5 failures');
    expect(slackAlert).toHaveBeenCalledTimes(1);
  });

  test('given a malformed response body, resolves with a failure instead of rejecting', async () => {
    server.use(http.get(`${META_URL}/${baseId}/tables`, () => HttpResponse.text('not json')));

    const result = await syncFieldUsageMarkers();

    expect(result.updated).toBe(0);
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toMatch(new RegExp(`^list base ${baseId}: `));
    expect(slackAlert).toHaveBeenCalledTimes(1);
  });
});
