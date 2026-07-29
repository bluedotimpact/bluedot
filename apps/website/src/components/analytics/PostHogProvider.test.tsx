import { render, waitFor } from '@testing-library/react';
import posthog from 'posthog-js';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import { PostHogProvider } from './PostHogProvider';

vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    set_config: vi.fn(),
  },
}));

vi.mock('posthog-js/react', () => ({
  PostHogProvider: ({ children }: React.PropsWithChildren) => children,
}));

describe('PostHogProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'test-key');
  });

  test('before_send redacts token query values from event, $set and $set_once properties', async () => {
    render(<PostHogProvider><div /></PostHogProvider>);
    await waitFor(() => expect(posthog.init).toHaveBeenCalled());

    const config = vi.mocked(posthog.init).mock.calls[0]![1]!;
    const beforeSend = [config.before_send!].flat()[0]!;

    expect(beforeSend(null)).toBeNull();

    const result = beforeSend({
      uuid: 'uuid-1',
      event: '$pageview',
      properties: {
        $current_url: 'https://bluedot.org/account/confirm-email-change?token=abc.def',
        $referrer: 'https://bluedot.org/some-page?a=1&token=zzz&b=2',
        $pathname: '/account/confirm-email-change',
        untouched: 'no tokens here',
        count: 3,
      },
      $set: { $current_url: 'https://bluedot.org/account/confirm-email-change?token=abc.def' },
      $set_once: { $initial_current_url: 'https://bluedot.org/account/confirm-email-change?token=abc.def' },
    });

    expect(result).toEqual({
      uuid: 'uuid-1',
      event: '$pageview',
      properties: {
        $current_url: 'https://bluedot.org/account/confirm-email-change?token=redacted',
        $referrer: 'https://bluedot.org/some-page?a=1&token=redacted&b=2',
        $pathname: '/account/confirm-email-change',
        untouched: 'no tokens here',
        count: 3,
      },
      $set: { $current_url: 'https://bluedot.org/account/confirm-email-change?token=redacted' },
      $set_once: { $initial_current_url: 'https://bluedot.org/account/confirm-email-change?token=redacted' },
    });
  });
});
