/**
 * StudentHub AI — Comprehensive T2 Expert Discovery & Multi-Signal Ranking Engine V2
 * Discovers and ranks qualified academic domain experts based on verifiable credentials, domain hierarchy, and historical reliability.
 */

import { EXPERT_STATUS } from "./expertIntelligenceModel.js";
import { ExpertStore } from "./expertStore.js";


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
        const verificationStatus = expert.status || expert.verificationStatus || EXPERT_STATUS.UNVERIFIED_EXPERT;
        const isVerified = expert.isVerified === true || verificationStatus === EXPERT_STATUS.VERIFIED_EXPERT ||
                           verificationStatus === "VERIFIED";
        const isPartiallyVerified = verificationStatus === EXPERT_STATUS.PARTIALLY_VERIFIED;
        
        if (requiredVerification && verificationStatus !== requiredVerification) {
          return null;
        }

        const verificationScore = isVerified ? 1.0 : (isPartiallyVerified ? 0.7 : 0.4);

        // 3. Historical Accuracy (Separate from Domain Scope!)
        const historicalAccuracy = this.#clampMetric(
          expert.historicalAccuracy ?? expert.metrics?.historicalAccuracy ?? 0.55
        );

        // 4. Evidence Quality
        const evidenceQuality = this.#clampMetric(
          expert.metrics?.evidenceQuality ?? this.#deriveEvidenceQuality(expert)
        );

        // 5. Freshness
        const freshnessScore = this.#clampMetric(
          expert.metrics?.freshnessScore ?? this.#deriveFreshness(expert)
        );

        // 6. Conflict of Interest Factor (0.0 = high conflict penalty, 1.0 = clear)
        const conflicts = expert.conflicts || expert.conflictOfInterest || [];
        const hasConflict = Array.isArray(conflicts) && conflicts.some((conflict) => conflict?.isActive !== false);
        const conflictFactor = hasConflict ? 0.78 : 1.0;

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
          fullName: expert.name || expert.fullName || "Chuyên gia chưa định danh",
          title: expert.academicTitle || expert.title || "Giảng viên / Chuyên gia",
          department: expert.department || "Khoa CNTT",
          institution: expert.institution || "HCMUTE",
          verificationStatus,
          compositeScore: Number(compositeScore.toFixed(3)),
          signals: {
            domainMatchPercentage: Math.round(domainRelevance * 100),
            verificationLabel: isVerified ? "Đã kiểm định chính quy" : (isPartiallyVerified ? "Xác nhận một phần" : "Chưa đủ xác minh"),
            historicalAccuracyPercentage: Math.round(historicalAccuracy * 100),
            historyConfidenceLabel: expert.historicalAccuracy !== undefined || expert.metrics?.historicalAccuracy !== undefined
              ? "Có dữ liệu lịch sử"
              : "Chưa đủ lịch sử đánh giá",
            evidenceQualityPercentage: Math.round(evidenceQuality * 100),
            freshnessLabel: freshnessScore >= 0.8 ? "MỚI" : "BÌNH THƯỜNG",
            hasConflictOfInterest: hasConflict
          },
          matchedDomains: this.#matchedDomains(expert, normalizedTopic, topic),
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
    const expertDomains = Array.isArray(expert.domains)
      ? expert.domains
      : (expert.scopes || []).flatMap((scope) => [scope.domain, scope.subdomain]);
    const expertResearch = Array.isArray(expert.researchAreas) ? expert.researchAreas : [];
    const expertTeaching = Array.isArray(expert.teachingCourses) ? expert.teachingCourses : [];

    const allKeywords = [
      ...expertDomains,
      ...expertResearch,
      ...expertTeaching,
      expert.department || "",
      expert.bio || ""
    ].map(k => this.#normalize(k));

    const normalizedTarget = this.#normalize(targetTopic);

    // Direct match
    if (allKeywords.some(k => k && (k.includes(normalizedTarget) || normalizedTarget.includes(k)))) {
      return 0.95;
    }

    // Secondary match on broad domain
    if (targetDomain && allKeywords.some(k => k.includes(this.#normalize(targetDomain)))) {
      return 0.70;
    }

    // Token intersection
    const tokens = normalizedTarget.split(/\s+/);
    const tokenMatches = tokens.filter(t => t.length > 2 && allKeywords.some(k => k.includes(t)));
    if (tokenMatches.length > 0) {
      return 0.40 + (tokenMatches.length / tokens.length) * 0.40;
    }

    return 0.05;
  }

  static #normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  static #clampMetric(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : 0;
  }

  static #deriveEvidenceQuality(expert) {
    const scopes = Array.isArray(expert.scopes) ? expert.scopes : [];
    const credentials = Array.isArray(expert.credentials) ? expert.credentials : [];
    const publications = Array.isArray(expert.publications) ? expert.publications : [];
    const verifiedCredentials = credentials.filter((credential) => credential.status === "VERIFIED" || credential.isVerified).length;
    const groundedPublications = publications.filter((publication) => !publication.isRetracted && (publication.doi || publication.provenanceClusterId)).length;
    return Math.min(1, 0.25 + (scopes.length > 0 ? 0.25 : 0) + (verifiedCredentials > 0 ? 0.25 : 0) + (groundedPublications > 0 ? 0.25 : 0));
  }

  static #deriveFreshness(expert) {
    const years = [
      ...(expert.scopes || []).map((scope) => Number(scope.recencyYear)),
      ...(expert.publications || []).map((publication) => Number(publication.year))
    ].filter(Number.isFinite);
    if (years.length === 0) return 0;
    const age = Math.max(0, new Date().getFullYear() - Math.max(...years));
    return Math.max(0.15, Math.min(1, 1 - age * 0.15));
  }

  static #matchedDomains(expert, normalizedTopic, fallback) {
    const scopes = Array.isArray(expert.scopes) ? expert.scopes : [];
    const target = this.#normalize(normalizedTopic);
    const matched = scopes
      .filter((scope) => [scope.domain, scope.subdomain].some((value) => this.#normalize(value).includes(target) || target.includes(this.#normalize(value))))
      .map((scope) => scope.subdomain ? `${scope.domain} · ${scope.subdomain}` : scope.domain);
    return matched.length > 0 ? matched : [fallback];
  }
}
