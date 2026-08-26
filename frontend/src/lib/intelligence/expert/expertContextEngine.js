/**
 * StudentHub AI — Expert Context & Flagship Intelligence Engine V2
 * 
 * Provides:
 * 1. "Why this expert?" — Grounded evidentiary profile.
 * 2. "Where NOT to trust?" — Explicit scope boundaries.
 * 3. Shared Evidence Clustering — Prevents 3 copies from becoming "3 independent proofs".
 * 4. Claim Reliability Track Record — Transparent history of corrections and retractions.
 */

import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  CLAIM_STATUS
} from "./expertIntelligenceModel.js";
import { ExpertScopeEngine } from "./expertScopeEngine.js";
import { ExpertConflictEngine } from "./expertConflictEngine.js";

export class ExpertContextEngine {
  /**
   * Generates the "Why this expert?" explanation packet
   */
  static generateWhyThisExpert(expert) {
    const expObj = ExpertIntelligenceModel.createExpert(expert);

    const identityEvidence = expObj.orcid
      ? `Danh tính xác thực qua mã ORCID: ${expObj.orcid} và cổng thông tin ${expObj.institution}.`
      : `Danh tính công vụ đã xác thực tại ${expObj.institution} (${expObj.verifiedEmail || "Email công vụ"}).`;

    const activeRole = expObj.roles.find(r => r.isCurrent);
    const currentRole = activeRole ? `${activeRole.roleTitle} tại ${activeRole.organization}` : expObj.title;

    const strongScope = expObj.scopes.find(s => s.level === EXPERTISE_LEVEL.ESTABLISHED) || expObj.scopes[0];
    const relevantExpertise = strongScope
      ? `${strongScope.domain} (${strongScope.level} — ${strongScope.subdomain})`
      : "Chuyên môn tổng quát";

    const supportingEvidence = expObj.publications.slice(0, 3).map(p => ({
      title: p.title,
      venue: p.venue,
      year: p.year,
      doi: p.doi
    }));

    const boundaries = ExpertScopeEngine.generateScopeBoundaries(expObj);

    return ExpertIntelligenceModel.createWhyThisExpertReport({
      expertId: expObj.expertId,
      canonicalIdentity: expObj.canonicalIdentity,
      isIdentityVerified: expObj.isVerified,
      identityEvidence,
      currentRole,
      isRoleCurrent: Boolean(activeRole),
      relevantExpertise,
      supportingEvidence,
      authorityScope: expObj.hasRegistrarAuthority
        ? "Có thẩm quyền ban hành/xác nhận quy chế Phòng Đào Tạo trong nhiệm kỳ hiệu lực."
        : "Nghiên cứu khoa học & Phương pháp luận học thuật (KHÔNG có thẩm quyền hành chính Phòng Đào Tạo).",
      scopeBoundaries: {
        established: boundaries.established,
        limited: boundaries.limited,
        outOfScope: boundaries.unestablished
      },
      recencyStatus: expObj.publications.length > 0
        ? `ACTIVE (Công trình mới nhất: ${Math.max(...expObj.publications.map(p => p.year))})`
        : "Hồ sơ chuyên môn cơ sở"
    });
  }

  /**
   * Evaluates consensus across multiple experts, collapsing shared citations
   */
  static evaluateConsensus(expertsWithClaims = []) {
    if (!Array.isArray(expertsWithClaims) || expertsWithClaims.length === 0) {
      return {
        consensusType: "NO_CLAIMS",
        isIndependentConsensus: false,
        independentExpertCount: 0,
        provenanceClusters: 0,
        summary: "Không có đủ dữ liệu nhận định từ chuyên gia."
      };
    }

    const uniqueExperts = new Set();
    const provenanceClusters = new Set();

    for (const item of expertsWithClaims) {
      if (item.expert && item.expert.expertId) {
        uniqueExperts.add(item.expert.expertId);
      }
      if (item.claim && item.claim.citedPublicationDoi) {
        provenanceClusters.add(item.claim.citedPublicationDoi);
      } else if (item.claim && item.claim.claimId) {
        provenanceClusters.add(`ORIGINAL_${item.claim.claimId}`);
      }
    }

    // Invariant: Multiple experts citing the SAME study != Multiple independent confirmations
    const isSingleSourceEcho = uniqueExperts.size > 1 && provenanceClusters.size === 1;

    return {
      consensusType: isSingleSourceEcho ? "APPARENT_CONSENSUS" : (uniqueExperts.size >= 2 ? "STRONG_CONSENSUS" : "SINGLE_EXPERT_OPINION"),
      isIndependentConsensus: !isSingleSourceEcho && uniqueExperts.size >= 2,
      independentExpertCount: uniqueExperts.size,
      provenanceClustersCount: provenanceClusters.size,
      explanation: isSingleSourceEcho
        ? `[SYNDICATION_WARNING] ${uniqueExperts.size} chuyên gia cùng trích dẫn 1 công trình duy nhất. Đây là hiện tượng lặp nguồn (Echo), KHÔNG PHẢI ${uniqueExperts.size} kiểm chứng độc lập.`
        : `Ghi nhận ${uniqueExperts.size} chuyên gia độc lập với ${provenanceClusters.size} nguồn dẫn chứng tách biệt.`
    };
  }

  /**
   * Builds the Claim Reliability Track Record for an expert
   */
  static buildClaimTrackRecord(expert, claimsPool = []) {
    const expObj = ExpertIntelligenceModel.createExpert(expert);
    const expertClaims = claimsPool.filter(c => c.expertId === expObj.expertId);

    const supported = expertClaims.filter(c => c.status === CLAIM_STATUS.SUPPORTED && !c.isRetracted);
    const corrected = expertClaims.filter(c => c.status === CLAIM_STATUS.CORRECTED || c.supersedesClaimId);
    const retracted = expertClaims.filter(c => c.status === CLAIM_STATUS.RETRACTED || c.isRetracted);
    const needsReeval = expertClaims.filter(c => c.status === CLAIM_STATUS.NEEDS_REEVALUATION);

    return {
      expertId: expObj.expertId,
      name: expObj.name,
      totalClaims: expertClaims.length,
      supportedClaimsCount: supported.length,
      correctedClaimsCount: corrected.length,
      retractedClaimsCount: retracted.length,
      needsReevaluationCount: needsReeval.length,
      historySummary: {
        reliabilityProfile: retracted.length > 0 ? "CHÚ Ý: Có bài viết bị thu hồi" : "Hồ sơ công bố học thuật chuẩn mực",
        correctionRate: expertClaims.length > 0 ? (corrected.length / expertClaims.length).toFixed(2) : "0.00"
      },
      claims: expertClaims.map(c => ({
        claimId: c.claimId,
        statement: c.statement || c.text,
        status: c.status,
        version: c.version || 1,
        correctionReason: c.correctionReason,
        publishedAt: c.publishedAt
      }))
    };
  }
}
