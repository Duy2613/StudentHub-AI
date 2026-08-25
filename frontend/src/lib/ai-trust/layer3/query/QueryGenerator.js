/**
 * Layer 3 — QueryGenerator
 * 
 * Generates multi-strategy search queries for each claim.
 * Enforces the Anti-Confirmation-Bias rule by producing both supporting and contradiction-oriented queries.
 */

import { LAYER_3_CONFIG } from "../config/Layer3Config.js";

export class QueryGenerator {
  /**
   * Generates search queries for a claim and candidate sources
   * @param {object} claim - Claim DTO from Layer 2
   * @param {Array<object>} candidateSources - Official domains from Layer 2
   * @returns {Array<object>} Array of query strategy objects
   */
  static generateQueries(claim, candidateSources = []) {
    if (!claim || !claim.rawText) return [];

    const queries = [];
    const rawText = claim.rawText.replace(/["\n\r]/g, " ").trim();
    const subject = claim.subject || "";
    const predicate = claim.predicate || "";
    const primaryDomain = candidateSources[0]?.officialDomains?.[0] || null;

    // Strategy A: Exact Claim Search
    queries.push({
      strategy: "EXACT_CLAIM",
      query: `"${rawText.slice(0, 100)}"`,
      purpose: "Tìm kiếm trích dẫn nguyên văn",
      targetClaimId: claim.claimId,
    });

    // Strategy B: Entity + Predicate / Keywords
    const entityActionKeywords = `${subject} ${predicate}`.trim();
    queries.push({
      strategy: "ENTITY_ACTION",
      query: entityActionKeywords,
      purpose: "Tìm kiếm nội dung hành động của thực thể",
      targetClaimId: claim.claimId,
    });

    // Strategy C: Entity + Date / Year
    if (claim.time) {
      queries.push({
        strategy: "ENTITY_TEMPORAL",
        query: `${subject} ${predicate} ${claim.time}`.trim(),
        purpose: "Kiểm tra mốc thời gian hiệu lực",
        targetClaimId: claim.claimId,
      });
    }

    // Strategy D: Official Domain Site Search
    if (primaryDomain) {
      queries.push({
        strategy: "OFFICIAL_SITE_FILTER",
        query: `site:${primaryDomain} ${predicate}`,
        purpose: "Truy vấn trực tiếp trên cổng thông tin chính thống",
        targetClaimId: claim.claimId,
        targetDomain: primaryDomain,
      });
    }

    // Strategy E: Anti-Confirmation-Bias Contradiction Search
    // Mandated: Always create at least one contradiction query for high-impact claims!
    queries.push({
      strategy: "CONTRADICTION_SEARCH",
      query: `${subject} ${predicate} đính chính OR cảnh báo lừa đảo OR sai sự thật OR bác bỏ OR dời lịch OR hoãn OR hủy`,
      purpose: "Tìm kiếm thông tin đính chính hoặc cảnh báo giả mạo",
      targetClaimId: claim.claimId,
      isContradictionSeeking: true,
    });

    // Strategy F: Source Claim Official Directive
    queries.push({
      strategy: "SOURCE_CLAIM_ANNOUNCEMENT",
      query: `thông báo chính thức ${subject} ${predicate}`,
      purpose: "Tìm kiếm văn bản thông cáo báo chí chính thức",
      targetClaimId: claim.claimId,
    });

    return queries.slice(0, LAYER_3_CONFIG.LIMITS.MAX_QUERIES_PER_CLAIM);
  }
}
