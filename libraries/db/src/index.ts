import { drizzle } from 'drizzle-orm/node-postgres';

export function createDbClient(url: string) {
  if (!url) {
    throw new Error("Must provide a postgres connection string to create a db client")
  }

  return drizzle(url);
}
