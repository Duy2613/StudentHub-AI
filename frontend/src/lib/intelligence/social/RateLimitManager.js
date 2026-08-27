/**
 * StudentHub AI — RateLimitManager V1
 * 
 * Token bucket rate limiting, quota tracking, exponential backoff,
 * and fail-closed throttle enforcement across external platform connectors.
 */

export class RateLimitManager {
  static #buckets = new Map(); // key -> { tokens, lastRefill, maxTokens, refillRatePerSec }
  static #backoffs = new Map(); // key -> { retryCount, nextAllowedTime }

  /**
   * Checks if an execution is allowed under the connector's rate limit
   * @param {string} connectorId 
   * @param {number} [requestsPerMinute=60] 
   * @param {number} [burstQuota=10]
   * @returns {{ allowed: boolean, remainingTokens: number, retryAfterSeconds: number }}
   */
  static checkRateLimit(connectorId, requestsPerMinute = 60, burstQuota = 10) {
    const key = `conn:${connectorId}`;
    const now = Date.now();

    // Check backoff lock
    const backoff = this.#backoffs.get(key);
    if (backoff && now < backoff.nextAllowedTime) {
      const waitSec = Math.ceil((backoff.nextAllowedTime - now) / 1000);
      return { allowed: false, remainingTokens: 0, retryAfterSeconds: waitSec };
    }

    let bucket = this.#buckets.get(key);
    if (!bucket) {
      bucket = {
        tokens: burstQuota,
        lastRefill: now,
        maxTokens: burstQuota,
        refillRatePerSec: requestsPerMinute / 60
      };
      this.#buckets.set(key, bucket);
    } else {
      // Refill tokens based on elapsed time
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      bucket.tokens = Math.min(bucket.maxTokens, bucket.tokens + elapsedSec * bucket.refillRatePerSec);
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, remainingTokens: Math.floor(bucket.tokens), retryAfterSeconds: 0 };
    }

    const waitSec = Math.ceil((1 - bucket.tokens) / bucket.refillRatePerSec);
    return { allowed: false, remainingTokens: 0, retryAfterSeconds: waitSec };
  }

  /**
   * Registers a rate limit event (e.g. HTTP 429 received from upstream platform)
   * Applies exponential backoff
   * @param {string} connectorId 
   * @returns {number} Wait duration in seconds
   */
  static triggerBackoff(connectorId) {
    const key = `conn:${connectorId}`;
    const now = Date.now();
    const existing = this.#backoffs.get(key) || { retryCount: 0, nextAllowedTime: now };

    const retryCount = existing.retryCount + 1;
    // Exponential backoff: 2^retryCount + jitter (up to 300s max)
    const baseWaitSec = Math.min(300, Math.pow(2, retryCount) * 5);
    const jitterSec = Math.floor(Math.random() * 3);
    const totalWaitSec = baseWaitSec + jitterSec;

    this.#backoffs.set(key, {
      retryCount,
      nextAllowedTime: now + totalWaitSec * 1000
    });

    return totalWaitSec;
  }

  /**
   * Resets backoff after a successful sync
   * @param {string} connectorId 
   */
  static resetBackoff(connectorId) {
    this.#backoffs.delete(`conn:${connectorId}`);
  }

  /**
   * Clears all rate limit state (for tests)
   */
  static clear() {
    this.#buckets.clear();
    this.#backoffs.clear();
  }
}
