# BlueDot db library

An abstraction layer for using Airtable mirrored to PostgreSQL as if it were (approximately) just PostgreSQL.

## Quick start

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

## Usage

### Get a single record

This will throw an error if 0 or >1 records match the filter.

```typescript
// Get by ID
const course = await db.get(courseTable, 'course123');

// Get by other fields
const course = await db.get(courseTable, { slug: 'aisf' });

// Get with multiple filters (all must match)
const registration = await db.get(courseRegistrationTable, { 
  email: 'user@example.com', 
  courseId: 'course123',
  decision: 'Accept'
});

// Comparison operators
// Available operators: '>', '<', '>=', '<=', '=', '!='
const courses = await db.scan(courseTable, {
  durationHours: { '>': 10 },
  averageRating: { '>=': 4.5 },
  publicationStatus: { '!=': 'Unpublished' },
  courseLeadFirstName: "Adam",
  courseLeadLastName: { '=': 'Jones' } // (this is equivalent to just 'Jones', as we default to equality)
});

// You can also combine things with an OR or AND (default is AND)
const coreOrFurtherResources = await db.scan(unitResourceTable, {
  OR: [
    { coreFurtherMaybe: 'Core' },
    { coreFurtherMaybe: 'Further' }
  ]
})
```

### Insert new records

```typescript
const newCourse = await db.insert(courseTable, {
  // id is always required to NOT be present
  title: 'Advanced AI Safety',
  slug: 'advanced-aisf',
  description: 'Deep dive into AI safety concepts'
});
```

### Update existing records

```typescript
const updatedCourse = await db.update(courseTable, {
  id: 'course123', // id is always required
  title: 'Updated Course Title',
  description: 'Updated description'
});
```

### Remove records

```typescript
const deletedCourse = await db.remove(courseTable, 'course123');
```

## Important

- **Use `db.get`, `db.scan`** for reads - these query PostgreSQL directly for speed
- **Use `db.insert`, `db.update`, `db.remove`** for writes - these update Airtable and sync to PostgreSQL
- **Don't use raw `db.pg.insert`/`db.pg.update`/`db.pg.delete`** - these only write to PostgreSQL and break sync

The [pg-sync-service](../../apps/pg-sync-service/) handles remotely syncing the databases via webhooks.
