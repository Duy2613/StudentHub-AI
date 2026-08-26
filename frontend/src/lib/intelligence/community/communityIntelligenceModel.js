/**
 * StudentHub AI — Comprehensive Community & Forum Intelligence Domain Model V2
 * Community Reality Graph Architecture
 */

import crypto from "node:crypto";

export const CLAIM_TYPE = Object.freeze({
  FIRST_HAND_EXPERIENCE: "FIRST_HAND_EXPERIENCE", // Direct personal observation / completed procedure
  SECOND_HAND_REPORT: "SECOND_HAND_REPORT",       // "My friend said...", indirect report
  FACTUAL_CLAIM: "FACTUAL_CLAIM",                 // Verifiable factual statement
  OPINION: "OPINION",                             // Subjective feeling / evaluation
  SPECULATION: "SPECULATION",                     // "Maybe the school will change...", hypothesis
  QUESTION: "QUESTION",                           // Query for information
  GUIDE: "GUIDE",                                 // Step-by-step procedural advice
  WARNING: "WARNING",                             // Heads-up for pitfalls / rejection risks
  RECOMMENDATION: "RECOMMENDATION",               // Suggested course of action
  OBSERVATION: "OBSERVATION",                     // Neutral physical/system observation
  RUMOR: "UNVERIFIED_RUMOR",                      // Unsubstantiated hearsay
  // Compatibility Aliases
  PRACTICAL_TIP: "GUIDE",
  PROCEDURE_TIMELINE: "FIRST_HAND_EXPERIENCE",
  EDGE_CASE_WARNING: "WARNING",
  OPINION_REVIEW: "OPINION",
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",
  SPAM_OR_PROMOTION: "OPINION"
});

export const CONTENT_TYPE = CLAIM_TYPE;

export const AUTHOR_IDENTITY_STATE = Object.freeze({
  VERIFIED_IDENTITY: "VERIFIED_IDENTITY",
  PARTIALLY_VERIFIED: "PARTIALLY_VERIFIED",
  KNOWN_ACCOUNT: "KNOWN_ACCOUNT",
  IDENTITY_AMBIGUOUS: "IDENTITY_AMBIGUOUS",
  UNVERIFIED: "UNVERIFIED",
  UNKNOWN: "UNKNOWN"
});

export const VERIFIED_IDENTITY_TIER = Object.freeze({
  VERIFIED_STUDENT: "VERIFIED_STUDENT",
  VERIFIED_ALUMNI: "VERIFIED_ALUMNI",
  FACULTY_STAFF: "FACULTY_STAFF",
  UNVERIFIED_GUEST: "UNVERIFIED_GUEST"
});

export const VERIFICATION_BADGE = VERIFIED_IDENTITY_TIER;

export const TEMPORAL_STATE = Object.freeze({
  CURRENT_EXPERIENCE: "CURRENT_EXPERIENCE",
  RECENT: "RECENT",
  AGING: "AGING",
  HISTORICAL: "HISTORICAL_CONTEXT",
  HISTORICAL_CONTEXT: "HISTORICAL_CONTEXT",
  STALE: "STALE",
  UNKNOWN: "UNKNOWN"
});

export const CONSENSUS_STATE = Object.freeze({
  STRONG_COMMUNITY_SIGNAL: "STRONG_COMMUNITY_SIGNAL",
  STRONG_EXPERIENCE_CONSENSUS: "STRONG_COMMUNITY_SIGNAL",
  MODERATE_COMMUNITY_SIGNAL: "MODERATE_COMMUNITY_SIGNAL",
  MIXED_EXPERIENCES: "MIXED_EXPERIENCES",
  WEAK_SIGNAL: "WEAK_SIGNAL",
  WEAK_ANECDOTE: "WEAK_SIGNAL",
  APPARENT_CONSENSUS: "APPARENT_CONSENSUS",
  SUSPECTED_COORDINATION: "SUSPECTED_COORDINATION",
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",
  CONFLICTED: "CONFLICTED",
  UNKNOWN: "UNKNOWN"
});

