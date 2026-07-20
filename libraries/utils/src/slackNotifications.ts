type SlackAlertEnv = {
  APP_NAME: string;
  ALERTS_SLACK_BOT_TOKEN: string;
  ALERTS_SLACK_CHANNEL_ID: string;
};

type SlackAlertOptions = {
  channelId?: string;
  batchKey?: string;
  flushIntervalMs?: number;
  // When a batched signature affects at least this many distinct records within a
  // flush window, cross-post the batched summary to escalationChannelId. Lets a
  // low-priority side channel stay quiet for routine drift while a sudden base-wide
  // spike still reaches the main alerts channel.
  spikeThreshold?: number;
  escalationChannelId?: string;
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
  channelId: string;
  spikeThreshold?: number;
  escalationChannelId?: string;
  createdAt?: number;
};

export const DEFAULT_FLUSH_INTERVAL_MS = 60000;
const batchers = new Map<string, BatcherState>();

/**
 * Sends Slack message(s) to our prod/dev channels
 * - By default, messages are sent immediately to ALERTS_SLACK_CHANNEL_ID
 * - To send to a different channel, provide a channelId
 * - To enable batching, provide a batchKey - messages will be grouped by signature (same error type/table/field)
 * - Batching uses a rolling window: messages are sent N ms after the last message (not from the first)
 * - If multiple messages are provided, the first is sent as a new message, and the rest are sent as replies in a thread
 *
 * @param options.channelId - If provided, sends to this channel instead of ALERTS_SLACK_CHANNEL_ID
 * @param options.batchKey - If provided, enables batching with this key as the batch group identifier
 * @param options.flushIntervalMs - Time window for batching in ms (default: 60000, only used when batchKey is provided). Uses a rolling window - each new message resets the timer.
 * @param options.spikeThreshold - If provided, when a batched signature affects at least this many distinct records within a flush window, cross-post the batched summary to escalationChannelId.
 * @param options.escalationChannelId - If provided, specifies the channel to which batched summaries are cross-posted when the spikeThreshold is exceeded.
 */
export const slackAlert = async (
  env: SlackAlertEnv,
  messages: string[],
  options?: SlackAlertOptions,
): Promise<void> => {
  if (messages.length === 0) {
    return;
  }

  const channelId = options?.channelId ?? env.ALERTS_SLACK_CHANNEL_ID;
  const flushIntervalMs = options?.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;

  if (options?.batchKey) {
    addToBatch(getBatcherKey(options.batchKey, env, channelId), env, messages, channelId, flushIntervalMs, {
      spikeThreshold: options.spikeThreshold,
      escalationChannelId: options.escalationChannelId,
    });
    return;
  }

  try {
    const res = await sendSingleSlackMessage(env, messages[0]!, channelId);
    for (let i = 1; i < messages.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await sendSingleSlackMessage(env, messages[i]!, channelId, res.ts);
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error sending Slack alert:', error);
  }
};

const getBatcherKey = (batchKey: string, env: SlackAlertEnv, channelId: string) => {
  return `${batchKey}-${env.APP_NAME}-${channelId}`;
};

const addToBatch = (
  batchKey: string,
  env: SlackAlertEnv,
  messages: string[],
  channelId: string,
  flushIntervalMs: number,
  spikeOptions: { spikeThreshold?: number; escalationChannelId?: string },
) => {
  const [mainMessage] = messages;
  if (!mainMessage) {
    return;
  }

  const { tableId, fieldId, recordIds } = extractAirtableIds(mainMessage);
  const signature = getMessageSignature(mainMessage);

  let batcher = batchers.get(batchKey);

  if (!batcher) {
    batcher = {
      batches: new Map(),
      flushTimer: null,
      env,
      channelId,
      spikeThreshold: spikeOptions.spikeThreshold,
      escalationChannelId: spikeOptions.escalationChannelId,
    };
    batchers.set(batchKey, batcher);
  } else {
    // Keep spike settings current: a later call in the same window should not be
    // silently ignored just because the batcher already exists.
    batcher.spikeThreshold = spikeOptions.spikeThreshold;
    batcher.escalationChannelId = spikeOptions.escalationChannelId;
  }

  const existing = batcher.batches.get(signature);
  if (existing) {
    existing.occurrences += 1;
    existing.lastSeen = Date.now();
    recordIds.forEach((id) => {
      existing.affectedRecords.add(id);
    });
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

  scheduleFlush(batchKey, flushIntervalMs).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Error scheduling flush:', error);
  });
};

const getMessageSignature = (message: string) => {
  // Match Airtable IDs (tbl/fld/rec + 10+ alphanumeric chars)
  return message
    .replace(/\btbl[A-Za-z0-9]{10,}/g, 'tbl***')
    .replace(/\bfld[A-Za-z0-9]{10,}/g, 'fld***')
    .replace(/\brec[A-Za-z0-9]{10,}/g, 'rec***');
};

