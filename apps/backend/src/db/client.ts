import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import Database from './generated/Database';
import { env } from '../env';

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_CONNECTION_STRING,
  }),
});

export const db = new Kysely<Database>({ dialect });
