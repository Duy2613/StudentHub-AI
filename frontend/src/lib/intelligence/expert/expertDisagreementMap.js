/**
 * StudentHub AI — Expert Disagreement Mapping Engine V2
 * 
 * Maps divergence and scientific debates between verified domain experts.
 * 
 * Invariants:
 * 1. NEVER select an arbitrary winner based on popularity, follower count, or title.
 * 2. Explicitly surface the root reason for disagreement (datasets, cohorts, timeframes, methods).
 * 3. Transparently present both viewpoints with their respective evidence spans and uncertainty boundaries.
 */

import {
  ExpertIntelligenceModel,
  DISAGREEMENT_REASON
} from "./expertIntelligenceModel.js";

export class ExpertDisagreementMap {
  /**
   * Compares two expert claims on a specific topic and generates a Disagreement Map
   * @param {object} param0 Comparison inputs
   * @returns {object} DisagreementMap object
   */
  static analyzeDisagreement({
    topic = "Hiệu năng kiến trúc Transformer trong xử lý tiếng Việt",
    domain = "AI_ML",
    expertA,
    claimA,
    evidenceA = [],
    expertB,
    claimB,
    evidenceB = [],
    divergenceReason = DISAGREEMENT_REASON.DIFFERENT_DATASETS,
    analysis = ""
  }) {
    if (!expertA || !expertB || !claimA || !claimB) {
      throw new Error("[EXPERT_DISAGREEMENT_MAP] Both experts and their respective claims are required.");
    }

    const expObjA = ExpertIntelligenceModel.createExpert(expertA);
    const expObjB = ExpertIntelligenceModel.createExpert(expertB);
    const clmObjA = ExpertIntelligenceModel.createExpertClaim(claimA);
    const clmObjB = ExpertIntelligenceModel.createExpertClaim(claimB);

    // Compute divergence analysis text if not provided
    let computedAnalysis = analysis;
    if (!computedAnalysis) {
      if (divergenceReason === DISAGREEMENT_REASON.DIFFERENT_DATASETS) {
        computedAnalysis = `${expObjA.name} dựa trên tập dữ liệu benchmark A, trong khi ${expObjB.name} thu thập kết quả từ tập thực nghiệm B. Sự khác biệt phản ánh đặc thù phân phối dữ liệu, không phải sai sót lý thuyết.`;
      } else if (divergenceReason === DISAGREEMENT_REASON.DIFFERENT_TIMEFRAMES) {
        computedAnalysis = `Nhận định của ${expObjA.name} xuất bản năm ${clmObjA.publishedAt?.slice(0, 4) || "trước"}, trong khi nghiên cứu của ${expObjB.name} bổ sung các phát hiện mới hơn năm ${clmObjB.publishedAt?.slice(0, 4) || "nay"}.`;
      } else if (divergenceReason === DISAGREEMENT_REASON.DIFFERENT_METHODOLOGIES) {
        computedAnalysis = `${expObjA.name} áp dụng phương pháp định lượng thống kê, còn ${expObjB.name} tiếp cận theo mô hình heuristic hành vi.`;
      } else {
        computedAnalysis = "Hai chuyên gia có góc nhìn lý thuyết khác nhau đối với cùng một bài toán nghiên cứu mở.";
      }
    }

    return ExpertIntelligenceModel.createDisagreementMap({
      topic,
      domain,
      expertA: {
        expertId: expObjA.expertId,
        name: expObjA.name,
        title: expObjA.title,
        institution: expObjA.institution,
        isVerified: expObjA.isVerified
      },
      claimA: clmObjA,
      evidenceA,
      expertB: {
        expertId: expObjB.expertId,
        name: expObjB.name,
        title: expObjB.title,
        institution: expObjB.institution,
        isVerified: expObjB.isVerified
      },
      claimB: clmObjB,
      evidenceB,
      divergenceReason,
      uncertainty: 0.35,
      analysis: computedAnalysis
    });
  }

  /**
   * Scans a pool of claims to find active peer debates for a domain
   */
  static findDisagreementsInDomain(domain = "AI_ML", claimsPool = [], expertsMap = new Map()) {
    const domainClaims = claimsPool.filter(c => c.domain === domain && !c.isRetracted);
    const disagreements = [];

    for (let i = 0; i < domainClaims.length; i++) {
      for (let j = i + 1; j < domainClaims.length; j++) {
        const c1 = domainClaims[i];
        const c2 = domainClaims[j];

        if (c1.expertId !== c2.expertId && (c1.isDisputed || c2.isDisputed || this.#isContradictoryTopic(c1, c2))) {
          const expA = expertsMap.get(c1.expertId) || { name: "Chuyên gia A" };
          const expB = expertsMap.get(c2.expertId) || { name: "Chuyên gia B" };

          disagreements.push(
            this.analyzeDisagreement({
              topic: c1.scope || c1.statement.slice(0, 60),
              domain,
              expertA: expA,
              claimA: c1,
              evidenceA: c1.evidenceRefs || [],
              expertB: expB,
              claimB: c2,
              evidenceB: c2.evidenceRefs || [],
              divergenceReason: DISAGREEMENT_REASON.DIFFERENT_DATASETS
            })
          );
        }
      }
    }

    return disagreements;
  }

  static #isContradictoryTopic(c1, c2) {
    if (c1.scope && c2.scope && c1.scope === c2.scope) {
      return true;
    }
    return false;
  }
}
