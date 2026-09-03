/**
 * StudentHub AI — ReputationGatewayAdapter
 * 
 * Binds reputation/threat intelligence (Safe Browsing, URLhaus) into the ProviderGateway.
 */

import { validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";

export class ReputationGatewayAdapter {
  constructor({ name = "reputation-service", underlyingProvider = null } = {}) {
    this.name = name;
    this.underlyingProvider = underlyingProvider;
  }

  async execute(payload, { signal, timeoutMs } = {}) {
    const url = payload.url || payload.domain;
    if (!url) {
      return { finding: "UNKNOWN", threatMatch: false, reason: "NO_URL_PROVIDED" };
    }

    // SSRF boundary check
    const urlValidation = validateRemoteUrlSync(url);
    if (!urlValidation.ok) {
      return {
        finding: "BLOCKED_SSRF",
        threatMatch: true,
        threatType: "SSRF_DISALLOWED",
        provider: this.name,
        confidence: 1.0,
      };
    }

    if (this.underlyingProvider?.checkUrl) {
      const raw = await this.underlyingProvider.checkUrl(url, { signal, timeoutMs });
      return {
        finding: raw.threatMatch ? "THREAT_MATCH" : "NO_KNOWN_THREAT",
        threatMatch: Boolean(raw.threatMatch),
        threatType: raw.threatType || null,
        provider: raw.provider || this.name,
        confidence: raw.confidence || 0.9,
      };
    }

    // Degraded fallback when no external API key configured
    return this.nativeFallback(payload);
  }

  async nativeFallback(payload) {
    return {
      finding: "UNKNOWN",
      threatMatch: false,
      status: "DEGRADED",
      provider: "NATIVE_HEURISTIC",
      reason: "Live reputation provider not configured or temporarily degraded",
    };
  }
}
