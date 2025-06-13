import { logger } from '@bluedot/ui/src/api';

/**
 * Simple rate limiter for Airtable API calls
 */
export class RateLimiter {
  private requests: number[] = [];

  private readonly maxRPS: number;

  private readonly windowMs: number;

  constructor(maxRPS = 5, windowMs = 1000) {
    this.maxRPS = maxRPS;
    this.windowMs = windowMs;
  }

  /**
   * Acquire permission to make a request. Will wait if rate limit is exceeded.
   * Uses sliding window to track request timestamps.
   */
  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove timestamps outside the current window
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs);

    // If we're at the limit, wait until we can make another request
    if (this.requests.length >= this.maxRPS) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 1;

      if (waitTime > 0) {
        logger.info(`[AirtableRateLimiter] Rate limit reached, waiting ${waitTime}ms`);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, waitTime);
        });
        return this.acquire(); // Retry after waiting
      }
    }

    // Record this request
    this.requests.push(now);
    return Promise.resolve();
  }
}
