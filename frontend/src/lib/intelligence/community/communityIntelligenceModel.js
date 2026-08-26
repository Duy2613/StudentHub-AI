/**
 * StudentHub AI — Comprehensive Community & Forum Intelligence Domain Model V1
 */

import crypto from "node:crypto";

export const CLAIM_TYPE = Object.freeze({
  FACTUAL_CLAIM: "FACTUAL_CLAIM",
  FIRST_HAND_EXPERIENCE: "FIRST_HAND_EXPERIENCE",
  SECOND_HAND_REPORT: "SECOND_HAND_REPORT",
  OPINION: "OPINION",
  QUESTION: "QUESTION",
  SPECULATION: "SPECULATION",
  GUIDE: "GUIDE",
  WARNING: "WARNING",
  // Aliases
  PRACTICAL_TIP: "PRACTICAL_TIP",
  PROCEDURE_TIMELINE: "PROCEDURE_TIMELINE",
  EDGE_CASE_WARNING: "EDGE_CASE_WARNING",
  OPINION_REVIEW: "OPINION_REVIEW",
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",
  SPAM_OR_PROMOTION: "SPAM_OR_PROMOTION"
});

export const CONTENT_TYPE = CLAIM_TYPE;

export const EVIDENCE_STATUS = Object.freeze({
  HIGH_VALUE_EXPERIENCE: "HIGH_VALUE_EXPERIENCE",
  USEFUL_CONTEXT: "USEFUL_CONTEXT",
  WEAK_SIGNAL: "WEAK_SIGNAL",
  UNVERIFIED: "UNVERIFIED",
  CONTRADICTED: "CONTRADICTED",
  STALE: "STALE",
  SUSPICIOUS: "SUSPICIOUS",
  REQUIRES_REVIEW: "REQUIRES_REVIEW"
});

export const CONSENSUS_STATE = Object.freeze({
  STRONG_COMMUNITY_SIGNAL: "STRONG_COMMUNITY_SIGNAL",
  STRONG_EXPERIENCE_CONSENSUS: "STRONG_COMMUNITY_SIGNAL",
  MODERATE_COMMUNITY_SIGNAL: "MODERATE_COMMUNITY_SIGNAL",
  MIXED_EXPERIENCES: "MIXED_EXPERIENCES",
  WEAK_ANECDOTE: "WEAK_SIGNAL",
  WEAK_SIGNAL: "WEAK_SIGNAL",
  APPARENT_CONSENSUS: "APPARENT_CONSENSUS",
  SUSPECTED_COORDINATION: "SUSPECTED_COORDINATION",
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",
  CONFLICTED: "CONFLICTED",
  UNKNOWN: "UNKNOWN"
});

export const CONSENSUS_SIGNAL = Object.freeze({
  STRONG_EXPERIENCE_CONSENSUS: "STRONG_COMMUNITY_SIGNAL",
  STRONG_COMMUNITY_SIGNAL: "STRONG_COMMUNITY_SIGNAL",
  MODERATE_COMMUNITY_SIGNAL: "MODERATE_COMMUNITY_SIGNAL",
  MIXED_EXPERIENCES: "MIXED_EXPERIENCES",
  WEAK_ANECDOTE: "WEAK_SIGNAL",
  WEAK_SIGNAL: "WEAK_SIGNAL",
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",
  SUSPECTED_COORDINATION: "SUSPECTED_COORDINATION",
  APPARENT_CONSENSUS: "APPARENT_CONSENSUS"
});

export const COORDINATION_RISK = Object.freeze({
  NONE: "NONE",
  COORDINATED_COPY_PASTE: "COORDINATED_COPY_PASTE",
  SUSPECTED_COORDINATION: "COORDINATED_COPY_PASTE",
  COORDINATION_RISK: "SUSPECTED_SOCKPUPPET",
  SUSPECTED_SOCKPUPPET: "SUSPECTED_SOCKPUPPET",
  ASTROTURFING_PROMOTION: "ASTROTURFING_PROMOTION",
  POTENTIAL_COMMERCIAL_INTEREST: "ASTROTURFING_PROMOTION",
  SUSPECTED_SYNTHETIC: "SUSPECTED_SYNTHETIC"
});

export const MANIPULATION_RISK = COORDINATION_RISK;

export const VERIFIED_IDENTITY_TIER = Object.freeze({
  VERIFIED_STUDENT: "VERIFIED_STUDENT",
  VERIFIED_ALUMNI: "VERIFIED_ALUMNI",
  FACULTY_STAFF: "FACULTY_STAFF",
  UNVERIFIED_GUEST: "UNVERIFIED_GUEST"
});

export const VERIFICATION_BADGE = VERIFIED_IDENTITY_TIER;

export const MODERATION_STATE = Object.freeze({
  CLEAN: "CLEAN",
  FLAGGED: "FLAGGED",
  MUTED: "MUTED",
  BANNED: "BANNED"
});

