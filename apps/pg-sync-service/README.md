# pg-sync-service

Service that listens for changes in Airtable via webhooks to keep a PostgreSQL read replica up to date.

## Usage

```bash
# Start the service
npm run start

# Start with initial full sync
npm run start -- --initial-sync
```

## How it works

1. **Webhooks**: Creates [Airtable webhooks](https://airtable.com/developers/web/api/webhooks-overview) for each base and polls them for changes
2. **Initial sync**: When started with `--initial-sync`, performs a full scan of each table to sync existing data
3. **Ongoing sync**: Continuously polls webhooks and replicates changes to PostgreSQL using the `@bluedot/db` library
