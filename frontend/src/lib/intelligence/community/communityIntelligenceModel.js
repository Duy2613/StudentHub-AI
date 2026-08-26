/**
 * StudentHub AI — Community Intelligence Domain Model V1
 * 
 * Canonical contracts, entities, and taxonomies for the
 * Real-World Experience Layer, Experience Consensus Graph & Astroturfing Defense.
 * 
 * Core Invariant: COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC POLICY.
 */

export const CONTENT_TYPE = Object.freeze({
  FIRST_HAND_EXPERIENCE: "FIRST_HAND_EXPERIENCE", // Direct personal experience with context & timeframe
  SECOND_HAND_REPORT: "SECOND_HAND_REPORT",       // "Heard from a friend" / indirect report
  QUESTION: "QUESTION",                           // Question / Inquiry
  OPINION: "OPINION",                             // Subjective feeling / personal reaction
  SPECULATION: "SPECULATION",                     // Guesswork / unverified assumption
  FACTUAL_CLAIM: "FACTUAL_CLAIM",                 // Asserts an absolute fact
  GUIDE: "GUIDE"                                  // Step-by-step practical advice
});

export const CONSENSUS_SIGNAL = Object.freeze({
  STRONG_EXPERIENCE_CONSENSUS: "STRONG_EXPERIENCE_CONSENSUS", // >= 3 independent accounts with unique phrasing in same semester
  MODERATE_COMMUNITY_SIGNAL: "MODERATE_COMMUNITY_SIGNAL",     // 2 independent accounts corroborating
  WEAK_ANECDOTE: "WEAK_ANECDOTE",                             // Single anecdotal report
  UNVERIFIED_RUMOR: "UNVERIFIED_RUMOR",                       // Speculation without direct experience
  SUSPECTED_COORDINATION: "SUSPECTED_COORDINATION"            // Multiple accounts with copied phrasing/links (astroturfing)
});

export const MANIPULATION_RISK = Object.freeze({
  NONE: "NONE",
  COORDINATED_COPY_PASTE: "COORDINATED_COPY_PASTE", // Identical texts across accounts
  ASTROTURFING_PROMOTION: "ASTROTURFING_PROMOTION", // Repeated commercial links
  SUSPECTED_SOCKPUPPET: "SUSPECTED_SOCKPUPPET"      // Same IP/fingerprint cluster
});

export class CommunityIntelligenceModel {
  /**
   * Creates a Canonical Community Post / Experience entity
   */
  static createCommunityPost(data = {}) {
    const postId = data.postId || `POST_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const authorId = typeof data.authorId === "string" ? data.authorId.trim() : "ANON_STUDENT";
    const authorCohort = typeof data.authorCohort === "string" ? data.authorCohort.trim() : "K23";
    const content = typeof data.content === "string" ? data.content.trim() : "";
    const topic = typeof data.topic === "string" ? data.topic.trim().toUpperCase() : "GENERAL";
    const contentType = CONTENT_TYPE[data.contentType] || this.inferContentType(content);
    const upvotes = typeof data.upvotes === "number" ? data.upvotes : 0;
    const procedureDurationDays = typeof data.procedureDurationDays === "number" ? data.procedureDurationDays : null;
    const externalLinks = Array.isArray(data.externalLinks) ? [...data.externalLinks] : [];
    const timestamp = data.timestamp || new Date().toISOString();

    return Object.freeze({
      postId,
      authorId,
      authorCohort,
      content,
      topic,
      contentType,
      upvotes,
      procedureDurationDays,
      externalLinks: Object.freeze(externalLinks),
      timestamp
    });
  }

  /**
   * Heuristic content classifier for community posts
   */
  static inferContentType(text = "") {
    const lower = text.toLowerCase();
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
      return CONTENT_TYPE.SPECULATION;
    }
    return CONTENT_TYPE.OPINION;
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
      summary: typeof data.summary === "string" ? data.summary : "",
      evaluatedAt: data.evaluatedAt || new Date().toISOString()
    });
  }
}
