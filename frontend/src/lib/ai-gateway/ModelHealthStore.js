/**
 * Bounded, process-local provider/model health state.
 *
 * This is a routing optimization, never a source of Trust authority.  State
 * expires automatically, is keyed by provider + model (not by credential),
 * and stores only public-safe failure metadata.
 */

const MAX_RETRY_AFTER_MS = 24 * 60 * 60 * 1000;

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function safeStatus(value) {
  return typeof value === "string" ? value.trim().toUpperCase().slice(0, 80) : "UNKNOWN";
}

function boundedCooldown(value, fallback, maximum) {
  const requested = finitePositive(value);
  return Math.min(Math.max(requested || fallback, 250), maximum);
}

export const MODEL_HEALTH_STATUS = Object.freeze({
  HEALTHY: "HEALTHY",
  RATE_LIMITED: "RATE_LIMITED",
  HIGH_DEMAND: "HIGH_DEMAND",
  TEMPORARILY_UNAVAILABLE: "TEMPORARILY_UNAVAILABLE",
  INCOMPATIBLE: "INCOMPATIBLE",
  RETIRED: "RETIRED",
});

export class ModelHealthStore {
  constructor({
    clock = () => Date.now(),
    maxEntries = 32,
    baseCooldownMs = 5_000,
    maxCooldownMs = 30 * 60 * 1000,
    dailyCooldownMs = 60 * 60 * 1000,
  } = {}) {
    this.clock = typeof clock === "function" ? clock : () => Date.now();
    this.maxEntries = Math.max(4, Math.min(Number(maxEntries) || 32, 128));
    this.baseCooldownMs = Math.max(250, Number(baseCooldownMs) || 5_000);
    this.maxCooldownMs = Math.max(this.baseCooldownMs, Number(maxCooldownMs) || 30 * 60 * 1000);
    this.dailyCooldownMs = Math.max(this.maxCooldownMs, Number(dailyCooldownMs) || 60 * 60 * 1000);
    this.entries = new Map();
  }

  now() {
    const value = Number(this.clock());
    return Number.isFinite(value) ? value : Date.now();
  }

  key(provider, model) {
    return `${safeStatus(provider)}:${typeof model === "string" ? model.trim().slice(0, 120) : ""}`;
  }

  get(provider, model) {
    const key = this.key(provider, model);
    const entry = this.entries.get(key);
    if (!entry) {
      return {
        provider: safeStatus(provider),
        model: typeof model === "string" ? model.trim().slice(0, 120) : "",
        healthStatus: MODEL_HEALTH_STATUS.HEALTHY,
        consecutiveFailures: 0,
        lastResult: null,
        lastHttpStatus: null,
        lastFailureAt: null,
        cooldownUntil: null,
        cooldownRemainingMs: 0,
        dailyQuotaExhausted: false,
      };
    }
    const now = this.now();
    const remaining = Math.max(0, Number(entry.cooldownUntil || 0) - now);
    if (remaining === 0 && entry.cooldownUntil) {
      entry.cooldownUntil = null;
      entry.dailyQuotaExhausted = false;
      entry.healthStatus = MODEL_HEALTH_STATUS.HEALTHY;
    }
    return {
      provider: entry.provider,
      model: entry.model,
      healthStatus: remaining > 0 ? (entry.healthStatus || MODEL_HEALTH_STATUS.TEMPORARILY_UNAVAILABLE) : MODEL_HEALTH_STATUS.HEALTHY,
      consecutiveFailures: entry.consecutiveFailures,
      lastResult: entry.lastResult,
      lastHttpStatus: entry.lastHttpStatus,
      lastFailureAt: entry.lastFailureAt,
      lastSuccessAt: entry.lastSuccessAt || null,
      lastLatencyMs: entry.lastLatencyMs || null,
      cooldownUntil: entry.cooldownUntil,
      cooldownRemainingMs: remaining,
      dailyQuotaExhausted: entry.dailyQuotaExhausted === true,
    };
  }

