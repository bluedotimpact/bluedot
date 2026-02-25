import {
  AirtableTs, type Item, type Table, type ScanParams, type AirtableTsTable,
} from 'airtable-ts';

function generateRecordId(): string {
  return `rec${Math.random().toString(36).slice(2, 16).padEnd(14, 'a')}`;
}

/**
 * Stateless mock of AirtableTs. Returns data passed to it with generated IDs,
 * without making any real Airtable API calls.
 *
 * Designed to act as a pass-through layer when testing PgAirtableDb with PGLite.
 * The PGLite database provides the actual statefulness.
 */
export class MockStatelessAirtableTs extends AirtableTs {
  constructor() {
    super({ apiKey: 'mock-api-key-not-used' });
  }

  override async get<T extends Item>(_table: Table<T>, _id: string): Promise<T> {
    throw new Error('MockStatelessAirtableTs is stateless and does not support get()');
  }

  override async scan<T extends Item>(_table: Table<T>, _params?: ScanParams): Promise<T[]> {
    return [];
  }

  override async insert<T extends Item>(_table: Table<T>, data: Partial<Omit<T, 'id'>>): Promise<T> {
    const dataAsRecord = data as Record<string, unknown>;
    const id = typeof dataAsRecord.id === 'string' ? dataAsRecord.id : generateRecordId();
    return { ...data, id } as T;
  }

  override async update<T extends Item>(_table: Table<T>, data: Partial<T> & { id: string }): Promise<T> {
    return { ...data } as T;
  }

  override async remove<T extends Item>(_table: Table<T>, id: string): Promise<{ id: string }> {
    return { id };
  }

  override async table<T extends Item>(_table: Table<T>): Promise<AirtableTsTable<T>> {
    throw new Error('MockStatelessAirtableTs does not support table()');
  }
}
