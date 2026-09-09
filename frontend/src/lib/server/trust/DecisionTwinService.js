/**
 * StudentHub AI — DecisionTwinService
 *
 * Implements the StudentHub Signature Feature: Decision Twin.
 * Calculates:
 * - Current decision state
 * - Decision drivers (each traced to concrete evidence IDs)
 * - Strongest supporting evidence
 * - Strongest contradiction
 * - Remaining unknowns
 * - Reversal conditions (exact evidence that would flip the verdict)
 */

export class DecisionTwinService {
  static buildDecisionTwin({
    verdict = "INSUFFICIENT_EVIDENCE",
    claims = [],
    evidence = [],
    relationships = [],
    unknowns = [],
  } = {}) {
    // 1. Identify strongest supporting & contradiction evidence
    const supportingRels = relationships.filter((r) => r.relation === "SUPPORTS");
    const contradictingRels = relationships.filter((r) => r.relation === "CONTRADICTS");

    const findEvidence = (evId) => evidence.find((e) => e.evidenceId === evId || e.id === evId);

    const strongestSupport = supportingRels.length > 0
      ? findEvidence(supportingRels[0].evidenceId)
      : null;

    const strongestContradiction = contradictingRels.length > 0
      ? findEvidence(contradictingRels[0].evidenceId)
      : null;

    // 2. Build decision drivers tracing back to evidence IDs
    const decisionDrivers = [];

    for (const rel of relationships) {
      const ev = findEvidence(rel.evidenceId);
      if (!ev) continue;
      decisionDrivers.push({
        evidenceId: rel.evidenceId,
        sourceTitle: ev.title,
        publisher: ev.publisher,
        claimId: rel.claimId,
        impactDirection: rel.relation === "CONTRADICTS" ? "RISK_ELEVATION" : "CREDIBILITY_SUPPORT",
        explanation: rel.reasoning,
        canonicalUrl: ev.canonicalUrl,
      });
    }

    // 3. Define Reversal Conditions (what would change the verdict?)
    const reversalConditions = [];
    if (verdict === "HIGH_RISK" || verdict === "CONTRADICTED") {
      reversalConditions.push({
        condition: "Văn bản đính chính có chữ ký số và con dấu đỏ đăng tải trực tiếp trên cổng tên miền chính thống .edu.vn",
        requiredEvidenceType: "PRIMARY_OFFICIAL",
        potentialNewVerdict: "NEEDS_EXPERT_REVIEW",
      });
    } else if (verdict === "INSUFFICIENT_EVIDENCE") {
      reversalConditions.push({
        condition: "Cung cấp thêm văn bản thông báo hoặc liên kết trang tin chính thức của nhà trường về đợt xét tuyển/học bổng này",
        requiredEvidenceType: "PRIMARY_OFFICIAL",
        potentialNewVerdict: "SUPPORTED",
      });
    } else if (verdict === "SUPPORTED") {
      reversalConditions.push({
        condition: "Phát hiện tài liệu đã hết hạn hiệu lực hoặc văn bản bị thay thế bởi quyết định mới hơn",
        requiredEvidenceType: "SUPERSEDING_OFFICIAL_REGULATION",
        potentialNewVerdict: "CONTRADICTED",
      });
    } else {
      reversalConditions.push({
        condition: "Cung cấp thêm tài liệu kiểm chứng chính thức có chữ ký hoặc cổng điện tử xác thực",
        requiredEvidenceType: "PRIMARY_OFFICIAL",
        potentialNewVerdict: "SUPPORTED",
      });
    }

    return {
      currentDecision: verdict,
      decisionDrivers,
      strongestSupportingEvidence: strongestSupport
        ? {
            evidenceId: strongestSupport.evidenceId,
            title: strongestSupport.title,
            publisher: strongestSupport.publisher,
            canonicalUrl: strongestSupport.canonicalUrl,
          }
        : null,
      strongestContradiction: strongestContradiction
        ? {
            evidenceId: strongestContradiction.evidenceId,
            title: strongestContradiction.title,
            publisher: strongestContradiction.publisher,
            canonicalUrl: strongestContradiction.canonicalUrl,
          }
        : null,
      unknowns: unknowns && unknowns.length > 0 ? unknowns : ["Chưa xác thực được toàn bộ danh mục tài khoản thụ hưởng"],
      reversalConditions,
    };
  }
}
