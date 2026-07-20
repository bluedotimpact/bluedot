import { PgAirtableDb, createTestDbClients, formatAirtableWarning } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils';
import env from '../env';

const isTest = env.VITEST === 'true';

export default new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  ...(isTest ? createTestDbClients() : {}),
  async onWarning(warning: unknown) {
    const { messages, batchGroup } = formatAirtableWarning(warning);
    await slackAlert(env, messages, { batchKey: 'airtable-validation', batchGroup });
  },
});
