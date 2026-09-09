/**
 * StudentHub AI — EvidenceDiscoveryService
 *
 * Implements Layer 2 Evidence Discovery:
 * - Search query strategy synthesis (official source, exact phrase, organization, policy, contradiction)
 * - SSRF protection on source URLs
 * - URL canonicalization (stripping tracking tags, normalizing hostnames)
 * - Real source contract & immutable content hash (SHA-256)
 * - Traceable search query provenance
 */

import { createHash } from "node:crypto";
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import { INSTITUTIONAL_KNOWLEDGE_BASE } from "../../ai-trust/layer3/retrieval/KnowledgeBaseRetriever.js";
import { LiveWebRetrievalService } from "./LiveWebRetrievalService.js";
import { EvidenceCandidatePool } from "./EvidenceCandidatePool.js";

const BLOCKED_IP_REGEX = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/;

export class EvidenceDiscoveryService {
  /**
   * SSRF & Protocol Safety Gate
   */
  static isSafeUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") return false;
    const trimmed = rawUrl.trim();
    if (/^(javascript|data|file|vbscript|blob):/i.test(trimmed)) return false;

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return false;
      if (BLOCKED_IP_REGEX.test(hostname)) return false;
      if (hostname.includes("169.254.169.254") || hostname.includes("metadata.google.internal")) return false;
      return validateRemoteUrlSync(trimmed).ok;
    } catch {
      return false;
    }
  }

  /**
   * Canonicalizes URL: removes tracking query parameters, normalizes case and slashes.
   */
  static canonicalizeUrl(rawUrl) {
    if (!this.isSafeUrl(rawUrl)) return null;
    try {
      const parsed = new URL(rawUrl.trim());
      parsed.hostname = parsed.hostname.toLowerCase();

      // Strip common tracking parameters
      const TRACKING_PARAMS = [
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "fbclid", "gclid", "ref", "source", "feature"
      ];
      for (const p of TRACKING_PARAMS) {
        parsed.searchParams.delete(p);
      }

      // Remove default ports
      if ((parsed.protocol === "http:" && parsed.port === "80") ||
          (parsed.protocol === "https:" && parsed.port === "443")) {
        parsed.port = "";
      }

      // Remove fragment
      parsed.hash = "";

      return parsed.toString();
    } catch {
      return null;
    }
  }

  /**
   * Computes SHA-256 content digest
   */
  static computeDigest(content) {
    return createHash("sha256").update(String(content || ""), "utf8").digest("hex");
  }

  /**
   * Synthesizes multi-strategy search queries for a claim
   */
  static generateSearchStrategies(claim) {
    const text = claim.normalizedText || claim.text || "";
    const entities = claim.entities || [];
    const entityNames = entities.map((e) => (typeof e === "string" ? e : e.name)).filter(Boolean);

    const strategies = [
      {
        type: "OFFICIAL_SOURCE",
        query: `${entityNames.join(" ")} quy chế chính thức thông báo`,
      },
      {
        type: "EXACT_PHRASE",
        query: `"${text.slice(0, 80)}"`,
      },
      {
        type: "CONTRADICTION_SEARCH",
        query: `${entityNames.join(" ")} cảnh báo lừa đảo ${text.slice(0, 60)}`,
      },
      {
        type: "POLICY_REGULATION",
        query: `${entityNames.join(" ")} quyết định quy định năm 2026`,
      },
    ];

    return strategies.filter((s) => s.query.trim().length > 3);
  }

  /**
   * Discovers and normalizes evidence for claims.
   * Leverages verified institutional knowledge base and returns normalized real source contracts.
   */
  static async discoverEvidenceForClaims({
    claims = [],
    runId = "run_default",
    revision = 1,
    mode = "HYBRID", // "STATIC" | "LIVE" | "HYBRID"
    officialDiscoverySources = [],
    officialDiscoveryAdapter = null,
    includeOfficialDiscovery = false,
    publicApiDiscoverySources = [],
    publicApiDiscoveryAdapter = null,
    includePublicApiDiscovery = false,
    signal,
  } = {}) {
    const liveSources = [];
    const staticSources = [];
    const discoveredOfficialSources = [];
    const discoveredPublicApiSources = [];
    const searchTraces = [];
    let liveRetrievalActive = false;
    let officialDiscoveryStatus = "NOT_REQUESTED";
    let publicApiDiscoveryStatus = "NOT_REQUESTED";

    // 1. If mode is LIVE or HYBRID, execute Live Web Retrieval first
    if (mode === "LIVE" || mode === "HYBRID") {
      try {
        const liveResult = await LiveWebRetrievalService.discoverLiveEvidenceForClaims({
          claims,
          runId,
          revision,
        });
        if (liveResult?.sources?.length > 0) {
          liveSources.push(...liveResult.sources);
          searchTraces.push(...(liveResult.searchTraces || []));
          liveRetrievalActive = true;
        }
      } catch (err) {
        console.warn("[EvidenceDiscoveryService] Live retrieval warning:", err.message);
      }
    }

    // 2. If mode is STATIC or HYBRID (or if LIVE returned 0 results as fallback)
    if (mode === "STATIC" || mode === "HYBRID" || liveSources.length === 0) {
      for (const [index, claim] of claims.entries()) {
        const claimId = claim.claimId || `claim-${index + 1}`;
        const strategies = this.generateSearchStrategies(claim);

        for (const strat of strategies) {
          const queryId = `query-${claimId}-${strat.type.toLowerCase()}`;
          searchTraces.push({
            queryId,
            claimId,
            strategyType: strat.type,
            query: strat.query,
            timestamp: new Date().toISOString(),
            provider: "INSTITUTIONAL_KNOWLEDGE_BASE",
          });

          // Search matching verified documents in institutional KB
          const normalizedQuery = strat.query.toLowerCase();
          const matches = INSTITUTIONAL_KNOWLEDGE_BASE.filter((doc) => {
            const docText = `${doc.title} ${doc.content} ${doc.domain} ${doc.keywords?.join(" ")}`.toLowerCase();
            const queryTokens = normalizedQuery.split(/\s+/).filter((t) => t.length > 2);
            return queryTokens.some((t) => docText.includes(t));
          });

          for (const doc of matches) {
            const canonical = this.canonicalizeUrl(doc.url);
            if (!canonical) continue;

            const contentDigest = this.computeDigest(doc.content);
            const sourceId = `src-${doc.id || createHash("sha256").update(canonical).digest("hex").slice(0, 12)}`;

            staticSources.push({
              sourceId,
              evidenceId: `ev-${sourceId}-${claimId}`,
              claimId,
              publisher: doc.publisher || "Official Institution",
              sourceType: doc.domain.endsWith(".edu.vn") || doc.domain.endsWith(".gov.vn") ? "PRIMARY_OFFICIAL" : "SECONDARY_PRESS",
              canonicalUrl: canonical,
              originalRetrievedUrl: doc.url,
              title: doc.title,
              domain: doc.domain,
              publishedAt: doc.publishedAt,
              retrievedAt: new Date().toISOString(),
              jurisdiction: "VN",
              allowedUse: "ACADEMIC_STUDENT_VERIFICATION",
              snapshotUri: `snapshot://${runId}/sources/${sourceId}.txt`,
              contentDigest,
              rawContentSnippet: doc.content.slice(0, 500),
              parserVersion: "1.0.0-verified",
              piiClassification: "REDACTED_PUBLIC",
              correctionChain: [],
              independenceKey: doc.domain,
              retrievalMethod: "VERIFIED_KNOWLEDGE_BASE",
              retrievalQueryId: queryId,
              revision,
              claimRelations: doc.claimRelations || {},
            });
          }
        }
      }
    }

    // Official pages are an explicit, opt-in discovery lane. The adapter
    // returns minimal identity metadata only; the candidates remain discovery
    // seeds and are never silently treated as proof of a claim.
    if (includeOfficialDiscovery && officialDiscoveryAdapter && typeof officialDiscoveryAdapter.discoverAll === "function") {
      try {
        const officialResult = await officialDiscoveryAdapter.discoverAll({ claims, signal });
        officialDiscoveryStatus = officialResult?.status || (officialResult?.ok ? "AVAILABLE" : "UNAVAILABLE");
        const records = Array.isArray(officialResult?.records) ? officialResult.records : [];
        for (const [claimIndex, claim] of claims.entries()) {
          const claimId = claim.claimId || `claim-${claimIndex + 1}`;
          for (const record of records) {
            const sourceId = String(record.sourceId || `official-discovery-${claimIndex + 1}`).slice(0, 240);
            discoveredOfficialSources.push({
              ...record,
              sourceId,
              evidenceId: `ev-${sourceId}-${claimId}`.slice(0, 320),
              claimId,
              allowedUse: "ENTITY_DISCOVERY_ONLY",
              retrievalQueryId: `query-${claimId}-official-discovery`,
              revision,
              claimRelations: { [claimId]: "DISCOVERY_ONLY" },
              officialDiscovery: true,
              discoveryOnly: true,
            });
          }
          searchTraces.push({
            queryId: `query-${claimId}-official-discovery`,
            claimId,
            strategyType: "OFFICIAL_DISCOVERY",
            query: claim.normalizedText || claim.text || "",
            timestamp: new Date().toISOString(),
            provider: officialResult?.provider || "MOET_OFFICIAL_DISCOVERY",
            sourceState: officialDiscoveryStatus,
          });
        }
      } catch {
        officialDiscoveryStatus = "UNAVAILABLE";
      }
    }

    // Public API institution metadata is a separate, opt-in discovery lane.
    // It can widen entity/domain recall, but it is never an official source or
    // a Trust authority. The adapter is passed claims so providers cannot see
    // evaluation-only gold labels.
    if (includePublicApiDiscovery && publicApiDiscoveryAdapter && typeof publicApiDiscoveryAdapter.discoverAll === "function") {
      try {
        const publicResult = await publicApiDiscoveryAdapter.discoverAll({ claims, signal });
        publicApiDiscoveryStatus = publicResult?.status || (publicResult?.ok ? "AVAILABLE" : "UNAVAILABLE");
        const records = Array.isArray(publicResult?.records) ? publicResult.records : [];
        for (const [claimIndex, claim] of claims.entries()) {
          const claimId = claim.claimId || `claim-${claimIndex + 1}`;
          const recordsForClaim = records.filter((record) => !record.claimId || record.claimId === claimId);
          for (const record of recordsForClaim) {
            const sourceId = String(record.sourceId || `public-api-discovery-${claimIndex + 1}`).slice(0, 240);
            discoveredPublicApiSources.push({
              ...record,
              sourceId,
              evidenceId: `ev-${sourceId}-${claimId}`.slice(0, 320),
              claimId,
              allowedUse: "ENTITY_DISCOVERY_ONLY",
              retrievalQueryId: `query-${claimId}-public-api-discovery`,
              revision,
              claimRelations: { [claimId]: "DISCOVERY_ONLY" },
              publicApiDiscovery: true,
              discoveryOnly: true,
              isAuthoritative: false,
              isPrimary: false,
            });
          }
          searchTraces.push({
            queryId: `query-${claimId}-public-api-discovery`,
            claimId,
            strategyType: "PUBLIC_API_ENTITY_DISCOVERY",
            query: claim.normalizedText || claim.text || "",
            timestamp: new Date().toISOString(),
            provider: publicResult?.provider || "OPENALEX_ENTITY_DISCOVERY",
            sourceState: publicApiDiscoveryStatus,
          });
        }
      } catch {
        publicApiDiscoveryStatus = "UNAVAILABLE";
      }
    }

    const suppliedOfficialSources = Array.isArray(officialDiscoverySources) ? officialDiscoverySources : [];
    const suppliedPublicApiSources = Array.isArray(publicApiDiscoverySources) ? publicApiDiscoverySources : [];
    const candidatePool = EvidenceCandidatePool.merge({
      staticSources,
      liveSources,
      officialDiscoverySources: [...suppliedOfficialSources, ...discoveredOfficialSources],
      publicApiDiscoverySources: [...suppliedPublicApiSources, ...discoveredPublicApiSources],
    });
    const dedupedSources = candidatePool.sources;

    const providerStatus = liveRetrievalActive && dedupedSources.some(s => s.retrievalMethod === "REAL_WEB_RETRIEVAL")
      ? "REAL_WEB_RETRIEVAL_VERIFIED"
      : mode === "LIVE"
        ? (liveRetrievalActive ? "INSUFFICIENT_EVIDENCE" : "SEARCH_UNAVAILABLE")
        : "STATIC_CORPUS_DISCOVERY";

    return {
      sources: dedupedSources,
      searchTraces,
      retrievalProviderStatus: providerStatus,
      candidatePoolTrace: candidatePool.trace,
      officialDiscoveryTrace: {
        requested: includeOfficialDiscovery === true,
        status: officialDiscoveryStatus,
        candidateCount: discoveredOfficialSources.length + suppliedOfficialSources.length,
        authority: "DISCOVERY_ONLY",
      },
      publicApiDiscoveryTrace: {
        requested: includePublicApiDiscovery === true,
        status: publicApiDiscoveryStatus,
        candidateCount: discoveredPublicApiSources.length + suppliedPublicApiSources.length,
        authority: "DISCOVERY_ONLY",
      },
    };
  }
}
