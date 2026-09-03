/**
 * StudentHub AI — Authority-Aware Conflict Resolution Engine V2
 * Adjudicates competing claims while preserving operational community nuance and official statutory priority.
 */

export const RESOLUTION_VERDICT = Object.freeze({
  SUPPORTED: "SUPPORTED",               // Strongly backed by current official/expert sources
  LIKELY_SUPPORTED: "LIKELY_SUPPORTED", // Backed by reputable sources with minor unverified details
  CONTESTED: "CONTESTED",               // Active peer or temporal disagreement
  LIKELY_FALSE: "LIKELY_FALSE",         // Contradicted by authoritative evidence
  UNRESOLVED: "UNRESOLVED",             // Insufficient evidence to adjudicate
  STALE: "STALE",                       // Evidence expired past temporal interval
  SUPERSEDED: "SUPERSEDED"              // Replaced by officially promulgated newer version
});

export class ConflictResolutionEngine {
  /**
   * Resolves conflicts between official sources, expert testimonies, and community reports
   * @param {object} params
   * @param {object} params.claim - Primary ClaimEntity
   * @param {object[]} params.supportingEvidence - Array of EvidenceEntity
   * @param {object[]} params.contradictingEvidence - Array of EvidenceEntity
   * @param {object[]} [params.contradictions] - Output from ContradictionEngine
   * @returns {object} Final resolved status, confidence score, rationale, and preserved nuances
   */
  static resolveConflict({
    claim,
    supportingEvidence = [],
    contradictingEvidence = [],
    contradictions = []
  }) {
    if (!claim) throw new Error("resolveConflict requires a valid claim.");

    // Check for Temporal Conflicts First (e.g. older regulation superseded by newer one)
    const temporalConflicts = contradictions.filter(c => c.contradictionType === "TEMPORAL_CONFLICT");
    if (temporalConflicts.length > 0) {
      const hasNewerOfficialSupport = supportingEvidence.some(e => e.type === "OFFICIAL_REGULATION" && e.recency >= 0.8);
      if (hasNewerOfficialSupport) {
        return {
          claimId: claim.claimId,
          verdict: RESOLUTION_VERDICT.SUPPORTED,
          adjudicationType: "TEMPORAL_UPDATE_CONFIRMED",
          rationale: "Quy chế mới nhất được ban hành đã thay thế quy định cũ trước đó.",
          preservedNuances: ["Thông tin cũ ở các học kỳ trước không còn hiệu lực thi hành."],
          resolvedAt: new Date().toISOString()
        };
      }
    }

    // Check for Scope Conflicts (e.g. Mass Program vs High-Quality Program)
    const scopeConflicts = contradictions.filter(c => c.contradictionType === "SCOPE_CONFLICT");
    if (scopeConflicts.length > 0) {
      return {
        claimId: claim.claimId,
        verdict: RESOLUTION_VERDICT.CONTESTED,
        adjudicationType: "SCOPE_DIVERGENCE",
        rationale: "Nhận định có sự khác biệt giữa các hệ đào tạo (Đại trà vs Chất lượng cao).",
        preservedNuances: ["Cần đối chiếu cụ thể theo Quyết định áp dụng cho từng khóa và chương trình đào tạo."],
        resolvedAt: new Date().toISOString()
      };
    }

    // Weight Official vs Community
    const officialSupports = supportingEvidence.filter(e => e.type === "OFFICIAL_REGULATION");
    const officialContradictions = contradictingEvidence.filter(e => e.type === "OFFICIAL_REGULATION");

    if (officialSupports.length > 0 && officialContradictions.length === 0) {
      const communityReports = contradictingEvidence.filter(e => e.type === "COMMUNITY_OBSERVATION");
      const operationalNuances = communityReports.map(c => `Thực tế sinh viên ghi nhận: ${c.contentReference}`);

      return {
        claimId: claim.claimId,
        verdict: RESOLUTION_VERDICT.SUPPORTED,
        adjudicationType: "OFFICIAL_PRIORITY_WITH_COMMUNITY_NUANCE",
        rationale: "Quy định chính thức của Nhà trường được ưu tiên áp dụng cao nhất.",
        preservedNuances: operationalNuances.length > 0 ? operationalNuances : ["Quy chế chính thức đang có hiệu lực."],
        resolvedAt: new Date().toISOString()
      };
    }

    if (officialContradictions.length > 0 && officialSupports.length === 0) {
      return {
        claimId: claim.claimId,
        verdict: RESOLUTION_VERDICT.LIKELY_FALSE,
        adjudicationType: "OFFICIAL_REFUTATION",
        rationale: "Nhận định trái ngược với văn bản quy chế hiện hành của Nhà trường.",
        preservedNuances: ["Không áp dụng theo thông tin truyền miệng trái quy chế."],
        resolvedAt: new Date().toISOString()
      };
    }

    // Direct Contradiction among peers
    if (contradictingEvidence.length > 0 && supportingEvidence.length > 0) {
      return {
        claimId: claim.claimId,
        verdict: RESOLUTION_VERDICT.CONTESTED,
        adjudicationType: "PEER_DISAGREEMENT",
        rationale: "Phát hiện minh chứng trái chiều giữa các nguồn, chưa đạt đủ mức độ đồng thuận để xác nhận.",
        preservedNuances: ["Cần tra cứu thêm công văn hướng dẫn từ Phòng Đào tạo."],
        resolvedAt: new Date().toISOString()
      };
    }

    if (supportingEvidence.length > 0) {
      return {
        claimId: claim.claimId,
        verdict: RESOLUTION_VERDICT.LIKELY_SUPPORTED,
        adjudicationType: "SINGLE_SOURCE_SUPPORT",
        rationale: "Có minh chứng hỗ trợ nhưng cần bổ sung thêm nguồn độc lập để nâng mức độ kiểm chứng.",
        preservedNuances: [],
        resolvedAt: new Date().toISOString()
      };
    }

    return {
      claimId: claim.claimId,
      verdict: RESOLUTION_VERDICT.UNRESOLVED,
      adjudicationType: "INSUFFICIENT_EVIDENCE",
      rationale: "Chưa có đủ dữ liệu và minh chứng độc lập để kết luận.",
      preservedNuances: [],
      resolvedAt: new Date().toISOString()
    };
  }
}
