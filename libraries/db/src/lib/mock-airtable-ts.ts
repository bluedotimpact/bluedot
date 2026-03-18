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
 * Test mock of AirtableTs.
 *
 * Does not write to Postgres — PgAirtableDb.ensureReplicated() handles that.
 * insert() and update() return data in the same shape real Airtable would,
 * and update() reads the existing PG row to merge partial updates (mirroring
 * how real Airtable returns the full record after a partial update).
 */
export class MockAirtableTs extends AirtableTs {
  private pgClient: PgDatabase;

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
      throw new Error(`MockAirtableTs: No PG table registered for Airtable tableId "${tableId}". `
        + 'Ensure the table is defined as a PgAirtableTable in @bluedot/db schema.');
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
    throw new Error('MockAirtableTs does not support scan(). PgAirtableDb.scan() reads from Postgres directly, so this method should not be called.');
  }

  override async insert<T extends Item>(_table: Table<T>, data: Partial<Omit<T, 'id'>>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const id = (data as any).id ?? generateRecordId();
    return { ...data, id } as T;
  }

  override async update<T extends Item>(table: Table<T>, data: Partial<T> & { id: string }): Promise<T> {
    // Read the existing row from PG and merge, mirroring how real Airtable
    // returns the full record after a partial update.
    const pgTable = this.getPgTable(table.tableId);
    const existing = await this.pgClient.select().from(pgTable).where(eq(pgTable.id, data.id));
    const existingRow = Array.isArray(existing) ? existing[0] : undefined;
    return { ...existingRow, ...data } as T;
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
