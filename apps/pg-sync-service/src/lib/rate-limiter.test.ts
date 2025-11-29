import {
  describe, expect, test, vi, beforeEach, afterEach,
} from 'vitest';
import { RateLimiter } from './rate-limiter';

describe('RateLimiter', () => {
  describe('acquire', () => {
    test('should allow requests under the rate limit', async () => {
      const limiter = new RateLimiter(2, 500);
      const start = Date.now();

      await limiter.acquire();
      await limiter.acquire();

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(100); // Should not have waited
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

  describe('tryAcquire', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('should allow requests under the rate limit', () => {
      const limiter = new RateLimiter(3, 1000);

      const result1 = limiter.tryAcquire();
      expect(result1.allowed).toBe(true);
      expect(result1.lastAllowedRequest).toBe(false);

      const result2 = limiter.tryAcquire();
      expect(result2.allowed).toBe(true);
      expect(result2.lastAllowedRequest).toBe(false);
    });

    test('should set lastAllowedRequest on the final allowed request', () => {
      const limiter = new RateLimiter(3, 1000);

      limiter.tryAcquire(); // 1st
      limiter.tryAcquire(); // 2nd
      const result3 = limiter.tryAcquire(); // 3rd (last allowed)

      expect(result3.allowed).toBe(true);
      expect(result3.lastAllowedRequest).toBe(true);
    });

    test('should deny requests over the rate limit', () => {
      const limiter = new RateLimiter(2, 1000);

      limiter.tryAcquire(); // 1st
      limiter.tryAcquire(); // 2nd

      const result3 = limiter.tryAcquire(); // Should be denied
      expect(result3.allowed).toBe(false);
      expect(result3.lastAllowedRequest).toBe(false);
    });

    test('should reset after the window expires', () => {
      const limiter = new RateLimiter(2, 1000);

      // Fill up the rate limit
      limiter.tryAcquire();
      limiter.tryAcquire();

      // Next request should be denied
      const result1 = limiter.tryAcquire();
      expect(result1.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(1001);

      // Should be allowed again
      const result2 = limiter.tryAcquire();
      expect(result2.allowed).toBe(true);
      expect(result2.lastAllowedRequest).toBe(false);
    });

    test('should use sliding window', () => {
      const limiter = new RateLimiter(2, 1000);

      // Request at t=0
      limiter.tryAcquire();

      // Request at t=500
      vi.advanceTimersByTime(500);
      limiter.tryAcquire();

      // Request at t=600 should be denied (still 2 requests in last 1000ms)
      vi.advanceTimersByTime(100);
      const result1 = limiter.tryAcquire();
      expect(result1.allowed).toBe(false);

      // Request at t=1001 should be allowed (first request expired)
      vi.advanceTimersByTime(401);
      const result2 = limiter.tryAcquire();
      expect(result2.allowed).toBe(true);
    });
  });
});
