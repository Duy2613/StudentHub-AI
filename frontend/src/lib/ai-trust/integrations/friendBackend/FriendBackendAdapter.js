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
  async verifyLayer2({ url, requestId, signal, budget } = {}) {
    return super.verifyLayer2({ url, requestId, signal, budget });
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
