import {
  PgAirtableDb,
  createTestDbClients,
  eq,
  exerciseResponseTable,
  exerciseTable,
  pushTestSchema,
  resetTestDb,
  type TestPgAirtableDb,
} from '@bluedot/db';
import {
  afterEach, beforeAll, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { createRollups } from './framework';
import { rollupDefinitions } from './rollups';

let db: PgAirtableDb;
let testDb: TestPgAirtableDb;
let rollups: ReturnType<typeof createRollups>;

beforeAll(async () => {
  const { pgClient, airtableClient } = createTestDbClients();
  db = new PgAirtableDb({
    pgConnString: 'unused', airtableApiKey: 'unused', pgClient, airtableClient,
  });
  testDb = db as unknown as TestPgAirtableDb;
  rollups = createRollups(db, rollupDefinitions);
  await pushTestSchema(db);
});

beforeEach(() => resetTestDb(db));
afterEach(() => vi.restoreAllMocks());

const completedResponse = (id: string, exerciseId: string, email: string) => testDb.insert(exerciseResponseTable, {
  id, exerciseId, email, response: 'x', completedAt: new Date().toISOString(),
});

const readNumCompletions = async (exerciseId: string): Promise<number | null> => {
  const [row] = await db.pg.select().from(exerciseTable.pg).where(eq(exerciseTable.pg.id, exerciseId));
  return row?.numCompletions ?? null;
};

describe('rollups.exercise (numCompletions)', () => {
  test('a single id writes the completed-response count for that row only', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1' });
    await testDb.insert(exerciseTable, { id: 'ex-2', title: 'Exercise 2', numCompletions: 99 });
    await completedResponse('resp-1', 'ex-1', 'a@example.com');
    await completedResponse('resp-2', 'ex-1', 'b@example.com');
    // An incomplete response (no completedAt) must not count.
    await testDb.insert(exerciseResponseTable, {
      id: 'resp-3', exerciseId: 'ex-1', email: 'c@example.com', response: 'x', completedAt: null,
    });

    await rollups.invalidate({ field: exerciseTable.pg.numCompletions, id: 'ex-1' });

    expect(await readNumCompletions('ex-1')).toBe(2);
    expect(await readNumCompletions('ex-2')).toBe(99);
  });

  test('a single id with no completions left resets a stale count to 0', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1', numCompletions: 5 });

    await rollups.invalidate({ field: exerciseTable.pg.numCompletions, id: 'ex-1' });

    expect(await readNumCompletions('ex-1')).toBe(0);
  });

  test('a whole-field recompute refreshes every row and resets ones with no completions', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1' });
    await testDb.insert(exerciseTable, { id: 'ex-2', title: 'Exercise 2', numCompletions: 5 });
    await completedResponse('resp-1', 'ex-1', 'a@example.com');

    await rollups.invalidate({ field: exerciseTable.pg.numCompletions });

    expect(await readNumCompletions('ex-1')).toBe(1);
    expect(await readNumCompletions('ex-2')).toBe(0);
  });

  test('a whole-field recompute does not write rows whose value is unchanged', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1', numCompletions: 1 });
    await completedResponse('resp-1', 'ex-1', 'a@example.com');

    const update = vi.spyOn(db, 'update');
    await rollups.invalidate({ field: exerciseTable.pg.numCompletions });

    expect(update).not.toHaveBeenCalled();
  });

  test('no argument refreshes every field', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1' });
    await completedResponse('resp-1', 'ex-1', 'a@example.com');

    await rollups.invalidate();

    expect(await readNumCompletions('ex-1')).toBe(1);
  });
});

describe('rollups.exercise edge cases', () => {
  // Several users complete the same exercise at once, each firing its own single-row invalidate.
  // The inline writes race (a stale count can land last), but a full recompute reconciles it.
  test('concurrent completions may race inline, but a recompute makes the count correct', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1' });

    await Promise.all(Array.from({ length: 5 }, (_, i) => (async () => {
      await completedResponse(`resp-${i}`, 'ex-1', `user-${i}@example.com`);
      await rollups.invalidate({ field: exerciseTable.pg.numCompletions, id: 'ex-1' });
    })()));

    const afterRace = await readNumCompletions('ex-1');
    expect(afterRace).toBeGreaterThan(0);
    expect(afterRace).toBeLessThanOrEqual(5);

    await rollups.invalidate({ field: exerciseTable.pg.numCompletions });
    expect(await readNumCompletions('ex-1')).toBe(5);
  });

  // A recompute that fails partway leaves some rows written. Re-running completes the rest: the rows
  // already written are skipped as unchanged.
  test('a recompute that fails partway is recovered by the next one', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1' });
    await testDb.insert(exerciseTable, { id: 'ex-2', title: 'Exercise 2' });
    await completedResponse('resp-1', 'ex-1', 'a@example.com');
    await completedResponse('resp-2', 'ex-2', 'a@example.com');

    const realUpdate = db.update.bind(db);
    vi.spyOn(db, 'update').mockImplementation((table, data) => {
      if (data.id === 'ex-2') {
        throw new Error('airtable error');
      }

      return realUpdate(table, data);
    });
    await expect(rollups.invalidate({ field: exerciseTable.pg.numCompletions })).rejects.toThrow();
    vi.restoreAllMocks();

    await rollups.invalidate({ field: exerciseTable.pg.numCompletions });
    expect(await readNumCompletions('ex-1')).toBe(1);
    expect(await readNumCompletions('ex-2')).toBe(1);
  });

  // A row with no completions should settle at 0 and not be rewritten on every run.
  test('rows with no completions write 0 once, then stay unchanged', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1' });

    await rollups.invalidate({ field: exerciseTable.pg.numCompletions });
    expect(await readNumCompletions('ex-1')).toBe(0);

    const update = vi.spyOn(db, 'update');
    await rollups.invalidate({ field: exerciseTable.pg.numCompletions });
    expect(update).not.toHaveBeenCalled();
  });

  // The field is the rollup's to own: a value changed elsewhere is overwritten by the true count.
  test('a value changed elsewhere is corrected on the next recompute', async () => {
    await testDb.insert(exerciseTable, { id: 'ex-1', title: 'Exercise 1', numCompletions: 999 });
    await completedResponse('resp-1', 'ex-1', 'a@example.com');

    await rollups.invalidate({ field: exerciseTable.pg.numCompletions });

    expect(await readNumCompletions('ex-1')).toBe(1);
  });
});
