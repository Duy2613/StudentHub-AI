/**
 * StudentHub AI — Temporal Fusion & Supersession Engine V1
 * 
 * Manages regulatory lifecycle transitions, historical vs active states,
 * and separates supersession from true contradictions.
 */

import {
  TEMPORAL_ALIGNMENT_STATE,
  KNOWLEDGE_LAYER
} from "./evidenceFusionModel.js";

export class EvidenceFusionTemporalEngine {
  /**
   * Evaluates temporal lifecycle relation between two official notices/rules
   */
  static evaluateTemporalRelation(sourceA, sourceB) {
    const timeA = new Date(sourceA.publishedAt || sourceA.timestamp || 0).getTime();
    const timeB = new Date(sourceB.publishedAt || sourceB.timestamp || 0).getTime();

    // If both are official sources for the same subject with different dates
    if (sourceA.layer === KNOWLEDGE_LAYER.OFFICIAL_TRUTH && sourceB.layer === KNOWLEDGE_LAYER.OFFICIAL_TRUTH) {
      if (timeA > timeB) {
        return {
          isSupersession: true,
          activeSource: sourceA,
          supersededSource: sourceB,
          state: TEMPORAL_ALIGNMENT_STATE.CURRENT_ACTIVE,
          explanation: `Văn bản mới hơn (${sourceA.publishedAt || 'V2'}) chính thức thay thế văn bản cũ (${sourceB.publishedAt || 'V1'}). Không cấu thành mâu thuẫn.`
        };
      } else if (timeB > timeA) {
        return {
          isSupersession: true,
          activeSource: sourceB,
          supersededSource: sourceA,
          state: TEMPORAL_ALIGNMENT_STATE.CURRENT_ACTIVE,
          explanation: `Văn bản mới hơn (${sourceB.publishedAt || 'V2'}) chính thức thay thế văn bản cũ (${sourceA.publishedAt || 'V1'}).`
        };
      }
    }

    return {
      isSupersession: false,
      activeSource: sourceA,
      supersededSource: null,
      state: TEMPORAL_ALIGNMENT_STATE.CURRENT_ACTIVE,
      explanation: "Các nguồn cùng thời kỳ hiệu lực."
    };
  }

  /**
   * Filters and labels active vs historical claims
   */
  static alignTemporalClaims(claims = []) {
    const currentYear = new Date().getFullYear();
    const active = [];
    const historical = [];

    for (const claim of claims) {
      const year = new Date(claim.createdAt || claim.publishedAt || Date.now()).getFullYear();
      if (currentYear - year >= 2 || claim.temporalState === "HISTORICAL_SUPERSEDED") {
        historical.push({ ...claim, temporalState: "HISTORICAL_SUPERSEDED" });
      } else {
        active.push({ ...claim, temporalState: "CURRENT_ACTIVE" });
      }
    }

    return { active, historical };
  }
}
