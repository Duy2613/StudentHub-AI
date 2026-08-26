/**
 * StudentHub AI — AI Trust Engine Orchestrator V2
 * Self-Verifying Epistemic Intelligence & Evidence-Constrained Reasoning System
 */

import {
  AiTrustModel,
  ABSTENTION_REASON,
  AUTHORITY_TIER,
  STAKE_LEVEL,
  EPISTEMIC_STATE,
  ANSWER_MODE,
  TEMPORAL_STATUS
} from "./aiTrustModel.js";
import { AdversarialTrustGuard } from "./adversarialTrustGuard.js";
import { SourceIndependenceEngine } from "./sourceIndependenceEngine.js";
import { ClaimDecompositionEngine } from "./claimDecompositionEngine.js";
import { CitationEntailmentEngine } from "./citationEntailmentEngine.js";
import { TemporalContradictionEngine } from "./temporalContradictionEngine.js";
import { SemanticOverclaimDetector } from "./semanticOverclaimDetector.js";
import { CounterEvidenceEngine } from "./counterEvidenceEngine.js";
import { BlindSpotDetector } from "./blindSpotDetector.js";
import { ToolUseFirewall } from "./toolUseFirewall.js";
import { EpistemicClaimGraph } from "./epistemicClaimGraph.js";

