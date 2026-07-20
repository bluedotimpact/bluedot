type SlackAlertEnv = {
  APP_NAME: string;
  ALERTS_SLACK_BOT_TOKEN: string;
  ALERTS_SLACK_CHANNEL_ID: string;
};

// Domain-neutral batching metadata. Callers describe how to group and summarise their
// messages without the util needing to know anything about the message contents.
type BatchGroup = {
  // Grouping key: messages sharing a signature collapse into one batch. Defaults to the
  // message text, so callers wanting to group by e.g. error type (ignoring embedded IDs)
  // must supply a stable signature themselves.
  signature?: string;
  // Distinct affected items. Deduplicated across the window, counted, and listed in the
  // batched summary ("affecting N …", first 10 + "and M more").
  dedupeKeys?: string[];
  // Noun for the count line, e.g. 'record'. Pluralised automatically. Defaults to 'item'.
  itemNoun?: string;
  // Extra header fragments appended to the batched summary, each rendered as ` (fragment)`,
  // e.g. 'Table: tbl123'.
  annotations?: string[];
};

type SlackAlertOptions = {
  channelId?: string;
  batchKey?: string;
  flushIntervalMs?: number;
  // When a batched signature affects at least this many distinct items within a
  // flush window, cross-post the batched summary to escalationChannelId. Lets a
  // low-priority side channel stay quiet for routine drift while a sudden base-wide
  // spike still reaches the main alerts channel.
  spikeThreshold?: number;
  escalationChannelId?: string;
  // How to group and summarise batched messages. Only used when batchKey is set.
  batchGroup?: BatchGroup;
};

type MessageBatch = {
  signature: string;
  occurrences: number;
  messages: string[];
  annotations: string[];
  itemNoun: string;
  dedupedItems: Set<string>;
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
 * - To enable batching, provide a batchKey - messages are grouped by signature (the message text by default, or batchGroup.signature)
 * - Batching uses a rolling window: messages are sent N ms after the last message (not from the first)
 * - If multiple messages are provided, the first is sent as a new message, and the rest are sent as replies in a thread
 *
 * @param options.channelId - If provided, sends to this channel instead of ALERTS_SLACK_CHANNEL_ID
 * @param options.batchKey - If provided, enables batching with this key as the batch group identifier
 * @param options.flushIntervalMs - Time window for batching in ms (default: 60000, only used when batchKey is provided). Uses a rolling window - each new message resets the timer.
 * @param options.spikeThreshold - If provided, when a batched signature affects at least this many distinct items within a flush window, cross-post the batched summary to escalationChannelId.
 * @param options.escalationChannelId - If provided, specifies the channel to which batched summaries are cross-posted when the spikeThreshold is exceeded.
 * @param options.batchGroup - If provided, controls how batched messages are grouped and summarised (signature, dedupeKeys, itemNoun, annotations).
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
      batchGroup: options.batchGroup,
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
  spikeOptions: { spikeThreshold?: number; escalationChannelId?: string; batchGroup?: BatchGroup },
) => {
  const [mainMessage] = messages;
  if (!mainMessage) {
    return;
  }

  const { batchGroup } = spikeOptions;
  const signature = batchGroup?.signature ?? mainMessage;
  const dedupeKeys = batchGroup?.dedupeKeys ?? [];

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
    dedupeKeys.forEach((id) => {
      existing.dedupedItems.add(id);
    });
  } else {
    batcher.batches.set(signature, {
      signature,
      occurrences: 1,
      messages,
      annotations: batchGroup?.annotations ?? [],
      itemNoun: batchGroup?.itemNoun ?? 'item',
      dedupedItems: new Set(dedupeKeys),
      lastSeen: Date.now(),
    });
  }

  scheduleFlush(batchKey, flushIntervalMs).catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Error scheduling flush:', error);
  });
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
      const annotationInfo = batch.annotations.map((a) => ` (${a})`).join('');
      const header = `${mainMessage}${annotationInfo}\n\n⚠️ This error occurred ${batch.occurrences} times`;

      // Only callers that pass dedupeKeys carry affected items; others (e.g. tRPC
      // server errors) have none, so drop the item clause for them.
      if (batch.dedupedItems.size > 0) {
        const itemList = Array.from(batch.dedupedItems).slice(0, 10).join(', ');
        const moreItems = batch.dedupedItems.size > 10 ? ` and ${batch.dedupedItems.size - 10} more` : '';
        const noun = batch.dedupedItems.size === 1 ? batch.itemNoun : `${batch.itemNoun}s`;

        messages.push(`${header} affecting ${batch.dedupedItems.size} ${noun}:\n${itemList}${moreItems}`);
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

  // Distinct affected items is the blast radius; fall back to raw occurrences when a
  // batch carries no dedupeKeys (e.g. a retry loop on the same broken field).
  const spikeCount = batch.dedupedItems.size > 0 ? batch.dedupedItems.size : batch.occurrences;
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
