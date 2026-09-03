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
  static #maxBuckets = 10_000;

  /**
   * Asserts request rate within window limit
   * @param {string} key - e.g. `ip:127.0.0.1`, `user:24110001:login`
   * @param {number} maxRequests - default 100
   * @param {number} windowSeconds - default 60
   * @throws {SecurityError} 429 if exceeded
   */
  static assertRateLimit(key, maxRequests = 100, windowSeconds = 60) {
    const normalizedKey = String(key || "").trim().slice(0, 240);
    if (!normalizedKey) throw new SecurityError({ code: "INTERNAL_SECURITY_ERROR", message: "Rate-limit key is required.", statusCode: 500 });
    const boundedMaxRequests = Math.min(10_000, Math.max(1, Math.floor(Number(maxRequests) || 1)));
    const boundedWindowSeconds = Math.min(3600, Math.max(1, Math.floor(Number(windowSeconds) || 60)));
    const now = Date.now();
    const windowStart = now - (boundedWindowSeconds * 1000);

    let timestamps = this.#windowBuckets.get(normalizedKey) || [];
    // Evict timestamps older than current window
    timestamps = timestamps.filter(t => t > windowStart);

    if (timestamps.length >= boundedMaxRequests) {
      const oldest = timestamps[0];
      const retryAfter = Math.ceil((oldest + (boundedWindowSeconds * 1000) - now) / 1000);
      throw SecurityError.rateLimited(
        "Too many requests. Please retry after the cooldown window.",
        null,
        retryAfter
      );
    }

    timestamps.push(now);
    if (!this.#windowBuckets.has(normalizedKey) && this.#windowBuckets.size >= this.#maxBuckets) {
      const oldestKey = this.#windowBuckets.keys().next().value;
      if (oldestKey) this.#windowBuckets.delete(oldestKey);
    }
    this.#windowBuckets.set(normalizedKey, timestamps);
    return true;
  }

  /**
   * Resets rate limiter memory (for unit tests)
   */
  static clear() {
    this.#windowBuckets.clear();
  }
}
