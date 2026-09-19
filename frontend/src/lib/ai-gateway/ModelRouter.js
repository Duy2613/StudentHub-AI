/**
 * AI Gateway — ModelRouter
 *
 * Capability-based, ordered Gemini failover. This module is the only place
 * where a capability becomes a model sequence. It makes one bounded attempt
 * per candidate, stops at the first valid structured result, and keeps health
 * state per provider/model without rotating credentials.
 */

import {
  AI_GATEWAY_CONFIG,
  resolveCapabilityRoute,
  validateActiveModelIdentifiers,
  validateCatalogModelEntry,
  isL4DemoPriorityEnabled,
} from "./config/AIGatewayConfig.js";
import {
  isQaExtendedFallbackEnabled,
  isQaExtendedGeminiModel,
} from "./config/GeminiModelCatalog.js";
import {
  PROVIDER_FAMILY,
  GATEWAY_ERROR_TYPE,
  classifyGatewayFailure,
  createAttemptRecord,
  isFailoverEligible,
  sanitizeGatewayError,
  traceResultForFailure,
  normalizeProviderErrorCode,
} from "./types.js";
import { ModelHealthStore } from "./ModelHealthStore.js";
import { GeminiProvider } from "./providers/GeminiProvider.js";

const PROVIDER_INSTANCES = Object.freeze({
  [PROVIDER_FAMILY.GEMINI]: new GeminiProvider(),
});

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function boundedTimeout(value, fallback) {
  return Math.min(Math.max(finiteNumber(value, fallback), 250), 30_000);
}

function boundedBudget(value, fallback) {
  return Math.min(Math.max(finiteNumber(value, fallback), 250), 120_000);
}

function boundedOutputTokens(value) {
  return Math.min(Math.max(Math.floor(finiteNumber(value, AI_GATEWAY_CONFIG.LIMITS.MAX_OUTPUT_TOKENS)), 1), AI_GATEWAY_CONFIG.LIMITS.MAX_OUTPUT_TOKENS);
}

function nowIso(value) {
  return new Date(value).toISOString();
}

function abortError(reason) {
  const error = reason instanceof Error ? reason : new Error("AI gateway request cancelled");
  error.name = "AbortError";
  return error;
}

function timeoutError() {
  const error = new Error("AI gateway model attempt timed out");
  error.name = "TimeoutError";
  error.code = "ATTEMPT_TIMEOUT";
  error.gatewayErrorType = GATEWAY_ERROR_TYPE.TIMEOUT;
  return error;
}

function linkAbortSignal(controller, signal) {
  if (!signal || typeof signal.addEventListener !== "function") return () => {};
  const onAbort = () => controller.abort(signal.reason);
  if (signal.aborted) onAbort();
  else signal.addEventListener("abort", onAbort, { once: true });
  return () => signal.removeEventListener?.("abort", onAbort);
}

function fallbackReasonFor(attempt) {
  const result = String(attempt?.result || "FAILED").toUpperCase();
  return `PRIMARY_${result}`;
}

function providerStatusFor(errorType, httpStatus, providerErrorCode) {
  return classifyGatewayFailure({ errorType, httpStatus, providerErrorCode });
}

function safeProviderValidation(provider, catalogEntry, { allowQaExtended = null } = {}) {
  if (!provider || typeof provider.validateModel !== "function") return { valid: true, compatible: true };
  try {
    const validation = provider.validateModel(catalogEntry, { allowQaExtended });
    if (validation === false) return { valid: false, compatible: false, code: "MODEL_INCOMPATIBLE" };
    if (validation && typeof validation === "object") return validation;
  } catch {
    return { valid: false, compatible: false, code: "MODEL_VALIDATION_FAILED" };
  }
  return { valid: true, compatible: true };
}

export class ModelRouter {
  /**
   * @param {object} [overrideProviders] test-only provider injection point
   * @param {object} [options] health/clock injection for deterministic tests
   */
  constructor(overrideProviders = {}, options = {}) {
    this.providers = { ...PROVIDER_INSTANCES, ...(overrideProviders || {}) };
    this.healthStore = options.healthStore || new ModelHealthStore({
      maxEntries: AI_GATEWAY_CONFIG.CIRCUIT_BREAKER.MAX_ENTRIES,
      baseCooldownMs: AI_GATEWAY_CONFIG.CIRCUIT_BREAKER.BASE_COOLDOWN_MS,
      maxCooldownMs: AI_GATEWAY_CONFIG.CIRCUIT_BREAKER.MAX_COOLDOWN_MS,
      dailyCooldownMs: AI_GATEWAY_CONFIG.CIRCUIT_BREAKER.DAILY_QUOTA_COOLDOWN_MS,
      clock: options.clock,
    });
    this.modelIdentifierValidation = validateActiveModelIdentifiers();
  }