const extractAirtableIds = (message: string) => {
  const tableId = (/\btbl[A-Za-z0-9]{10,}/.exec(message))?.[0] ?? null;
  const fieldId = (/\bfld[A-Za-z0-9]{10,}/.exec(message))?.[0] ?? null;
  const recordIds = message.match(/\brec[A-Za-z0-9]{10,}/g) ?? [];
  return { tableId, fieldId, recordIds };
};

const shouldForceFlush = (batcher: BatcherState, flushIntervalMs: number) => {
  // Hard upper bound: flush at most 5× the interval after the first message
  // This prevents never flushing if messages keep coming in at a high rate, while still allowing for bursts of messages to be batched together
  const maxDelayMs = flushIntervalMs * 5;
  const batcherCreatedAt = batcher.createdAt ?? Date.now();
  const elapsed = Date.now() - batcherCreatedAt;
  const effectiveDelay = Math.min(flushIntervalMs, maxDelayMs - elapsed);
  return effectiveDelay <= 0;
};

const flushAndCleanupBatcher = async (batchKey: string, batcher: BatcherState) => {
  try {
    await flushBatcher(batcher);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error flushing batched Slack alerts:', error);
  } finally {
    batcher.batches.clear();

    batcher.flushTimer = null;
    batchers.delete(batchKey);
  }
};

const scheduleFlush = async (batchKey: string, flushIntervalMs: number) => {
  const batcher = batchers.get(batchKey);
  if (!batcher) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (!batcher.createdAt) batcher.createdAt = Date.now();

  if (shouldForceFlush(batcher, flushIntervalMs)) {
    await flushAndCleanupBatcher(batchKey, batcher);
    return;
  }

  // Clear existing timer to implement rolling window
  if (batcher.flushTimer) {
    clearTimeout(batcher.flushTimer);
  }

  batcher.flushTimer = setTimeout(async () => {
    await flushAndCleanupBatcher(batchKey, batcher);
  }, flushIntervalMs);
};

const flushBatcher = async (batcher: BatcherState) => {
  if (batcher.batches.size === 0) {
    return;
  }

  const batchesToSend = Array.from(batcher.batches.values());

  for (const batch of batchesToSend) {
    const [mainMessage, ...replies] = batch.messages;
    const messages: string[] = [];

    // Build main message
    if (batch.occurrences > 1) {
      const tableInfo = batch.tableId ? ` (Table: ${batch.tableId})` : '';
      const fieldInfo = batch.fieldId ? ` (Field: ${batch.fieldId})` : '';
      const header = `${mainMessage}${tableInfo}${fieldInfo}\n\n⚠️ This error occurred ${batch.occurrences} times`;

      // Only Airtable-derived warnings carry record IDs; other batched errors
      // (e.g. tRPC server errors) have none, so drop the record clause for them.
      if (batch.affectedRecords.size > 0) {
        const recordList = Array.from(batch.affectedRecords).slice(0, 10).join(', ');
        const moreRecords = batch.affectedRecords.size > 10 ? ` and ${batch.affectedRecords.size - 10} more` : '';
        const recordNoun = batch.affectedRecords.size === 1 ? 'record' : 'records';

        messages.push(`${header} affecting ${batch.affectedRecords.size} ${recordNoun}:\n${recordList}${moreRecords}`);
      } else {
        messages.push(`${header}.`);
      }
    } else {
      messages.push(mainMessage!);
    }

    // Add replies: first reply only for batched, all replies for single occurrence
    const repliesToSend = batch.occurrences > 1 ? replies.slice(0, 1) : replies;
    messages.push(...repliesToSend);

    // Send the batched message immediately (bypass batching for the flush)
    try {
      // eslint-disable-next-line no-await-in-loop
      const res = await sendSingleSlackMessage(batcher.env, messages[0]!, batcher.channelId);
      for (let i = 1; i < messages.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await sendSingleSlackMessage(batcher.env, messages[i]!, batcher.channelId, res.ts);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending batched Slack alert:', error);
    }

    // eslint-disable-next-line no-await-in-loop
    await maybeEscalateSpike(batcher, batch, messages[0]!);
  }
};

const maybeEscalateSpike = async (batcher: BatcherState, batch: MessageBatch, mainMessage: string) => {
  const { spikeThreshold, escalationChannelId } = batcher;
  if (spikeThreshold === undefined || !escalationChannelId || escalationChannelId === batcher.channelId) {
    return;
  }

  // Distinct records is the blast radius; fall back to raw occurrences when a
  // warning carries no record IDs (e.g. a retry loop on the same broken field).
  const spikeCount = batch.affectedRecords.size > 0 ? batch.affectedRecords.size : batch.occurrences;
  if (spikeCount < spikeThreshold) {
    return;
  }

  try {
    await sendSingleSlackMessage(
      batcher.env,
      `🚨 High-volume warning spike (${spikeCount} affected in one window, threshold ${spikeThreshold}):\n${mainMessage}`,
      escalationChannelId,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error escalating spiked Slack alert:', error);
  }
};

const sendSingleSlackMessage = async (
  env: SlackAlertEnv,
  message: string,
  channelId: string,
  threadTs?: string,
): Promise<{ ts: string }> => {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.ALERTS_SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify({
      channel: channelId,
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
