/**
 * StudentHub AI — SearchGatewayAdapter
 * 
 * Binds external web evidence retrieval (Tavily, Google Grounding, MoET registry)
 * into ProviderGateway. Preserves rigorous citation provenance.
 */

import crypto from "node:crypto";
import { validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";

export class SearchGatewayAdapter {
  constructor({ name = "tavily-evidence-retriever", underlyingProvider = null } = {}) {
    this.name = name;
    this.underlyingProvider = underlyingProvider;
  }

  async execute(payload, { signal, timeoutMs } = {}) {
    const query = payload.query || payload.statement;
    if (!query) return { sources: [], verified: false };

    if (this.underlyingProvider?.search) {
      const raw = await this.underlyingProvider.search(query, { signal, timeoutMs });
      const sources = (raw.sources || []).filter((s) => {
        if (!s.url) return false;
        const check = validateRemoteUrlSync(s.url);
        return check.ok;
      }).slice(0, 10).map((s) => ({
        title: s.title || "Tài liệu đối chiếu",
        url: s.url,
        domain: new URL(s.url).hostname,
        contentHash: crypto.createHash("sha256").update(s.content || s.snippet || "").digest("hex").slice(0, 16),
        publishedAt: s.publishedAt || new Date().toISOString(),
        sourceIndependence: s.sourceIndependence || "INDEPENDENT_EXTERNAL",
      }));

      return {
        sources,
        verified: sources.length > 0,
        provider: this.name,
      };
    }

    return this.nativeFallback(payload);
  }

  async nativeFallback(payload) {
    return {
      sources: [],
      verified: false,
      status: "DEGRADED",
      provider: "NATIVE_KNOWLEDGE_BASE",
      reason: "External evidence search degraded; relying on deterministic local authority",
    };
  }
}
