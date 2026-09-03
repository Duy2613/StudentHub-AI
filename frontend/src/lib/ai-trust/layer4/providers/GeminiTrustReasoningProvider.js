/**
 * Compatibility name for callers that still import the historical Gemini
 * provider. Vendor selection now belongs to the shared AI Gateway; this class
 * does not read vendor secrets, construct a direct vendor request, or decide
 * a security verdict. The deterministic Layer 4 policy remains authoritative.
 */

import { AIGatewayReasoningProvider } from "./AIGatewayReasoningProvider.js";

export class GeminiTrustReasoningProvider extends AIGatewayReasoningProvider {
  constructor(options = {}) {
    super(options);
    this.providerId = "ai_gateway_multi_vendor_trust_reasoning";
  }
}
