/**
 * StudentHub AI — Canonical Owner ProviderGateway
 * 
 * Centralized, authoritative gateway for all external provider executions:
 * - Reputation (Safe Browsing, URLhaus)
 * - Evidence Search (Tavily, Google Grounding)
 * - AI Synthesis / Semantic (Gemini, OpenAI, Groq)
 * - Shadow / Verification
 * 
 * INVARIANT: Native deterministic authority remains PRIMARY.
 * Provider results are advisory/evidence sources. Provider outage must NEVER
 * silently convert a hazardous signal into a clean verdict.
 */

import { CircuitBreaker } from "./CircuitBreaker.js";
import { Bulkhead } from "./Bulkhead.js";
import { CostBudgetTracker } from "./CostBudgetTracker.js";
import { Redactor } from "./Redactor.js";
import {
  ProviderError,
  ProviderTimeoutError,
  ProviderCancelledError,
} from "./ProviderErrors.js";

export const PROVIDER_CAPABILITY = Object.freeze({
  REPUTATION: "REPUTATION",
  SEARCH: "SEARCH",
  AI: "AI",
  SHADOW: "SHADOW",
});

export const GATEWAY_MODE = Object.freeze({
  NATIVE: "NATIVE",
  PROVIDER: "PROVIDER",
  SHADOW: "SHADOW",
  DEGRADED: "DEGRADED",
});

export class ProviderGateway {
  constructor({
    adapters = new Map(),
    budgetTracker = new CostBudgetTracker(),
    defaultTimeoutMs = 5000,
    maxRetries = 2,
    now = () => Date.now(),
  } = {}) {
    this.adapters = adapters;
    this.budgetTracker = budgetTracker;
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.maxRetries = maxRetries;
    this.now = now;

    this.circuitBreakers = new Map();
    this.bulkheads = new Map();
    this.telemetryLogs = [];
  }

  registerAdapter(capability, adapter) {
    this.adapters.set(capability, adapter);
    const providerName = adapter.name || capability;
    if (!this.circuitBreakers.has(capability)) {
      this.circuitBreakers.set(capability, new CircuitBreaker({ provider: providerName, now: this.now }));
    }
    if (!this.bulkheads.has(capability)) {
      this.bulkheads.set(capability, new Bulkhead({ provider: providerName, maxConcurrent: 10 }));
    }
  }

  _getCircuitBreaker(capability) {
    if (!this.circuitBreakers.has(capability)) {
      this.circuitBreakers.set(capability, new CircuitBreaker({ provider: capability, now: this.now }));
    }
    return this.circuitBreakers.get(capability);
  }

  _getBulkhead(capability) {
    if (!this.bulkheads.has(capability)) {
      this.bulkheads.set(capability, new Bulkhead({ provider: capability, maxConcurrent: 10 }));
    }
    return this.bulkheads.get(capability);
  }

