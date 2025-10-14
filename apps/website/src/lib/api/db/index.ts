import { PgAirtableDb } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils';
import env from '../env';

export default new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  onWarning: async (warning: unknown) => {
    try {
      const err = warning instanceof Error ? warning : new Error(String(warning));
      await slackAlert(env, [
        `Airtable validation warning encountered, attempting to proceed by setting the affected fields to undefined. Warning message: ${err.message}`,
        ...(err.stack ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : []),
      ]);
    } catch (slackError) {
      // eslint-disable-next-line no-console
      console.error('Failed to send Slack alert', slackError);
    }
  },
});