export const CONSENSUS_SIGNAL = Object.freeze({
  STRONG_COMMUNITY_SIGNAL: "STRONG_COMMUNITY_SIGNAL",
  STRONG_EXPERIENCE_CONSENSUS: "STRONG_COMMUNITY_SIGNAL",
  MODERATE_COMMUNITY_SIGNAL: "MODERATE_COMMUNITY_SIGNAL",
  MIXED_EXPERIENCES: "MIXED_EXPERIENCES",
  WEAK_SIGNAL: "WEAK_SIGNAL",
  WEAK_ANECDOTE: "WEAK_SIGNAL",
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",
  SUSPECTED_COORDINATION: "SUSPECTED_COORDINATION",
  APPARENT_CONSENSUS: "APPARENT_CONSENSUS"
});

export const REALITY_GAP_STATE = Object.freeze({
  ALIGNED: "ALIGNED",
  MINOR_GAP: "MINOR_GAP",
  SIGNIFICANT_OPERATIONAL_GAP: "SIGNIFICANT_OPERATIONAL_GAP",
  UNRESOLVED: "UNRESOLVED",
  NO_COMMUNITY_EVIDENCE: "NO_COMMUNITY_EVIDENCE",
  STALE_COMMUNITY_EVIDENCE: "STALE_COMMUNITY_EVIDENCE"
});

export const FRICTION_STATE = Object.freeze({
  NEW: "NEW",
  EMERGING: "EMERGING",
  REPEATED: "REPEATED",
  PERSISTENT: "PERSISTENT",
  IMPROVING: "IMPROVING",
  RESOLVED: "RESOLVED",
  UNKNOWN: "UNKNOWN"
});

export const FRICTION_TREND = Object.freeze({
  NEW_SPIKE: "NEW_SPIKE",
  STABLE: "STABLE",
  DECLINING: "DECLINING",
  RESOLVED: "RESOLVED"
});

export const COORDINATION_RISK = Object.freeze({
  NONE: "NONE",
  COORDINATED_COPY_PASTE: "COORDINATED_COPY_PASTE",
  SUSPECTED_COORDINATION: "COORDINATED_COPY_PASTE",
  SUSPECTED_SOCKPUPPET: "SUSPECTED_SOCKPUPPET",
  COORDINATION_RISK: "SUSPECTED_SOCKPUPPET",
  POTENTIAL_COMMERCIAL_INTEREST: "POTENTIAL_COMMERCIAL_INTEREST",
  ASTROTURFING_PROMOTION: "POTENTIAL_COMMERCIAL_INTEREST",
  SUSPECTED_SYNTHETIC: "SUSPECTED_SYNTHETIC"
});

export const MANIPULATION_RISK = COORDINATION_RISK;

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

export const MODERATION_STATE = Object.freeze({
  CLEAN: "CLEAN",
  FLAGGED: "FLAGGED",
  MUTED: "MUTED",
  BANNED: "BANNED"
});

