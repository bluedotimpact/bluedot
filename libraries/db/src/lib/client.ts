import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AirtableTs } from 'airtable-ts';
import {
  PgAirtableColumnInput, PgAirtableTable, BasePgTableType, AirtableItemFromColumnsMap,
} from './db-core';

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

  constructor({ pgConnString, airtableApiKey }: { pgConnString: string; airtableApiKey?: string }) {
    if (!pgConnString) {
      throw new Error('Must provide a postgres connection string to create a db client');
    }

    this.airtableClient = new AirtableTs({
      // FIXME envvar handling
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      apiKey: airtableApiKey ?? process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
    });
    this.pgUnrestricted = drizzle(pgConnString);
  }

  public get pg(): RestrictedPgDatabase {
    return this.pgUnrestricted;
  }

  async airtableInsert<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: Partial<Omit<AirtableItemFromColumnsMap<TColumnsMap>, 'id'>>,
  ): Promise<BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>['$inferSelect']> {
    const fullData = await this.airtableClient.insert(table.airtable, data);

    const pgResult = await this.ensureReplicated(table, fullData.id, fullData);

    return pgResult;
  }

  async airtableUpdate<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: Partial<AirtableItemFromColumnsMap<TColumnsMap>> & { id: string },
  ): Promise<BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>['$inferSelect']> {
    const fullData = await this.airtableClient.update(table.airtable, data);

    const pgResult = await this.ensureReplicated(table, fullData.id, fullData);

    return pgResult;
  }

  async airtableDelete<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    id: string,
  ): Promise<BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>['$inferSelect']> {
    const { id: resultId } = await this.airtableClient.remove(table.airtable, id);

    const pgResult = await this.ensureReplicated(table, resultId);

    return pgResult;
  }

  async ensureReplicated<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    id: string,
    /** Optional, if given prevents an extra round trip to airtable */
    fullData?: AirtableItemFromColumnsMap<TColumnsMap>,
  ): Promise<BasePgTableType<TTableName, TColumnsMap & { id: PgAirtableColumnInput }>['$inferSelect']> {
    const data: AirtableItemFromColumnsMap<TColumnsMap> | null = fullData ?? await this.airtableClient.get(table.airtable, id);

    if (data) {
      // TODO fix type
      // @ts-expect-error
      const [result] = await this.pgUnrestricted.insert(table.pg).values(data).onConflictDoUpdate({
        target: table.pg.id, // Assuming 'id' is the conflict target column
        set: dataToProcess, // Update all columns with the new data
      }).returning();

      return result;
    }

    const [deletedResult] = await this.pgUnrestricted.delete(table.pg).where(eq(table.pg.id, id)).returning();

    return deletedResult;
  }
}

export function createDbClient(url: string): PgAirtableDb {
  return new PgAirtableDb({ pgConnString: url });
}