  /** Safe, no-network startup/provider initialization result. */
  validateModelIdentifiers() {
    return {
      valid: this.modelIdentifierValidation.valid,
      entries: this.modelIdentifierValidation.entries.map((entry) => ({ ...entry })),
      expectedModels: [...this.modelIdentifierValidation.expectedModels],
    };
  }

  getModelHealth() {
    return this.healthStore.snapshot();
  }

  /**
   * Lists the exact route without making a network call. Health is included so
   * operators can explain why a primary was skipped on a later Trust case.
   */
  describeRoute(capability, { allowQaExtended = null } = {}) {
    const qaExtendedActive = typeof allowQaExtended === "boolean" ? allowQaExtended : isQaExtendedFallbackEnabled();
    const chain = resolveCapabilityRoute(capability, { allowQaExtended: qaExtendedActive });
    return chain.map((entryId) => {
      const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
      if (!entry) {
        return { entryId, provider: null, model: null, tier: null, configured: false, valid: false, validationCode: "CATALOG_ENTRY_MISSING" };
      }
      const provider = this.providers[entry.provider];
      const validation = validateCatalogModelEntry(entryId, { allowQaExtended: qaExtendedActive });
      const health = this.healthStore.get(entry.provider, entry.model);
      let configured = false;
      try {
        configured = Boolean(provider?.isConfigured?.(entry));
      } catch {
        configured = false;
      }
      return {
        entryId,
        provider: entry.provider,
        model: entry.model,
        tier: entry.tier,
        productionTier: entry.productionTier || "PRIMARY",
        qaFallbackEligible: entry.qaFallbackEligible === true,
        configured,
        valid: validation.valid,
        validationCode: validation.code,
        structuredOutputContract: entry.structuredOutputContract || null,
        cooldownUntil: health?.cooldownUntil || null,
        cooldownRemainingMs: health?.cooldownRemainingMs || 0,
        dailyQuotaExhausted: health?.dailyQuotaExhausted === true,
      };
    });
  }

