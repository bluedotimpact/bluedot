import { drizzle, NodePgClient } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type PgAirtableDatabase<
  TSchema extends Record<string, unknown> = Record<string, never>,
  TClient extends NodePgClient = Pool,
> = ReturnType<typeof drizzle<TSchema, TClient>> & {
  // TODO
  async airtableInsert<T extends Item>(table: PgAirtableTable<T>, data: Partial<Omit<T, 'id'>>): Promise<T>
};

export function createDbClient(url: string) {
  if (!url) {
    throw new Error('Must provide a postgres connection string to create a db client');
  }

  return drizzle(url);
}