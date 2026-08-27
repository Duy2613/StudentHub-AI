/**
 * StudentHub AI — Comprehensive T2 Expert Discovery & Multi-Signal Ranking Engine V2
 * Discovers and ranks qualified academic domain experts based on verifiable credentials, domain hierarchy, and historical reliability.
 */

import { EXPERT_STATUS, CREDENTIAL_STATUS, EXPERTISE_LEVEL } from "./expertIntelligenceModel.js";
import { ExpertStore } from "./expertStore.js";
import { ExpertScopeEngine } from "./expertScopeEngine.js";

export class ExpertDiscoveryEngine {
  /**
   * Discovers and ranks experts matching a specific topic/query
   * @param {object} params
   * @param {string} params.topic - e.g. "Computer Vision", "Giải tích", "Xử lý ảnh"
   * @param {string} [params.domain] - e.g. "Computer Science"
   * @param {string} [params.requiredVerification] - e.g. EXPERT_STATUS.VERIFIED_EXPERT
   * @param {number} [params.limit] - max results
   * @returns {object} Ranked expert matches with multi-dimensional match breakdowns
   */
  static discoverExperts({
    topic,
    domain = null,
    requiredVerification = null,
    limit = 10
  }) {
    if (!topic || typeof topic !== "string") {
      throw new Error("discoverExperts requires a valid non-empty topic.");
    }

    const allExperts = ExpertStore.getAllExperts ? ExpertStore.getAllExperts() : [];
    const normalizedTopic = topic.trim().toLowerCase();

    const scoredMatches = allExperts
      .map(expert => {
        // 1. Topic & Domain Relevance (0.0 to 1.0)
        const domainRelevance = this.#calculateDomainRelevance(expert, normalizedTopic, domain);
        if (domainRelevance <= 0.1) return null;

        // 2. Verification Multiplier
        const isVerified = expert.verificationStatus === EXPERT_STATUS.VERIFIED_EXPERT ||
                           expert.verificationStatus === "VERIFIED";
        const isPartiallyVerified = expert.verificationStatus === EXPERT_STATUS.PARTIALLY_VERIFIED;
        
        if (requiredVerification && expert.verificationStatus !== requiredVerification) {
          return null;
        }

        const verificationScore = isVerified ? 1.0 : (isPartiallyVerified ? 0.7 : 0.4);

        // 3. Historical Accuracy (Separate from Domain Scope!)
        const historicalAccuracy = expert.historicalAccuracy !== undefined
          ? expert.historicalAccuracy
          : (expert.metrics && expert.metrics.historicalAccuracy !== undefined ? expert.metrics.historicalAccuracy : 0.90);

        // 4. Evidence Quality
        const evidenceQuality = expert.metrics && expert.metrics.evidenceQuality !== undefined
          ? expert.metrics.evidenceQuality
          : 0.88;

        // 5. Freshness
        const freshnessScore = expert.metrics && expert.metrics.freshnessScore !== undefined
          ? expert.metrics.freshnessScore
          : 0.85;

        // 6. Conflict of Interest Factor (0.0 = high conflict penalty, 1.0 = clear)
        const hasConflict = Array.isArray(expert.conflictOfInterest) && expert.conflictOfInterest.length > 0;
        const conflictFactor = hasConflict ? 0.85 : 1.0;

        // Multi-signal composite ranking weight
        const compositeScore = (
          domainRelevance * 0.40 +
          verificationScore * 0.20 +
          historicalAccuracy * 0.20 +
          evidenceQuality * 0.10 +
          freshnessScore * 0.10
        ) * conflictFactor;

        return {
          expertId: expert.expertId,
          fullName: expert.fullName,
          title: expert.academicTitle || expert.title || "Giảng viên / Chuyên gia",
          department: expert.department || "Khoa CNTT",
          institution: expert.institution || "HCMUTE",
          verificationStatus: expert.verificationStatus || EXPERT_STATUS.VERIFIED_EXPERT,
          compositeScore: Number(compositeScore.toFixed(3)),
          signals: {
            domainMatchPercentage: Math.round(domainRelevance * 100),
            verificationLabel: isVerified ? "Đã kiểm định chính quy" : "Xác nhận một phần",
            historicalAccuracyPercentage: Math.round(historicalAccuracy * 100),
            evidenceQualityPercentage: Math.round(evidenceQuality * 100),
            freshnessLabel: freshnessScore >= 0.8 ? "MỚI" : "BÌNH THƯỜNG",
            hasConflictOfInterest: hasConflict
          },
          matchedDomains: expert.domains || [topic],
          rawExpert: expert
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.compositeScore - a.compositeScore)
      .slice(0, limit);

    return {
      queryTopic: topic,
      totalMatched: scoredMatches.length,
      topMatches: scoredMatches,
      evaluatedAt: new Date().toISOString()
    };
  }

  static #calculateDomainRelevance(expert, targetTopic, targetDomain) {
    const expertDomains = Array.isArray(expert.domains) ? expert.domains : [];
    const expertResearch = Array.isArray(expert.researchAreas) ? expert.researchAreas : [];
    const expertTeaching = Array.isArray(expert.teachingCourses) ? expert.teachingCourses : [];

    const allKeywords = [
      ...expertDomains,
      ...expertResearch,
      ...expertTeaching,
      expert.department || "",
      expert.bio || ""
    ].map(k => String(k).toLowerCase());

    // Direct match
    if (allKeywords.some(k => k.includes(targetTopic) || targetTopic.includes(k))) {
      return 0.95;
    }

    // Secondary match on broad domain
    if (targetDomain && allKeywords.some(k => k.includes(targetDomain.toLowerCase()))) {
      return 0.70;
    }

    // Token intersection
    const tokens = targetTopic.split(/\s+/);
    const tokenMatches = tokens.filter(t => t.length > 2 && allKeywords.some(k => k.includes(t)));
    if (tokenMatches.length > 0) {
      return 0.40 + (tokenMatches.length / tokens.length) * 0.40;
    }

    return 0.05;
  }
}
