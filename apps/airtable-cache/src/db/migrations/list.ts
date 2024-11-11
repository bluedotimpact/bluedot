import { Migration } from 'kysely';
import { v00001init } from './v00001init';

export const migrations: Record<string, Migration['up']> = {
  v00001init,
};
