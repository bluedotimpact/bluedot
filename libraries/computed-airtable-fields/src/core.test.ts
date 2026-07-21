import {
  createTestDbClients,
  exerciseResponsePgTable,
  exerciseTable,
  PgAirtableDb,
  pushTestSchema,
  resetTestDb,
  type TestPgAirtableDb,
} from '@bluedot/db';
import {
  afterEach, beforeAll, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { recomputeValues, type ComputedAirtableFieldDefinition } from './core';

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

describe('recomputeValues', () => {
  test('writes a fresh value to every row in a single chunk', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1' });
    await testDb.insert(exerciseTable, { id: 'ex-2' });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1', exerciseId: 'ex-1', response: 'done', completedAt: new Date().toISOString(),
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-2', exerciseId: 'ex-1', response: 'done', completedAt: new Date().toISOString(),
    });

    const result = await recomputeValues({
      db,
      definition: {
        table: exerciseTable,
        field: 'computedNumResponses',
        compute: async (_db, ids) => Object.fromEntries(ids.map((id) => [id, id === 'ex-1' ? 2 : 0])),
      },
    });

    expect(result).toMatchObject({ checked: 2, updated: 2 });
    const rows = await db.pg.select().from(exerciseTable.pg);
    expect(Object.fromEntries(rows.map((r) => [r.id, r.computedNumResponses])))
      .toEqual({ 'ex-1': 2, 'ex-2': 0 });
  });

  test('only rows whose computed value differs from current are written', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-stale', computedNumResponses: 0 });
    await testDb.insert(exerciseTable, { id: 'ex-current', computedNumResponses: 5 });

    const update = vi.spyOn(db, 'update');
    const result = await recomputeValues({
      db,
      definition: {
        table: exerciseTable,
        field: 'computedNumResponses',
        compute: async (_db, ids) => Object.fromEntries(ids.map((id) => [id, id === 'ex-stale' ? 3 : 5])),
      },
    });

    expect(result).toMatchObject({ checked: 2, updated: 1 });
    expect(update).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledWith(exerciseTable, { id: 'ex-stale', computedNumResponses: 3 });
  });

  test('null handling: null↔null is a no-op, null↔value and value↔null both write', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-already-null', computedNumResponses: null });
    await testDb.insert(exerciseTable, { id: 'ex-becomes-null', computedNumResponses: 5 });
    await testDb.insert(exerciseTable, { id: 'ex-gets-value', computedNumResponses: null });

    const update = vi.spyOn(db, 'update');
    const result = await recomputeValues({
      db,
      definition: {
        table: exerciseTable,
        field: 'computedNumResponses',
        compute: async (_db, ids) => Object.fromEntries(ids.map((id) => {
          if (id === 'ex-already-null') return [id, null];
          if (id === 'ex-becomes-null') return [id, null];
          return [id, 7];
        })),
      },
    });

    expect(result).toMatchObject({ checked: 3, updated: 2 });
    expect(update.mock.calls.map(([, patch]) => patch)).toEqual(expect.arrayContaining([
      { id: 'ex-becomes-null', computedNumResponses: null },
      { id: 'ex-gets-value', computedNumResponses: 7 },
    ]));
    expect(update).toHaveBeenCalledTimes(2);
  });

  test('idempotent: a second run against unchanged state writes nothing', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1' });
    await testDb.insert(exerciseTable, { id: 'ex-2' });

    const definition: ComputedAirtableFieldDefinition = {
      table: exerciseTable,
      field: 'computedNumResponses',
      compute: async (_db, ids) => Object.fromEntries(ids.map((id) => [id, 42])),
    };

    const first = await recomputeValues({ db, definition });
    expect(first.updated).toBe(2);

    const update = vi.spyOn(db, 'update');
    const second = await recomputeValues({ db, definition });

    expect(second).toMatchObject({ checked: 2, updated: 0 });
    expect(update).not.toHaveBeenCalled();
  });

  test('empty table: compute is never called, no writes, counts are zero', async () => {
    const compute = vi.fn(async () => ({}));
    const update = vi.spyOn(db, 'update');

    const result = await recomputeValues({
      db,
      definition: { table: exerciseTable, field: 'computedNumResponses', compute },
    });

    expect(result).toMatchObject({ checked: 0, updated: 0 });
    expect(compute).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  test('multi-chunk: every row across two chunks is processed exactly once', async () => {
    // > COMPUTE_CHUNK_SIZE (500) so we straddle a chunk boundary.
    const ids = Array.from({ length: 501 }, (_, i) => `ex-${i.toString().padStart(4, '0')}`);
    await db.pg.insert(exerciseTable.pg).values(ids.map((id) => ({ id })));

    const compute = vi.fn(async (_db, chunkIds: string[]) => (
      Object.fromEntries(chunkIds.map((id) => [id, 1]))
    ));
    const result = await recomputeValues({
      db,
      definition: { table: exerciseTable, field: 'computedNumResponses', compute },
    });

    expect(result).toMatchObject({ checked: 501, updated: 501 });
    expect(compute.mock.calls.length).toBeGreaterThan(1);
    const rows = await db.pg.select().from(exerciseTable.pg);
    expect(rows.length).toBe(501);
    expect(rows.every((r) => r.computedNumResponses === 1)).toBe(true);
  });

  test('beforeWrite runs before every db.update and once per write (not per scanned row)', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1' });
    await testDb.insert(exerciseTable, { id: 'ex-2' });
    await testDb.insert(exerciseTable, { id: 'ex-3', computedNumResponses: 9 }); // no diff → no write

    const events: string[] = [];
    const beforeWrite = vi.fn(async () => {
      events.push('beforeWrite');
    });
    vi.spyOn(db, 'update').mockImplementation(async () => {
      events.push('update');
      return undefined as never;
    });

    await recomputeValues({
      db,
      definition: {
        table: exerciseTable,
        field: 'computedNumResponses',
        compute: async (_db, ids) => Object.fromEntries(ids.map((id) => [id, 9])),
      },
      beforeWrite,
    });

    expect(events).toEqual(['beforeWrite', 'update', 'beforeWrite', 'update']);
  });

  test('unknown field throws clearly, before any reads or writes', async () => {
    const compute = vi.fn();
    const update = vi.spyOn(db, 'update');

    await expect(recomputeValues({
      db,
      definition: { table: exerciseTable, field: 'notAColumn', compute },
    })).rejects.toThrow(/notAColumn.*exercise/);

    expect(compute).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  test('compute return type is constrained to string | number | boolean | null', () => {
    // Pure type-level assertion: a Date return must not satisfy ComputedAirtableFieldDefinition.
    const ok: ComputedAirtableFieldDefinition = {
      table: exerciseTable,
      field: 'computedNumResponses',
      compute: async () => ({ 'ex-1': 1 }),
    };
    expect(ok.field).toBe('computedNumResponses');

    const bad: ComputedAirtableFieldDefinition = {
      table: exerciseTable,
      field: 'computedNumResponses',
      // @ts-expect-error - Date is not assignable to ComputedAirtableFieldValue
      compute: async () => ({ 'ex-1': new Date() }),
    };
    expect(bad.field).toBe('computedNumResponses');
  });

  test('ids omitted by compute are counted as checked but not updated', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-a' });
    await testDb.insert(exerciseTable, { id: 'ex-b' });
    await testDb.insert(exerciseTable, { id: 'ex-c' });

    const update = vi.spyOn(db, 'update');
    const result = await recomputeValues({
      db,
      definition: {
        table: exerciseTable,
        field: 'computedNumResponses',
        // compute drops ex-b — that row should be left alone.
        compute: async (_db, ids) => Object.fromEntries(ids.filter((id) => id !== 'ex-b').map((id) => [id, 1])),
      },
    });

    expect(result).toMatchObject({ checked: 3, updated: 2 });
    expect(update.mock.calls.map(([, patch]) => patch.id)).toEqual(['ex-a', 'ex-c']);
  });

  test('beforeWrite is optional', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1' });
    const result = await recomputeValues({
      db,
      definition: {
        table: exerciseTable,
        field: 'computedNumResponses',
        compute: async (_db, ids) => Object.fromEntries(ids.map((id) => [id, 1])),
      },
    });
    expect(result).toMatchObject({ checked: 1, updated: 1 });
  });

  test('compute throwing in one chunk does not abort other chunks', async () => {
    const ids = Array.from({ length: 501 }, (_, i) => `ex-${i.toString().padStart(4, '0')}`);
    await db.pg.insert(exerciseTable.pg).values(ids.map((id) => ({ id })));

    let chunkIndex = 0;
    const compute = async (_db: PgAirtableDb, chunkIds: string[]) => {
      chunkIndex += 1;
      if (chunkIndex === 1) throw new Error('boom');
      return Object.fromEntries(chunkIds.map((id) => [id, 1]));
    };

    const result = await recomputeValues({
      db,
      definition: { table: exerciseTable, field: 'computedNumResponses', compute },
    });

    expect(result.updated).toBe(1); // only the second chunk's single row succeeded
    expect(result.failed).toBeGreaterThan(0);
    expect(result.errors).toHaveLength(1);
    expect((result.errors[0] as Error).message).toMatch(/boom/);
  });

  test('db.update throwing on one row does not abort other writes in the same chunk', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1' });
    await testDb.insert(exerciseTable, { id: 'ex-2' });
    await testDb.insert(exerciseTable, { id: 'ex-3' });

    let writeIndex = 0;
    vi.spyOn(db, 'update').mockImplementation(async () => {
      writeIndex += 1;
      if (writeIndex === 2) throw new Error('airtable 429');
      return undefined as never;
    });

    const result = await recomputeValues({
      db,
      definition: {
        table: exerciseTable,
        field: 'computedNumResponses',
        compute: async (_db, chunkIds) => Object.fromEntries(chunkIds.map((id) => [id, 1])),
      },
    });

    expect(result.updated).toBe(2);
    expect(result.failed).toBe(1);
    expect((result.errors[0] as Error).message).toMatch(/airtable 429/);
  });

  test('beforeWrite throwing on one row skips that write but continues', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1' });
    await testDb.insert(exerciseTable, { id: 'ex-2' });
    await testDb.insert(exerciseTable, { id: 'ex-3' });

    let count = 0;
    const beforeWrite = async () => {
      count += 1;
      if (count === 2) throw new Error('rate-limit acquire failed');
    };

    const update = vi.spyOn(db, 'update');
    const result = await recomputeValues({
      db,
      definition: {
        table: exerciseTable,
        field: 'computedNumResponses',
        compute: async (_db, chunkIds) => Object.fromEntries(chunkIds.map((id) => [id, 1])),
      },
      beforeWrite,
    });

    expect(update).toHaveBeenCalledTimes(2);
    expect(result.updated).toBe(2);
    expect(result.failed).toBe(1);
  });
});
