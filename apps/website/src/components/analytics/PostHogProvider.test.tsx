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

  test('sanitize_properties redacts token query values from string properties', async () => {
    render(<PostHogProvider><div /></PostHogProvider>);
    await waitFor(() => expect(posthog.init).toHaveBeenCalled());

    const config = vi.mocked(posthog.init).mock.calls[0]![1]!;
    const sanitized = config.sanitize_properties!({
      $current_url: 'https://bluedot.org/account/confirm-email-change?token=abc.def',
      $referrer: 'https://bluedot.org/some-page?a=1&token=zzz&b=2',
      $pathname: '/account/confirm-email-change',
      untouched: 'no tokens here',
      count: 3,
    }, '$pageview');

    expect(sanitized).toEqual({
      $current_url: 'https://bluedot.org/account/confirm-email-change?token=redacted',
      $referrer: 'https://bluedot.org/some-page?a=1&token=redacted&b=2',
      $pathname: '/account/confirm-email-change',
      untouched: 'no tokens here',
      count: 3,
    });
  });
});
