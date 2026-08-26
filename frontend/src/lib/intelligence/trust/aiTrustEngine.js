/**
 * StudentHub AI — AI Trust Engine Orchestrator V1
 * 
 * Central Verification & Reliability Engine for StudentHub Intelligence OS.
 * 
 * Pipeline:
 * USER QUERY
 *   ↓
 * QUERY RISK CLASSIFICATION
 *   ↓
 * ADVERSARIAL & PROMPT INJECTION GUARD
 *   ↓
 * SOURCE INDEPENDENCE & LAUNDERING ANALYSIS
 *   ↓
 * CLAIM DECOMPOSITION (Compound & Numeric)
 *   ↓
 * CITATION ENTAILMENT & PASSAGE VERIFICATION
 *   ↓
 * TEMPORAL VALIDITY & CONTRADICTION ANALYSIS
 *   ↓
 * ABSTENTION & AUDITABLE SYNTHESIS
 */

import {
  AiTrustModel,
  ABSTENTION_REASON,
  AUTHORITY_TIER,
  STAKE_LEVEL,
  TRUST_STATUS
} from "./aiTrustModel.js";
import { AdversarialTrustGuard } from "./adversarialTrustGuard.js";
import { SourceIndependenceEngine } from "./sourceIndependenceEngine.js";
import { ClaimDecompositionEngine } from "./claimDecompositionEngine.js";
import { CitationEntailmentEngine } from "./citationEntailmentEngine.js";
import { TemporalContradictionEngine } from "./temporalContradictionEngine.js";