  /**
   * Executes a provider capability with full resilience and fallback guardrails.
   * 
   * @param {string} capability - One of PROVIDER_CAPABILITY
   * @param {object} payload - Input parameters for the provider
   * @param {object} [options] - Execution options (timeoutMs, signal, mode)
   * @returns {Promise<object>} Canonical Provider Response DTO
   */
  async execute(capability, payload = {}, options = {}) {
    const startTime = this.now();
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const requestedMode = options.mode || GATEWAY_MODE.PROVIDER;

    const cb = this._getCircuitBreaker(capability);
    const bulkhead = this._getBulkhead(capability);
    const adapter = this.adapters.get(capability);

    // If in NATIVE mode or adapter is not configured, return native fallback
    if (requestedMode === GATEWAY_MODE.NATIVE || !adapter) {
      const fallback = adapter?.nativeFallback
        ? await adapter.nativeFallback(payload)
        : { status: "UNAVAILABLE", reason: `No provider adapter registered for ${capability}` };

      return {
        success: true,
        mode: GATEWAY_MODE.NATIVE,
        capability,
        provider: "NATIVE_DETERMINISTIC",
        data: fallback,
        latencyMs: this.now() - startTime,
        degraded: false,
      };
    }

    // Check circuit breaker and budget
    try {
      cb.assertAvailable();
      this.budgetTracker.assertBudget(adapter.name || capability, payload.estimatedTokens || 0);
    } catch (guardErr) {
      // Degraded fallback
      return this._degradedResponse({
        capability,
        provider: adapter.name || capability,
        error: guardErr,
        startTime,
        payload,
        adapter,
      });
    }

    // Execute with bulkhead, timeout, and bounded retry
    return bulkhead.execute(async () => {
      let lastError = null;
      const effectiveRetries = options.allowRetry === false ? 0 : this.maxRetries;

      for (let attempt = 0; attempt <= effectiveRetries; attempt += 1) {
        if (options.signal?.aborted) {
          throw new ProviderCancelledError(adapter.name || capability);
        }

        const controller = new AbortController();
        let timeoutTimer;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutTimer = setTimeout(() => {
            controller.abort();
            reject(new ProviderTimeoutError(`Provider call timed out after ${timeoutMs}ms`, {
              provider: adapter.name || capability,
              timeoutMs,
            }));
          }, timeoutMs);
        });

        // Chain with caller's signal if present
        const handleCallerAbort = () => controller.abort();
        if (options.signal) {
          options.signal.addEventListener("abort", handleCallerAbort);
        }

        try {
          const rawResult = await Promise.race([
            adapter.execute(payload, { signal: controller.signal, timeoutMs }),
            timeoutPromise,
          ]);

          clearTimeout(timeoutTimer);
          if (options.signal) {
            options.signal.removeEventListener("abort", handleCallerAbort);
          }

          cb.recordSuccess();
          this.budgetTracker.recordUsage(rawResult?.tokensUsed || 0);

          const latencyMs = this.now() - startTime;
          this._logTelemetry({
            capability,
            provider: adapter.name || capability,
            status: "SUCCESS",
            latencyMs,
            attempt,
          });

          return {
            success: true,
            mode: requestedMode,
            capability,
            provider: adapter.name || capability,
            data: rawResult?.data !== undefined ? rawResult.data : rawResult,
            latencyMs,
            degraded: false,
          };
        } catch (err) {
          clearTimeout(timeoutTimer);
          if (options.signal) {
            options.signal.removeEventListener("abort", handleCallerAbort);
          }

          if (options.signal?.aborted) {
            throw new ProviderCancelledError(adapter.name || capability);
          }

          if (controller.signal.aborted) {
            lastError = new ProviderTimeoutError(`Provider call timed out after ${timeoutMs}ms`, {
              provider: adapter.name || capability,
              timeoutMs,
            });
          } else {
            lastError = err;
          }

          // Check if retryable (transient network or 5xx)
          const isRetryable = attempt < effectiveRetries && !controller.signal.aborted;
          if (isRetryable) {
            const backoffMs = Math.min(100 * Math.pow(2, attempt), 1000);
            await new Promise((r) => setTimeout(r, backoffMs));
          }
        }
      }

      // Record failure on circuit breaker
      cb.recordFailure();

      return this._degradedResponse({
        capability,
        provider: adapter.name || capability,
        error: lastError,
        startTime,
        payload,
        adapter,
      });
    });
  }

  async _degradedResponse({ capability, provider, error, startTime, payload, adapter }) {
    const latencyMs = this.now() - startTime;

    this._logTelemetry({
      capability,
      provider,
      status: "DEGRADED",
      error: error?.message || "UNKNOWN_ERROR",
      latencyMs,
    });

    const fallbackData = adapter?.nativeFallback
      ? await adapter.nativeFallback(payload)
      : { status: "DEGRADED", finding: "PROVIDER_OUTAGE", reason: error?.message || "Provider unavailable" };

    return {
      success: true,
      mode: GATEWAY_MODE.DEGRADED,
      capability,
      provider,
      data: fallbackData,
      latencyMs,
      degraded: true,
      degradationReason: error?.message || "Provider call failed or degraded",
    };
  }

  _logTelemetry(entry) {
    const redacted = Redactor.redact({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    this.telemetryLogs.push(redacted);
    if (this.telemetryLogs.length > 200) {
      this.telemetryLogs.shift();
    }
  }

  getHealth() {
    const capabilities = {};
    for (const [cap, cb] of this.circuitBreakers.entries()) {
      const state = cb.getState();
      capabilities[cap] = {
        circuitBreaker: state,
        status: state === "OPEN" ? "UNAVAILABLE" : (state === "HALF_OPEN" ? "DEGRADED" : "HEALTHY"),
      };
    }
    return {
      status: Object.values(capabilities).some((c) => c.status === "UNAVAILABLE") ? "DEGRADED" : "HEALTHY",
      capabilities,
      budget: this.budgetTracker.getMetrics(),
    };
  }
}

let defaultGateway;
export function getProviderGateway() {
  if (!defaultGateway) {
    defaultGateway = new ProviderGateway();
  }
  return defaultGateway;
}
export function setProviderGatewayForTests(gw) {
  defaultGateway = gw;
}
