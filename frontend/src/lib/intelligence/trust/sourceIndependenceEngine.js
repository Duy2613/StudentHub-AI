/**
 * StudentHub AI — Source Independence & Laundering Detection Engine V1
 * 
 * Enforces provenance purity. Clustered syndications (multiple sites copying the same text)
 * and circular laundering chains (Forum -> Blog -> Search Result) are identified and collapsed
 * into single provenance nodes so that they NEVER masquerade as independent corroboration.
 */

import { AiTrustModel, AUTHORITY_TIER, SOURCE_TYPE } from "./aiTrustModel.js";

export class SourceIndependenceEngine {
  /**
   * Evaluates independence across a set of retrieved sources and evidence spans
   * @param {Array<object>} sources 
   * @param {Array<object>} evidenceSpans 
   * @returns {{
   *   sourceIndependenceScore: number,
   *   provenanceClusters: Array<object>,
   *   effectiveIndependentCount: number,
   *   launderingAlerts: Array<string>
   * }}
   */
  static analyzeIndependence(sources = [], evidenceSpans = []) {
    if (!Array.isArray(sources) || sources.length === 0) {
      return {
        sourceIndependenceScore: 1.0,
        provenanceClusters: [],
        effectiveIndependentCount: 0,
        launderingAlerts: []
      };
    }

    const clustersByHash = new Map();
    const launderingAlerts = [];

    // 1. Group evidence spans by content hash or text similarity
    for (const span of evidenceSpans) {
      const hash = span.contentHash || AiTrustModel.computeContentHash(span.passage || "");
      if (!clustersByHash.has(hash)) {
        clustersByHash.set(hash, new Set());
      }
      if (span.sourceId) {
        clustersByHash.get(hash).add(span.sourceId);
      }
    }

    // 2. Identify syndication across sources
    const provenanceClusters = [];
    const sourceToClusterMap = new Map();
    let clusterIdx = 1;

    for (const [hash, sourceIdSet] of clustersByHash.entries()) {
      const memberIds = Array.from(sourceIdSet);
      const clusterId = `PROV_CLUSTER_${clusterIdx++}`;
      
      const clusterSources = sources.filter(s => memberIds.includes(s.sourceId));
      // Determine origin tier (lowest authority among laundered chain or highest verified official)
      const hasCommunityOrigin = clusterSources.some(s => s.sourceType === SOURCE_TYPE.COMMUNITY);
      const hasOfficial = clusterSources.some(s => s.sourceType === SOURCE_TYPE.OFFICIAL);

      if (hasCommunityOrigin && hasOfficial) {
        launderingAlerts.push(`Cảnh báo: Phát hiện chuỗi trích dẫn chéo giữa diễn đàn và nguồn web (Cluster ${clusterId}).`);
      }

      const clusterObj = {
        clusterId,
        sharedContentHash: hash,
        primarySourceId: memberIds[0] || null,
        memberSourceIds: memberIds,
        memberCount: memberIds.length,
        isSyndicated: memberIds.length > 1,
        originAuthorityTier: hasOfficial ? AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR : (
          hasCommunityOrigin ? AUTHORITY_TIER.TIER_4_COMMUNITY_STUDENT : AUTHORITY_TIER.TIER_5_UNVERIFIED_WEB
        )
      };

      provenanceClusters.push(clusterObj);
      for (const sid of memberIds) {
        sourceToClusterMap.set(sid, clusterId);
      }
    }

    // Add unclustered standalone sources
    for (const src of sources) {
      if (!sourceToClusterMap.has(src.sourceId)) {
        const clusterId = `PROV_CLUSTER_${clusterIdx++}`;
        provenanceClusters.push({
          clusterId,
          sharedContentHash: src.contentHash || AiTrustModel.computeContentHash(src.url || src.sourceId),
          primarySourceId: src.sourceId,
          memberSourceIds: [src.sourceId],
          memberCount: 1,
          isSyndicated: false,
          originAuthorityTier: src.authorityTier || AUTHORITY_TIER.TIER_5_UNVERIFIED_WEB
        });
      }
    }

    const effectiveIndependentCount = provenanceClusters.length;
    const rawTotalSources = sources.length;

    // Independence score is ratio of independent clusters to raw count
    const sourceIndependenceScore = rawTotalSources > 0
      ? Math.min(1.0, Number((effectiveIndependentCount / rawTotalSources).toFixed(2)))
      : 1.0;

    return {
      sourceIndependenceScore,
      provenanceClusters,
      effectiveIndependentCount,
      launderingAlerts
    };
  }
}
