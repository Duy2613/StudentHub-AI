/**
 * StudentHub AI — Zero-Trust Security Fabric
 * RateLimiter V1
 * 
 * In-Memory Sliding Window Rate Limiter:
 * - Layered rate limiting by IP, Subject, Endpoint, and AI Tool
 * - Protects against resource exhaustion and credential stuffing attacks
 */

import { SecurityError } from "../core/SecurityErrorEnvelope.js";

export class RateLimiter {
  static #windowBuckets = new Map(); // key -> Array of timestamps

  /**
   * Asserts request rate within window limit
   * @param {string} key - e.g. `ip:127.0.0.1`, `user:24110001:login`
   * @param {number} maxRequests - default 100
   * @param {number} windowSeconds - default 60
   * @throws {SecurityError} 429 if exceeded
   */
  static assertRateLimit(key, maxRequests = 100, windowSeconds = 60) {
    const now = Date.now();
    const windowStart = now - (windowSeconds * 1000);

    let timestamps = this.#windowBuckets.get(key) || [];
    // Evict timestamps older than current window
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      const retryAfter = Math.ceil((oldest + (windowSeconds * 1000) - now) / 1000);
      throw SecurityError.rateLimited(
        `Rate limit exceeded for key '${key}'. Please wait ${retryAfter}s before retrying.`,
        null,
        retryAfter
      );
    }

    timestamps.push(now);
    this.#windowBuckets.set(key, timestamps);
    return true;
  }

  /**
   * Resets rate limiter memory (for unit tests)
   */
  static clear() {
    this.#windowBuckets.clear();
  }
}
