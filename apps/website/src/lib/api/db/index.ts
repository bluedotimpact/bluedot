import { PgAirtableDb } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils';
import env from '../env';

const isTest = env.VITEST === 'true';

export default new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  isTest,
  async onWarning(warning: unknown) {
    const err = warning instanceof Error ? warning : new Error(String(warning));
    await slackAlert(env, [
      `Airtable validation warning encountered, attempting to proceed by setting the affected fields to undefined. Warning message: ${err.message}`,
      ...(err.stack ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : []),
    ], { batchKey: 'airtable-validation' });
  },
});