export class CommunityIntelligenceModel {
  static createAuthor(data = {}) {
    const authorId = typeof data.authorId === "string" ? data.authorId.trim() : `ANON_${Math.random().toString(36).slice(2, 7)}`;
    const canonicalIdentity = typeof data.canonicalIdentity === "string" ? data.canonicalIdentity.trim() : `Sinh viên ${data.cohort || "K24"}`;
    const cohort = typeof data.cohort === "string" ? data.cohort.trim().toUpperCase() : "K24";
    const accountAgeDays = typeof data.accountAgeDays === "number" ? data.accountAgeDays : 180;
    
    let verificationState = AUTHOR_IDENTITY_STATE[data.verificationState] || (
      data.verifiedIdentity === VERIFIED_IDENTITY_TIER.VERIFIED_STUDENT ? AUTHOR_IDENTITY_STATE.VERIFIED_IDENTITY :
      authorId.startsWith("ANON") ? AUTHOR_IDENTITY_STATE.UNVERIFIED : AUTHOR_IDENTITY_STATE.KNOWN_ACCOUNT
    );

    const verifiedIdentity = VERIFIED_IDENTITY_TIER[data.verifiedIdentity] || (
      verificationState === AUTHOR_IDENTITY_STATE.VERIFIED_IDENTITY && !authorId.startsWith("ANON") ? VERIFIED_IDENTITY_TIER.VERIFIED_STUDENT : VERIFIED_IDENTITY_TIER.UNVERIFIED_GUEST
    );

    const participationHistory = data.participationHistory ? { ...data.participationHistory } : { postCount: 1, upvotesReceived: 0 };
    const domainHistory = Array.isArray(data.domainHistory) ? [...data.domainHistory] : [];
    const moderationState = MODERATION_STATE[data.moderationState] || MODERATION_STATE.CLEAN;
    const citationBehavior = data.citationBehavior ? { ...data.citationBehavior } : { linksSharedCount: 0, internalCitations: 0 };
    const commercialSignals = data.commercialSignals ? { ...data.commercialSignals } : { hasCommercialPromotion: false, isAffiliatedVendor: false };
    const provenanceSignals = data.provenanceSignals ? { ...data.provenanceSignals } : { uniqueOriginCount: 1, copyCount: 0 };

    const authorHash = this.anonymizeAuthorId(authorId, cohort);

    return Object.freeze({
      authorId,
      canonicalIdentity,
      authorHash,
      cohort,
      accountAgeDays,
      verificationState,
      verifiedIdentity,
      badge: verifiedIdentity,
      participationHistory: Object.freeze(participationHistory),
      domainHistory: Object.freeze(domainHistory),
      moderationState,
      citationBehavior: Object.freeze(citationBehavior),
      commercialSignals: Object.freeze(commercialSignals),
      conflictSignals: Object.freeze(commercialSignals),
      provenanceSignals: Object.freeze(provenanceSignals)
    });
  }

