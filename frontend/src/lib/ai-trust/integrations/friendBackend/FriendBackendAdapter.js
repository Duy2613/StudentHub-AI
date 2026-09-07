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
import { createLayer2AResult, LAYER_2A_FINDING, LAYER_2A_PROVIDER_STATUS } from "../../layer2a/types.js";

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
    const inputType = String(input?.type || "").toLowerCase();
    const candidateUrl = url || (inputType === "url" ? input?.content : null) || input?.metadata?.url;
    if (candidateUrl) {
      return super.verifyLayer2({ url: candidateUrl, requestId, signal, budget });
    }
    return createLayer2AResult({
      provider: "google-safe-browsing",
      providerStatus: LAYER_2A_PROVIDER_STATUS.NOT_APPLICABLE,
      finding: LAYER_2A_FINDING.NOT_APPLICABLE,
      notApplicable: true,
      requestId,
      message: "Layer 2 URL reputation is not applicable to non-URL input; later layers evaluate the supplied content.",
    });
  }

  /**
   * Verify Layer 3: Tavily search evidence acquisition.
   * Maps to POST /api/verify/layer3
   */
  async verifyLayer3({ input, claims = [], requestId, signal, budget } = {}) {
    const inputType = String(input?.type || "").toLowerCase();
    const layer3Input = inputType === "url" || inputType === "text"
      ? input
      : { ...input, type: "text" };
    return super.verifyLayer3({ input: layer3Input, claims, requestId, signal, budget });
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
