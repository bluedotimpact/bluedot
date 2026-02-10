import {
  describe, test, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { DEFAULT_FLUSH_INTERVAL_MS, slackAlert } from './slackNotifications';

const mockEnv = {
  APP_NAME: 'test-app',
  ALERTS_SLACK_BOT_TOKEN: 'test-token',
  ALERTS_SLACK_CHANNEL_ID: 'test-channel',
  INFO_SLACK_CHANNEL_ID: 'test-info-channel',
};

const SLACK_API_URL = 'https://slack.com/api/chat.postMessage';

describe('slackNotifications', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
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

    test('should use info channel when level is info', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await slackAlert(mockEnv, ['Info message'], { level: 'info' });

      expect(fetchMock).toHaveBeenCalledWith(
        SLACK_API_URL,
        expect.objectContaining({
          body: JSON.stringify({
            channel: 'test-info-channel',
            text: 'test-app: Info message',
            thread_ts: undefined,
          }),
        }),
      );
    });
  });

  describe('batching mode', () => {
    test('should batch similar messages by signature', async () => {
      const message1 = 'Failed to map field unitNumber (fldL42M2hgchJYIdD) from Airtable for table exercise (tbla7lc2MtSSbWVvS) and record rec3BGObwkLPSskvb';
      const message2 = 'Failed to map field unitNumber (fldL42M2hgchJYIdD) from Airtable for table exercise (tbla7lc2MtSSbWVvS) and record rec3qTvZcFGYccFcl';
      const message3 = 'Failed to map field unitNumber (fldL42M2hgchJYIdD) from Airtable for table exercise (tbla7lc2MtSSbWVvS) and record rec3060zKybkbm9UH';

      // Add messages to batch
      slackAlert(mockEnv, [message1], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      slackAlert(mockEnv, [message2], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      slackAlert(mockEnv, [message3], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

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
      expect(callBody.text).toContain('This error occurred 3 times affecting 3 record(s)');
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

    test('should preserve first reply in batched messages', async () => {
      const message1 = ['Main error message rec1AbCdEfGhIjKl', 'Stack trace here'];
      const message2 = ['Main error message rec2MnOpQrStUvWx', 'Different stack trace'];

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

    test('should track unique record IDs across batches', async () => {
      const message1 = 'Error rec1AbCdEfGhIjKl';
      const message2 = 'Error rec1AbCdEfGhIjKl'; // Same record
      const message3 = 'Error rec2MnOpQrStUvWx';

      slackAlert(mockEnv, [message1], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      slackAlert(mockEnv, [message2], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      slackAlert(mockEnv, [message3], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('affecting 2 record(s)'); // Only unique records
      expect(callBody.text).toContain('rec1AbCdEfGhIjKl');
      expect(callBody.text).toContain('rec2MnOpQrStUvWx');
    });

    test('should limit record list to 10 records', async () => {
      const recordIds = Array.from({ length: 15 }, (_, i) => `rec${i}AbCdEfGhIjKl`);

      for (const recordId of recordIds) {
        slackAlert(mockEnv, [`Error ${recordId}`], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, ts: '1.0' }),
      });

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1].body);
      expect(callBody.text).toContain('affecting 15 record(s)');
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
  });

  describe('error handling', () => {
    test('should log error when fetch fails in immediate mode', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await slackAlert(mockEnv, ['Test message']);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending Slack alert:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    test('should log error when fetch fails in batch mode', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      slackAlert(mockEnv, ['Test message'], { batchKey: 'test', flushIntervalMs: DEFAULT_FLUSH_INTERVAL_MS });

      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await vi.advanceTimersByTimeAsync(DEFAULT_FLUSH_INTERVAL_MS);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error sending batched Slack alert:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    test('should handle empty messages array', async () => {
      await slackAlert(mockEnv, []);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
