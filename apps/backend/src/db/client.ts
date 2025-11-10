import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
// These ignores are to allow this to pass in CI, where we don't have a database to generate the files with
// If we do more with backend, we should fix this properly by having CI spin up a database
/* eslint-disable */
// @ts-ignore
import Database from './generated/Database';
import { env } from '../env';

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: env.DATABASE_CONNECTION_STRING,
  }),
});

export const db = new Kysely<Database>({ dialect });
