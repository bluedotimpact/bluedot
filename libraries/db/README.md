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
const course = await db.insert(courseTable, {
  title: 'AI Safety Fundamentals',
  slug: 'aisf'
});

// Read from PostgreSQL (fast)
const courses = await db.scan(courseTable);
```

## Important

- **Use `db.get`, `db.scan` or `db.pg.select`** for reads - this queries PostgreSQL directly for speed
- **Use `db.insert`, `db.update`, `db.delete`** for writes - these update Airtable and sync to PostgreSQL
- **Don't use raw `db.pg.insert`/`db.pg.update`/`db.pg.delete`** - these only write to PostgreSQL and break sync

The [pg-sync-service](../../apps/pg-sync-service/) handles remotely syncing the databases via webhooks.
