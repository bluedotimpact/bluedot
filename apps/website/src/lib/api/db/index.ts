import { PgAirtableDb, createTestDbClients, formatAirtableWarning } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils';
import env from '../env';

const isTest = env.VITEST === 'true';

export default new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  ...(isTest ? createTestDbClients() : {}),
  async onWarning(warning: unknown) {
    const err = warning instanceof Error ? warning : new Error(String(warning));
    const formatted = formatAirtableWarning(err.message);
    const message = formatted?.message ?? err.message;
    await slackAlert(env, [
      message,
      ...(err.stack ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : []),
    ], {
      batchKey: 'airtable-validation',
      ...(formatted ? { batchGroup: formatted.batchGroup } : {}),
    });
  },
});
