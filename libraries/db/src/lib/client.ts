import { eq } from 'drizzle-orm';
import { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AirtableTs } from 'airtable-ts';
import { PgAirtableTable } from './db-core';
import { AirtableItemFromColumnsMap, BasePgTableType, PgAirtableColumnInput } from './typeUtils';

/**
 * Postgres client which is identical to the standard client in terms of functionality, but
 * with deprecated write functions to warn developers not to use them directly.
 */
type RestrictedPgDatabase = Omit<ReturnType<typeof drizzle>, 'insert' | 'update' | 'delete'> & {
  /**
   * @deprecated Please use `airtableInsert`, which will write to Airtable and mirror the result to Postgres.
   * Using this raw `insert` function will only write to Postgres.
   */
  insert: ReturnType<typeof drizzle>['insert'];
  /**
   * @deprecated Please use `airtableUpdate`, which will write to Airtable and mirror the result to Postgres.
   * Using this raw `update` function will only write to Postgres.
   */
  update: ReturnType<typeof drizzle>['update'];
  /**
   * @deprecated Please use `airtableDelete`, which will write to Airtable and mirror the result to Postgres.
   * Using this raw `delete` function will only write to Postgres.
   */
  delete: ReturnType<typeof drizzle>['delete'];
};

export class PgAirtableDb {
  private pgUnrestricted: ReturnType<typeof drizzle>;

  public airtableClient: AirtableTs;

  constructor({ pgConnString, airtableApiKey }: { pgConnString: string; airtableApiKey: string }) {
    this.airtableClient = new AirtableTs({
      apiKey: airtableApiKey,
    });
    this.pgUnrestricted = drizzle(pgConnString);
  }

  public get pg(): RestrictedPgDatabase {
    return this.pgUnrestricted;
  }

  /**
   * Insert `data` into airtable and replicate synchronously to postgres (changes are readable immediately
   * after awaiting this).
   */
  async airtableInsert<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: Partial<Omit<AirtableItemFromColumnsMap<TColumnsMap>, 'id'>>,
  ): Promise<BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>['$inferSelect']> {
    const fullData = await this.airtableClient.insert(table.airtable, data);

    const pgResult = await this.ensureReplicated({ table, id: fullData.id, fullData });

    return pgResult;
  }

  /**
   * Update the given record in airtable and replicate synchronously to postgres (changes are
   * readable immediately after awaiting this).
   */
  async airtableUpdate<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: Partial<AirtableItemFromColumnsMap<TColumnsMap>> & { id: string },
  ): Promise<BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>['$inferSelect']> {
    const fullData = await this.airtableClient.update(table.airtable, data);

    const pgResult = await this.ensureReplicated({ table, id: fullData.id, fullData });

    return pgResult;
  }

  /**
   * Delete the given record in airtable and replicate synchronously to postgres (changes are
   * readable immediately after awaiting this).
   */
  async airtableDelete<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    id: string,
  ): Promise<BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>['$inferSelect']> {
    const { id: resultId } = await this.airtableClient.remove(table.airtable, id);

    const pgResult = await this.ensureReplicated({ table, id: resultId, isDelete: true });

    return pgResult;
  }

  /**
   * Ensures that a record from Airtable is replicated in the PostgreSQL database.
   * @param params.table - The PgAirtableTable instance defining the table schema and mappings
   * @param params.id - The Airtable record ID to replicate or delete
   * @param params.fullData - Optional Airtable record data. If provided, prevents an extra
   *   round trip to Airtable to fetch the data. Ignored when isDelete is true.
   * @param params.isDelete - Whether this is a delete operation. Defaults to false.
   *   Must be explicitly set to true for records to be deleted.
   */
  async ensureReplicated<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    {
      table, id, fullData, isDelete = false,
    }: {
      table: PgAirtableTable<TTableName, TColumnsMap>;
      id: string;
      /** Optional, if given prevents an extra round trip to airtable */
      fullData?: AirtableItemFromColumnsMap<TColumnsMap>;
      /** Must be passed explicitly for a record to be deleted. */
      isDelete?: boolean;
    },
  ): Promise<BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>['$inferSelect']> {
    return this.pgUnrestricted.transaction(async (tx) => {
      if (isDelete) {
        const deletedResults = await tx.delete(table.pg).where(eq(table.pg.id, id)).returning();
        const deletedResult = Array.isArray(deletedResults) ? deletedResults[0] : undefined;

        if (!deletedResult) {
          throw new Error('Unknown error: Delete failed to return result');
        }

        return deletedResult;
      }

      const data = fullData ?? await this.airtableClient.get(table.airtable, id);

      if (!data) {
        throw new Error('No data found for upsert operation');
      }

      // TODO For updates, check if there are changes with SELECT first to avoid acquiring a lock
      const rows = await tx.insert(table.pg).values(data as PgInsertValue<typeof table.pg>).onConflictDoUpdate({
        target: table.pg.id,
        set: data as PgUpdateSetSource<typeof table.pg>,
      }).returning();

      const result = Array.isArray(rows) ? rows[0] : undefined;

      if (!result) {
        throw new Error('Unexpected error: Nothing returned from upset operation');
      }

      return result;
    });
  }
}
