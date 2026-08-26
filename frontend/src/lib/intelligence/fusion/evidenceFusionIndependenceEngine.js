/**
 * StudentHub AI — Cross-Layer Independence & Derivation Tracking Engine V1
 * 
 * Prevents false independence inflation:
 * - Detects cross-layer dependence (Official -> Expert -> AI is 1 lineage, not 3 independent supports)
 * - Collapses syndicated provenance clusters into single observation units.
 */

import { KNOWLEDGE_LAYER } from "./evidenceFusionModel.js";

export class EvidenceFusionIndependenceEngine {
  /**
   * Analyzes independence across a set of multi-layer claims and sources
   */
  static evaluateIndependence(claims = [], sources = []) {
    const uniqueOrigins = new Set();
    const derivationChains = [];
    const layerCounts = {
      [KNOWLEDGE_LAYER.OFFICIAL_TRUTH]: 0,
      [KNOWLEDGE_LAYER.AI_VERIFIED_REASONING]: 0,
      [KNOWLEDGE_LAYER.EXPERT_INTERPRETATION]: 0,
      [KNOWLEDGE_LAYER.COMMUNITY_REALITY]: 0
    };

    for (const claim of claims) {
      if (claim.layer) {
        layerCounts[claim.layer] = (layerCounts[claim.layer] || 0) + 1;
      }

      // Check if claim derives from upstream source
      if (claim.derivationChain && claim.derivationChain.length > 0) {
        derivationChains.push({
          claimId: claim.claimId,
          chain: claim.derivationChain
        });
        uniqueOrigins.add(claim.derivationChain[0]);
      } else {
        const originKey = claim.sourceRef?.sourceId || claim.authorId || claim.claimId;
        uniqueOrigins.add(originKey);
      }
    }

    // Evaluate if AI is a downstream derivative
    const hasOfficial = layerCounts[KNOWLEDGE_LAYER.OFFICIAL_TRUTH] > 0;
    const hasExpert = layerCounts[KNOWLEDGE_LAYER.EXPERT_INTERPRETATION] > 0;
    const hasAI = layerCounts[KNOWLEDGE_LAYER.AI_VERIFIED_REASONING] > 0;

    const isLinearDerivation = hasOfficial && (hasExpert || hasAI) && uniqueOrigins.size <= 2;

    return {
      independentClusterCount: Math.max(1, uniqueOrigins.size),
      isLinearDerivation,
      layerDistribution: layerCounts,
      derivationChains,
      explanation: isLinearDerivation
        ? "Phát hiện chuỗi dẫn xuất phụ thuộc (Official → Expert → AI). Hệ thống ghi nhận 1 chuỗi bằng chứng có căn cứ gốc, không tính là 3 nguồn độc lập."
        : `Ghi nhận ${uniqueOrigins.size} cụm nguồn độc lập.`
    };
  }
}