  isCoolingDown(provider, model) {
    return (this.get(provider, model)?.cooldownRemainingMs || 0) > 0;
  }

  recordSuccess(provider, model, { latencyMs = null } = {}) {
    const key = this.key(provider, model);
    const now = this.now();
    const entry = {
      provider: safeStatus(provider),
      model: typeof model === "string" ? model.trim().slice(0, 120) : "",
      healthStatus: MODEL_HEALTH_STATUS.HEALTHY,
      consecutiveFailures: 0,
      lastResult: "SUCCESS",
      lastHttpStatus: 200,
      lastLatencyMs: Number.isFinite(Number(latencyMs)) ? Number(latencyMs) : null,
      lastSuccessAt: new Date(now).toISOString(),
      lastFailureAt: null,
      cooldownUntil: null,
      dailyQuotaExhausted: false,
    };
    this.entries.delete(key);
    this.entries.set(key, entry);
  }

  recordFailure({
    provider,
    model,
    result,
    httpStatus = null,
    retryAfterMs = null,
    dailyQuotaExhausted = false,
    quotaResetAt = null,
  } = {}) {
    const key = this.key(provider, model);
    const now = this.now();
    const previous = this.entries.get(key) || {
      provider: safeStatus(provider),
      model: typeof model === "string" ? model.trim().slice(0, 120) : "",
      consecutiveFailures: 0,
    };
    const consecutiveFailures = Math.min(previous.consecutiveFailures + 1, 32);
    const exponential = Math.min(this.baseCooldownMs * (2 ** Math.max(0, consecutiveFailures - 1)), this.maxCooldownMs);
    const explicitReset = Number.isFinite(Number(quotaResetAt)) && Number(quotaResetAt) > now
      ? Number(quotaResetAt) - now
      : null;
    const cooldownMs = dailyQuotaExhausted
      ? Math.min(
        Math.max(this.dailyCooldownMs, finitePositive(explicitReset) || finitePositive(retryAfterMs) || this.dailyCooldownMs),
        MAX_RETRY_AFTER_MS,
      )
      : boundedCooldown(retryAfterMs, exponential, this.maxCooldownMs);
    const safeResult = safeStatus(result);
    let healthStatus = MODEL_HEALTH_STATUS.TEMPORARILY_UNAVAILABLE;
    const statusNum = Number(httpStatus);
    if (statusNum === 429 || dailyQuotaExhausted || safeResult === "RATE_LIMITED" || safeResult === "RESOURCE_EXHAUSTED") {
      healthStatus = MODEL_HEALTH_STATUS.RATE_LIMITED;
    } else if (statusNum === 503 || safeResult === "HIGH_DEMAND") {
      healthStatus = MODEL_HEALTH_STATUS.HIGH_DEMAND;
    } else if (statusNum === 404 || safeResult === "RETIRED" || safeResult === "MODEL_NOT_FOUND") {
      healthStatus = MODEL_HEALTH_STATUS.RETIRED;
    } else if (safeResult === "MODEL_INCOMPATIBLE" || safeResult === "INCOMPATIBLE") {
      healthStatus = MODEL_HEALTH_STATUS.INCOMPATIBLE;
    }

    const entry = {
      provider: previous.provider,
      model: previous.model,
      healthStatus,
      consecutiveFailures,
      lastResult: safeResult,
      lastHttpStatus: Number.isInteger(statusNum) ? statusNum : null,
      lastFailureAt: new Date(now).toISOString(),
      cooldownUntil: now + cooldownMs,
      dailyQuotaExhausted: dailyQuotaExhausted === true,
    };
    this.entries.delete(key);
    this.entries.set(key, entry);
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value);
    }
    return this.get(provider, model);
  }

  snapshot() {
    return [...this.entries.values()].map((entry) => this.get(entry.provider, entry.model)).filter(Boolean);
  }
}
