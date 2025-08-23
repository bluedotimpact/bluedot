# pg-sync-service

Service that listens for changes in Airtable via webhooks to keep a PostgreSQL read replica up to date.

## Usage

```bash
# Start the service
npm run start

# Start with initial full sync
npm run start -- --initial-sync

# Start with initial sync for specific tables only, using postgres table names
npm run start -- --initial-sync-tables course person user
```

## How it works

1. **Webhooks**: Creates [Airtable webhooks](https://airtable.com/developers/web/api/webhooks-overview) for each base and polls them for changes
2. **Initial sync**: When started with `--initial-sync`, or when no sync has occured in the last 24 hours, performs a full scan of each table to sync existing data. Use `--initial-sync-tables` to limit initial sync to specific postgres tables while keeping all webhook syncing active, this is useful for testing schema changes in development.
3. **Ongoing sync**: Continuously polls webhooks and replicates changes to PostgreSQL using the `@bluedot/db` library
