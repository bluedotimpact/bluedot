import { PgInsertValue } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/node-postgres';
import { AirtableTs } from 'airtable-ts';
import { PgAirtableColumnInput, PgAirtableTable } from './db-core';

export type PgAirtableDatabase = Omit<ReturnType<typeof drizzle>, 'insert' | 'update' | 'delete'> & {
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

  // TODO
  airtableInsert<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: PgInsertValue<PgAirtableTable<TTableName, TColumnsMap>>
  ): Promise<PgAirtableTable<TTableName, TColumnsMap>['$inferSelect']>;
};

export function createDbClient(url: string): PgAirtableDatabase {
  if (!url) {
    throw new Error('Must provide a postgres connection string to create a db client');
  }

  const airtableClient = new AirtableTs({
    // FIXME envvar handling
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  });
  const pgClient = drizzle(url);

  // TODO move this elsewhere
  const airtableInsertImplementation = async <
    TTableName extends string,
    TColumnsMap extends Record<string, PgAirtableColumnInput>,
  >(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: PgInsertValue<PgAirtableTable<TTableName, TColumnsMap>>,
  ): Promise<PgAirtableTable<TTableName, TColumnsMap>['$inferSelect']> => {
    airtableClient.insert(table, data);
    const result = await pgClient.insert(table).values(data).returning();

    console.log({ result });

    // @ts-expect-error
    return result[0];
  };


  const handler: ProxyHandler<PgAirtableDatabase> = {
    get(target, propKey, receiver) {
      // TODO encapsulate this proxy thing better
      if (propKey === 'airtableInsert') {
        return airtableInsertImplementation;
      }

      return Reflect.get(target, propKey, receiver);
    },
  };

  // @ts-expect-error
  const typedBaseClient: PgAirtableDatabase = pgClient;
  const proxyClient = new Proxy<PgAirtableDatabase>(typedBaseClient, handler);

  return proxyClient;
}
