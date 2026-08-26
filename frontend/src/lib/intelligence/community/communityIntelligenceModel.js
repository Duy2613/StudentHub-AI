/**
 * StudentHub AI — Comprehensive Community Intelligence Domain Model V1
 * 
 * Canonical contracts, immutable factories, taxonomy, and state machines for:
 * - Student Real-World Experience Layer & Procedure Timelines
 * - Multi-Account Experience Consensus (>= 3 independent reports)
 * - Astroturfing, Spam & Coordinated Sockpuppet Defense
 * - Rumor vs Confirmed Community Fact Classification
 * - Edge-Case & Friction Mining
 * - Salted Student Privacy & Anonymization
 * 
 * Non-Negotiable Core Invariant:
 * ==================================================================================
 *             COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC POLICY
 * ==================================================================================
 */

import crypto from "node:crypto";

export const CONTENT_TYPE = Object.freeze({
  FIRST_HAND_EXPERIENCE: "FIRST_HAND_EXPERIENCE", // Direct personal experience with verifiable context
  PRACTICAL_TIP: "PRACTICAL_TIP",                 // Actionable advice / lifehack
  PROCEDURE_TIMELINE: "PROCEDURE_TIMELINE",       // Specific duration / step timeline recorded
  EDGE_CASE_WARNING: "EDGE_CASE_WARNING",         // Rare friction / unexpected condition warning
  OPINION_REVIEW: "OPINION_REVIEW",               // Subjective review / evaluation
  SECOND_HAND_REPORT: "SECOND_HAND_REPORT",       // "Heard from a peer" / indirect report
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",           // Unsubstantiated speculation
  SPAM_OR_PROMOTION: "SPAM_OR_PROMOTION",         // Commercial ad / astroturfed promotion
  QUESTION: "QUESTION",                           // Inquiries
  GUIDE: "GUIDE"                                  // Step-by-step procedure guide
});

export const CONSENSUS_SIGNAL = Object.freeze({
  STRONG_EXPERIENCE_CONSENSUS: "STRONG_EXPERIENCE_CONSENSUS", // >= 3 independent students with diverse phrasing
  MODERATE_COMMUNITY_SIGNAL: "MODERATE_COMMUNITY_SIGNAL",     // 2 independent students corroborating
  WEAK_ANECDOTE: "WEAK_ANECDOTE",                             // Single anecdotal report
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",                       // Speculation without direct experience
  SUSPECTED_COORDINATION: "SUSPECTED_COORDINATION"            // Multiple accounts with copied phrasing/links (astroturfing)
});

export const MANIPULATION_RISK = Object.freeze({
  NONE: "NONE",
  COORDINATED_COPY_PASTE: "COORDINATED_COPY_PASTE", // Identical texts across accounts
  ASTROTURFING_PROMOTION: "ASTROTURFING_PROMOTION", // Repeated commercial links or vendor spam
  SUSPECTED_SOCKPUPPET: "SUSPECTED_SOCKPUPPET"      // Same device/network fingerprint cluster
});

export const VERIFICATION_BADGE = Object.freeze({
  VERIFIED_STUDENT: "VERIFIED_STUDENT",
  VERIFIED_ALUMNI: "VERIFIED_ALUMNI",
  UNVERIFIED_GUEST: "UNVERIFIED_GUEST"
});