export class CommunityIntelligenceModel {
  static createAuthor(data = {}) {
    const authorId = typeof data.authorId === "string" ? data.authorId.trim() : `ANON_${Math.random().toString(36).slice(2, 7)}`;
    const cohort = typeof data.cohort === "string" ? data.cohort.trim().toUpperCase() : "K23";
    const accountAgeDays = typeof data.accountAgeDays === "number" ? data.accountAgeDays : 180;
    const verifiedIdentity = VERIFIED_IDENTITY_TIER[data.verifiedIdentity] || (authorId.startsWith("ANON") ? VERIFIED_IDENTITY_TIER.UNVERIFIED_GUEST : VERIFIED_IDENTITY_TIER.VERIFIED_STUDENT);
    const participationHistory = data.participationHistory ? { ...data.participationHistory } : { postCount: 1, upvotesReceived: 0 };
    const domainHistory = Array.isArray(data.domainHistory) ? [...data.domainHistory] : [];
    const moderationState = MODERATION_STATE[data.moderationState] || MODERATION_STATE.CLEAN;
    const citationBehavior = data.citationBehavior ? { ...data.citationBehavior } : { linksSharedCount: 0, internalCitations: 0 };
    const conflictSignals = data.conflictSignals ? { ...data.conflictSignals } : { hasCommercialPromotion: false, isAffiliatedVendor: false };

    const authorHash = this.anonymizeAuthorId(authorId, cohort);

    return Object.freeze({
      authorId,
      authorHash,
      cohort,
      accountAgeDays,
      verifiedIdentity,
      badge: verifiedIdentity,
      participationHistory: Object.freeze(participationHistory),
      domainHistory: Object.freeze(domainHistory),
      moderationState,
      citationBehavior: Object.freeze(citationBehavior),
      conflictSignals: Object.freeze(conflictSignals)
    });
  }

