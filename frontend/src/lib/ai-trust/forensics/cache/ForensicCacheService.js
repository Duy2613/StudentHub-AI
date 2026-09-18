/**
 * StudentHub AI — ForensicCacheService
 * 
 * In-memory / durable cache for forensic provider results:
 * - Cache key format: imageHash:detector:provider:modelVersion:policyVersion
 * - Deduplicates expensive external provider calls.
 * 
 * STRICT PRIVACY INVARIANT (Hardening Rule 12):
 * - Forensic cache must NEVER expose another user's private case analysis or metadata.
 * - Cache stores raw normalized detector outputs only.
 * - User and Case authorization are strictly enforced at the case persistence layer.
 */

const cacheStore = new Map();
const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export class ForensicCacheService {
  /**
   * Generates a deterministic cache key for a specific detector and version.
   */
  static generateKey({
    imageHash,
    detector,
    provider = "default",
    modelVersion = "v1",
    policyVersion = "IMAGE_FORENSICS_V1",
  }) {
    if (!imageHash || !detector) return null;
    return `${imageHash}:${detector}:${provider}:${modelVersion}:${policyVersion}`.toLowerCase();
  }

  /**
   * Retrieves a cached detector result if present and not expired.
   */
  static get(key) {
    if (!key) return null;
    const entry = cacheStore.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      cacheStore.delete(key);
      return null;
    }

    return JSON.parse(JSON.stringify(entry.value));
  }

  /**
   * Stores a detector result with TTL.
   */
  static set(key, value, ttlMs = DEFAULT_CACHE_TTL_MS) {
    if (!key || !value) return;
    cacheStore.set(key, {
      value: JSON.parse(JSON.stringify(value)),
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Clears the cache (primarily for tests).
   */
  static clear() {
    cacheStore.clear();
  }
}