export class CommunityIntelligenceModel {
  /**
   * Creates a Canonical Community Post / Experience entity
   */
  static createCommunityPost(data = {}) {
    const postId = data.postId || `POST_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const authorCohort = typeof data.authorCohort === "string" ? data.authorCohort.trim().toUpperCase() : "K23";
    const rawAuthorId = typeof data.authorId === "string" ? data.authorId.trim() : "ANON_STUDENT";
    
    // Salted Privacy Anonymization
    const authorHash = this.anonymizeAuthorId(rawAuthorId, authorCohort);
    const badge = data.badge || (rawAuthorId.startsWith("ANON") ? VERIFICATION_BADGE.UNVERIFIED_GUEST : VERIFICATION_BADGE.VERIFIED_STUDENT);

    const content = typeof data.content === "string" ? data.content.trim() : "";
    const topic = typeof data.topic === "string" ? data.topic.trim().toUpperCase() : "GENERAL";
    const contentType = CONTENT_TYPE[data.contentType] || this.inferContentType(content);
    const upvotes = typeof data.upvotes === "number" ? data.upvotes : 0;
    const procedureDurationDays = typeof data.procedureDurationDays === "number" ? data.procedureDurationDays : null;
    const externalLinks = Array.isArray(data.externalLinks) ? [...data.externalLinks] : [];
    const timestamp = data.timestamp || new Date().toISOString();
    const deviceFingerprint = data.deviceFingerprint || null;

    return Object.freeze({
      postId,
      authorId: rawAuthorId,
      authorHash,
      authorCohort,
      badge,
      content,
      topic,
      contentType,
      upvotes,
      procedureDurationDays,
      externalLinks: Object.freeze(externalLinks),
      deviceFingerprint,
      timestamp
    });
  }

  /**
   * Anonymizes author ID to protect student privacy
   */
  static anonymizeAuthorId(rawAuthorId, cohort = "K23") {
    if (!rawAuthorId || rawAuthorId.startsWith("ANON")) {
      return `ANON_${cohort}_${Math.random().toString(36).slice(2, 6)}`;
    }
    const hash = crypto.createHash("sha256").update(`SALT_STUDENT_${rawAuthorId}`).digest("hex").slice(0, 8);
    return `STUDENT_${cohort}_${hash.toUpperCase()}`;
  }

  /**
   * Heuristic content classifier for community posts
   */
  static inferContentType(text = "") {
    const lower = text.toLowerCase();
    if (lower.includes("mua tài liệu tại") || lower.includes("liên hệ zalo 09") || lower.includes("giảm giá khóa học")) {
      return CONTENT_TYPE.SPAM_OR_PROMOTION;
    }
    if (lower.includes("lưu ý:") || lower.includes("cảnh báo") || lower.includes("coi chừng") || lower.includes("bị trừ điểm nếu")) {
      return CONTENT_TYPE.EDGE_CASE_WARNING;
    }
    if (lower.includes("mất khoảng") && (lower.includes("ngày") || lower.includes("tuần"))) {
      return CONTENT_TYPE.PROCEDURE_TIMELINE;
    }
    if (lower.includes("mẹo:") || lower.includes("tips:") || lower.includes("kinh nghiệm để")) {
      return CONTENT_TYPE.PRACTICAL_TIP;
    }
    if (lower.includes("mình vừa làm xong") || lower.includes("kinh nghiệm của mình") || lower.includes("hôm qua mình lên phòng")) {
      return CONTENT_TYPE.FIRST_HAND_EXPERIENCE;
    }
    if (lower.includes("nghe nói") || lower.includes("bạn mình bảo") || lower.includes("thấy bảo")) {
      return CONTENT_TYPE.SECOND_HAND_REPORT;
    }
    if (lower.includes("cho mình hỏi") || lower.includes("có ai biết") || lower.includes("?")) {
      return CONTENT_TYPE.QUESTION;
    }
    if (lower.includes("hướng dẫn") || lower.includes("các bước:") || lower.includes("quy trình gồm")) {
      return CONTENT_TYPE.GUIDE;
    }
    if (lower.includes("chắc là") || lower.includes("hình như") || lower.includes("có thể")) {
      return CONTENT_TYPE.UNVERIFIED_RUMOR;
    }
    return CONTENT_TYPE.OPINION_REVIEW;
  }

  /**
   * Creates an Experience Consensus Evaluation entity
   */
  static createConsensusEvaluation(data = {}) {
    return Object.freeze({
      topic: data.topic || "GENERAL",
      consensusSignal: CONSENSUS_SIGNAL[data.consensusSignal] || CONSENSUS_SIGNAL.WEAK_ANECDOTE,
      manipulationRisk: MANIPULATION_RISK[data.manipulationRisk] || MANIPULATION_RISK.NONE,
      independentAccountsCount: Number(data.independentAccountsCount || 0),
      totalPostsCount: Number(data.totalPostsCount || 0),
      provenanceClustersCount: Number(data.provenanceClustersCount || 0),
      medianProcedureDays: data.medianProcedureDays ?? null,
      edgeCases: Array.isArray(data.edgeCases) ? Object.freeze([...data.edgeCases]) : Object.freeze([]),
      summary: typeof data.summary === "string" ? data.summary : "",
      evaluatedAt: data.evaluatedAt || new Date().toISOString()
    });
  }

  /**
   * Redacts internal device fingerprint and author IDs for public API delivery
   */
  static redactForPublic(post) {
    if (!post) return null;
    const { authorId, deviceFingerprint, ...publicFields } = post;
    return Object.freeze(publicFields);
  }
}
