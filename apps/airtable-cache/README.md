# airtable-cache

A caching proxy to Airtable. Consumers can generally ignore the details, and just pretend this is Airtable itself for standard [Airtable API](https://airtable.com/developers/web/api/) routes. For example, with [`airtable-ts`](https://github.com/domdomegg/airtable-ts):

```ts
import { AirtableTs } from 'airtable-ts';

const db = new AirtableTs({
  apiKey: 'pat1234.abcdef',
  // Add this line
  endpointUrl: 'https://airtable-proxy.k8s.bluedot.org/'
});
```

## Details

Under the hood, we intercept and cache certain types of successful responses. This means data will usually load more quickly, especially for larger tables.

We store the cache results in a Postgres table. We chose this over a cache solution like Redis because we already have a Postgres cluster set up, and [we like boring technology](https://boringtechnology.club/).

We invalidate cache entries when records are directly updated. Updates performed outside of airtable-cache can risk stale data being returned. Your app should be able to handle stale data this given Airtable itself only provides eventually consistent updates. However, if you _really_ need to override the cache, send a DELETE request to `/cache/{cacheKeyPrefix}`, with your Airtable Bearer token authorization. The `cacheKey` should be a `baseId`, a `baseId,tableId`, or `baseId,tableId,recordId` - do try to be as specific as possible!

## Developer setup

No special actions needed, just follow [the general developer setup instructions](../../README.md#developer-setup-instructions)

## Deployment

This app is deployed onto the K8s cluster as a docker container.

To deploy a new version, simply commit to the master branch. GitHub Actions automatically handles CD.

## TODO

- deleting old entries in the cache. need some kind of cron job in the app
