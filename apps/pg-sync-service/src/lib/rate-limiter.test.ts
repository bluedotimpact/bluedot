import { describe, expect, test } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  test('should allow requests under the rate limit', async () => {
    const limiter = new RateLimiter(2, 100);

    await limiter.acquire();
    await limiter.acquire();
  });

  test('should delay requests over the rate limit', async () => {
    const limiter = new RateLimiter(1, 100);
    const start = Date.now();

    await limiter.acquire();
    await limiter.acquire(); // This should wait

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThan(90); // Should have waited ~100ms
  });
});
