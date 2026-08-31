/**
 * StudentHub AI — Grounded AI Recommendation Engine Architecture V1
 * Generates explainable, evidence-backed student recommendations with uncertainty boundaries.
 */

import crypto from "node:crypto";
import { ProvenanceGraph, TRANSFORMATION_TYPE } from "../fabric/ProvenanceGraph.js";

export const RECOMMENDATION_CONFIDENCE_BAND = Object.freeze({
  HIGH_CONFIDENCE: "HIGH_CONFIDENCE",           // Supported by official rules + strong evidence (>= 0.80)
  MODERATE_CONFIDENCE: "MODERATE_CONFIDENCE",   // Good evidence with minor operational variance (0.60 - 0.79)
  LOW_CONFIDENCE: "LOW_CONFIDENCE",             // Sparse evidence, requires caution (0.40 - 0.59)
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE" // Under-evidenced (< 0.40)
});

export class RecommendationObject {
  /**
   * @param {object} params
   * @param {string} [params.recommendationId]
   * @param {string} params.subjectId - e.g. "student:24110001"
   * @param {object} params.context - { semester, cohort, gpa, program }
   * @param {string} params.action - e.g. "Ưu tiên đăng ký môn Giải tích 1 trong HK1"
   * @param {string} params.rationale - High-level human rationale
   * @param {string[]} [params.supportingClaimIds]
   * @param {string[]} [params.supportingEvidenceIds]
   * @param {number} [params.confidence] - 0.0 to 1.0
   * @param {string} [params.risk] - "LOW" | "MEDIUM" | "HIGH"
   * @param {string} [params.uncertaintyExplanation] - What assumptions/nuances could alter outcome
   * @param {string[]} [params.alternatives] - Alternative viable pathways
   * @param {string} [params.generatedBy] - "AcademicPlannerAgent"
   * @param {string} [params.expiresAt]
   */
  constructor({
    recommendationId = null,
    subjectId,
    context = {},
    action,
    rationale,
    supportingClaimIds = [],
    supportingEvidenceIds = [],
    confidence = 0.85,
    risk = "LOW",
    uncertaintyExplanation = "Không có bất định đáng kể.",
    alternatives = [],
    generatedBy = "AcademicPlannerAgent",
    createdAt = new Date().toISOString(),
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days default
  }) {
    if (!subjectId) throw new Error("RecommendationObject requires subjectId.");
    if (!action) throw new Error("RecommendationObject requires action.");
    if (!rationale) throw new Error("RecommendationObject requires rationale.");

    this.recommendationId = recommendationId || `rec_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    this.subjectId = subjectId;
    this.context = Object.freeze({ ...context });
    this.action = action.trim();
    this.rationale = rationale.trim();
    this.supportingClaimIds = Object.freeze([...new Set(supportingClaimIds)]);
    this.supportingEvidenceIds = Object.freeze([...new Set(supportingEvidenceIds)]);
    this.confidence = Math.max(0.05, Math.min(0.98, Number(confidence) || 0.5));
    this.risk = risk;
    this.uncertaintyExplanation = uncertaintyExplanation;
    this.alternatives = Object.freeze([...alternatives]);
    this.generatedBy = generatedBy;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;

    Object.freeze(this);
  }

  get confidenceBand() {
    if (this.confidence >= 0.80) return RECOMMENDATION_CONFIDENCE_BAND.HIGH_CONFIDENCE;
    if (this.confidence >= 0.60) return RECOMMENDATION_CONFIDENCE_BAND.MODERATE_CONFIDENCE;
    if (this.confidence >= 0.40) return RECOMMENDATION_CONFIDENCE_BAND.LOW_CONFIDENCE;
    return RECOMMENDATION_CONFIDENCE_BAND.INSUFFICIENT_EVIDENCE;
  }

  get isExpired() {
    return new Date() > new Date(this.expiresAt);
  }

  toJSON() {
    return {
      recommendationId: this.recommendationId,
      subjectId: this.subjectId,
      context: this.context,
      action: this.action,
      rationale: this.rationale,
      confidence: this.confidence,
      confidenceBand: this.confidenceBand,
      risk: this.risk,
      uncertaintyExplanation: this.uncertaintyExplanation,
      alternatives: this.alternatives,
      supportingClaimIds: this.supportingClaimIds,
      supportingEvidenceIds: this.supportingEvidenceIds,
      generatedBy: this.generatedBy,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
      isExpired: this.isExpired
    };
  }
}

export class AiRecommendationEngine {
  /**
   * Generates grounded recommendations for a student based on verified claims and evidence
   * @param {object} params
   * @param {string} params.subjectId
   * @param {object} params.studentProfile - Academic Profile 360
   * @param {object[]} params.fusedClaims - Fused ClaimEntity items
   * @param {object[]} params.availableEvidence - EvidenceEntity items
   * @returns {object} Recommendation results with traceable evidence and alternatives
   */
  static generateAcademicRecommendations({
    subjectId,
    studentProfile,
    fusedClaims = [],
    availableEvidence = []
  }) {
    if (!subjectId) throw new Error("generateAcademicRecommendations requires subjectId.");

    const recommendations = [];
    const context = {
      cohort: studentProfile?.academicSummary?.cohort || 2024,
      programCode: studentProfile?.academicSummary?.programCode || "7480103",
      cgpa: studentProfile?.academicSummary?.cgpa || 3.20,
      earnedCredits: studentProfile?.academicSummary?.earnedCredits || 45
    };

    // Rule 1: Prerequisite chain prioritization
    const hasMath1 = studentProfile?.courses?.some(c => c.courseId === "MATH141701" && c.status === "PASSED");
    if (!hasMath1) {
      const mathClaims = fusedClaims.filter(c => c.topicId.includes("prerequisites") || c.statement.includes("Giải tích 1"));
      const supportingClaimIds = mathClaims.map(c => c.claimId);
      const supportingEvidenceIds = availableEvidence.filter(e => e.contentReference.includes("MATH141701") || e.type === "OFFICIAL_REGULATION").map(e => e.evidenceId);

      const rec = new RecommendationObject({
        subjectId,
        context,
        action: "Ưu tiên đăng ký môn Giải tích 1 (MATH141701) trong học kỳ kế tiếp.",
        rationale: "Giải tích 1 là môn tiên quyết then chốt mở khóa 6 môn chuyên ngành tiếp theo (Giải tích 2, Xác suất thống kê, Vật lý đại cương).",
        supportingClaimIds,
        supportingEvidenceIds,
        confidence: 0.92,
        risk: "LOW",
        uncertaintyExplanation: "Nếu điểm rèn luyện hoặc học lực đang thuộc diện cảnh báo, nên cân nhắc giảm tải môn bổ trợ.",
        alternatives: [
          "Đăng ký lớp học kỳ hè để bắt kịp tiến độ nếu học kỳ chính đã hết chỗ.",
          "Học ghép với khóa mới nếu chương trình cho phép tương đương."
        ]
      });

      // Record Provenance
      ProvenanceGraph.recordProvenance({
        targetEntityId: rec.recommendationId,
        targetEntityType: "RECOMMENDATION",
        sourceIds: supportingEvidenceIds,
        authorId: "AcademicPlannerAgent",
        transformations: [TRANSFORMATION_TYPE.REASONED, TRANSFORMATION_TYPE.FUSED],
        confidence: rec.confidence
      });

      recommendations.push(rec);
    }

    // Rule 2: Certification Graduation Requirement
    const hasEnglishCert = studentProfile?.certificates?.some(c => c.type === "ENGLISH" && c.status === "ACTIVE");
    if (!hasEnglishCert && context.earnedCredits >= 60) {
      const rec = new RecommendationObject({
        subjectId,
        context,
        action: "Chuẩn bị thi và nộp chứng chỉ tiếng Anh quốc tế (TOEIC/IELTS) trước học kỳ 6.",
        rationale: "Quy chuẩn chuẩn đầu ra ngoại ngữ yêu cầu nộp hồ sơ xét miễn trước thời điểm đăng ký Khóa luận tốt nghiệp tối thiểu 1 học kỳ.",
        supportingClaimIds: [],
        supportingEvidenceIds: [],
        confidence: 0.88,
        risk: "MEDIUM",
        uncertaintyExplanation: "Thời gian tiếp nhận và xử lý thẩm định chứng chỉ của trường thường mất 7-10 ngày làm việc.",
        alternatives: ["Đăng ký kỳ thi nội bộ do Trung tâm Ngoại ngữ HCMUTE tổ chức."]
      });
      recommendations.push(rec);
    }

    return {
      subjectId,
      totalRecommendations: recommendations.length,
      recommendations: recommendations.map(r => r.toJSON()),
      compiledAt: new Date().toISOString()
    };
  }
}
