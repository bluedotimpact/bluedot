import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { DEFAULT_FLUSH_INTERVAL_MS, slackAlert } from './slackNotifications';

const mockEnv = {
  APP_NAME: 'test-app',
  ALERTS_SLACK_BOT_TOKEN: 'test-token',
  ALERTS_SLACK_CHANNEL_ID: 'test-channel',
};

const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';

describe('slackNotifications', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    originalFetch = global.fetch;
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllTimers();
    vi.restoreAllMocks();
  });

  describe('immediate mode', () => {
    test('should send a single message immediately', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await slackAlert(mockEnv, ['Test message']);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        SLACK_API_URL,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({
            channel: 'test-channel',
            text: 'test-app: Test message',
            thread_ts: undefined,
          }),
        }),
      );
    });

    test('should send multiple messages as thread replies', async () => {
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.0' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.1' }),
        });

      await slackAlert(mockEnv, ['Main message', 'Reply message']);

      expect(fetchMock).toHaveBeenCalledTimes(2);

      // First call - main message
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        SLACK_API_URL,
        expect.objectContaining({
          body: JSON.stringify({
            channel: 'test-channel',
            text: 'test-app: Main message',
            thread_ts: undefined,
          }),
        }),
      );

      // Second call - reply in thread
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        SLACK_API_URL,
        expect.objectContaining({
          body: JSON.stringify({
            channel: 'test-channel',
            text: 'test-app: Reply message',
            thread_ts: '1.0',
          }),
        }),
      );
    });

    test('should use provided channelId instead of default', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await slackAlert(mockEnv, ['Info message'], { channelId: 'custom-channel' });

      expect(fetchMock).toHaveBeenCalledWith(
        SLACK_API_URL,
        expect.objectContaining({
          body: JSON.stringify({
            channel: 'custom-channel',
            text: 'test-app: Info message',
            thread_ts: undefined,
          }),
        }),
      );
    });
  });

  describe('batching mode', () => {
    test('should batch by shared signature and render dedupeKeys and annotations', async () => {
      const message = 'Field `unitNumber` on `exercise`: cannot map value. Set to undefined.';
      const batchGroupFor = (recordId: string) => ({
        signature: 'exercise/unitNumber',
        dedupeKeys: [recordId],
        itemNoun: 'record',
        annotations: ['Table: tbla7lc2MtSSbWVvS', 'Field: fldL42M2hgchJYIdD'],
      });

      slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: batchGroupFor('rec3BGObwkLPSskvb') });
      slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: batchGroupFor('rec3qTvZcFGYccFcl') });
      slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: batchGroupFor('rec3060zKybkbm9UH') });

      // No messages sent yet
      expect(fetchMock).not.toHaveBeenCalled();

      // Mock the flush
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      // Advance timers to trigger flush
      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      // Should send one batched message
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('test-app:');
      expect(callBody.text).toContain('This error occurred 3 times affecting 3 records');
      expect(callBody.text).toContain('rec3BGObwkLPSskvb');
      expect(callBody.text).toContain('rec3qTvZcFGYccFcl');
      expect(callBody.text).toContain('rec3060zKybkbm9UH');
      expect(callBody.text).toContain('Table: tbla7lc2MtSSbWVvS');
      expect(callBody.text).toContain('Field: fldL42M2hgchJYIdD');
    });

    test('should send single occurrence without batching summary', async () => {
      const message = 'Failed to map field unitNumber (fldL42M2hgchJYIdD) from Airtable for table exercise (tbla7lc2MtSSbWVvS) and record rec3BGObwkLPSskvb';

      slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(fetchMock).toHaveBeenCalledTimes(1);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toBe(`test-app: ${message}`);
      expect(callBody.text).not.toContain('This error occurred');
    });

    test('should batch messages without record IDs and omit the record clause', async () => {
      const message = 'Error: Failed request on route users.getUser, type query: The service is temporarily unavailable. Please retry shortly.';

      slackAlert(mockEnv, [message], { batchKey: 'trpc-server-errors', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      slackAlert(mockEnv, [message], { batchKey: 'trpc-server-errors', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      slackAlert(mockEnv, [message], { batchKey: 'trpc-server-errors', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(fetchMock).toHaveBeenCalledTimes(1);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('This error occurred 3 times.');
      expect(callBody.text).not.toContain('record(s)');
      expect(callBody.text).not.toContain('affecting');
    });

    test('should collapse differing messages that share an explicit signature', async () => {
      // Distinct message bodies but the same signature must land in one batch.
      slackAlert(mockEnv, ['Error affecting Alice'], {
        batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: { signature: 'same-group', dedupeKeys: ['a'] },
      });
      slackAlert(mockEnv, ['Error affecting Bob'], {
        batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: { signature: 'same-group', dedupeKeys: ['b'] },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      // First message wins as the batch's main message.
      expect(callBody.text).toContain('Error affecting Alice');
      expect(callBody.text).toContain('This error occurred 2 times affecting 2 items');
    });

    test('should default itemNoun to a pluralised "item"', async () => {
      slackAlert(mockEnv, ['boom'], {
        batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: { signature: 'g', dedupeKeys: ['x'] },
      });
      slackAlert(mockEnv, ['boom'], {
        batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: { signature: 'g', dedupeKeys: ['y'] },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('affecting 2 items');
    });

    test('should preserve first reply in batched messages', async () => {
      const message1 = ['Main error message', 'Stack trace here'];
      const message2 = ['Main error message', 'Different stack trace'];

      slackAlert(mockEnv, message1, { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      slackAlert(mockEnv, message2, { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.0' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.1' }),
        });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      // Should send main message and first reply
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const mainBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(mainBody.text).toContain('This error occurred 2 times');
      expect(mainBody.thread_ts).toBeUndefined();

      const replyBody = JSON.parse(fetchMock.mock.calls[1]?.[1].body);
      expect(replyBody.text).toBe('test-app: Stack trace here');
      expect(replyBody.thread_ts).toBe('1.0');
    });

    test('should preserve all replies for single occurrence', async () => {
      const messages = ['Main error', 'Reply 1', 'Reply 2'];

      slackAlert(mockEnv, messages, { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.0' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.2' }),
        });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(fetchMock).toHaveBeenCalledTimes(3);

      const mainBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(mainBody.text).toBe('test-app: Main error');

      const reply1Body = JSON.parse(fetchMock.mock.calls[1]?.[1].body);
      expect(reply1Body.text).toBe('test-app: Reply 1');

      const reply2Body = JSON.parse(fetchMock.mock.calls[2]?.[1].body);
      expect(reply2Body.text).toBe('test-app: Reply 2');
    });

    test('should deduplicate items across batches', async () => {
      const dedupe = (key: string) => ({ batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: { signature: 'g', dedupeKeys: [key], itemNoun: 'record' } });

      slackAlert(mockEnv, ['Error'], dedupe('rec1AbCdEfGhIjKl'));
      slackAlert(mockEnv, ['Error'], dedupe('rec1AbCdEfGhIjKl')); // Same key
      slackAlert(mockEnv, ['Error'], dedupe('rec2MnOpQrStUvWx'));

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('affecting 2 records'); // Only unique keys
      expect(callBody.text).toContain('rec1AbCdEfGhIjKl');
      expect(callBody.text).toContain('rec2MnOpQrStUvWx');
    });

    test('should limit the item list to 10', async () => {
      const recordIds = Array.from({ length: 15 }, (_, i) => `rec${i}AbCdEfGhIjKl`);

      for (const recordId of recordIds) {
        slackAlert(mockEnv, ['Error'], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS, batchGroup: { signature: 'g', dedupeKeys: [recordId], itemNoun: 'record' } });
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('affecting 15 records');
      expect(callBody.text).toContain('and 5 more'); // 15 - 10 = 5
    });

    test('should use separate batch keys', async () => {
      slackAlert(mockEnv, ['Batch 1 message'], { batchKey: 'batch1', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      slackAlert(mockEnv, ['Batch 2 message'], { batchKey: 'batch2', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.0' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, ts: '1.1' }),
        });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      // Should send two separate messages
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test('should reschedule flush timer on new messages (rolling window)', async () => {
      const message = 'Error message rec1AbCdEfGhIjKl';
      const flushInterval = 1000;

      // First message at time 0 - timer scheduled for 1000ms
      slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs: flushInterval });

      // Advance to 800ms
      await vi.advanceTimersByTimeAsync(800);
      expect(fetchMock).not.toHaveBeenCalled();

      // Second message at 800ms - timer should reschedule to 1800ms (800 + 1000)
      slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs: flushInterval });

      // Advance to 1000ms total (original flush time) - should NOT flush
      await vi.advanceTimersByTimeAsync(200);
      expect(fetchMock).not.toHaveBeenCalled();

      // Mock the flush
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      // Advance to 1800ms total (rescheduled flush time) - should flush
      await vi.advanceTimersByTimeAsync(800);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('This error occurred 2 times');
    });

    test('should force flush immediately when max delay (5× interval) is exceeded', async () => {
      const message = 'Error message rec1AbCdEfGhIjKl';
      const flushIntervalMs = 1000;

      // First message at time 0
      slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs });

      // Keep resetting the timer by sending messages just before it flushes
      // This simulates a high-traffic scenario where the rolling window keeps getting reset
      for (let i = 0; i < 5; i++) {
        // eslint-disable-next-line no-await-in-loop
        await vi.advanceTimersByTimeAsync(flushIntervalMs - 100);
        slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs });
      }

      // Total elapsed: 900ms * 5 = 4500ms (still under 5000ms max delay)
      expect(fetchMock).not.toHaveBeenCalled();

      // Advance past the max delay threshold
      await vi.advanceTimersByTimeAsync(600); // Total: 5100ms

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      // Should flush immediately without needing to advance timers
      await slackAlert(mockEnv, [message], { batchKey: 'test', flushIntervalMs });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('This error occurred 7 times'); // 1 + 5 + 1 = 7 messages
    });
  });

  describe('spike escalation', () => {
    const escalationChannelId = 'alerts-channel';

    test('cross-posts batched summary to escalation channel when item count hits threshold', async () => {
      const recordIds = ['rec1AbCdEfGhIjKl', 'rec2MnOpQrStUvWx', 'rec3ZzYyXxWwVvUu'];

      for (const recordId of recordIds) {
        slackAlert(mockEnv, ['Validation warning'], {
          batchKey: 'test',
          flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
          spikeThreshold: 3,
          escalationChannelId,
          batchGroup: { signature: 'g', dedupeKeys: [recordId] },
        });
      }

      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, ts: '1.0' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, ts: '2.0' }) });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      // One batched message to the default channel + one escalation to the alerts channel
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const batchBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(batchBody.channel).toBe('test-channel');

      const escalationBody = JSON.parse(fetchMock.mock.calls[1]?.[1].body);
      expect(escalationBody.channel).toBe(escalationChannelId);
      expect(escalationBody.text).toContain('High-volume warning spike');
      expect(escalationBody.text).toContain('3 affected');
    });

    test('does not escalate when below threshold', async () => {
      slackAlert(mockEnv, ['Validation warning rec1AbCdEfGhIjKl'], {
        batchKey: 'test',
        flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
        spikeThreshold: 3,
        escalationChannelId,
      });

      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, ts: '1.0' }) });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const body = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(body.channel).toBe('test-channel');
    });

    test('does not escalate when escalation channel equals batch channel', async () => {
      const recordIds = ['rec1AbCdEfGhIjKl', 'rec2MnOpQrStUvWx', 'rec3ZzYyXxWwVvUu'];

      for (const recordId of recordIds) {
        slackAlert(mockEnv, ['Validation warning'], {
          batchKey: 'test',
          flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
          spikeThreshold: 3,
          channelId: 'test-channel',
          escalationChannelId: 'test-channel',
          batchGroup: { signature: 'g', dedupeKeys: [recordId] },
        });
      }

      fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, ts: '1.0' }) });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test('falls back to occurrence count when messages carry no record IDs', async () => {
      // No dedupeKeys -> dedupedItems stays empty -> spikeCount uses raw occurrences.
      for (let i = 0; i < 3; i++) {
        slackAlert(mockEnv, ['Validation warning with no record id'], {
          batchKey: 'test',
          flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
          spikeThreshold: 3,
          escalationChannelId,
        });
      }

      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, ts: '1.0' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, ts: '2.0' }) });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const escalationBody = JSON.parse(fetchMock.mock.calls[1]?.[1].body);
      expect(escalationBody.channel).toBe(escalationChannelId);
      expect(escalationBody.text).toContain('3 affected');
    });

    test('uses spike options from a later call in the same window', async () => {
      // First call omits spike options; a later call in the same window supplies them.
      // The later options should take effect rather than being silently ignored.
      slackAlert(mockEnv, ['Validation warning'], {
        batchKey: 'test',
        flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
        batchGroup: { signature: 'g', dedupeKeys: ['rec1AbCdEfGhIjKl'] },
      });
      slackAlert(mockEnv, ['Validation warning'], {
        batchKey: 'test',
        flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS,
        spikeThreshold: 2,
        escalationChannelId,
        batchGroup: { signature: 'g', dedupeKeys: ['rec2MnOpQrStUvWx'] },
      });

      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, ts: '1.0' }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true, ts: '2.0' }) });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const escalationBody = JSON.parse(fetchMock.mock.calls[1]?.[1].body);
      expect(escalationBody.channel).toBe(escalationChannelId);
    });
  });

  describe('error handling', () => {
    test('should log error when fetch fails in immediate mode', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await slackAlert(mockEnv, ['Test message']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending Slack alert:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    test('should log error when fetch fails in batch mode', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      slackAlert(mockEnv, ['Test message'], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending batched Slack alert:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    test('should handle empty messages array', async () => {
      await slackAlert(mockEnv, []);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
