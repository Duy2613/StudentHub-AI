/**
 * StudentHub AI — PlatformResilienceService
 * 
 * Production platform operations, safe caching, telemetry, and degraded health evaluation.
 */

import { getPostgresPool } from "../database/PostgresPool.js";
import { getProviderGateway } from "../providers/ProviderGateway.js";
import { Redactor } from "../providers/Redactor.js";

class SafeCache {
  constructor({ maxEntries = 5000, defaultTtlMs = 10 * 60 * 1000 } = {}) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest) this.store.delete(oldest);
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  clear() {
    this.store.clear();
  }
}

export class PlatformResilienceService {
  static #reputationCache = new SafeCache({ maxEntries: 2000, defaultTtlMs: 15 * 60 * 1000 });
  static #metrics = {
    requests: 0,
    errors: 0,
    rateLimits: 0,
    dbHealthFailures: 0,
    stageLatencies: {},
  };

  /**
   * Caches safe, public domain reputation result.
   * STRICT INVARIANT: Private user data, tokens, and case inputs MUST NOT be passed here.
   */
  static cacheDomainReputation(domain, result) {
    if (!domain || typeof domain !== "string") return;
    const cleanDomain = domain.toLowerCase().trim();
    this.#reputationCache.set(cleanDomain, result);
  }

  static getCachedDomainReputation(domain) {
    if (!domain || typeof domain !== "string") return null;
    return this.#reputationCache.get(domain.toLowerCase().trim());
  }

  /**
   * Records structured telemetry without leaking credentials or personal info.
   */
  static recordMetric(category, name, value = 1, metadata = {}) {
    const sanitizedMeta = Redactor.redact(metadata);
    if (category === "rate_limit") this.#metrics.rateLimits += 1;
    if (category === "error") this.#metrics.errors += 1;
    if (category === "request") this.#metrics.requests += 1;
    if (category === "latency") {
      this.#metrics.stageLatencies[name] = (this.#metrics.stageLatencies[name] || []).concat(value).slice(-100);
    }
  }

  static getMetrics() {
    return { ...this.#metrics };
  }

  /**
   * Health readiness probe with graceful degradation.
   */
  static async evaluateReadiness() {
    const checks = {
      database: "UNKNOWN",
      providers: "UNKNOWN",
      overall: "UNKNOWN",
    };

    // 1. Critical Dependency: Database
    try {
      const pool = getPostgresPool();
      await pool.query("SELECT 1");
      checks.database = "HEALTHY";
    } catch (dbErr) {
      checks.database = "DOWN";
      this.#metrics.dbHealthFailures += 1;
    }

    // 2. Non-Critical Dependency: External Providers
    try {
      const gw = getProviderGateway();
      const gwHealth = gw.getHealth();
      checks.providers = gwHealth.status; // HEALTHY or DEGRADED
    } catch {
      checks.providers = "DEGRADED";
    }

    // Critical policy: If DB is down, overall is DOWN.
    // If providers are degraded, overall is DEGRADED but still READY to serve native authority!
    if (checks.database === "DOWN") {
      checks.overall = "DOWN";
    } else if (checks.providers === "DEGRADED") {
      checks.overall = "DEGRADED_OPERATIONAL";
    } else {
      checks.overall = "READY";
    }

    return checks;
  }
}
