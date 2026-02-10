type SlackAlertEnv = {
  APP_NAME: string;
  ALERTS_SLACK_BOT_TOKEN: string;
  ALERTS_SLACK_CHANNEL_ID: string;
  INFO_SLACK_CHANNEL_ID: string;
};

type SlackAlertOptions = {
  level?: 'error' | 'info';
  batchKey?: string;
  flushIntervalMs?: number;
};

type MessageBatch = {
  signature: string;
  occurrences: number;
  messages: string[];
  tableId: string | null;
  fieldId: string | null;
  affectedRecords: Set<string>;
  lastSeen: number;
};

type BatcherState = {
  batches: Map<string, MessageBatch>;
  flushTimer: NodeJS.Timeout | null;
  env: SlackAlertEnv;
  level: 'error' | 'info';
};

export const DEFAULT_FLUSH_INTERVAL_MS = 60000;
const batchers = new Map<string, BatcherState>();

/**
 * Sends Slack message(s) to our prod/dev channels
 * - By default, messages are sent immediately
 * - To enable batching, provide a batchKey - messages will be grouped by signature (same error type/table/field) and sent after a 60s window
 * - If multiple messages are provided, the first is sent as a new message, and the rest are sent as replies in a thread
 *
 * @param options.level - Alert level: 'error' (default) or 'info'. Determines which Slack channel the message is sent to.
 * @param options.batchKey - If provided, enables batching with this key as the batch group identifier
 * @param options.flushIntervalMs - Time window for batching in ms (default: 60000, only used when batchKey is provided)
 */
export const slackAlert = async (
  env: SlackAlertEnv,
  messages: string[],
  options?: SlackAlertOptions,
): Promise<void> => {
  if (messages.length === 0) return;

  const level = options?.level ?? 'error';
  const flushIntervalMs = options?.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;

  if (options?.batchKey) {
    addToBatch(options.batchKey, env, messages, level, flushIntervalMs);
    return;
  }

  try {
    const res = await sendSingleSlackMessage(env, messages[0]!, level);
    for (let i = 1; i < messages.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await sendSingleSlackMessage(env, messages[i]!, level, res.ts);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending Slack alert:', error);
  }
};

const addToBatch = (
  batchKey: string,
  env: SlackAlertEnv,
  messages: string[],
  level: 'error' | 'info',
  flushIntervalMs: number,
) => {
  const [mainMessage] = messages;
  if (!mainMessage) return;

  const { tableId, fieldId, recordIds } = extractAirtableIds(mainMessage);
  const signature = getMessageSignature(mainMessage);

  let batcher = batchers.get(batchKey);

  if (!batcher) {
    batcher = {
      batches: new Map(),
      flushTimer: null,
      env,
      level,
    };
    batchers.set(batchKey, batcher);
  }

  const existing = batcher.batches.get(signature);
  if (existing) {
    existing.occurrences += 1;
    existing.lastSeen = Date.now();
    recordIds.forEach((id) => existing.affectedRecords.add(id));
  } else {
    batcher.batches.set(signature, {
      signature,
      occurrences: 1,
      messages,
      tableId,
      fieldId,
      affectedRecords: new Set(recordIds),
      lastSeen: Date.now(),
    });
  }

  scheduleFlush(batchKey, flushIntervalMs);
};

const getMessageSignature = (message: string) => {
  // Match Airtable IDs (tbl/fld/rec + 10+ alphanumeric chars)
  return message
    .replace(/\btbl[A-Za-z0-9]{10,}/g, 'tbl***')
    .replace(/\bfld[A-Za-z0-9]{10,}/g, 'fld***')
    .replace(/\brec[A-Za-z0-9]{10,}/g, 'rec***');
};

const extractAirtableIds = (message: string) => {
  const tableId = message.match(/\btbl[A-Za-z0-9]{10,}/)?.[0] ?? null;
  const fieldId = message.match(/\bfld[A-Za-z0-9]{10,}/)?.[0] ?? null;
  const recordIds = message.match(/\brec[A-Za-z0-9]{10,}/g) ?? [];
  return { tableId, fieldId, recordIds };
};

const scheduleFlush = (batchKey: string, flushIntervalMs: number) => {
  const batcher = batchers.get(batchKey);
  if (!batcher || batcher.flushTimer) return;

  batcher.flushTimer = setTimeout(async () => {
    try {
      await flushBatcher(batcher);
      batcher.batches.clear();
      batcher.flushTimer = null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error flushing batched Slack alerts:', error);
    }
  }, flushIntervalMs);
};

const flushBatcher = async (batcher: BatcherState) => {
  if (batcher.batches.size === 0) return;

  const batchesToSend = Array.from(batcher.batches.values());

  for (const batch of batchesToSend) {
    const [mainMessage, ...replies] = batch.messages;
    const messages: string[] = [];

    // Build main message
    if (batch.occurrences > 1) {
      const tableInfo = batch.tableId ? ` (Table: ${batch.tableId})` : '';
      const fieldInfo = batch.fieldId ? ` (Field: ${batch.fieldId})` : '';
      const recordList = Array.from(batch.affectedRecords).slice(0, 10).join(', ');
      const moreRecords = batch.affectedRecords.size > 10 ? ` and ${batch.affectedRecords.size - 10} more` : '';

      messages.push(
        `${mainMessage}${tableInfo}${fieldInfo}\n\n`
        + `⚠️ This error occurred ${batch.occurrences} times affecting ${batch.affectedRecords.size} record(s):\n`
        + `${recordList}${moreRecords}`,
      );
    } else {
      messages.push(mainMessage!);
    }

    // Add replies: first reply only for batched, all replies for single occurrence
    const repliesToSend = batch.occurrences > 1 ? replies.slice(0, 1) : replies;
    messages.push(...repliesToSend);

    // Send the batched message immediately (bypass batching for the flush)
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await sendSingleSlackMessage(batcher.env, messages[0]!, batcher.level);
      for (let i = 1; i < messages.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await sendSingleSlackMessage(batcher.env, messages[i]!, batcher.level, res.ts);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending batched Slack alert:', error);
    }
  }
};

const sendSingleSlackMessage = async (
  env: SlackAlertEnv,
  message: string,
  level: 'error' | 'info' = 'error',
  threadTs?: string,
): Promise<{ ts: string }> => {
  // By default we send to the alerts channel if no explicit channel is provided
  const channel = level === 'error' ? env.ALERTS_SLACK_CHANNEL_ID : env.INFO_SLACK_CHANNEL_ID;

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ALERTS_SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel,
      text: `${env.APP_NAME}: ${message}`,
      thread_ts: threadTs,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(`Error from Slack API: ${data.error ?? response.statusText}`);
  }

  return { ts: data.ts };
};
