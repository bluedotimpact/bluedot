import { describe, expect, test } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  test('should allow requests under the rate limit', async () => {
    const limiter = new RateLimiter(2, 100);

    expect(limiter.canMakeRequest()).toBe(true);
    await limiter.acquire();
    expect(limiter.getCurrentRequestCount()).toBe(1);

    await limiter.acquire();
    expect(limiter.getCurrentRequestCount()).toBe(2);
  });

  test('should block requests over the rate limit', async () => {
    const limiter = new RateLimiter(1, 100);

    await limiter.acquire();
    expect(limiter.canMakeRequest()).toBe(false);
    expect(limiter.getCurrentRequestCount()).toBe(1);
  });

  test('should reset count after window expires', async () => {
    const limiter = new RateLimiter(1, 50);

    await limiter.acquire();
    expect(limiter.getCurrentRequestCount()).toBe(1);

    await new Promise((resolve) => { setTimeout(resolve, 60); });
    expect(limiter.getCurrentRequestCount()).toBe(0);
    expect(limiter.canMakeRequest()).toBe(true);
  });
});
