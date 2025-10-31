import { PgAirtableDb } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils';
import env from '../env';
import { RateLimiter } from './rate-limiter';

// Rate limiting: During initial sync there is the potential to generate thousands of redundant warnings
// if there is a mismatch between the schema and Airtable. Drop these above a low rate limit.
const alertRateLimiter = new RateLimiter(30, 30_000);

export const db = new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  onWarning: async (warning: unknown) => {
    const err = warning instanceof Error ? warning : new Error(String(warning));
    const message = `Airtable validation warning encountered, attempting to proceed by setting the affected fields to undefined. Warning message: ${err.message}`;

    // eslint-disable-next-line no-console
    console.warn(message);

    const { allowed: slackAlertAllowed, lastAllowedRequest } = alertRateLimiter.tryAcquire();

    if (!slackAlertAllowed) {
      return;
    }

    await slackAlert(env, [
      message,
      ...(err.stack ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : []),
    ]);

    if (lastAllowedRequest) {
      await slackAlert(env, [
        'Rate limit hit for Airtable validation warnings. Any new warnings will be logged but not sent to Slack until the rate limit expires.',
      ]);
    }
  },
});
