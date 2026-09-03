/**
 * Server-side anti-corruption adapter for the friend's four-layer backend.
 *
 * Implements the FriendBackendAdapter boundary:
 * - Reads FRIEND_BACKEND_API_URL (with fallback to legacy env vars)
 * - Safe URL validation & DNS checking
 * - Calls /api/verify/layer2, /api/verify/layer3, /api/verify/layer4
 * - Normalizes external responses into canonical StudentHub data structures
 * - Converts transport/HTTP errors into typed application errors
 * - Enforces timeout, bulkhead concurrency, circuit breaking, and secret redaction
 * - Does NOT leak secrets or raw provider exceptions
 */

import {
  LegacyVerificationAdapter,
  normalizeLegacyLayer3Payload,
  normalizeLegacyLayer4Payload,
} from "../legacyVerification/LegacyVerificationAdapter.js";
import { getLegacyVerificationConfig } from "../legacyVerification/config.js";

export class FriendBackendAdapter extends LegacyVerificationAdapter {
  constructor(options = {}) {
    super(options);
    this.providerId = "friend_backend_adapter";
  }

  get isConfigured() {
    return this.config.enabled;
  }

  get status() {
    if (!this.config.configured) return "NOT_CONFIGURED";
    if (!this.config.enabled) return "INVALID_CONFIG";
    return "READY";
  }

  /**
   * Verify Layer 2: Google Safe Browsing URL threat check.
   * Maps to POST /api/verify/layer2
   */
  async verifyLayer2({ url, input, requestId, signal, budget } = {}) {
    const candidateUrl = url || (input?.type === "url" ? input?.content : null) || input?.metadata?.url;
    if (candidateUrl) {
      return super.verifyLayer2({ url: candidateUrl, requestId, signal, budget });
    }
    if (this.config.enabled) {
      try {
        const textContent = input?.content || "";
        const endpoint = `${this.config.baseUrl}${this.config.ENDPOINTS.layer2}`;
        const startedAt = this.clock();
        const response = await this.fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
            "X-Request-ID": requestId || "req_l2_text",
          },
          body: JSON.stringify({ type: "text", content: textContent }),
          signal,
        });
        const latencyMs = Math.max(0, this.clock() - startedAt);
        if (response?.ok) {
          const payload = await response.json();
          return {
            provider: "google-safe-browsing",
            providerStatus: "SUCCESS",
            finding: "NOT_APPLICABLE_URL_ONLY",
            rawVerdict: payload.verdict || "UNKNOWN",
            confidence: payload.confidence || 0,
            reason: payload.reason || "Layer 2 only supports URL scanning at this time.",
            providers: payload.providers || [],
            latencyMs,
            requestId,
          };
        }
      } catch (err) {
        if (signal?.aborted) throw err;
      }
    }
    return super.verifyLayer2({ url: "", requestId, signal, budget });
  }

  /**
   * Verify Layer 3: Tavily search evidence acquisition.
   * Maps to POST /api/verify/layer3
   */
  async verifyLayer3({ input, claims = [], requestId, signal, budget } = {}) {
    return super.verifyLayer3({ input, claims, requestId, signal, budget });
  }

  /**
   * Verify Layer 4: Independent research & LLM synthesis (Gemini/Groq).
   * Maps to POST /api/verify/layer4
   */
  async verifyLayer4({ input = {}, layer3Result, mode = "user", requestId, signal, budget } = {}) {
    const targetInput = { ...input, mode: input.mode || mode };
    return super.verifyLayer4({ input: targetInput, layer3Result, requestId, signal, budget });
  }
}

export function createFriendBackendAdapter(options = {}) {
  return new FriendBackendAdapter(options);
}

export { normalizeLegacyLayer3Payload, normalizeLegacyLayer4Payload, getLegacyVerificationConfig };
