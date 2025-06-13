import { describe, expect, test } from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  test('should allow requests under the rate limit', async () => {
    const limiter = new RateLimiter(2, 500);
    const start = Date.now();

    await limiter.acquire();
    await limiter.acquire();

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10); // Should not have waited
  });

  test('should delay requests over the rate limit', async () => {
    const limiter = new RateLimiter(1, 500);
    const start = Date.now();

    await limiter.acquire();
    await limiter.acquire(); // This should wait

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(500); // Should have waited at least 500ms
  });
});
