// Experimental version of the sysnc service. Implemented as an API route so
// I can trigger it with a button

import { z } from 'zod';

import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { userTable } from '../../../db/schema';
import { pg } from '../../../db';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.any(),
}, async () => {
  // Cases:
  // 1. When triggered by a webhook
  // 2. When scanning the full base

  // Desirable properties of the sync service:
  // - Depends only on the databases in question, not on any code stored elsewhere. Reasons:
  //  - Requires only two things to be consistent (the state of both databases), rather than 3
  //  - It makes it easier to run the service locally against a dev database that you fiddle with

  // Case 2 (most general)
  // 1. Scan the metadata of the db, find tables that need to be synced
  // 2. For each table, poll for every record
  // 3. Check all the ids that exist in airtable exist in postgres
  //   i. If not compare contents of fields that are mapped, if there is a diff, build a query to write to the field

  // Components of the above:
  // 1. getTablesToSync() -> returns map of airtable tableId -> relevant info about postgres table
  // 2. getDiffRecords() -> look up all identifiers in airtable, and all in postgres, diff to see if they match
  //   i. First pass: Create records that don't exist in postgres, delete ones that only exist in postgres
  //   ii. Second pass: Diff records that exist in both, and overwrite in postgres with the new data
  //     - Note: Think about edge case where there is a write in postgres that hasn't come through to Airtable yet
});
