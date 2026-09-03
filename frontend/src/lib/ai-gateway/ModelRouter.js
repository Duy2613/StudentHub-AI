/**
 * AI Gateway — ModelRouter
 *
 * Capability-based router: given a requested AI_CAPABILITY, walks the
 * configured fallback chain (AI_GATEWAY_CONFIG.CAPABILITY_ROUTES), skips
 * any model whose provider/secrets are not configured, retries transient
 * errors once per candidate, and stops at the first successful response.
 * Structured callers can provide a parser and validator; those checks are
 * performed inside the candidate lifecycle so deterministic output failures
 * advance to the next candidate without retrying the same model.
 *
 * This is the ONLY place capability -> model selection logic lives.
 * Domain code (Layer 2, Layer 4, AI Mentor) must never hard-code a model id.
 */

import { AI_GATEWAY_CONFIG } from "./config/AIGatewayConfig.js";
import {
  PROVIDER_FAMILY,
  GATEWAY_ERROR_TYPE,
  createAttemptRecord,
  estimateModelUsage,
  estimatedCostCentsFor,
  mergeModelUsage,
  normalizeModelUsage,
  sanitizeGatewayError,
} from "./types.js";
import { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider.js";
import { GeminiProvider } from "./providers/GeminiProvider.js";

const PROVIDER_INSTANCES = {
  [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: new OpenAICompatibleProvider(),
  [PROVIDER_FAMILY.GEMINI]: new GeminiProvider(),
};

function consumeBudget(budget, operations) {
  if (!budget) return { allowed: true, code: null };
  if (typeof budget.tryConsumeMany === "function") return budget.tryConsumeMany(operations);
  if (typeof budget.tryConsume !== "function") return { allowed: true, code: null };
  for (const operation of operations) {
    const result = budget.tryConsume(operation.kind, operation.amount);
    if (!result?.allowed) return result;
  }
  return { allowed: true, code: null };
}

function recordBudgetUsage(budget, kind, amount = 1) {
  if (typeof budget?.recordUsage !== "function") return;
  budget.recordUsage(kind, amount);
}

export class ModelRouter {
  /**
   * @param {object} [overrideProviders] - test-only injection point,
   *   e.g. { openai_compatible: fakeProviderInstance }
   */
  constructor(overrideProviders = {}) {
    this.providers = { ...PROVIDER_INSTANCES, ...overrideProviders };
  }

  /**
   * Lists model catalog entries eligible for a capability, in fallback
   * order, annotated with whether they are currently configured.
   * Useful for observability/diagnostics without making any network call.
   */
  describeRoute(capability) {
    const chain = AI_GATEWAY_CONFIG.CAPABILITY_ROUTES[capability] || [];
    return chain.map((entryId) => {
      const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
      if (!entry) {
        return {
          entryId,
          provider: null,
          model: null,
          tier: null,
          configured: false,
        };
      }
      const provider = this.providers[entry.provider];
      return {
        entryId,
        provider: entry.provider,
        model: entry.model,
        tier: entry.tier,
        configured: Boolean(provider?.isConfigured(entry)),
      };
    });
  }

  /**
   * Attempts generation for the given capability across the fallback chain.
   * @param {object} params
   * @param {string} params.capability - AI_CAPABILITY value
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {boolean} [params.jsonMode]
   * @param {number} [params.timeoutMs]
   * @param {number} [params.maxOutputTokens]
   * @param {object} [params.budget] - request-scoped investigation budget
   * @param {(text: string) => unknown} [params.parseResponse] - optional structured parser
   * @param {(value: unknown) => boolean} [params.validateResponse] - optional structured validator
   * @returns {Promise<{ ok: boolean, provider?: string, model?: string, text?: string, attempts: object[], errorType?: string, errorMessage?: string }>}
   */
  async route({
    capability,
    systemPrompt,
    userPrompt,
    jsonMode = false,
    timeoutMs = AI_GATEWAY_CONFIG.SLA.DEFAULT_TIMEOUT_MS,
    maxOutputTokens = AI_GATEWAY_CONFIG.LIMITS.MAX_OUTPUT_TOKENS,
    signal,
    budget = null,
    parseResponse = null,
    validateResponse = null,
  }) {
    const chain = (AI_GATEWAY_CONFIG.CAPABILITY_ROUTES[capability] || []).slice(
      0,
      AI_GATEWAY_CONFIG.LIMITS.MAX_ROUTER_ATTEMPTS
    );
    const attempts = [];
    const boundedSystemPrompt = String(systemPrompt || "").slice(0, AI_GATEWAY_CONFIG.LIMITS.MAX_PROMPT_CHARACTERS);
    const boundedUserPrompt = String(userPrompt || "").slice(0, AI_GATEWAY_CONFIG.LIMITS.MAX_PROMPT_CHARACTERS);
    const requestedTimeout = Number(timeoutMs);
    const boundedTimeout = Number.isFinite(requestedTimeout)
      ? Math.min(Math.max(requestedTimeout, 250), 30000)
      : AI_GATEWAY_CONFIG.SLA.DEFAULT_TIMEOUT_MS;
    const requestedOutputTokens = Number(maxOutputTokens);
    const boundedOutputTokens = Number.isFinite(requestedOutputTokens)
      ? Math.min(Math.max(Math.floor(requestedOutputTokens), 1), AI_GATEWAY_CONFIG.LIMITS.MAX_OUTPUT_TOKENS)
      : AI_GATEWAY_CONFIG.LIMITS.MAX_OUTPUT_TOKENS;
    let aggregateUsage = null;
    let aggregateEstimatedCostCents = 0;

    if (chain.length === 0) {
      return {
        ok: false,
        attempts,
        errorType: GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
        errorMessage: `No model route defined for capability "${capability}"`,
      };
    }

    let lastError = null;
    let budgetBlocked = false;

    for (const entryId of chain) {
      if (signal?.aborted) {
        const error = signal.reason instanceof Error ? signal.reason : new Error("AI gateway request cancelled");
        error.name = "AbortError";
        throw error;
      }
      const catalogEntry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
      if (!catalogEntry) {
        attempts.push(createAttemptRecord({
          provider: "unknown",
          model: entryId,
          ok: false,
          errorType: GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
          errorMessage: "Unknown model catalog entry"
        }));
        continue;
      }

      const provider = this.providers[catalogEntry.provider];

      let configured = false;
      try {
        configured = Boolean(provider && provider.isConfigured(catalogEntry));
      } catch {
        configured = false;
      }
      if (!configured) {
        attempts.push(
          createAttemptRecord({
            provider: catalogEntry.provider,
            model: catalogEntry.model,
            ok: false,
            errorType: GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
            errorMessage: `Missing configuration for ${catalogEntry.envKey}`,
          })
        );
        continue;
      }

      const maxAttempts = 1 + AI_GATEWAY_CONFIG.RETRY.MAX_RETRIES_PER_CANDIDATE;
      for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex += 1) {
        if (signal?.aborted) {
          const error = signal.reason instanceof Error ? signal.reason : new Error("AI gateway request cancelled");
          error.name = "AbortError";
          throw error;
        }
        const startedAt = Date.now();
        const admissionUsage = estimateModelUsage({
          systemPrompt: boundedSystemPrompt,
          userPrompt: boundedUserPrompt,
          maxOutputTokens: boundedOutputTokens,
        });
        const admissionCost = estimatedCostCentsFor({ costClass: catalogEntry.costClass, usage: admissionUsage });
        const budgetResult = consumeBudget(budget, [
          { kind: "aiTokens", amount: admissionUsage.totalTokens },
          { kind: "estimatedCostCents", amount: admissionCost },
          ...(attemptIndex > 0 ? [{ kind: "retries", amount: 1 }] : []),
        ]);
        if (budgetResult && budgetResult.allowed === false) {
          const errorType = GATEWAY_ERROR_TYPE.BUDGET_EXCEEDED;
          const errorMessage = "The investigation budget refused another AI provider call";
          lastError = { errorType, errorMessage };
          attempts.push(createAttemptRecord({
            provider: catalogEntry.provider,
            model: catalogEntry.model,
            ok: false,
            errorType,
            errorMessage,
            latencyMs: 0,
          }));
          budgetBlocked = true;
          break;
        }
        recordBudgetUsage(budget, "aiCalls");
        let providerUsage = null;
        const recordProviderAttempt = ({ ok, errorType = null, errorMessage = null, latencyMs = 0 }) => {
          const usage = normalizeModelUsage(providerUsage) || admissionUsage;
          aggregateUsage = mergeModelUsage(aggregateUsage, usage);
          aggregateEstimatedCostCents += admissionCost;
          attempts.push(createAttemptRecord({
            provider: catalogEntry.provider,
            model: catalogEntry.model,
            ok,
            errorType,
            errorMessage,
            latencyMs,
            usage,
            estimatedCostCents: admissionCost,
          }));
        };
        try {
          const generated = await provider.generate({
            catalogEntry,
            systemPrompt: boundedSystemPrompt,
            userPrompt: boundedUserPrompt,
            jsonMode,
            timeoutMs: boundedTimeout,
            maxOutputTokens: boundedOutputTokens,
            signal,
          });
          const text = generated?.text;
          providerUsage = normalizeModelUsage(generated?.usage);

          let parsedResponse;
          if (typeof parseResponse === "function") {
            try {
              parsedResponse = parseResponse(String(text ?? ""));
            } catch {
              const errorType = GATEWAY_ERROR_TYPE.INVALID_JSON;
              const errorMessage = "Model output was not valid JSON";
              lastError = { errorType, errorMessage };
              recordProviderAttempt({ ok: false, errorType, errorMessage, latencyMs: Date.now() - startedAt });
              // Parsing is deterministic for this response. Do not retry the
              // same candidate; continue with the next configured model.
              break;
            }

            let valid = true;
            if (typeof validateResponse === "function") {
              try {
                valid = Boolean(validateResponse(parsedResponse));
              } catch {
                valid = false;
              }
            }
            if (!valid) {
              const errorType = GATEWAY_ERROR_TYPE.SCHEMA_VALIDATION_FAILED;
              const errorMessage = "Model output failed schema validation";
              lastError = { errorType, errorMessage };
              recordProviderAttempt({ ok: false, errorType, errorMessage, latencyMs: Date.now() - startedAt });
              // Schema validation is deterministic for this response. Do not
              // retry the same candidate; continue with the next configured model.
              break;
            }
          }

          recordProviderAttempt({ ok: true, latencyMs: Date.now() - startedAt });

          return {
            ok: true,
            provider: catalogEntry.provider,
            model: catalogEntry.model,
            text: String(text ?? ""),
            ...(typeof parseResponse === "function" ? { json: parsedResponse } : {}),
            attempts,
            usage: aggregateUsage,
            estimatedCostCents: aggregateEstimatedCostCents,
          };
        } catch (err) {
          if (signal?.aborted) throw err;
          const latencyMs = Date.now() - startedAt;
          const errorType = err.gatewayErrorType || GATEWAY_ERROR_TYPE.NETWORK_ERROR;
          lastError = { errorType, errorMessage: sanitizeGatewayError(errorType, err.message) };

          recordProviderAttempt({ ok: false, errorType, errorMessage: err.message, latencyMs });

          const isRetryable =
            errorType === GATEWAY_ERROR_TYPE.TIMEOUT ||
            AI_GATEWAY_CONFIG.RETRY.RETRYABLE_HTTP_STATUS.includes(err.httpStatus);

          if (!isRetryable || attemptIndex === maxAttempts - 1) {
            break; // move to next candidate in the fallback chain
          }
        }
      }
      if (budgetBlocked) break;
    }

    return {
      ok: false,
      attempts,
      errorType: lastError?.errorType || GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
      errorMessage: sanitizeGatewayError(
        lastError?.errorType || GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
        lastError?.errorMessage
      ),
      usage: aggregateUsage,
      estimatedCostCents: aggregateEstimatedCostCents,
    };
  }
}
