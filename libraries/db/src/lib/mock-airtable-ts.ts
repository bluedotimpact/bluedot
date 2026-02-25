import {
  AirtableTs, type Item, type Table, type ScanParams, type AirtableTsTable,
} from 'airtable-ts';
import { eq } from 'drizzle-orm';
import type { PgDatabase } from './client';
import { PgAirtableTable } from './db-core';
import * as schema from '../schema';

function generateRecordId(): string {
  return `rec${Math.random().toString(36).slice(2, 16).padEnd(14, 'a')}`;
}

/**
 * Test mock of AirtableTs backed by the same PGlite database.
 *
 * insert/update write to PG and return full records (including defaults).
 * This means ensureReplicated receives complete data, avoiding NOT NULL issues
 * that would occur with a stateless mock returning only partial fields.
 *
 * The double-write (mock writes to PG, then ensureReplicated upserts the same data)
 * is harmless — the upsert is idempotent.
 */
export class MockAirtableTs extends AirtableTs {
  private pgClient: PgDatabase;

  // Maps Airtable tableId → drizzle PG table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tableRegistry: Map<string, any>;

  constructor(pgClient: PgDatabase) {
    super({ apiKey: 'mock-api-key-not-used' });
    this.pgClient = pgClient;
    this.tableRegistry = new Map();

    for (const value of Object.values(schema)) {
      if (value instanceof PgAirtableTable) {
        this.tableRegistry.set(value.airtable.tableId, value.pg);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getPgTable(tableId: string): any {
    const pgTable = this.tableRegistry.get(tableId);
    if (!pgTable) {
      throw new Error(
        `MockAirtableTs: No PG table registered for Airtable tableId "${tableId}". `
        + 'Ensure the table is defined as a PgAirtableTable in @bluedot/db schema.',
      );
    }
    return pgTable;
  }

  override async get<T extends Item>(table: Table<T>, id: string): Promise<T> {
    const pgTable = this.getPgTable(table.tableId);
    try {
      const results = await this.pgClient.select().from(pgTable).where(eq(pgTable.id, id));
      if (results.length === 0) {
        throw new Error(`Record "${id}" not found`);
      }
      return results[0] as T;
    } catch (error) {
      const original = error instanceof Error ? error.message : String(error);
      throw new Error(`MockAirtableTs.get() failed for id "${id}": ${original}`);
    }
  }

  override async scan<T extends Item>(_table: Table<T>, _params?: ScanParams): Promise<T[]> {
    // PgAirtableDb reads from PG directly; this method is not called in normal operation.
    return [];
  }

  override async insert<T extends Item>(table: Table<T>, data: Partial<Omit<T, 'id'>>): Promise<T> {
    const pgTable = this.getPgTable(table.tableId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = (data as any).id ?? generateRecordId();
    try {
      const rows = await this.pgClient
        .insert(pgTable)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .values({ ...data, id } as any)
        .returning();
      return rows[0] as T;
    } catch (error) {
      const original = error instanceof Error ? error.message : String(error);
      throw new Error(
        `MockAirtableTs.insert() failed: ${original}. `
        + 'Check that the data passed to db.insert() includes all required (NOT NULL) fields.',
      );
    }
  }

  override async update<T extends Item>(table: Table<T>, data: Partial<T> & { id: string }): Promise<T> {
    const pgTable = this.getPgTable(table.tableId);
    const { id, ...updateFields } = data;
    try {
      const rows = await this.pgClient
        .update(pgTable)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .set(updateFields as any)
        .where(eq(pgTable.id, id))
        .returning();
      if (rows.length === 0) {
        throw new Error(`Record "${id}" not found for update`);
      }
      return rows[0] as T;
    } catch (error) {
      const original = error instanceof Error ? error.message : String(error);
      throw new Error(
        `MockAirtableTs.update() failed for id "${data.id}": ${original}. `
        + 'Check that the record exists and the update data is valid.',
      );
    }
  }

  override async remove<T extends Item>(_table: Table<T>, id: string): Promise<{ id: string }> {
    // Don't delete from PG here — let ensureReplicated handle it so that
    // .returning() can capture the deleted record.
    return { id };
  }

  override async table<T extends Item>(_table: Table<T>): Promise<AirtableTsTable<T>> {
    throw new Error('MockAirtableTs does not support table()');
  }
}