export class AiTrustEngine {
  static evaluate(input = {}) {
    const query = typeof input.query === "string" ? input.query.trim() : "";
    const rawAnswer = typeof input.rawAnswer === "string" ? input.rawAnswer.trim() : (input.draftText || "");
    const sources = Array.isArray(input.sources) ? input.sources.map(s => AiTrustModel.createSourceNode(s)) : [];
    const evidenceSpans = Array.isArray(input.evidenceSpans) ? input.evidenceSpans.map(e => AiTrustModel.createEvidenceSpan(e)) : [];
    const candidateCounterPool = Array.isArray(input.counterEvidencePool) ? input.counterEvidencePool.map(e => AiTrustModel.createEvidenceSpan(e)) : [];

    // ─────────────────────────────────────────────────────────────────────────────
    // PASS 1: INTENT & STAKE CLASSIFICATION + ADVERSARIAL INJECTION GUARD
    // ─────────────────────────────────────────────────────────────────────────────
    const stakeLevel = this.#classifyStake(query, rawAnswer, input.stakeLevel || input.evidenceBudget);
    const queryGuard = AdversarialTrustGuard.inspectText(query);
    const answerGuard = AdversarialTrustGuard.inspectText(rawAnswer);
    const maxManipulationRisk = Math.max(queryGuard.manipulationRisk, answerGuard.manipulationRisk);

    if (queryGuard.isAdversarial || answerGuard.isAdversarial) {
      return this.#buildAbstentionResult({
        query,
        rawAnswer,
        stakeLevel,
        reason: ABSTENTION_REASON.PROMPT_INJECTION_DETECTED,
        explanation: "Phát hiện dấu hiệu tấn công Prompt Injection hoặc thao túng chỉ thị an toàn."
      });
    }

    const independenceResult = SourceIndependenceEngine.analyzeIndependence(sources, evidenceSpans);
    const rawClaims = ClaimDecompositionEngine.decompose(rawAnswer, { stakeLevel });

    const claimGraph = new EpistemicClaimGraph();
    const graphClaims = rawClaims.map(c => claimGraph.addClaim(c));

    // ─────────────────────────────────────────────────────────────────────────────
    // PASS 2: CITATION ENTAILMENT & SEMANTIC OVERCLAIM DETECTION
    // ─────────────────────────────────────────────────────────────────────────────
    const entailmentResult = CitationEntailmentEngine.evaluateEntailment(graphClaims, evidenceSpans, sources);

    const overclaimChecks = [];
    let hasOverclaim = false;
    for (const claim of entailmentResult.verifiedClaims) {
      const primaryPassage = evidenceSpans.find(e => claim.citationIds?.includes(e.evidenceId))?.passage || (evidenceSpans[0]?.passage || "");
      const check = SemanticOverclaimDetector.detectOverclaim(claim.text, primaryPassage);
      overclaimChecks.push({ claimId: claim.claimId, ...check });
      if (check.hasOverclaim) hasOverclaim = true;
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PASS 3: ACTIVE COUNTER-EVIDENCE & ADVERSARIAL DISPROOF SEARCH
    // ─────────────────────────────────────────────────────────────────────────────
    const counterEvidenceSpans = [];
    let disproveOutcome = "CONFIRMED";
    let disproveExplanation = "Không phát hiện bằng chứng phản bác.";

    if (candidateCounterPool.length > 0) {
      for (const claim of entailmentResult.verifiedClaims) {
        const res = CounterEvidenceEngine.searchCounterEvidence(claim, candidateCounterPool);
        if (res.counterEvidence.length > 0) {
          counterEvidenceSpans.push(...res.counterEvidence);
          if (res.outcome === "CONFLICTED") {
            disproveOutcome = "CONFLICTED";
            disproveExplanation = res.explanation;
          } else if (res.outcome === "WEAKENED" && disproveOutcome !== "CONFLICTED") {
            disproveOutcome = "WEAKENED";
            disproveExplanation = res.explanation;
          }
        }
      }
    }

    // Temporal Validity & Contradictions
    const temporalResult = TemporalContradictionEngine.analyzeTemporalAndContradictions(
      entailmentResult.verifiedClaims,
      sources,
      evidenceSpans,
      entailmentResult.citations
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // PASS 4: BLIND-SPOT DETECTION & UNSUPPORTED CLAIM PRUNING
    // ─────────────────────────────────────────────────────────────────────────────
    const blindSpotReports = [];
    if (evidenceSpans.length > 0) {
      for (const claim of temporalResult.claimsWithTemporalStatus) {
        const report = BlindSpotDetector.detectBlindSpots(claim, evidenceSpans, { cohort: input.cohort || claim.scope });
        if (report.blindSpots.length > 0) {
          blindSpotReports.push(...report.blindSpots);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PASS 5: STRUCTURED SYNTHESIS, ABSTENTION & AUDIT PACKAGING
    // ─────────────────────────────────────────────────────────────────────────────
    const synthesis = this.#synthesizeEpistemicStatus({
      stakeLevel,
      claims: temporalResult.claimsWithTemporalStatus,
      evidenceSpans,
      claimCoverage: entailmentResult.claimCoverage,
      citationAccuracy: entailmentResult.citationAccuracy,
      hasOfficialConflict: temporalResult.hasOfficialConflict || disproveOutcome === "CONFLICTED",
      contradictions: temporalResult.contradictions,
      temporalValidityScore: temporalResult.temporalValidityScore,
      maxManipulationRisk,
      sources,
      hasOverclaim,
      disproveOutcome
    });

    const sensitivityAnalysis = CounterEvidenceEngine.generateSensitivityAnalysis(
      temporalResult.claimsWithTemporalStatus[0] || null,
      evidenceSpans[0] || null
    );

    const verifiedAnswer = this.#composeVerifiedAnswer({
      rawAnswer,
      claims: temporalResult.claimsWithTemporalStatus,
      trustStatus: synthesis.epistemicState,
      requiresAbstention: synthesis.requiresAbstention,
      abstentionReason: synthesis.abstentionReason,
      explanation: synthesis.explanation,
      overclaimChecks
    });

    const maxAuthorityTier = sources.length > 0
      ? Math.max(...sources.map(s => s.authorityTier || 0))
      : (evidenceSpans.length > 0 ? Math.max(...evidenceSpans.map(e => e.authorityTier || 0)) : 0);

    const evaluation = AiTrustModel.createEpistemicEvaluation({
      query,
      answerMode: synthesis.answerMode,
      epistemicState: synthesis.epistemicState,
      abstentionReason: synthesis.abstentionReason,
      claims: temporalResult.claimsWithTemporalStatus,
      evidenceSpans,
      counterEvidenceSpans,
      blindSpots: blindSpotReports,
      disproveAnalysis: {
        outcome: disproveOutcome,
        explanation: disproveExplanation,
        counterEvidenceCount: counterEvidenceSpans.length
      },
      sensitivityAnalysis,
      humanReviewPacket: synthesis.answerMode === ANSWER_MODE.HUMAN_REVIEW_REQUIRED || synthesis.answerMode === ANSWER_MODE.CONFLICTED
        ? AiTrustModel.createHumanReviewPacket({
            claim: temporalResult.claimsWithTemporalStatus[0],
            supportingEvidence: evidenceSpans,
            counterEvidence: counterEvidenceSpans,
            riskLevel: stakeLevel
          })
        : null
    });

    return Object.freeze({
      ...evaluation,
      queryStake: stakeLevel,
      rawAnswer,
      verifiedAnswer,
      citations: entailmentResult.citations,
      sources,
      trustStatus: synthesis.epistemicState,
      requiresAbstention: synthesis.requiresAbstention,
      explanation: synthesis.explanation,
      contradictions: temporalResult.contradictions,
      unsupportedClaims: entailmentResult.unsupportedClaims,
      provenanceClusters: independenceResult.provenanceClusters,
      overclaimChecks,
      claimGraph: {
        nodes: claimGraph.getAllClaims(),
        edges: claimGraph.getAllEdges()
      },
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

  static verifyClaim(claim, evidencePool = []) {
    const validClaim = AiTrustModel.createClaim(claim);
    const validEvidence = evidencePool.map(e => AiTrustModel.createEvidenceSpan(e));
    const entailment = CitationEntailmentEngine.evaluateEntailment([validClaim], validEvidence, []);
    return entailment.verifiedClaims[0] || validClaim;
  }

  static validateTool(toolName, output) {
    return ToolUseFirewall.validateToolOutput(toolName, output);
  }

  static #classifyStake(query, answer, explicitStake) {
    if (explicitStake && STAKE_LEVEL[explicitStake]) {
      return STAKE_LEVEL[explicitStake];
    }
    const combined = `${query} ${answer}`.toLowerCase();
    if (combined.includes("tốt nghiệp") || combined.includes("học phí") || combined.includes("kỷ luật") || combined.includes("buộc thôi học") || combined.includes("quy chế")) {
      return STAKE_LEVEL.CRITICAL;
    }
    if (combined.includes("tiên quyết") || combined.includes("chuẩn đầu ra") || combined.includes("toeic") || combined.includes("chứng chỉ")) {
      return STAKE_LEVEL.HIGH;
    }
    return STAKE_LEVEL.MEDIUM;
  }

  static #synthesizeEpistemicStatus(params) {
    const {
      stakeLevel,
      claims,
      evidenceSpans,
      claimCoverage,
      hasOfficialConflict,
      contradictions,
      temporalValidityScore,
      hasOverclaim,
      disproveOutcome
    } = params;

    // 1. Conflict / Official Contradiction (Always Human Review)
    if (hasOfficialConflict || disproveOutcome === "CONFLICTED") {
      return {
        epistemicState: EPISTEMIC_STATE.CONFLICTED,
        answerMode: ANSWER_MODE.HUMAN_REVIEW_REQUIRED,
        requiresAbstention: true,
        abstentionReason: ABSTENTION_REASON.OFFICIAL_CONFLICT,
        explanation: "Phát hiện mâu thuẫn giữa các văn bản quy định chính thức. Hệ thống tạm dừng kết luận và chuyển hồ sơ kiểm tra tới cán bộ phụ trách."
      };
    }

    // 2. High Stake with Insufficient Evidence
    if ((stakeLevel === STAKE_LEVEL.CRITICAL || stakeLevel === STAKE_LEVEL.HIGH) && (claimCoverage < 0.6 || claims.length === 0 || evidenceSpans.length === 0)) {
      return {
        epistemicState: EPISTEMIC_STATE.UNSUPPORTED,
        answerMode: ANSWER_MODE.INSUFFICIENT_EVIDENCE,
        requiresAbstention: true,
        abstentionReason: ABSTENTION_REASON.HIGH_STAKE_UNVERIFIED,
        explanation: "Không đủ bằng chứng chính thức để kết luận cho yêu cầu học vụ trọng yếu này."
      };
    }

    // 3. Stale / Superseded Policy / Retracted
    if (claims.some(c => c.epistemicState === EPISTEMIC_STATE.RETRACTED || c.status === EPISTEMIC_STATE.RETRACTED)) {
      return {
        epistemicState: EPISTEMIC_STATE.RETRACTED,
        answerMode: ANSWER_MODE.INSUFFICIENT_EVIDENCE,
        requiresAbstention: true,
        abstentionReason: ABSTENTION_REASON.SOURCE_RETRACTED,
        explanation: "Văn bản trích dẫn đã bị thu hồi hoặc hủy bỏ hiệu lực chính thức."
      };
    }

    if (temporalValidityScore < 0.5 || claims.some(c => c.epistemicState === EPISTEMIC_STATE.OUTDATED || c.status === EPISTEMIC_STATE.OUTDATED)) {
      return {
        epistemicState: EPISTEMIC_STATE.OUTDATED,
        answerMode: ANSWER_MODE.PARTIALLY_SUPPORTED,
        requiresAbstention: false,
        abstentionReason: ABSTENTION_REASON.POLICY_SUPERSEDED,
        explanation: "Văn bản trích dẫn thuộc phiên bản cũ, đã có quy định thay thế mới hơn."
      };
    }

    // 4. Overclaim Detected
    if (hasOverclaim) {
      return {
        epistemicState: EPISTEMIC_STATE.PARTIALLY_SUPPORTED,
        answerMode: ANSWER_MODE.PARTIALLY_SUPPORTED,
        requiresAbstention: false,
        abstentionReason: ABSTENTION_REASON.NONE,
        explanation: "Nội dung chính được hỗ trợ, nhưng phát hiện một số chi tiết mở rộng không có trong văn bản gốc đã được cắt gọt an toàn."
      };
    }

    // 5. Direct Verified
    if (claimCoverage >= 0.85 && temporalValidityScore >= 0.9 && contradictions.length === 0) {
      return {
        epistemicState: EPISTEMIC_STATE.VERIFIED,
        answerMode: ANSWER_MODE.DIRECT_VERIFIED,
        requiresAbstention: false,
        abstentionReason: ABSTENTION_REASON.NONE,
        explanation: "Toàn bộ khẳng định được chứng minh đầy đủ bởi văn bản chính thức hiện hành."
      };
    }

    return {
      epistemicState: EPISTEMIC_STATE.SUPPORTED,
      answerMode: ANSWER_MODE.SUPPORTED,
      requiresAbstention: false,
      abstentionReason: ABSTENTION_REASON.NONE,
      explanation: "Thông tin được hỗ trợ bởi các nguồn tài liệu hợp lệ trong phạm vi cho phép."
    };
  }

  static #composeVerifiedAnswer({ rawAnswer, claims, trustStatus, requiresAbstention, abstentionReason, explanation, overclaimChecks = [] }) {
    if (requiresAbstention) {
      return `[TỪ CHỐI KHẲNG ĐỊNH VÌ AN TOÀN HỌC VỤ] ${explanation}`;
    }

    if (trustStatus === EPISTEMIC_STATE.VERIFIED) {
      return rawAnswer;
    }

    if (overclaimChecks.some(c => c.hasOverclaim)) {
      const overclaimed = overclaimChecks.find(c => c.hasOverclaim);
      return overclaimed?.safeGroundedText || rawAnswer;
    }

    return rawAnswer;
  }

  static #buildAbstentionResult({ query, rawAnswer, stakeLevel, reason, explanation }) {
    return Object.freeze({
      evaluationId: `EVAL_ABSTAIN_${Date.now()}`,
      query,
      queryStake: stakeLevel,
      rawAnswer,
      verifiedAnswer: `[TỪ CHỐI KHẲNG ĐỊNH] ${explanation}`,
      trustStatus: EPISTEMIC_STATE.UNKNOWN,
      epistemicState: EPISTEMIC_STATE.UNKNOWN,
      answerMode: ANSWER_MODE.INSUFFICIENT_EVIDENCE,
      requiresAbstention: true,
      abstentionReason: reason,
      explanation,
      claims: [],
      citations: [],
      evidenceSpans: [],
      sources: [],
      contradictions: [],
      unsupportedClaims: [],
      provenanceClusters: [],
      blindSpots: [],
      claimGraph: { nodes: [], edges: [] },
      metrics: {
        provenanceScore: 0,
        authorityScore: 0,
        evidenceQuality: 0,
        claimCoverage: 0,
        citationAccuracy: 0,
        temporalValidity: 0,
        sourceIndependenceScore: 0,
        contradictionSeverity: 1.0,
        manipulationRisk: 1.0,
        uncertainty: 1.0
      }
    });
  }
}
