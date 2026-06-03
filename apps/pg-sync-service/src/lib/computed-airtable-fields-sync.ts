import {
  computedAirtableFieldDefinitions,
  recomputeComputedAirtableFieldsAndSyncToAirtable,
} from '@bluedot/computed-airtable-fields';
import { logger } from '@bluedot/ui/src/api';
import { db } from './db';

export const recomputeComputedAirtableFields = async () => {
  const results = await recomputeComputedAirtableFieldsAndSyncToAirtable({
    db,
    definitions: computedAirtableFieldDefinitions,
  });

  for (const result of results) {
    logger.info(`[computed-airtable-fields] ${result.table}.${result.field}: checked ${result.checked}, updated ${result.updated}`);
  }
};
