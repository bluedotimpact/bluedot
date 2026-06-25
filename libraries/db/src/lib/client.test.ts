import {
  beforeAll, beforeEach, describe, expect, test,
} from 'vitest';
import {
  PgAirtableDb,
  createTestDbClients,
  getFirstFromPg,
  personTable,
  pushTestSchema,
  resetTestDb,
  type TestPgAirtableDb,
  userTable,
} from '../index';
import { pgConnectionConfig, VULTR_PROJECT_CA } from './pg-ssl';

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
  // pushTestSchema runs drizzle-kit's schema diff against a fresh PGlite instance,
  // which is ~1s locally but can exceed the 10s default under CI CPU contention.
}, 30_000);

beforeEach(async () => resetTestDb(db));

describe('db.getFirst', () => {
  describe('with autoNumberId table', () => {
    test('returns null when no record matches', async () => {
      const result = await db.getFirst(userTable, { filter: { email: 'nonexistent@example.com' } });
      expect(result).toBeNull();
    });

    test('returns the matching record', async () => {
      await testDb.insert(userTable, { id: 'u1', email: 'a@x', name: 'Alice' });
      const result = await db.getFirst(userTable, { filter: { email: 'a@x' } });
      expect(result?.email).toBe('a@x');
      expect(result?.name).toBe('Alice');
    });

    test('defaults to autoNumberId DESC (newest first) with no sortBy', async () => {
      await testDb.insert(userTable, {
        id: 'u1', email: 'shared@x', name: 'First', autoNumberId: 1,
      });
      await testDb.insert(userTable, {
        id: 'u2', email: 'shared@x', name: 'Second', autoNumberId: 2,
      });
      await testDb.insert(userTable, {
        id: 'u3', email: 'shared@x', name: 'Third', autoNumberId: 3,
      });

      const result = await db.getFirst(userTable, { filter: { email: 'shared@x' } });
      expect(result?.name).toBe('Third');
    });

    test('explicit sortBy as string defaults to ASC', async () => {
      await testDb.insert(userTable, { id: 'u1', email: 'b@x', name: 'B' });
      await testDb.insert(userTable, { id: 'u2', email: 'a@x', name: 'A' });
      await testDb.insert(userTable, { id: 'u3', email: 'c@x', name: 'C' });

      const result = await db.getFirst(userTable, { sortBy: 'email' });
      expect(result?.email).toBe('a@x');
    });

    test('explicit sortBy: autoNumberId as string defaults to DESC (special case)', async () => {
      await testDb.insert(userTable, {
        id: 'u1', email: 'a@x', name: 'A', autoNumberId: 1,
      });
      await testDb.insert(userTable, {
        id: 'u2', email: 'a@x', name: 'B', autoNumberId: 2,
      });

      const result = await db.getFirst(userTable, { sortBy: 'autoNumberId' });
      expect(result?.autoNumberId).toBe(2);
    });

    test('explicit sortBy as object respects direction', async () => {
      await testDb.insert(userTable, { id: 'u1', email: 'b@x', name: 'B' });
      await testDb.insert(userTable, { id: 'u2', email: 'a@x', name: 'A' });

      const result = await db.getFirst(userTable, { sortBy: { field: 'email', direction: 'desc' } });
      expect(result?.email).toBe('b@x');
    });
  });

  describe('with non-autoNumberId table', () => {
    test('throws when sortBy is not provided', async () => {
      // The type system enforces sortBy at compile time; runtime check is the safety net.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = db.getFirst(personTable, { filter: { email: 'a@x' } } as any);
      await expect(call).rejects.toThrow(/autoNumberId for default sorting/);
    });

    test('works with explicit sortBy', async () => {
      await testDb.insert(personTable, { id: 'p1', email: 'b@x' });
      await testDb.insert(personTable, { id: 'p2', email: 'a@x' });

      const result = await db.getFirst(personTable, { sortBy: 'email' });
      expect(result?.email).toBe('a@x');
    });
  });

  describe('filter handling', () => {
    test('AND filter combines conditions', async () => {
      await testDb.insert(userTable, { id: 'u1', email: 'a@x', name: 'Alice' });
      await testDb.insert(userTable, { id: 'u2', email: 'a@x', name: 'Bob' });

      const result = await db.getFirst(userTable, {
        filter: { AND: [{ email: 'a@x' }, { name: 'Bob' }] },
      });
      expect(result?.name).toBe('Bob');
    });

    test('OR filter matches either branch', async () => {
      await testDb.insert(userTable, { id: 'u1', email: 'a@x', name: 'Alice' });

      const result = await db.getFirst(userTable, {
        filter: { OR: [{ email: 'a@x' }, { email: 'nonexistent@x' }] },
      });
      expect(result?.email).toBe('a@x');
    });

    test('comparison operator >', async () => {
      await testDb.insert(userTable, {
        id: 'u1', email: 'a@x', name: 'A', autoNumberId: 1,
      });
      await testDb.insert(userTable, {
        id: 'u2', email: 'a@x', name: 'B', autoNumberId: 5,
      });
      await testDb.insert(userTable, {
        id: 'u3', email: 'a@x', name: 'C', autoNumberId: 10,
      });

      // Default sort is autoNumberId DESC, so we get the highest match.
      const result = await db.getFirst(userTable, { filter: { autoNumberId: { '>': 3 } } });
      expect(result?.autoNumberId).toBe(10);
    });

    test('comparison operator !=', async () => {
      await testDb.insert(userTable, {
        id: 'u1', email: 'a@x', name: 'A', autoNumberId: 1,
      });
      await testDb.insert(userTable, {
        id: 'u2', email: 'b@x', name: 'B', autoNumberId: 2,
      });

      const result = await db.getFirst(userTable, { filter: { email: { '!=': 'a@x' } } });
      expect(result?.email).toBe('b@x');
    });

    test('empty AND defensively returns no rows (matches no records)', async () => {
      await testDb.insert(userTable, { id: 'u1', email: 'a@x', name: 'A' });
      const result = await db.getFirst(userTable, { filter: { AND: [] } });
      expect(result).toBeNull();
    });

    test('empty OR returns no rows', async () => {
      await testDb.insert(userTable, { id: 'u1', email: 'a@x', name: 'A' });
      const result = await db.getFirst(userTable, { filter: { OR: [] } });
      expect(result).toBeNull();
    });

    test('throws on unknown field in filter', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const call = db.getFirst(userTable, { filter: { nonExistent: 'x' } as any });
      await expect(call).rejects.toThrow(/Unknown field/);
    });
  });

  describe('no-options invocation', () => {
    test('with autoNumberId table, no options at all returns newest row', async () => {
      await testDb.insert(userTable, {
        id: 'u1', email: 'a@x', name: 'First', autoNumberId: 1,
      });
      await testDb.insert(userTable, {
        id: 'u2', email: 'b@x', name: 'Second', autoNumberId: 2,
      });

      const result = await db.getFirst(userTable);
      expect(result?.id).toBe('u2');
    });
  });
});

