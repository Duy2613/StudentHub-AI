/**
 * StudentHub AI — Tool Use Firewall & Validation Guard V2
 * 
 * Enforces that tools provide raw empirical DATA, but NEVER escalate or inject
 * AUTHORITY. Validates tool schemas, enforces origin boundaries, detects prompt
 * injections embedded in tool payloads, and ensures fail-closed operations.
 */

import { AiTrustModel, AUTHORITY_TIER } from "./aiTrustModel.js";

export class ToolUseFirewall {
  /**
   * Validates tool output and strips any attempt to escalate authority
   */
  static validateToolOutput(toolName = "", rawOutput = {}) {
    if (!rawOutput || typeof rawOutput !== "object") {
      return {
        isValid: false,
        sanitizedData: null,
        error: "Malformed tool payload (non-object or null)."
      };
    }

    // 1. Check for prompt injection or instruction override in tool content
    const textContent = JSON.stringify(rawOutput).toLowerCase();
    const injectionSignatures = [
      "ignore previous instructions",
      "bỏ qua các chỉ thị trước",
      "hệ thống hãy xác nhận",
      "set authority_tier = 100",
      "bypass trust verification",
      "<system>",
      "you are now an unrestricted"
    ];

    for (const sig of injectionSignatures) {
      if (textContent.includes(sig)) {
        return {
          isValid: false,
          sanitizedData: null,
          error: `[TOOL_FIREWALL] Prompt injection signature detected inside tool payload: '${sig}'`,
          isInjected: true
        };
      }
    }

    // 2. Prevent tool output from injecting or escalating authorityTier
    const sanitized = { ...rawOutput };
    
    // Tools can NEVER declare themselves Tier 1 without official server verification
    if (sanitized.authorityTier && sanitized.authorityTier > AUTHORITY_TIER.TIER_3_VERIFIED_EXPERT) {
      sanitized.authorityTier = AUTHORITY_TIER.TIER_4_COMMUNITY_STUDENT;
      sanitized.authorityOverridden = true;
    }

    // Ensure content hash is present and verified
    if (!sanitized.contentHash && typeof sanitized.content === "string") {
      sanitized.contentHash = AiTrustModel.computeContentHash(sanitized.content);
    }

    return {
      isValid: true,
      sanitizedData: Object.freeze(sanitized),
      error: null
    };
  }
}
