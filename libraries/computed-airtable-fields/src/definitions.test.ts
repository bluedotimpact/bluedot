import {
  createTestDbClients,
  exerciseResponseTable,
  exerciseTable,
  PgAirtableDb,
  pushTestSchema,
  RESOURCE_FEEDBACK,
  resourceCompletionTable,
  resourceTable,
  resetTestDb,
  type TestPgAirtableDb,
} from '@bluedot/db';
import {
  beforeAll, beforeEach, describe, expect, test,
} from 'vitest';
import { computedAirtableFieldDefinitions } from './definitions';

let db: PgAirtableDb;
let testDb: TestPgAirtableDb;

beforeAll(async () => {
  const { pgClient, airtableClient } = createTestDbClients();
  db = new PgAirtableDb({
    pgConnString: 'unused',
    airtableApiKey: 'unused',
    pgClient,
    airtableClient,
  });
  testDb = db as unknown as TestPgAirtableDb;
  await pushTestSchema(db);
});

beforeEach(async () => resetTestDb(db));

// Look up a registered compute fn by its (table, field) — keeps tests honest about what's actually wired up.
function getComputeFn(table: typeof exerciseTable | typeof resourceTable, field: string) {
  const group = computedAirtableFieldDefinitions.find((g) => g.table === table);
  if (!group) throw new Error('No group registered for table');
  const fn = group.fields[field];
  if (!fn) throw new Error(`No compute fn registered for ${field}`);
  return fn;
}

describe('exercise.computedNumResponses', () => {
  const compute = () => getComputeFn(exerciseTable, 'computedNumResponses');

  test('counts only completed responses, scoped to the target ids', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1' });
    await testDb.insert(exerciseTable, { id: 'ex-2' });
    await testDb.insert(exerciseTable, { id: 'ex-other' });
    // ex-1: 2 completed, 1 in-progress → 2
    await testDb.insert(exerciseResponseTable, {
      id: 'r1', email: 'a@x', exerciseId: 'ex-1', response: '', completedAt: '2026-01-01',
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'r2', email: 'b@x', exerciseId: 'ex-1', response: '', completedAt: '2026-01-02',
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'r3', email: 'c@x', exerciseId: 'ex-1', response: '', completedAt: null,
    });
    // ex-2: 0 completed → 0
    // ex-other not in input → not in output
    await testDb.insert(exerciseResponseTable, {
      id: 'r4', email: 'd@x', exerciseId: 'ex-other', response: '', completedAt: '2026-01-03',
    });

    const result = await compute()(db, ['ex-1', 'ex-2']);
    expect(result).toEqual({ 'ex-1': 2, 'ex-2': 0 });
  });

  test('empty target list returns empty object', async () => {
    const result = await compute()(db, []);
    expect(result).toEqual({});
  });
});

describe('resource.computedNumCompletions', () => {
  const compute = () => getComputeFn(resourceTable, 'computedNumCompletions');

  test('counts completed resource_completion rows per resource, multi-resource arrays counted once each', async () => {
    await testDb.insert(resourceTable, { id: 'res-1' });
    await testDb.insert(resourceTable, { id: 'res-2' });
    await testDb.insert(resourceCompletionTable, {
      id: 'c1', email: 'a@x', isCompleted: true, resourceId: ['res-1'],
    });
    await testDb.insert(resourceCompletionTable, {
      id: 'c2', email: 'b@x', isCompleted: true, resourceId: ['res-1', 'res-2'],
    });
    // Not counted: isCompleted=false
    await testDb.insert(resourceCompletionTable, {
      id: 'c3', email: 'c@x', isCompleted: false, resourceId: ['res-1'],
    });

    const result = await compute()(db, ['res-1', 'res-2']);
    expect(result).toEqual({ 'res-1': 2, 'res-2': 1 });
  });

  test('returns 0 for resources with no completions', async () => {
    await testDb.insert(resourceTable, { id: 'res-lonely' });
    const result = await compute()(db, ['res-lonely']);
    expect(result).toEqual({ 'res-lonely': 0 });
  });
});

describe('resource.computedAverageRating', () => {
  const compute = () => getComputeFn(resourceTable, 'computedAverageRating');

  test('returns mean of resourceFeedback, ignoring NO_RESPONSE and null', async () => {
    await testDb.insert(resourceTable, { id: 'res-1' });
    await testDb.insert(resourceCompletionTable, {
      id: 'c1', email: 'a@x', resourceId: ['res-1'], resourceFeedback: RESOURCE_FEEDBACK.LIKE,
    });
    await testDb.insert(resourceCompletionTable, {
      id: 'c2', email: 'b@x', resourceId: ['res-1'], resourceFeedback: RESOURCE_FEEDBACK.LIKE,
    });
    await testDb.insert(resourceCompletionTable, {
      id: 'c3', email: 'c@x', resourceId: ['res-1'], resourceFeedback: RESOURCE_FEEDBACK.DISLIKE,
    });
    // Ignored: NO_RESPONSE
    await testDb.insert(resourceCompletionTable, {
      id: 'c4', email: 'd@x', resourceId: ['res-1'], resourceFeedback: RESOURCE_FEEDBACK.NO_RESPONSE,
    });

    const result = await compute()(db, ['res-1']);
    // (LIKE + LIKE + DISLIKE) / 3 = (1 + 1 + -1) / 3 = 1/3
    expect(result['res-1']).toBeCloseTo(1 / 3);
  });

  test('returns null when no ratings exist for a resource', async () => {
    await testDb.insert(resourceTable, { id: 'res-1' });
    await testDb.insert(resourceCompletionTable, {
      id: 'c1', email: 'a@x', resourceId: ['res-1'], resourceFeedback: RESOURCE_FEEDBACK.NO_RESPONSE,
    });
    const result = await compute()(db, ['res-1']);
    expect(result['res-1']).toBeNull();
  });
});