describe('getFirstFromPg (direct)', () => {
  test('returns the matching record with a raw pgClient and PgTable', async () => {
    await testDb.insert(userTable, { id: 'u1', email: 'direct@x', name: 'Direct' });

    const result = await getFirstFromPg(db.pg, userTable.pg, {
      filter: { email: 'direct@x' },
    });
    expect(result?.id).toBe('u1');
    expect(result?.name).toBe('Direct');
  });

  test('returns null when no record matches', async () => {
    const result = await getFirstFromPg(db.pg, userTable.pg, {
      filter: { email: 'nobody@x' },
    });
    expect(result).toBeNull();
  });

  test('throws when table has no autoNumberId and no sortBy is provided', async () => {
    await expect(getFirstFromPg(db.pg, personTable.pg)).rejects.toThrow(/autoNumberId for default sorting/);
  });
});

describe('pgConnectionConfig', () => {
  test('passes through a connection string with no sslmode', () => {
    const connString = 'postgres://user:pass@localhost:5432/bluedot_dev';
    expect(pgConnectionConfig(connString)).toEqual({ connectionString: connString });
  });

  test('passes through sslmode=no-verify (production posture)', () => {
    const connString = 'postgres://user:pass@db.example.com:5432/app?sslmode=no-verify';
    expect(pgConnectionConfig(connString)).toEqual({ connectionString: connString });
  });

  test('passes through a non-URI connection string', () => {
    const connString = 'host=localhost dbname=app';
    expect(pgConnectionConfig(connString)).toEqual({ connectionString: connString });
  });

  test('passes through sslmode=verify-ca (its no-hostname-check semantics are not supported)', () => {
    const connString = 'postgres://user:pass@db.vultrdb.com:16751/app?sslmode=verify-ca';
    expect(pgConnectionConfig(connString)).toEqual({ connectionString: connString });
  });

  test.each(['require', 'verify-full'])('sslmode=%s strips the param and attaches the Vultr CA plus system roots', (sslmode) => {
    const config = pgConnectionConfig(`postgres://user:pass@db.vultrdb.com:16751/app?sslmode=${sslmode}`);

    expect(config.connectionString).toBe('postgres://user:pass@db.vultrdb.com:16751/app');
    const { ca } = config.ssl as { ca: string[] };
    expect(ca[0]).toBe(VULTR_PROJECT_CA);
    expect(ca.length).toBeGreaterThan(1);
  });

  test('sslmode=require preserves credentials and other query params', () => {
    const config = pgConnectionConfig('postgres://user:p%40ss@db.vultrdb.com:16751/app?application_name=x&sslmode=require');

    expect(config.connectionString).toBe('postgres://user:p%40ss@db.vultrdb.com:16751/app?application_name=x');
    expect(config.ssl).toBeDefined();
  });
});
