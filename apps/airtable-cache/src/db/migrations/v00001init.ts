import { Kysely, sql } from 'kysely';

export async function v00001init(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('cached_response')
    .addColumn('key', 'text', (col) => col.notNull().primaryKey())
    .addColumn('status', 'integer', (col) => col.notNull())
    .addColumn('body', 'text', (col) => col.notNull())
    .addColumn('headers', 'jsonb', (col) => col.notNull())
    .addColumn('inserted_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await sql`ALTER TABLE cached_response SET UNLOGGED`.execute(db);
}
