/**
 * Rate limiter for Airtable API calls using sliding window algorithm
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
   * Uses sliding window algorithm to track request timestamps.
   */
  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove requests outside the current window
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs);

    // If we're at the limit, wait until we can make another request
    if (this.requests.length >= this.maxRPS) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 1; // +1ms buffer

      if (waitTime > 0) {
        console.log(`[AirtableRateLimiter] Rate limit reached, waiting ${waitTime}ms`);
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

  /**
   * Get current request count in the sliding window
   */
  getCurrentRequestCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs);
    return this.requests.length;
  }

  /**
   * Check if we can make a request without waiting
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter((timestamp) => now - timestamp < this.windowMs);
    return this.requests.length < this.maxRPS;
  }
}
