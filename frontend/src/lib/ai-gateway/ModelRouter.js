/**
 * AI Gateway — ModelRouter
 *
 * Capability-based router: given a requested AI_CAPABILITY, walks the
 * configured fallback chain (AI_GATEWAY_CONFIG.CAPABILITY_ROUTES), skips
 * any model whose provider/secrets are not configured, retries transient
 * errors once per candidate, and stops at the first successful response.
 *
 * This is the ONLY place capability -> model selection logic lives.
 * Domain code (Layer 2, Layer 4, AI Mentor) must never hard-code a model id.
 */

import { AI_GATEWAY_CONFIG } from "./config/AIGatewayConfig.js";
import { PROVIDER_FAMILY, GATEWAY_ERROR_TYPE, createAttemptRecord } from "./types.js";
import { OpenAICompatibleProvider } from "./providers/OpenAICompatibleProvider.js";
import { GeminiProvider } from "./providers/GeminiProvider.js";

const PROVIDER_INSTANCES = {
  [PROVIDER_FAMILY.OPENAI_COMPATIBLE]: new OpenAICompatibleProvider(),
  [PROVIDER_FAMILY.GEMINI]: new GeminiProvider(),
};

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
   * @returns {Promise<{ ok: boolean, provider?: string, model?: string, text?: string, attempts: object[], errorType?: string, errorMessage?: string }>}
   */
  async route({
    capability,
    systemPrompt,
    userPrompt,
    jsonMode = false,
    timeoutMs = AI_GATEWAY_CONFIG.SLA.DEFAULT_TIMEOUT_MS,
    maxOutputTokens = AI_GATEWAY_CONFIG.LIMITS.MAX_OUTPUT_TOKENS,
  }) {
    const chain = (AI_GATEWAY_CONFIG.CAPABILITY_ROUTES[capability] || []).slice(
      0,
      AI_GATEWAY_CONFIG.LIMITS.MAX_ROUTER_ATTEMPTS
    );
    const attempts = [];

    if (chain.length === 0) {
      return {
        ok: false,
        attempts,
        errorType: GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
        errorMessage: `No model route defined for capability "${capability}"`,
      };
    }

    let lastError = null;

    for (const entryId of chain) {
      const catalogEntry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
      const provider = this.providers[catalogEntry.provider];

      if (!provider || !provider.isConfigured(catalogEntry)) {
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
        const startedAt = Date.now();
        try {
          // eslint-disable-next-line no-await-in-loop
          const { text } = await provider.generate({
            catalogEntry,
            systemPrompt,
            userPrompt,
            jsonMode,
            timeoutMs,
            maxOutputTokens,
          });

          attempts.push(
            createAttemptRecord({
              provider: catalogEntry.provider,
              model: catalogEntry.model,
              ok: true,
              latencyMs: Date.now() - startedAt,
            })
          );

          return {
            ok: true,
            provider: catalogEntry.provider,
            model: catalogEntry.model,
            text,
            attempts,
          };
        } catch (err) {
          const latencyMs = Date.now() - startedAt;
          const errorType = err.gatewayErrorType || GATEWAY_ERROR_TYPE.NETWORK_ERROR;
          lastError = { errorType, errorMessage: err.message };

          attempts.push(
            createAttemptRecord({
              provider: catalogEntry.provider,
              model: catalogEntry.model,
              ok: false,
              errorType,
              errorMessage: err.message,
              latencyMs,
            })
          );

          const isRetryable =
            errorType === GATEWAY_ERROR_TYPE.TIMEOUT ||
            AI_GATEWAY_CONFIG.RETRY.RETRYABLE_HTTP_STATUS.includes(err.httpStatus);

          if (!isRetryable || attemptIndex === maxAttempts - 1) {
            break; // move to next candidate in the fallback chain
          }
        }
      }
    }

    return {
      ok: false,
      attempts,
      errorType: lastError?.errorType || GATEWAY_ERROR_TYPE.NOT_CONFIGURED,
      errorMessage: lastError?.errorMessage || "No configured provider available for this capability",
    };
  }
}