  static anonymizeAuthorId(rawAuthorId, cohort = "K23") {
    if (!rawAuthorId || rawAuthorId.startsWith("ANON")) {
      return `ANON_${cohort}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    const hash = crypto.createHash("sha256").update(`SALT_STUDENT_PRIVACY_${rawAuthorId}`).digest("hex").slice(0, 8);
    return `STUDENT_${cohort}_${hash.toUpperCase()}`;
  }

  static createCommunityPost(data = {}) {
    const postId = data.postId || `POST_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const authorId = typeof data.authorId === "string" ? data.authorId.trim() : "ANON_STUDENT";
    const authorCohort = typeof data.authorCohort === "string" ? data.authorCohort.trim().toUpperCase() : "K23";
    const authorHash = data.authorHash || this.anonymizeAuthorId(authorId, authorCohort);

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const body = typeof data.body === "string" ? data.body.trim() : (typeof data.content === "string" ? data.content.trim() : "");
    const topic = typeof data.topic === "string" ? data.topic.trim().toUpperCase() : "GENERAL";
    const sourceUrl = typeof data.sourceUrl === "string" ? data.sourceUrl.trim() : null;
    const language = data.language || "vi";

    const context = this.createContext(data.context || {
      institution: data.institution || "HCMUTE",
      program: data.program || "DAI_TRA",
      cohort: authorCohort,
      term: data.term || "2025-2026_HK1",
      procedure: data.procedure || topic,
      department: data.department || "KHOA_CNTT"
    });

    const contentType = CLAIM_TYPE[data.contentType] || this.inferClaimType(body);
    const upvotes = typeof data.upvotes === "number" ? data.upvotes : 0;
    const procedureDurationDays = typeof data.procedureDurationDays === "number" ? data.procedureDurationDays : null;
    const externalLinks = Array.isArray(data.externalLinks) ? [...data.externalLinks] : [];
    const publishedAt = data.publishedAt || data.timestamp || new Date().toISOString();
    const editedAt = data.editedAt || null;

    const provenance = data.provenance ? { ...data.provenance } : {
      deviceFingerprint: data.deviceFingerprint || null,
      sourceHash: this.generateContentFingerprint(body)
    };

    return Object.freeze({
      postId,
      authorId,
      authorHash,
      authorCohort,
      badge: authorId.startsWith("ANON") ? VERIFIED_IDENTITY_TIER.UNVERIFIED_GUEST : VERIFIED_IDENTITY_TIER.VERIFIED_STUDENT,
      title,
      body,
      content: body,
      topic,
      sourceUrl,
      language,
      context,
      contentType,
      upvotes,
      procedureDurationDays,
      externalLinks: Object.freeze(externalLinks),
      provenance: Object.freeze(provenance),
      deviceFingerprint: provenance.deviceFingerprint,
      publishedAt,
      timestamp: publishedAt,
      editedAt
    });
  }

  static createContext(data = {}) {
    return Object.freeze({
      institution: typeof data.institution === "string" ? data.institution.trim() : "HCMUTE",
      program: typeof data.program === "string" ? data.program.trim().toUpperCase() : "DAI_TRA",
      cohort: typeof data.cohort === "string" ? data.cohort.trim().toUpperCase() : "K23",
      term: typeof data.term === "string" ? data.term.trim() : "2025-2026_HK1",
      procedure: typeof data.procedure === "string" ? data.procedure.trim().toUpperCase() : "GENERAL",
      department: typeof data.department === "string" ? data.department.trim().toUpperCase() : "KHOA_CNTT"
    });
  }

  static createCommunityClaim(data = {}) {
    const claimId = data.claimId || `CLAIM_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const postIds = Array.isArray(data.postIds) ? [...data.postIds] : [];
    const topic = typeof data.topic === "string" ? data.topic.trim().toUpperCase() : "GENERAL";
    const claimType = CLAIM_TYPE[data.claimType] || CLAIM_TYPE.FIRST_HAND_EXPERIENCE;
    const statement = typeof data.statement === "string" ? data.statement.trim() : "";
    const context = this.createContext(data.context || {});
    
    const supportCount = Number(data.supportCount || postIds.length || 1);
    const contradictionCount = Number(data.contradictionCount || 0);
    const independentAuthorCount = Number(data.independentAuthorCount || 1);
    const provenanceClustersCount = Number(data.provenanceClustersCount || 1);

    const publishedYear = data.publishedAt ? new Date(data.publishedAt).getFullYear() : new Date().getFullYear();
    const isHistorical = (new Date().getFullYear() - publishedYear) >= 2;
    const recency = isHistorical ? "HISTORICAL_CONTEXT" : "CURRENT_PROCESS";

    const status = EVIDENCE_STATUS[data.status] || (isHistorical ? EVIDENCE_STATUS.STALE : EVIDENCE_STATUS.HIGH_VALUE_EXPERIENCE);

    return Object.freeze({
      claimId,
      postIds: Object.freeze(postIds),
      topic,
      claimType,
      statement,
      context,
      supportCount,
      contradictionCount,
      independentAuthorCount,
      provenanceClustersCount,
      recency,
      status
    });
  }

  static generateContentFingerprint(text = "") {
    const normalized = text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s\p{P}]+/gu, " ")
      .trim();
    return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
  }

  static inferClaimType(text = "") {
    const lower = text.toLowerCase();
    if (lower.includes("mua tài liệu tại") || lower.includes("liên hệ zalo 09") || lower.includes("giảm giá khóa học")) {
      return CLAIM_TYPE.SPAM_OR_PROMOTION;
    }
    if (lower.includes("lưu ý:") || lower.includes("cảnh báo") || lower.includes("coi chừng") || lower.includes("bị trừ điểm nếu")) {
      return CLAIM_TYPE.WARNING;
    }
    if (lower.includes("hướng dẫn") || lower.includes("các bước:") || lower.includes("quy trình gồm")) {
      return CLAIM_TYPE.GUIDE;
    }
    if (lower.includes("tôi đã nộp") || lower.includes("mình vừa làm xong") || lower.includes("hôm qua mình lên") || lower.includes("kinh nghiệm của mình") || lower.includes("tôi nộp")) {
      return CLAIM_TYPE.FIRST_HAND_EXPERIENCE;
    }
    if (lower.includes("bạn tôi") || lower.includes("nghe nói") || lower.includes("bạn mình bảo") || lower.includes("thấy bảo")) {
      return CLAIM_TYPE.SECOND_HAND_REPORT;
    }
    if (lower.includes("cho mình hỏi") || lower.includes("có ai biết") || lower.includes("?")) {
      return CLAIM_TYPE.QUESTION;
    }
    if (lower.includes("có lẽ") || lower.includes("chắc là") || lower.includes("hình như") || lower.includes("sẽ miễn thi")) {
      return CLAIM_TYPE.SPECULATION;
    }
    if (lower.includes("tôi nghĩ") || lower.includes("mình thấy") || lower.includes("cảm giác")) {
      return CLAIM_TYPE.OPINION;
    }
    return CLAIM_TYPE.FACTUAL_CLAIM;
  }

  static createExperienceScore(data = {}) {
    return Object.freeze({
      firstHandRate: Number(data.firstHandRate ?? 1.0),
      independence: Number(data.independence ?? 1.0),
      recency: Number(data.recency ?? 1.0),
      contextMatch: Number(data.contextMatch ?? 1.0),
      provenanceQuality: Number(data.provenanceQuality ?? 1.0),
      contradictionRate: Number(data.contradictionRate ?? 0.0),
      coordinationRisk: COORDINATION_RISK[data.coordinationRisk] || COORDINATION_RISK.NONE
    });
  }

  static redactForPublic(postOrAuthor) {
    if (!postOrAuthor) return null;
    const copy = { ...postOrAuthor };
    delete copy.authorId;
    delete copy.provenance;
    delete copy.deviceFingerprint;
    delete copy.participationHistory;
    delete copy.citationBehavior;
    return Object.freeze(copy);
  }
}
