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
  afterEach, beforeAll, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { recomputeComputedAirtableFieldsAndSyncToAirtable } from './core';
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
afterEach(() => vi.restoreAllMocks());

const recompute = () => recomputeComputedAirtableFieldsAndSyncToAirtable({
  db,
  definitions: computedAirtableFieldDefinitions,
});

describe('computed Airtable fields', () => {
  test('writes exercise response counts from completed responses', async () => {
    await testDb.insert(exerciseTable, { id: 'exercise-1', title: 'Exercise 1' });
    await testDb.insert(exerciseTable, { id: 'exercise-2', title: 'Exercise 2', computedNumResponses: 99 });
    await testDb.insert(exerciseResponseTable, {
      id: 'response-1',
      email: 'a@example.com',
      exerciseId: 'exercise-1',
      response: 'done',
      completedAt: new Date().toISOString(),
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'response-2',
      email: 'b@example.com',
      exerciseId: 'exercise-1',
      response: 'started',
      completedAt: null,
    });

    await recompute();

    const rows = await db.pg.select().from(exerciseTable.pg);
    expect(Object.fromEntries(rows.map((row) => [row.id, row.computedNumResponses]))).toEqual({
      'exercise-1': 1,
      'exercise-2': 0,
    });
  });

  test('writes resource completion counts from completed resource-completion rows', async () => {
    await testDb.insert(resourceTable, { id: 'resource-1' });
    await testDb.insert(resourceTable, { id: 'resource-2' });
    await testDb.insert(resourceCompletionTable, {
      id: 'completion-1',
      unitResourceId: 'unit-resource-1',
      email: 'a@example.com',
      isCompleted: true,
      resourceId: ['resource-1'],
    });
    await testDb.insert(resourceCompletionTable, {
      id: 'completion-2',
      unitResourceId: 'unit-resource-2',
      email: 'b@example.com',
      isCompleted: true,
      resourceId: ['resource-1', 'resource-2'],
    });
    await testDb.insert(resourceCompletionTable, {
      id: 'completion-3',
      unitResourceId: 'unit-resource-3',
      email: 'c@example.com',
      isCompleted: false,
      resourceId: ['resource-1'],
    });

    await recompute();

    const rows = await db.pg.select().from(resourceTable.pg);
    expect(Object.fromEntries(rows.map((row) => [row.id, row.computedNumCompletions]))).toEqual({
      'resource-1': 2,
      'resource-2': 1,
    });
  });

  test('writes resource average ratings as a simple mean of submitted feedback values', async () => {
    await testDb.insert(resourceTable, { id: 'resource-1' });
    await testDb.insert(resourceTable, { id: 'resource-2', computedAverageRating: 10 });
    await testDb.insert(resourceCompletionTable, {
      id: 'rating-1',
      unitResourceId: 'unit-resource-1',
      email: 'a@example.com',
      resourceId: ['resource-1'],
      resourceFeedback: RESOURCE_FEEDBACK.LIKE,
    });
    await testDb.insert(resourceCompletionTable, {
      id: 'rating-2',
      unitResourceId: 'unit-resource-2',
      email: 'b@example.com',
      resourceId: ['resource-1'],
      resourceFeedback: RESOURCE_FEEDBACK.DISLIKE,
    });
    await testDb.insert(resourceCompletionTable, {
      id: 'rating-3',
      unitResourceId: 'unit-resource-3',
      email: 'c@example.com',
      resourceId: ['resource-1'],
      resourceFeedback: RESOURCE_FEEDBACK.NO_RESPONSE,
    });

    await recompute();

    const rows = await db.pg.select().from(resourceTable.pg);
    expect(Object.fromEntries(rows.map((row) => [row.id, row.computedAverageRating]))).toEqual({
      'resource-1': 0,
      'resource-2': null,
    });
  });

  test('does not write rows whose computed value is unchanged', async () => {
    await testDb.insert(exerciseTable, { id: 'exercise-1', title: 'Exercise 1', computedNumResponses: 0 });
    await testDb.insert(resourceTable, {
      id: 'resource-1',
      computedNumCompletions: 0,
      computedAverageRating: null,
    });

    const update = vi.spyOn(db, 'update');
    await recompute();

    expect(update).not.toHaveBeenCalled();
  });

  test('throws when a definition targets a field that is not on the table', async () => {
    await expect(recomputeComputedAirtableFieldsAndSyncToAirtable({
      db,
      definitions: [{
        table: exerciseTable,
        field: 'notAColumn',
        compute: async () => ({}),
      }],
    })).rejects.toThrow(/notAColumn/);
  });
});
