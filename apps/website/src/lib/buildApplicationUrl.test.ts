import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';

const mockGetSessionId = vi.fn<() => string | null>();
vi.mock('posthog-js', () => ({
  default: { get_session_id: () => mockGetSessionId() },
}));

const { buildApplicationUrl } = await import('./buildApplicationUrl');

describe('buildApplicationUrl', () => {
  beforeEach(() => {
    mockGetSessionId.mockReturnValue(null);
  });

  test('returns empty string for null / undefined / empty base URL', () => {
    expect(buildApplicationUrl(null, 'twitter')).toBe('');
    expect(buildApplicationUrl(undefined, 'twitter')).toBe('');
    expect(buildApplicationUrl('', 'twitter')).toBe('');
  });

  test('returns base URL unchanged when neither UTM source nor session ID is available', () => {
    expect(buildApplicationUrl('https://example.com/apply', null)).toBe('https://example.com/apply');
  });

  test('appends prefill_Source when UTM source is provided', () => {
    expect(buildApplicationUrl('https://example.com/apply', 'twitter')).toBe('https://example.com/apply?prefill_Source=twitter');
  });

  test('appends prefill_PostHog Session ID (URL-encoded) when session is available', () => {
    mockGetSessionId.mockReturnValue('sess-123');
    expect(buildApplicationUrl('https://example.com/apply', null))
      .toBe('https://example.com/apply?prefill_PostHog%20Session%20ID=sess-123');
  });

  test('appends both UTM source and PostHog session ID when both are present', () => {
    mockGetSessionId.mockReturnValue('sess-123');
    expect(buildApplicationUrl('https://example.com/apply', 'twitter'))
      .toBe('https://example.com/apply?prefill_Source=twitter&prefill_PostHog%20Session%20ID=sess-123');
  });

  test('preserves existing query params', () => {
    expect(buildApplicationUrl('https://example.com/apply?foo=bar', 'twitter'))
      .toBe('https://example.com/apply?foo=bar&prefill_Source=twitter');
  });
});