export class AiTrustEngine {
  /**
   * Evaluates the reliability and truth status of an AI response
   * @param {object} input 
   * @param {string} input.query User question/query
   * @param {string} input.rawAnswer AI generated response to evaluate
   * @param {Array<object>} input.sources Available/retrieved sources
   * @param {Array<object>} input.evidenceSpans Specific evidence passages
   * @param {string} [input.stakeLevel] Optional stake override (LOW, MEDIUM, HIGH, CRITICAL)
   * @returns {object} Canonical TrustEvaluation record
   */
  static evaluate(input = {}) {
    const query = typeof input.query === "string" ? input.query.trim() : "";
    const rawAnswer = typeof input.rawAnswer === "string" ? input.rawAnswer.trim() : "";
    const sources = Array.isArray(input.sources) ? input.sources.map(s => AiTrustModel.createSource(s)) : [];
    const evidenceSpans = Array.isArray(input.evidenceSpans) ? input.evidenceSpans.map(e => AiTrustModel.createEvidenceSpan(e)) : [];

    // 1. Query Risk & Stake Classification
    const stakeLevel = this.#classifyStake(query, rawAnswer, input.stakeLevel);

    // 2. Adversarial & Prompt Injection Guard
    const queryGuard = AdversarialTrustGuard.inspectText(query);
    const answerGuard = AdversarialTrustGuard.inspectText(rawAnswer);
    const maxManipulationRisk = Math.max(queryGuard.manipulationRisk, answerGuard.manipulationRisk);

    // 3. Source Independence & Laundering Clustering
    const independenceResult = SourceIndependenceEngine.analyzeIndependence(sources, evidenceSpans);

    // 4. Claim Decomposition (Compound Sentences & Numeric Values)
    const rawClaims = ClaimDecompositionEngine.decompose(rawAnswer, {
      stakeLevel
    });

    // 5. Citation Entailment & Passage Extraction
    const entailmentResult = CitationEntailmentEngine.evaluateEntailment(
      rawClaims,
      evidenceSpans,
      sources
    );

    // 6. Temporal Validity & Contradiction Analysis
    const temporalResult = TemporalContradictionEngine.analyzeTemporalAndContradictions(
      entailmentResult.verifiedClaims,
      sources,
      evidenceSpans,
      entailmentResult.citations
    );

    // 7. Abstention & Trust Status Synthesis
    const synthesis = this.#synthesizeTrustStatus({
      stakeLevel,
      claims: temporalResult.claimsWithTemporalStatus,
      claimCoverage: entailmentResult.claimCoverage,
      citationAccuracy: entailmentResult.citationAccuracy,
      hasOfficialConflict: temporalResult.hasOfficialConflict,
      contradictions: temporalResult.contradictions,
      temporalValidityScore: temporalResult.temporalValidityScore,
      maxManipulationRisk,
      sources,
      queryGuard
    });

    // 8. Compose Verified Structured Answer
    const verifiedAnswer = this.#composeVerifiedAnswer({
      rawAnswer,
      claims: temporalResult.claimsWithTemporalStatus,
      trustStatus: synthesis.trustStatus,
      requiresAbstention: synthesis.requiresAbstention,
      abstentionReason: synthesis.abstentionReason,
      explanation: synthesis.explanation
    });

    // 9. Calculate Authority Score
    const maxAuthorityTier = sources.length > 0
      ? Math.max(...sources.map(s => s.authorityTier || 0))
      : 0;

    return AiTrustModel.createTrustEvaluation({
      query,
      queryStake: stakeLevel,
      rawAnswer,
      verifiedAnswer,
      claims: temporalResult.claimsWithTemporalStatus,
      citations: entailmentResult.citations,
      evidenceSpans,
      sources,
      trustStatus: synthesis.trustStatus,
      requiresAbstention: synthesis.requiresAbstention,
      abstentionReason: synthesis.abstentionReason,
      explanation: synthesis.explanation,
      contradictions: temporalResult.contradictions,
      unsupportedClaims: entailmentResult.unsupportedClaims,
      provenanceClusters: independenceResult.provenanceClusters,
      metrics: {
        provenanceScore: Number(independenceResult.sourceIndependenceScore.toFixed(2)),
        authorityScore: maxAuthorityTier,
        evidenceQuality: Number(temporalResult.temporalValidityScore.toFixed(2)),
        claimCoverage: entailmentResult.claimCoverage,
        citationAccuracy: entailmentResult.citationAccuracy,
        temporalValidity: temporalResult.temporalValidityScore,
        sourceIndependenceScore: independenceResult.sourceIndependenceScore,
        contradictionSeverity: temporalResult.contradictionSeverity,
        manipulationRisk: maxManipulationRisk,
        uncertainty: synthesis.requiresAbstention ? 0.8 : (1.0 - entailmentResult.claimCoverage)
      }
    });
  }

  /**
   * Classifies stake level based on query and content
   */
  static #classifyStake(query, answer, explicitStake) {
    if (explicitStake && STAKE_LEVEL[explicitStake]) {
      return STAKE_LEVEL[explicitStake];
    }
    const text = `${query} ${answer}`.toLowerCase();
    if (text.includes("kỷ luật") || text.includes("buộc thôi học") || text.includes("học phí") || text.includes("quy chế")) {
      return STAKE_LEVEL.CRITICAL;
    }
    if (text.includes("toeic") || text.includes("tốt nghiệp") || text.includes("tiên quyết") || text.includes("hạn nộp") || text.includes("deadline")) {
      return STAKE_LEVEL.HIGH;
    }
    if (text.includes("môn học") || text.includes("đăng ký") || text.includes("giảng viên")) {
      return STAKE_LEVEL.MEDIUM;
    }
    return STAKE_LEVEL.LOW;
  }

  /**
   * Synthesizes overall trust status and evaluates abstention rules
   */
  static #synthesizeTrustStatus(ctx) {
    const {
      stakeLevel,
      claims,
      claimCoverage,
      citationAccuracy,
      hasOfficialConflict,
      contradictions,
      temporalValidityScore,
      maxManipulationRisk,
      sources,
      queryGuard
    } = ctx;

    // Rule A: Adversarial prompt injection detected
    if (!queryGuard.isSafe || maxManipulationRisk >= 0.7) {
      return {
        trustStatus: TRUST_STATUS.UNVERIFIED,
        requiresAbstention: true,
        abstentionReason: ABSTENTION_REASON.PROMPT_INJECTION_DETECTED,
        explanation: "Phát hiện chỉ thị độc hại hoặc can thiệp prompt injection. Hệ thống từ chối xác thực câu trả lời."
      };
    }

    // Rule B: Active official conflict
    if (hasOfficialConflict) {
      return {
        trustStatus: TRUST_STATUS.CONFLICTED,
        requiresAbstention: true,
        abstentionReason: ABSTENTION_REASON.OFFICIAL_CONFLICT,
        explanation: "Phát hiện mâu thuẫn giữa các nguồn quy chế chính thức có cùng hiệu lực. Cần chuyển giao chuyên viên học vụ xác minh."
      };
    }

    // Rule C: Retracted evidence
    const hasRetractedClaim = claims.some(c => c.status === TRUST_STATUS.RETRACTED);
    if (hasRetractedClaim) {
      return {
        trustStatus: TRUST_STATUS.RETRACTED,
        requiresAbstention: true,
        abstentionReason: ABSTENTION_REASON.SOURCE_RETRACTED,
        explanation: "Văn bản hoặc minh chứng trích dẫn đã bị nhà trường thu hồi/hủy bỏ."
      };
    }

    // Rule D: Outdated / Superseded evidence
    const hasOutdatedClaim = claims.some(c => c.status === TRUST_STATUS.OUTDATED);
    if (hasOutdatedClaim) {
      return {
        trustStatus: TRUST_STATUS.OUTDATED,
        requiresAbstention: stakeLevel === STAKE_LEVEL.CRITICAL || stakeLevel === STAKE_LEVEL.HIGH,
        abstentionReason: ABSTENTION_REASON.POLICY_SUPERSEDED,
        explanation: "Thông tin dựa trên văn bản quy định cũ đã được thay thế bởi phiên bản quy chế mới hơn."
      };
    }

    // Rule E: Zero sources provided
    if (sources.length === 0) {
      const isHighStake = stakeLevel === STAKE_LEVEL.CRITICAL || stakeLevel === STAKE_LEVEL.HIGH;
      return {
        trustStatus: TRUST_STATUS.UNVERIFIED,
        requiresAbstention: isHighStake,
        abstentionReason: isHighStake ? ABSTENTION_REASON.HIGH_STAKE_UNVERIFIED : ABSTENTION_REASON.NONE,
        explanation: "Không tìm thấy nguồn dữ liệu học vụ được xác thực để kiểm chứng câu trả lời."
      };
    }

    // Rule F: High/Critical Stake with Insufficient Evidence
    const hasAuthoritativeSource = sources.some(s => s.authorityTier >= AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR);
    if ((stakeLevel === STAKE_LEVEL.CRITICAL || stakeLevel === STAKE_LEVEL.HIGH) && claimCoverage < 0.6) {
      return {
        trustStatus: TRUST_STATUS.UNSUPPORTED,
        requiresAbstention: true,
        abstentionReason: ABSTENTION_REASON.INSUFFICIENT_EVIDENCE,
        explanation: "Câu hỏi thuộc mức độ ảnh hưởng cao nhưng chưa đủ bằng chứng quy chế chính thức để khẳng định."
      };
    }

    // Rule G: 100% Coverage-based grading
    if (claimCoverage === 1.0 && citationAccuracy === 1.0) {
      if (hasAuthoritativeSource) {
        return {
          trustStatus: TRUST_STATUS.AUTHORITATIVE,
          requiresAbstention: false,
          abstentionReason: ABSTENTION_REASON.NONE,
          explanation: "100% khẳng định được chứng minh đầy đủ bởi nguồn văn bản quy chế chính thức có hiệu lực."
        };
      }
      return {
        trustStatus: TRUST_STATUS.VERIFIED,
        requiresAbstention: false,
        abstentionReason: ABSTENTION_REASON.NONE,
        explanation: "100% khẳng định có trích dẫn minh chứng hợp lệ."
      };
    }

    if (claimCoverage >= 0.5) {
      return {
        trustStatus: TRUST_STATUS.PARTIALLY_SUPPORTED,
        requiresAbstention: false,
        abstentionReason: ABSTENTION_REASON.NONE,
        explanation: `Một phần khẳng định có bằng chứng (${Math.round(claimCoverage * 100)}%), các nội dung còn lại chưa đủ dữ liệu đối soát.`
      };
    }

    return {
      trustStatus: TRUST_STATUS.UNSUPPORTED,
      requiresAbstention: false,
      abstentionReason: ABSTENTION_REASON.NONE,
      explanation: "Minh chứng thu thập được không tương thích hoặc không chứng minh được khẳng định của AI."
    };
  }

  /**
   * Composes a transparent, auditable response separating fact, evidence, and uncertainty
   */
  static #composeVerifiedAnswer(params) {
    const { rawAnswer, claims, trustStatus, requiresAbstention, abstentionReason, explanation } = params;

    if (requiresAbstention) {
      return `[TỪ CHỐI KHẲNG ĐỊNH - ${abstentionReason}]\n${explanation}\n\n⚠️ Khuyến cáo: Sinh viên vui lòng tra cứu trực tiếp tại Cổng Thông Tin Đào Tạo HCMUTE hoặc liên hệ Phòng Đào Tạo.`;
    }

    if (trustStatus === TRUST_STATUS.PARTIALLY_SUPPORTED) {
      const supported = claims.filter(c => c.status === TRUST_STATUS.AUTHORITATIVE || c.status === TRUST_STATUS.VERIFIED || c.status === TRUST_STATUS.SUPPORTED);
      const unsupported = claims.filter(c => c.status !== TRUST_STATUS.AUTHORITATIVE && c.status !== TRUST_STATUS.VERIFIED && c.status !== TRUST_STATUS.SUPPORTED);

      return `${rawAnswer}\n\n---\n📊 ĐỐI SOÁT BẰNG CHỨNG (AI TRUST ENGINE):\n✓ Đã xác thực (${supported.length}): ${supported.map(s => s.text).join("; ")}\n⚠️ Chưa có nguồn kiểm chứng (${unsupported.length}): ${unsupported.map(u => u.text).join("; ")}`;
    }

    return rawAnswer;
  }
}
