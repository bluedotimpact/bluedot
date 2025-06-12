# BlueDot db library

An abstraction layer for using Airtable mirrored to PostgreSQL as if it were (approximately) just PostgreSQL.

## Usage

```typescript
import { PgAirtableDb, courseTable } from '@bluedot/db';

const db = new PgAirtableDb({ 
  pgConnString: process.env.PG_URL, 
  airtableApiKey: process.env.AIRTABLE_API_KEY 
});

// Write to Airtable and sync to PostgreSQL
const course = await db.airtableInsert(courseTable, {
  title: 'AI Safety Fundamentals',
  slug: 'aisf'
});

// Read from PostgreSQL (fast)
const courses = await db.pg.select().from(courseTable.pg);
```

## Important

- **Use `airtableInsert`, `airtableUpdate`, `airtableDelete`** for writes - these update Airtable and sync to PostgreSQL
- **Use `db.pg.select()`** for reads - this queries PostgreSQL directly for speed
- **Don't use raw `insert`/`update`/`delete`** - these only write to PostgreSQL and break sync

The [pg-sync-service](../../apps/pg-sync-service/) handles remotely syncing the databases via webhooks.
