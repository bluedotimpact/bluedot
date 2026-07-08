import { PgAirtableDb, createTestDbClients } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils';
import env from '../env';

const isTest = env.VITEST === 'true';

// Validation warnings are mostly schema/Airtable drift, so they go to a
// dedicated low-priority channel to keep the main alerts channel readable. A
// sudden spike affecting many records in one flush window likely signals a new
// schema change or other breakage -> escalate to the main alerts channel when
// the distinct affected-record count in a window reaches this threshold (falls
// back to raw occurrence count for warnings with no record IDs).
const VALIDATION_WARNING_SPIKE_THRESHOLD = 25;

export const db = new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  ...(isTest ? createTestDbClients() : {}),
  onWarning: async (warning: unknown) => {
    const err = warning instanceof Error ? warning : new Error(String(warning));
    const message = `Airtable validation warning encountered, attempting to proceed by setting the affected fields to undefined. Warning message: ${err.message}`;

    // eslint-disable-next-line no-console
    console.warn(message);

    await slackAlert(env, [
      message,
      ...(err.stack ? [`Stack:\n\`\`\`${err.stack}\`\`\``] : []),
    ], {
      channelId: env.PG_SYNC_SLACK_CHANNEL_ID,
      batchKey: 'airtable-validation',
      spikeThreshold: VALIDATION_WARNING_SPIKE_THRESHOLD,
      escalationChannelId: env.ALERTS_SLACK_CHANNEL_ID,
    });
  },
});
