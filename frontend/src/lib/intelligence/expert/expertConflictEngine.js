/**
 * StudentHub AI — Expert Conflict of Interest (COI) Engine V2
 * 
 * Tracks commercial sponsorships, corporate advisory roles, vendor ties,
 * and financial relationships for domain experts.
 * 
 * Invariants:
 * 1. POTENTIAL_CONFLICT does not infer misconduct or automatically prove falsehood.
 * 2. COI requires full transparency and prevents claims from masquerading as disinterested academic consensus.
 * 3. Commercial product endorsements are strictly disqualified from being objective course guidance.
 */

import {
  ExpertIntelligenceModel
} from "./expertIntelligenceModel.js";

export class ExpertConflictEngine {
  /**
   * Analyzes an expert's conflict graph against a target claim/domain
   */
  static analyzeConflicts(expert, targetDomain = "AI_ML") {
    if (!expert) return { hasConflict: false, conflicts: [], disclosure: null };

    const expObj = ExpertIntelligenceModel.createExpert(expert);
    const domain = String(targetDomain).trim().toUpperCase();

    const activeConflicts = expObj.conflicts.filter(
      cf => cf.isActive && (cf.domain === domain || cf.domain === "ALL" || cf.domain === "GENERAL")
    );

    if (activeConflicts.length === 0) {
      return {
        hasConflict: false,
        conflicts: [],
        disclosure: "Không phát hiện mối quan hệ thương mại hoặc tài trợ doanh nghiệp trong lĩnh vực này."
      };
    }

    const entities = activeConflicts.map(c => `${c.entity} (${c.nature})`).join(", ");

    return {
      hasConflict: true,
      conflicts: activeConflicts,
      disclosure: `[MINH BẠCH LỢI ÍCH] Chuyên gia có quan hệ hợp tác/tài trợ với: ${entities}. Khuyến nghị xem xét tính độc lập khi đánh giá các sản phẩm/giải pháp liên quan.`
    };
  }

  /**
   * Checks if an expert claim constitutes a direct commercial endorsement
   */
  static isCommercialEndorsement(claim, expert) {
    if (!claim) return false;
    if (claim.isCommercialEndorsement) return true;

    const text = (claim.statement || claim.text || "").toLowerCase();
    const commercialKeywords = [
      "khuyên dùng khóa học",
      "mua gói dịch vụ",
      "sử dụng nền tảng của công ty",
      "tài trợ độc quyền",
      "đối tác tài trợ",
      "mã giảm giá"
    ];

    return commercialKeywords.some(kw => text.includes(kw));
  }
}