  async #invokeProvider(provider, payload, timeoutMs, signal) {
    const controller = new AbortController();
    const unbind = linkAbortSignal(controller, signal);
    let timer = null;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort(timeoutError());
        reject(timeoutError());
      }, timeoutMs);
    });
    try {
      const generation = Promise.resolve().then(() => provider.generate({
        ...payload,
        signal: controller.signal,
        timeoutMs,
      }));
      return await Promise.race([generation, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
      unbind();
    }
  }

  #pushFailure(attempts, {
    entry,
    attemptNumber,
    startedAt,
    durationMs,
    errorType,
    httpStatus = null,
    providerErrorCode = null,
    result = null,
    errorMessage = null,
  }) {
    const attempt = createAttemptRecord({
      provider: entry?.provider || "unknown",
      model: entry?.model || entry?.id,
      ok: false,
      attemptNumber,
      startedAt: nowIso(startedAt),
      durationMs,
      httpStatus,
      providerErrorCode,
      result,
      errorType,
      errorMessage,
      qaExtendedFallback: isQaExtendedGeminiModel(entry?.model),
    });
    attempts.push(attempt);
    return attempt;
  }

  /**
   * Routes one request across the approved chain. The returned object is
   * advisory transport metadata; Layer 4 remains responsible for policy.
   */
  async route({
    capability,
    systemPrompt,
    userPrompt,
    inputParts = null,
    jsonMode = false,
    responseSchema = null,
    timeoutMs = AI_GATEWAY_CONFIG.SLA.DEFAULT_TIMEOUT_MS,
    perModelTimeoutMs = null,
    totalBudgetMs = AI_GATEWAY_CONFIG.BUDGET.DEFAULT_TOTAL_MS,
    maxOutputTokens = AI_GATEWAY_CONFIG.LIMITS.MAX_OUTPUT_TOKENS,
    signal,
    parseResponse = null,
    validateResponse = null,
    allowQaExtended = null,
    resultPriority = null,
  } = {}) {
    const isDemoMode = resultPriority === "DEMO" || isL4DemoPriorityEnabled();
    const qaExtendedActive = isDemoMode ? true : (typeof allowQaExtended === "boolean" ? allowQaExtended : isQaExtendedFallbackEnabled());
    let configuredChain = resolveCapabilityRoute(capability, { allowQaExtended: qaExtendedActive }).slice(0, AI_GATEWAY_CONFIG.LIMITS.MAX_ROUTER_ATTEMPTS);

    if (isDemoMode) {
      // Dynamic candidate prioritization by current health for demo mode
      configuredChain.sort((aId, bId) => {
        const aEntry = AI_GATEWAY_CONFIG.MODEL_CATALOG[aId];
        const bEntry = AI_GATEWAY_CONFIG.MODEL_CATALOG[bId];
        const aHealth = aEntry ? this.healthStore.get(aEntry.provider, aEntry.model) : null;
        const bHealth = bEntry ? this.healthStore.get(bEntry.provider, bEntry.model) : null;

        const scoreModel = (health, entry) => {
          if (!entry) return 999;
          if (health?.dailyQuotaExhausted) return 500;
          if (health?.cooldownRemainingMs > 0) return 400;
          if (health?.healthStatus === "HEALTHY" && health?.lastSuccessAt) {
            return 10 + (health?.lastLatencyMs ? Math.min(health.lastLatencyMs / 1000, 10) : 0);
          }
          if (health?.healthStatus === "HEALTHY") return 50;
          if (health?.consecutiveFailures > 0) return 200;
          return 100;
        };

        return scoreModel(aHealth, aEntry) - scoreModel(bHealth, bEntry);
      });
    }

    const attempts = [];
    const startedAt = Date.now();
    const effectiveTotalBudget = isDemoMode
      ? (totalBudgetMs || AI_GATEWAY_CONFIG.BUDGET.L4_TOTAL_DEMO_BUDGET_MS || 22_000)
      : (totalBudgetMs || AI_GATEWAY_CONFIG.BUDGET.DEFAULT_TOTAL_MS);
    const boundedTotalBudget = boundedBudget(effectiveTotalBudget, AI_GATEWAY_CONFIG.BUDGET.DEFAULT_TOTAL_MS);
    const requestedTimeout = boundedTimeout(timeoutMs, AI_GATEWAY_CONFIG.SLA.DEFAULT_TIMEOUT_MS);
    const perCandidateTimeout = boundedTimeout(perModelTimeoutMs || requestedTimeout, requestedTimeout);
    const boundedSystemPrompt = String(systemPrompt || "").slice(0, AI_GATEWAY_CONFIG.LIMITS.MAX_PROMPT_CHARACTERS);
    const boundedUserPrompt = String(userPrompt || "").slice(0, AI_GATEWAY_CONFIG.LIMITS.MAX_PROMPT_CHARACTERS);
    const outputTokens = boundedOutputTokens(maxOutputTokens);
    const requestedPrimaryModel = AI_GATEWAY_CONFIG.MODEL_CATALOG[configuredChain[0]]?.model || null;
    const cooldownModels = [];
    const activeCooldowns = [];
    let primaryFailure = null;
    let lastError = null;

    if (configuredChain.length === 0) {
      return {
        ok: false,
        attempts,
        requestedPrimaryModel,
        executedModel: null,
        fallbackUsed: false,
        fallbackReason: null,
        providerStatus: "NOT_CONFIGURED",
        operationStatus: "PARTIAL",
        totalBudgetMs: boundedTotalBudget,
        errorType: GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
        errorMessage: `No model route defined for capability ${capability}`,
      };
    }

    for (const entryId of configuredChain) {
      if (signal?.aborted) throw abortError(signal.reason);
      const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
      const attemptNumber = attempts.length + 1;
      if (!entry) {
        const attempt = this.#pushFailure(attempts, {
          entry: { provider: "unknown", model: entryId, id: entryId },
          attemptNumber,
          startedAt: Date.now(),
          durationMs: 0,
          errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE,
          providerErrorCode: "CATALOG_ENTRY_MISSING",
          result: "MODEL_INCOMPATIBLE",
          errorMessage: "Unknown model catalog entry",
        });
        primaryFailure ||= attempt;
        lastError = { errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE, providerStatus: "MODEL_INCOMPATIBLE" };
        continue;
      }

      const validation = validateCatalogModelEntry(entryId, { allowQaExtended: qaExtendedActive });
      if (!validation.valid) {
        const attempt = this.#pushFailure(attempts, {
          entry,
          attemptNumber,
          startedAt: Date.now(),
          durationMs: 0,
          errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE,
          providerErrorCode: validation.code,
          result: "MODEL_INCOMPATIBLE",
          errorMessage: "Model catalog validation failed",
        });
        primaryFailure ||= attempt;
        lastError = { errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE, providerErrorCode: validation.code, providerStatus: "MODEL_INCOMPATIBLE" };
        continue;
      }

      const health = this.healthStore.get(entry.provider, entry.model);
      if (health?.cooldownRemainingMs > 0) {
        const skipStartedAt = Date.now();
        const attempt = this.#pushFailure(attempts, {
          entry,
          attemptNumber,
          startedAt: skipStartedAt,
          durationMs: 0,
          errorType: GATEWAY_ERROR_TYPE.CIRCUIT_OPEN,
          providerErrorCode: "MODEL_COOLDOWN",
          result: "COOLDOWN",
          errorMessage: "Model is cooling down",
        });
        primaryFailure ||= attempt;
        cooldownModels.push(entry.model);
        activeCooldowns.push({ model: entry.model, cooldownUntil: health.cooldownUntil, cooldownRemainingMs: health.cooldownRemainingMs });
        lastError = { errorType: GATEWAY_ERROR_TYPE.CIRCUIT_OPEN, providerErrorCode: "MODEL_COOLDOWN", providerStatus: "COOLDOWN" };
        continue;
      }

      const provider = this.providers[entry.provider];
      let configured = false;
      try {
        configured = Boolean(provider?.isConfigured?.(entry));
      } catch {
        configured = false;
      }
      if (!configured) {
        const attempt = this.#pushFailure(attempts, {
          entry,
          attemptNumber,
          startedAt: Date.now(),
          durationMs: 0,
          errorType: GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
          providerErrorCode: "GEMINI_API_KEY_MISSING",
          result: "NOT_CONFIGURED",
          errorMessage: "Missing canonical provider configuration",
        });
        primaryFailure ||= attempt;
        lastError = { errorType: GATEWAY_ERROR_TYPE.NOT_CONFIGURED, providerErrorCode: "GEMINI_API_KEY_MISSING", providerStatus: "NOT_CONFIGURED" };
        continue;
      }

      const providerValidation = safeProviderValidation(provider, entry, { allowQaExtended: qaExtendedActive });
      if (providerValidation.valid === false || providerValidation.compatible === false) {
        const attempt = this.#pushFailure(attempts, {
          entry,
          attemptNumber,
          startedAt: Date.now(),
          durationMs: 0,
          errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE,
          providerErrorCode: providerValidation.code || "MODEL_INCOMPATIBLE",
          result: "MODEL_INCOMPATIBLE",
          errorMessage: "Provider model compatibility validation failed",
        });
        primaryFailure ||= attempt;
        lastError = { errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE, providerErrorCode: providerValidation.code, providerStatus: "MODEL_INCOMPATIBLE" };
        continue;
      }

      // Budget reservation: Check if there is a known healthy candidate downstream.
      // If entry is not terminal and a downstream candidate is healthy (e.g. 3.6),
      // reserve L4_RESERVED_HEALTHY_BUDGET_MS (~6800ms) for it.
      const downstreamCandidates = configuredChain.slice(configuredChain.indexOf(entryId) + 1);
      const hasDownstreamHealthy = downstreamCandidates.some((id) => {
        const downstreamEntry = AI_GATEWAY_CONFIG.MODEL_CATALOG[id];
        return downstreamEntry && !this.healthStore.isCoolingDown(downstreamEntry.provider, downstreamEntry.model);
      });

      const reservedHealthyBudget = hasDownstreamHealthy
        ? (AI_GATEWAY_CONFIG.BUDGET.L4_RESERVED_HEALTHY_BUDGET_MS || 6800)
        : 0;

      const remainingBeforeAttempt = boundedTotalBudget - (Date.now() - startedAt);
      if (remainingBeforeAttempt < AI_GATEWAY_CONFIG.BUDGET.MIN_ATTEMPT_MS) {
        lastError = { errorType: GATEWAY_ERROR_TYPE.BUDGET_EXHAUSTED, providerStatus: "BUDGET_EXHAUSTED" };
        break;
      }

      // If attempting this candidate would violate the reservation for the downstream healthy candidate,
      // bypass this candidate immediately to protect the healthy model's execution window
      const availableForAttempt = remainingBeforeAttempt - reservedHealthyBudget;
      if (hasDownstreamHealthy && availableForAttempt < AI_GATEWAY_CONFIG.BUDGET.MIN_ATTEMPT_MS) {
        const attempt = this.#pushFailure(attempts, {
          entry,
          attemptNumber,
          startedAt: Date.now(),
          durationMs: 0,
          errorType: GATEWAY_ERROR_TYPE.TIMEOUT,
          providerErrorCode: "BUDGET_RESERVED_FOR_HEALTHY_CANDIDATE",
          result: "BUDGET_EXHAUSTED",
          errorMessage: "Bypassed candidate to preserve execution budget for healthy terminal candidate",
        });
        primaryFailure ||= attempt;
        continue;
      }

      const attemptBudgetCap = hasDownstreamHealthy
        ? Math.min(perCandidateTimeout, Math.max(AI_GATEWAY_CONFIG.BUDGET.MIN_ATTEMPT_MS, availableForAttempt))
        : Math.min(perCandidateTimeout, remainingBeforeAttempt);

      const attemptTimeout = Math.max(AI_GATEWAY_CONFIG.BUDGET.MIN_ATTEMPT_MS, attemptBudgetCap);

      const candidateSystemPrompt = boundedSystemPrompt.includes("model must be one of:")
        ? boundedSystemPrompt.replace(/model must be one of: [^.]+\./, `model must be "${entry.model}". Set "model": "${entry.model}".`)
        : boundedSystemPrompt;

      const attemptStartedAt = Date.now();
      try {
        const generated = await this.#invokeProvider(provider, {
          catalogEntry: entry,
          systemPrompt: candidateSystemPrompt,
          userPrompt: boundedUserPrompt,
          inputParts,
          jsonMode,
          responseSchema,
          maxOutputTokens: outputTokens,
          allowQaExtended: qaExtendedActive,
        }, attemptTimeout, signal);
        const text = String(generated?.text ?? "");
        if (!text.trim()) {
          throw Object.assign(new Error("Empty structured response"), {
            gatewayErrorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE,
            providerErrorCode: "EMPTY_RESPONSE",
          });
        }

        let parsedResponse;
        if (typeof parseResponse === "function") {
          try {
            parsedResponse = parseResponse(text);
          } catch {
            const attempt = this.#pushFailure(attempts, {
              entry,
              attemptNumber,
              startedAt: attemptStartedAt,
              durationMs: Date.now() - attemptStartedAt,
              errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE,
              providerErrorCode: "INVALID_JSON",
              result: "MODEL_INCOMPATIBLE",
              errorMessage: "Model output was not valid JSON",
            });
            primaryFailure ||= attempt;
            lastError = { errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE, providerErrorCode: "INVALID_JSON", providerStatus: "MODEL_INCOMPATIBLE" };
            continue;
          }

          // Server-owned model provenance: authoritative model identity is stamped server-side
          if (parsedResponse && typeof parsedResponse === "object" && !Array.isArray(parsedResponse)) {
            parsedResponse.provider = "google";
            parsedResponse.model = entry.model;
          }

          let valid = true;
          if (typeof validateResponse === "function") {
            try {
              valid = Boolean(validateResponse(parsedResponse, entry));
            } catch {
              valid = false;
            }
          }
          if (!valid) {
            const attempt = this.#pushFailure(attempts, {
              entry,
              attemptNumber,
              startedAt: attemptStartedAt,
              durationMs: Date.now() - attemptStartedAt,
              errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE,
              providerErrorCode: "SCHEMA_VALIDATION_FAILED",
              result: "MODEL_INCOMPATIBLE",
              errorMessage: "Model output failed schema validation",
            });
            primaryFailure ||= attempt;
            lastError = { errorType: GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE, providerErrorCode: "SCHEMA_VALIDATION_FAILED", providerStatus: "MODEL_INCOMPATIBLE" };
            continue;
          }
        }

        const durationMs = Date.now() - attemptStartedAt;
        const isExecutedExtended = isQaExtendedGeminiModel(entry.model);
        const attempt = createAttemptRecord({
          provider: entry.provider,
          model: entry.model,
          ok: true,
          attemptNumber,
          startedAt: nowIso(attemptStartedAt),
          durationMs,
          httpStatus: generated?.httpStatus ?? 200,
          providerErrorCode: generated?.providerErrorCode || null,
          result: "SUCCESS",
          qaExtendedFallback: isExecutedExtended,
        });
        attempts.push(attempt);
        this.healthStore.recordSuccess(entry.provider, entry.model, { latencyMs: durationMs });
        const usedFallback = entry.model !== requestedPrimaryModel || Boolean(primaryFailure);
        const qaExtendedFallback = isExecutedExtended || attempts.some((a) => isQaExtendedGeminiModel(a.model));
        return {
          ok: true,
          capability,
          provider: entry.provider,
          model: entry.model,
          text,
          ...(typeof parseResponse === "function" ? { json: parsedResponse } : {}),
          attempts,
          modelTrace: attempts,
          attemptCount: attempts.length,
          durationMs: Date.now() - startedAt,
          qaExtendedFallback,
          requestedPrimaryModel,
          executedModel: entry.model,
          fallbackUsed: usedFallback,
          fallbackReason: usedFallback ? fallbackReasonFor(primaryFailure) : null,
          providerStatus: "SUCCESS",
          operationStatus: "COMPLETED",
          totalBudgetMs: boundedTotalBudget,
          totalLatencyMs: Date.now() - startedAt,
          httpStatus: generated?.httpStatus ?? 200,
          providerErrorCode: generated?.providerErrorCode || null,
          providerMetadata: {
            transport: generated?.transport || null,
            thinkingLevel: generated?.thinkingLevel || entry.thinkingLevel || null,
          },
          cooldownResult: { skippedModels: cooldownModels, cooldownModels, activeCooldowns },
        };
      } catch (error) {
        if (signal?.aborted) throw abortError(signal.reason);
        const durationMs = Date.now() - attemptStartedAt;
        const rawErrorType = error?.gatewayErrorType || (error?.name === "AbortError" || error?.name === "TimeoutError" ? GATEWAY_ERROR_TYPE.TIMEOUT : GATEWAY_ERROR_TYPE.NETWORK_ERROR);
        const errorType = [GATEWAY_ERROR_TYPE.INVALID_JSON, GATEWAY_ERROR_TYPE.SCHEMA_VALIDATION_FAILED, GATEWAY_ERROR_TYPE.EMPTY_RESPONSE].includes(rawErrorType)
          ? GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE
          : rawErrorType;
        const httpStatus = Number.isInteger(Number(error?.httpStatus)) ? Number(error.httpStatus) : null;
        const providerErrorCode = normalizeProviderErrorCode(error?.providerErrorCode || error?.code);
        const status = providerStatusFor(errorType, httpStatus, providerErrorCode);
        const result = traceResultForFailure({ errorType, httpStatus, providerErrorCode });
        const attempt = this.#pushFailure(attempts, {
          entry,
          attemptNumber,
          startedAt: attemptStartedAt,
          durationMs,
          errorType,
          httpStatus,
          providerErrorCode,
          result,
          errorMessage: error?.message,
        });
        primaryFailure ||= attempt;
        lastError = {
          errorType,
          httpStatus,
          providerErrorCode,
          providerStatus: status,
          errorMessage: sanitizeGatewayError(errorType, error?.message),
        };

        const shouldFailover = isFailoverEligible({ errorType, httpStatus, providerErrorCode });
        if (shouldFailover) {
          if (errorType !== GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE) {
            this.healthStore.recordFailure({
              provider: entry.provider,
              model: entry.model,
              result,
              httpStatus,
              retryAfterMs: error?.retryAfterMs,
              dailyQuotaExhausted: error?.dailyQuotaExhausted === true,
              quotaResetAt: error?.quotaResetAt,
            });
          }
          continue;
        }
        break;
      }
    }

    const totalLatencyMs = Date.now() - startedAt;
    const finalErrorType = lastError?.errorType || GATEWAY_ERROR_TYPE.NOT_CONFIGURED;
    const qaExtendedFallback = attempts.some((a) => isQaExtendedGeminiModel(a.model));
    return {
      ok: false,
      capability,
      provider: null,
      model: null,
      attempts,
      modelTrace: attempts,
      attemptCount: attempts.length,
      durationMs: totalLatencyMs,
      qaExtendedFallback,
      requestedPrimaryModel,
      executedModel: null,
      fallbackUsed: false,
      fallbackReason: null,
      providerStatus: lastError?.providerStatus || classifyGatewayFailure({
        errorType: finalErrorType,
        httpStatus: lastError?.httpStatus,
        providerErrorCode: lastError?.providerErrorCode,
      }),
      operationStatus: "PARTIAL",
      totalBudgetMs: boundedTotalBudget,
      totalLatencyMs,
      errorType: finalErrorType,
      errorMessage: sanitizeGatewayError(finalErrorType, lastError?.errorMessage),
      httpStatus: lastError?.httpStatus || null,
      providerErrorCode: lastError?.providerErrorCode || null,
      providerMetadata: { transport: null, thinkingLevel: null },
      cooldownResult: { skippedModels: cooldownModels, cooldownModels, activeCooldowns },
    };
  }

  /**
   * Preflight health probe for configured Gemini candidates.
   * Runs lightweight checks to identify healthy models before recording or testing.
   */
  async preflightHealthCheck({ timeoutPerModelMs = 4500 } = {}) {
    const candidateEntries = [
      "GEMINI_3_8_FLASH",
      "GEMINI_3_7_FLASH",
      "GEMINI_3_6_FLASH",
      "GEMINI_3_5_FLASH",
      "GEMINI_3_5_FLASH_LITE",
      "GEMINI_3_1_FLASH_LITE",
    ];
    const results = [];
    const healthyModels = [];
    const unhealthyModels = [];

    for (const entryId of candidateEntries) {
      const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
      if (!entry) continue;
      const provider = this.providers[entry.provider];
      if (!provider || !provider.isConfigured(entry)) {
        unhealthyModels.push({ model: entry.model, reason: "NOT_CONFIGURED" });
        results.push({ model: entry.model, health: "NOT_CONFIGURED", lastHttpStatus: null, latencyMs: 0, status: "NOT_CONFIGURED" });
        continue;
      }

      const checkStart = Date.now();
      try {
        await this.#invokeProvider(provider, {
          catalogEntry: entry,
          systemPrompt: 'Respond strictly with {"status":"HEALTHY","model":"' + entry.model + '"}',
          userPrompt: "Health probe",
          jsonMode: true,
          maxOutputTokens: 64,
          allowQaExtended: true,
        }, timeoutPerModelMs);

        const latencyMs = Date.now() - checkStart;
        this.healthStore.recordSuccess(entry.provider, entry.model, { latencyMs });
        healthyModels.push(entry.model);
        results.push({
          model: entry.model,
          health: "HEALTHY",
          lastHttpStatus: 200,
          latencyMs,
          status: "SUCCESS",
        });
      } catch (err) {
        const latencyMs = Date.now() - checkStart;
        const httpStatus = err?.httpStatus || (err?.name === "TimeoutError" ? 408 : 500);
        this.healthStore.recordFailure({
          provider: entry.provider,
          model: entry.model,
          result: err?.name === "TimeoutError" ? "TIMEOUT" : "HTTP_" + httpStatus,
          httpStatus,
          dailyQuotaExhausted: err?.dailyQuotaExhausted === true || httpStatus === 429,
        });
        unhealthyModels.push({ model: entry.model, reason: err?.message || String(err), httpStatus, latencyMs });
        results.push({
          model: entry.model,
          health: "UNHEALTHY",
          lastHttpStatus: httpStatus,
          latencyMs,
          status: err?.name === "TimeoutError" ? "TIMEOUT" : "ERROR",
        });
      }
    }

    return {
      preflightRun: true,
      healthyModels,
      unhealthyModels,
      preferredModel: healthyModels[0] || null,
      backupOrder: healthyModels.slice(1),
      modelHealthSnapshot: results,
      demoL4Ready: healthyModels.length >= 1,
    };
  }
}

