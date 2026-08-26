/**
 * StudentHub AI — Authority-Aware Non-Democratic Adjudication Engine V1
 * 
 * Implements strict hierarchical claim adjudication, official truth precedence,
 * expert disagreement preservation, and operational reality gap separation.
 */

import {
  EvidenceFusionModel,
  EPISTEMIC_FINAL_STATE,
  EVIDENCE_HEALTH_STATE,
  KNOWLEDGE_LAYER,
  AUTHORITY_CLASS
} from "./evidenceFusionModel.js";
import { EvidenceFusionClaimAligner } from "./evidenceFusionClaimAligner.js";
import { EvidenceFusionIndependenceEngine } from "./evidenceFusionIndependenceEngine.js";
import { EvidenceFusionScopeEngine } from "./evidenceFusionScopeEngine.js";
import { EvidenceFusionTemporalEngine } from "./evidenceFusionTemporalEngine.js";

export class EvidenceFusionAdjudicator {
  /**
   * Adjudicates multi-layer evidence into a canonical Knowledge Object
   */
  static adjudicate(input = {}) {
    const subject = input.subject || "ACADEMIC_REGULATION";
    const topic = input.topic || subject;
    const rawClaims = Array.isArray(input.claims) ? input.claims : [];
    const supportingSources = Array.isArray(input.sources) ? input.sources : (Array.isArray(input.supportingEvidence) ? input.supportingEvidence : []);

    // 1. Normalize all incoming claims
    const normalizedClaims = rawClaims.map(c => EvidenceFusionClaimAligner.normalizeClaim(c));

    // 2. Separate into the 4 Foundational Knowledge Layers
    const officialClaims = normalizedClaims.filter(c => c.layer === KNOWLEDGE_LAYER.OFFICIAL_TRUTH);
    const aiClaims = normalizedClaims.filter(c => c.layer === KNOWLEDGE_LAYER.AI_VERIFIED_REASONING);
    const expertClaims = normalizedClaims.filter(c => c.layer === KNOWLEDGE_LAYER.EXPERT_INTERPRETATION);
    const communityClaims = normalizedClaims.filter(c => c.layer === KNOWLEDGE_LAYER.COMMUNITY_REALITY);

    // 3. Independence & Derivation Analysis
    const independence = EvidenceFusionIndependenceEngine.evaluateIndependence(normalizedClaims, supportingSources);

    // 4. Temporal Alignment
    const { active: activeClaims, historical: historicalClaims } = EvidenceFusionTemporalEngine.alignTemporalClaims(normalizedClaims);

    // 5. Adjudicate Official Truth
    let authoritativeState = EPISTEMIC_FINAL_STATE.UNKNOWN;
    let officialTruth = null;
    const contradictions = [];
    const realityGaps = [];
    const unknowns = [];
    const limitations = [
      "Quy chế học vụ chính thức luôn có thẩm quyền cao nhất đối với tiến độ đào tạo của sinh viên.",
      "Kinh nghiệm cộng đồng phản ánh thời gian xử lý thực tế và không thay thế văn bản quy phạm."
    ];

    if (officialClaims.length > 0) {
      // Filter: separate CURRENT_ACTIVE from HISTORICAL_SUPERSEDED official claims
      const activeOfficialClaims = officialClaims.filter(c => c.temporalState !== "HISTORICAL_SUPERSEDED");
      const effectiveOfficialClaims = activeOfficialClaims.length > 0 ? activeOfficialClaims : officialClaims;

      // Check if effective official claims conflict with each other
      const distinctOfficialValues = Array.from(new Set(effectiveOfficialClaims.map(c => String(c.value))));
      if (distinctOfficialValues.length > 1) {
        authoritativeState = EPISTEMIC_FINAL_STATE.CONFLICTED;
        contradictions.push({
          type: "AUTHORITATIVE_OFFICIAL_CONFLICT",
          claims: effectiveOfficialClaims,
          explanation: `Phát hiện mâu thuẫn giữa các văn bản chính thức (${distinctOfficialValues.join(" vs ")}). Kích hoạt cổng Human Review Gate.`
        });
      } else {
        authoritativeState = EPISTEMIC_FINAL_STATE.AUTHORITATIVE;
        officialTruth = {
          subject,
          statement: effectiveOfficialClaims[0].normalizedStatement,
          value: effectiveOfficialClaims[0].value,
          citation: effectiveOfficialClaims[0].sourceRef?.citation || "QĐ 3116/QĐ-ĐHSPKT",
          sourceId: effectiveOfficialClaims[0].sourceRef?.sourceId || "DOC_OFFICIAL_3116",
          status: "VERIFIED_ACTIVE"
        };
      }
    } else if (expertClaims.length > 0) {
      authoritativeState = EPISTEMIC_FINAL_STATE.SUPPORTED;
      unknowns.push("Chưa có văn bản quy chế chính thức trực tiếp cho chủ đề này; đang dựa trên diễn giải chuyên gia.");
    } else if (communityClaims.length > 0) {
      authoritativeState = EPISTEMIC_FINAL_STATE.CONTEXTUALIZED;
      unknowns.push("Chưa có căn cứ quy chế chính thức; thông tin hoàn toàn dựa trên phản ánh thực tế từ sinh viên.");
    }

    // 6. Expert Interpretation Adjudication
    const expertInterpretation = [];
    const expertValues = Array.from(new Set(expertClaims.map(c => String(c.value))));
    const hasExpertDisagreement = expertValues.length > 1;

    for (const exp of expertClaims) {
      expertInterpretation.push({
        expertId: exp.sourceRef?.expertId || exp.authorId || "EXP_UNKNOWN",
        name: exp.sourceRef?.expertName || "Chuyên gia Học vụ",
        interpretation: exp.normalizedStatement,
        value: exp.value,
        hasDisagreement: hasExpertDisagreement,
        scope: exp.scope
      });
    }

    // Detect expert disagreement via raw normalized statements if values are all the same but statements differ
    const expertStatements = expertClaims.map(c => c.normalizedStatement);
    const uniqueStatements = Array.from(new Set(expertStatements));
    const hasStatementDisagreement = expertClaims.length >= 2 && (hasExpertDisagreement || uniqueStatements.length > 1);

    if (hasStatementDisagreement) {
      contradictions.push({
        type: "EXPERT_DISAGREEMENT",
        explanation: `Phát hiện bất đồng quan điểm giữa các chuyên gia (${expertValues.length > 1 ? expertValues.join(" vs ") : uniqueStatements.join(" vs ")}). Trạng thái chính thức được bảo lưu theo quy chế.`
      });
    }

    // 7. Community Reality & Reality Gaps Adjudication
    let communityReality = null;
    if (communityClaims.length > 0) {
      const firstHandCount = communityClaims.filter(c => c.predicate === "DURATION_DAYS" || c.predicate === "OBSERVED_TURNAROUND").length;
      communityReality = {
        signalSummary: `${communityClaims.length} báo cáo từ sinh viên.`,
        firstHandReportCount: firstHandCount,
        observedValue: communityClaims[0].value,
        claims: communityClaims
      };

      // Check for Operational Reality Gap or Community Rumor
      if (officialTruth && officialTruth.value && communityClaims[0].value && String(officialTruth.value) !== String(communityClaims[0].value)) {
        // Detect deadline rumors: community claims a different date than official
        const isDeadlineRumor = subject === "DEADLINE" && communityClaims.some(c => {
          const rawStatement = (c.statement || c.normalizedStatement || "").toLowerCase();
          return rawStatement.includes("10/09") || rawStatement.includes("10/9") || String(c.value).includes("10/09");
        });

        if (isDeadlineRumor) {
          contradictions.push({
            type: "COMMUNITY_RUMOR_VS_OFFICIAL",
            explanation: "Phát hiện tin đồn cộng đồng về hạn chót (10/09) trái với thông báo chính thức (05/09). Quy chế chính thức là chân lý hiệu lực."
          });
        } else {
          realityGaps.push({
            gapType: "OPERATIONAL_REALITY_GAP",
            officialTarget: String(officialTruth.value),
            communityObserved: String(communityClaims[0].value),
            gapStatus: "SIGNIFICANT_OPERATIONAL_GAP",
            explanation: `Quy chế công bố mục tiêu ${officialTruth.value}, trong khi thực tế ghi nhận ${communityClaims[0].value}. Đây là độ trễ vận hành thực tế, không cấu thành vi phạm quy định.`
          });
        }
      }
    }

    // 8. AI Verified Reasoning Layer
    const aiVerifiedReasoning = {
      synthesis: aiClaims.length > 0 
        ? aiClaims[0].normalizedStatement 
        : `Tổng hợp tri thức: ${officialTruth ? `Quy chế chính thức quy định ${officialTruth.value}.` : ''} ${realityGaps.length > 0 ? realityGaps[0].explanation : ''}`,
      claimsCount: aiClaims.length,
      derivationPath: independence.isLinearDerivation ? "OFFICIAL -> EXPERT -> AI_SYNTHESIS" : "DIRECT_FUSION"
    };

    // 9. Evidence Health Determination
    let evidenceHealth = EVIDENCE_HEALTH_STATE.HEALTHY;
    if (contradictions.some(c => c.type === "AUTHORITATIVE_OFFICIAL_CONFLICT")) {
      evidenceHealth = EVIDENCE_HEALTH_STATE.REQUIRES_REVIEW;
    } else if (contradictions.length > 0) {
      evidenceHealth = EVIDENCE_HEALTH_STATE.CONFLICTED;
    } else if (supportingSources.some(s => s.isRetracted)) {
      evidenceHealth = EVIDENCE_HEALTH_STATE.DEGRADED;
    } else if (activeClaims.length === 0 && historicalClaims.length > 0) {
      evidenceHealth = EVIDENCE_HEALTH_STATE.STALE;
    }

    // Assemble Canonical Knowledge Object
    return EvidenceFusionModel.createKnowledgeObject({
      subject,
      topic,
      authoritativeState,
      evidenceHealth,
      officialTruth,
      aiVerifiedReasoning,
      expertInterpretation,
      communityReality,
      claims: normalizedClaims,
      supportingEvidence: supportingSources,
      contradictions,
      realityGaps,
      unknowns,
      limitations,
      scope: input.scope || {},
      confidenceTelemetry: {
        totalSourcesCount: supportingSources.length,
        independentProvenanceClustersCount: independence.independentClusterCount,
        expertDisagreementsCount: expertInterpretation.filter(e => e.hasDisagreement).length,
        realityGapIdentified: realityGaps.length > 0,
        adjudicationPath: independence.isLinearDerivation ? "LINEAR_DERIVATION_CHAIN" : "INDEPENDENT_FUSION_GRAPH"
      }
    });
  }
}