  static anonymizeAuthorId(rawAuthorId, cohort = "K24") {
    if (!rawAuthorId || rawAuthorId.startsWith("ANON")) {
      return `ANON_${cohort}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    const hash = crypto.createHash("sha256").update(`SALT_STUDENT_PRIVACY_V2_${rawAuthorId}`).digest("hex").slice(0, 8);
    return `STUDENT_${cohort}_${hash.toUpperCase()}`;
  }

  static createCommunityPost(data = {}) {
    const postId = data.postId || `POST_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const authorId = typeof data.authorId === "string" ? data.authorId.trim() : "ANON_STUDENT";
    const authorCohort = typeof data.authorCohort === "string" ? data.authorCohort.trim().toUpperCase() : "K24";
    const authorHash = data.authorHash || this.anonymizeAuthorId(authorId, authorCohort);

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const body = typeof data.body === "string" ? data.body.trim() : (typeof data.content === "string" ? data.content.trim() : "");
    const topic = typeof data.topic === "string" ? data.topic.trim().toUpperCase() : "GENERAL";
    const sourcePlatform = typeof data.sourcePlatform === "string" ? data.sourcePlatform.trim() : "STUDENTHUB_FORUM";
    const sourceUrl = typeof data.sourceUrl === "string" ? data.sourceUrl.trim() : null;
    const language = data.language || "vi";

    const context = this.createContext(data.context || {
      institution: data.institution || "HCMUTE",
      faculty: data.faculty || data.department || "KHOA_CNTT",
      department: data.department || data.faculty || "KHOA_CNTT",
      program: data.program || "DAI_TRA",
      cohort: authorCohort,
      semester: data.semester || data.term || "2025-2026_HK1",
      term: data.term || data.semester || "2025-2026_HK1",
      procedure: data.procedure || topic,
      channel: data.channel || "ONLINE_PORTAL"
    });

    const contentType = CLAIM_TYPE[data.contentType] || this.inferClaimType(body);
    const upvotes = typeof data.upvotes === "number" ? data.upvotes : 0;
    const procedureDurationDays = typeof data.procedureDurationDays === "number" ? data.procedureDurationDays : null;
    const externalLinks = Array.isArray(data.externalLinks) ? [...data.externalLinks] : (Array.isArray(data.links) ? [...data.links] : []);
    const evidenceRefs = Array.isArray(data.evidenceRefs) ? [...data.evidenceRefs] : [];
    const publishedAt = data.publishedAt || data.timestamp || new Date().toISOString();
    const editedAt = data.editedAt || null;

    const sourceHash = this.generateContentFingerprint(body);
    const provenance = data.provenance ? { ...data.provenance } : {
      sourceOrigin: data.sourceOrigin || "ORIGINAL_POST",
      deviceFingerprint: data.deviceFingerprint || null,
      sourceHash
    };

    return Object.freeze({
      postId,
      authorId,
      authorHash,
      authorCohort,
      badge: (data.badge && data.badge !== "OFFICIAL_REGISTRAR") ? data.badge : (authorId.startsWith("ANON") ? VERIFIED_IDENTITY_TIER.UNVERIFIED_GUEST : VERIFIED_IDENTITY_TIER.VERIFIED_STUDENT),
      title,
      body,
      content: body,
      topic,
      sourcePlatform,
      sourceUrl,
      language,
      context,
      contentType,
      upvotes,
      procedureDurationDays,
      externalLinks: Object.freeze(externalLinks),
      links: Object.freeze(externalLinks),
      evidenceRefs: Object.freeze(evidenceRefs),
      provenance: Object.freeze(provenance),
      sourceHash,
      deviceFingerprint: provenance.deviceFingerprint || data.deviceFingerprint,
      publishedAt,
      timestamp: publishedAt,
      editedAt
    });
  }

  static createContext(data = {}) {
    return Object.freeze({
      institution: typeof data.institution === "string" ? data.institution.trim() : "HCMUTE",
      faculty: typeof data.faculty === "string" ? data.faculty.trim().toUpperCase() : (data.department ? data.department.toUpperCase() : "KHOA_CNTT"),
      department: typeof data.department === "string" ? data.department.trim().toUpperCase() : (data.faculty ? data.faculty.toUpperCase() : "KHOA_CNTT"),
      program: typeof data.program === "string" ? data.program.trim().toUpperCase() : "DAI_TRA",
      cohort: typeof data.cohort === "string" ? data.cohort.trim().toUpperCase() : "K24",
      semester: typeof data.semester === "string" ? data.semester.trim() : (data.term || "2025-2026_HK1"),
      term: typeof data.term === "string" ? data.term.trim() : (data.semester || "2025-2026_HK1"),
      procedure: typeof data.procedure === "string" ? data.procedure.trim().toUpperCase() : "GENERAL",
      channel: typeof data.channel === "string" ? data.channel.trim().toUpperCase() : "ONLINE_PORTAL"
    });
  }

  static createCommunityClaim(data = {}) {
    const claimId = data.claimId || `CLM_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const postIds = Array.isArray(data.postIds) ? [...data.postIds] : (data.postId ? [data.postId] : []);
    const authorId = data.authorId || (data.authorHash || "ANON_STUDENT");
    const topic = typeof data.topic === "string" ? data.topic.trim().toUpperCase() : "GENERAL";
    const claimType = CLAIM_TYPE[data.claimType] || CLAIM_TYPE.FIRST_HAND_EXPERIENCE;
    const statement = typeof data.statement === "string" ? data.statement.trim() : (data.body || data.text || "");
    const context = this.createContext(data.context || {});
    
    const publishedAt = data.publishedAt || new Date().toISOString();
    const publishedYear = new Date(publishedAt).getFullYear();
    const currentYear = new Date().getFullYear();
    const isHistorical = (currentYear - publishedYear) >= 2;
    const recency = isHistorical ? "HISTORICAL_CONTEXT" : "CURRENT_PROCESS";

    const supportCount = Number(data.supportCount || postIds.length || 1);
    const contradictionCount = Number(data.contradictionCount || 0);
    const independentAuthorCount = Number(data.independentAuthorCount || 1);
    const provenanceClustersCount = Number(data.provenanceClustersCount || 1);

    const status = EVIDENCE_STATUS[data.status] || (
      isHistorical ? EVIDENCE_STATUS.STALE :
      claimType === CLAIM_TYPE.FIRST_HAND_EXPERIENCE ? EVIDENCE_STATUS.HIGH_VALUE_EXPERIENCE :
      claimType === CLAIM_TYPE.OPINION ? EVIDENCE_STATUS.USEFUL_CONTEXT :
      EVIDENCE_STATUS.UNVERIFIED
    );

    return Object.freeze({
      claimId,
      authorId,
      postIds: Object.freeze(postIds),
      topic,
      claimType,
      statement,
      text: statement,
      context,
      supportCount,
      contradictionCount,
      independentAuthorCount,
      provenanceClustersCount,
      publishedAt,
      recency,
      status,
      isRetracted: Boolean(data.isRetracted),
      supersededByClaimId: data.supersededByClaimId || null
    });
  }

  static createCommunityExperience(data = {}) {
    const experienceId = data.experienceId || `EXP_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const authorId = data.authorId || "ANON_STUDENT";
    const postId = data.postId || "POST_UNKNOWN";
    const event = typeof data.event === "string" ? data.event.trim() : (data.title || "Thực hiện quy trình học vụ");
    const observedAt = data.observedAt || data.publishedAt || new Date().toISOString();
    const context = this.createContext(data.context || {});
    const firstHandState = Boolean(data.firstHandState ?? (data.claimType === CLAIM_TYPE.FIRST_HAND_EXPERIENCE || true));
    const durationDays = typeof data.durationDays === "number" ? data.durationDays : (typeof data.procedureDurationDays === "number" ? data.procedureDurationDays : null);
    const evidenceRefs = Array.isArray(data.evidenceRefs) ? [...data.evidenceRefs] : [];
    const status = data.status || EVIDENCE_STATUS.HIGH_VALUE_EXPERIENCE;

    return Object.freeze({
      experienceId,
      authorId,
      postId,
      event,
      observedAt,
      context,
      firstHandState,
      durationDays,
      procedureDurationDays: durationDays,
      evidenceRefs: Object.freeze(evidenceRefs),
      status
    });
  }

  static createProvenanceCluster(data = {}) {
    const clusterId = data.clusterId || `PROV_CLUS_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const signature = data.signature || "SIG_DEFAULT";
    const sourceOrigin = data.sourceOrigin || "ORIGINAL_STUDENT_POST";
    const postIds = Array.isArray(data.postIds) ? [...data.postIds] : [];
    const distinctAuthors = Array.isArray(data.distinctAuthors) ? [...data.distinctAuthors] : [];
    const isSyndicated = Boolean(data.isSyndicated || postIds.length >= 3);

    return Object.freeze({
      clusterId,
      signature,
      sourceOrigin,
      postIds: Object.freeze(postIds),
      postsCount: postIds.length,
      distinctAuthors: Object.freeze(distinctAuthors),
      distinctAuthorsCount: distinctAuthors.length,
      isSyndicated,
      explanation: isSyndicated
        ? `Cụm bản sao (Syndication): ${postIds.length} bài viết lặp lại cùng nguồn nội dung, chỉ tính 1 đơn vị bằng chứng độc lập.`
        : `Nguồn độc lập xác nhận.`
    });
  }

  static createFrictionSignal(data = {}) {
    const frictionId = data.frictionId || `FRIC_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const process = typeof data.process === "string" ? data.process.trim() : "Quy trình Đào Tạo";
    const step = typeof data.step === "string" ? data.step.trim() : "Nộp hồ sơ";
    const frictionType = typeof data.frictionType === "string" ? data.frictionType.trim() : "DELAY_CONFIRMATION";
    const affectedContext = this.createContext(data.affectedContext || { cohort: data.cohort || "K24" });
    const firstSeen = data.firstSeen || new Date().toISOString();
    const lastSeen = data.lastSeen || new Date().toISOString();
    const independentReportCount = Number(data.independentReportCount || 1);
    const trend = FRICTION_TREND[data.trend] || FRICTION_TREND.STABLE;
    const severity = data.severity || "MEDIUM";
    const state = FRICTION_STATE[data.state] || (independentReportCount >= 5 ? FRICTION_STATE.REPEATED : FRICTION_STATE.EMERGING);

    return Object.freeze({
      frictionId,
      process,
      step,
      frictionType,
      affectedContext,
      cohort: affectedContext.cohort,
      firstSeen,
      lastSeen,
      independentReportCount,
      trend,
      severity,
      state,
      description: data.description || `Điểm nghẽn vận hành tại bước '${step}' thuộc quy trình '${process}'.`
    });
  }

  static createOfficialRealityGap(data = {}) {
    const gapId = data.gapId || `GAP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const topic = typeof data.topic === "string" ? data.topic.trim().toUpperCase() : "GENERAL";
    const officialTarget = typeof data.officialTarget === "string" ? data.officialTarget.trim() : "3 ngày làm việc";
    const officialCitation = typeof data.officialCitation === "string" ? data.officialCitation.trim() : "QĐ 3116/QĐ-ĐHSPKT";
    const communityObserved = typeof data.communityObserved === "string" ? data.communityObserved.trim() : "6–8 ngày làm việc";
    const sampleSize = Number(data.sampleSize ?? 0);
    const gapStatus = REALITY_GAP_STATE[data.gapStatus] || REALITY_GAP_STATE.SIGNIFICANT_OPERATIONAL_GAP;
    const explanation = data.explanation || `Quy định chính thức nêu mục tiêu ${officialTarget}, trong khi thực tế ${sampleSize} sinh viên phản ánh thời gian xử lý ${communityObserved}. Đây là độ trễ vận hành thực tế, không cấu thành vi phạm quy chế.`;

    return Object.freeze({
      gapId,
      topic,
      officialTarget,
      officialCitation,
      communityObserved,
      sampleSize,
      gapStatus,
      explanation,
      evaluatedAt: new Date().toISOString(),
      limitations: Object.freeze([
        "Thông tin phản ánh trải nghiệm vận hành thực tế tại thời điểm khảo sát.",
        "Không thay đổi hoặc phủ quyết quy chế đào tạo chính thức của nhà trường."
      ])
    });
  }

  static generateContentFingerprint(text = "") {
    const normalized = String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s\p{P}]+/gu, " ")
      .trim();
    return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
  }

  static inferClaimType(text = "") {
    const lower = String(text).toLowerCase();
    
    // 1. Commercial / Spam
    if (lower.includes("mua tài liệu tại") || lower.includes("liên hệ zalo 09") || lower.includes("giảm giá khóa học") || lower.includes("dịch vụ viết thuê") || lower.includes("dịch vụ làm chứng chỉ")) {
      return CLAIM_TYPE.OPINION;
    }
    
    // 2. Second-hand report (must be checked BEFORE duration keywords)
    if (lower.includes("bạn tôi") || lower.includes("nghe nói") || lower.includes("bạn mình bảo") || lower.includes("thấy bảo")) {
      return CLAIM_TYPE.SECOND_HAND_REPORT;
    }

    // 3. Speculation
    if (lower.includes("có lẽ") || lower.includes("chắc là") || lower.includes("hình như") || lower.includes("sẽ đổi quy chế") || lower.includes("sẽ miễn thi")) {
      return CLAIM_TYPE.SPECULATION;
    }

    // 4. Warning
    if (lower.includes("lưu ý:") || lower.includes("cảnh báo") || lower.includes("coi chừng") || lower.includes("bị từ chối") || lower.includes("bị trừ điểm")) {
      return CLAIM_TYPE.WARNING;
    }

    // 5. Guide
    if (lower.includes("hướng dẫn") || lower.includes("các bước:") || lower.includes("quy trình gồm")) {
      return CLAIM_TYPE.GUIDE;
    }

    // 6. First-hand Experience
    if (lower.includes("tôi đã nộp") || lower.includes("mình vừa làm xong") || lower.includes("hôm qua mình lên") || lower.includes("kinh nghiệm của mình") || lower.includes("tôi nộp") || lower.includes("mất 3 ngày") || lower.includes("mất 7 ngày") || lower.includes("mất 6 ngày") || lower.includes("mất 8 ngày") || lower.includes("mất 10 ngày")) {
      return CLAIM_TYPE.FIRST_HAND_EXPERIENCE;
    }

    // 7. Question
    if (lower.includes("cho mình hỏi") || lower.includes("có ai biết") || lower.includes("?")) {
      return CLAIM_TYPE.QUESTION;
    }

    // 8. Opinion
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
    delete copy.ip;
    delete copy.provenance;
    delete copy.deviceFingerprint;
    delete copy.participationHistory;
    delete copy.citationBehavior;
    delete copy.moderationNotes;
    return Object.freeze(copy);
  }
}
