/**
 * StudentHub AI — AuthorityLadderRanking
 *
 * Implements the Authority Ladder & Explainable Source Forensics (Sections 4, 25, 26, 27):
 * - Strict hierarchy: EXACT_OFFICIAL_DOCUMENT > OFFICIAL_INSTITUTION > GOVERNMENT_REGULATOR > AUTHORIZED_ORG > INDEPENDENT_SECONDARY > ENCYCLOPEDIA_CONTEXT > COMMUNITY
 * - Freshness decay: Outdated policies are penalized and flagged as STALE
 * - Jurisdiction & Scope verification
 * - Non-arbitrary, explainable quality calculation
 */

import { EntityResolutionService } from "./EntityResolutionService.js";

export const AUTHORITY_WEIGHTS = {
  EXACT_OFFICIAL_DOCUMENT: 1.0,
  OFFICIAL_INSTITUTION: 0.95,
  GOVERNMENT_REGULATOR: 0.95,
  AUTHORIZED_ORGANIZATION: 0.85,
  INDEPENDENT_SECONDARY: 0.70,
  ENCYCLOPEDIA_CONTEXT: 0.50,
  COMMUNITY: 0.30,
  UNKNOWN: 0.20
};

export class AuthorityLadderRanking {
  /**
   * Classifies a source's authority tier based on domain, resolved entity, and document characteristics.
   */
  static classifyAuthorityTier(source, resolvedEntities = []) {
    const domain = (source.domain || "").toLowerCase();
    const url = source.canonicalUrl || source.url || "";

    // Discovery seeds are deliberately not evidence authority. They may point
    // to an official-looking domain, but the seed itself has not established
    // document scope, provenance, or authorization for a Trust verdict.
    if (source.discoveryOnly === true || (source.officialDiscovery === true && source.isAuthoritative === false)) {
      return "UNKNOWN";
    }

    // 1. Government regulator (.gov.vn or official government portals)
    if (
      domain.endsWith(".gov.vn") ||
      domain === "chinhphu.vn" ||
      domain.endsWith(".chinhphu.vn") ||
      domain === "baochinhphu.vn" ||
      domain === "moet.gov.vn" ||
      domain === "bocongan.gov.vn" ||
      domain === "molisa.gov.vn"
    ) {
      return "GOVERNMENT_REGULATOR";
    }

    // 2. Exact match to resolved entity's official domain (.edu.vn)
    for (const ent of resolvedEntities) {
      if (EntityResolutionService.isOfficialDomainForEntity(url, ent.entityId)) {
        if (url.includes("/van-ban/") || url.includes("/quy-che/") || url.includes("/thong-bao/") || url.includes("/quyet-dinh/")) {
          return "EXACT_OFFICIAL_DOCUMENT";
        }
        return "OFFICIAL_INSTITUTION";
      }
    }

    // 3. Higher education domain (.edu.vn)
    if (domain.endsWith(".edu.vn")) {
      return "OFFICIAL_INSTITUTION";
    }

    // 4. Authorized security / verification portals
    if (domain === "tinnhiemmang.vn" || domain === "khonggianmang.vn" || domain === "chongluadao.vn") {
      return "AUTHORIZED_ORGANIZATION";
    }

    // 5. Major independent press
    if (domain === "vnexpress.net" || domain === "tuoitre.vn" || domain === "thanhnien.vn" || domain === "dantri.com.vn") {
      return "INDEPENDENT_SECONDARY";
    }

    // 6. Encyclopedic / context
    if (domain === "vi.wikipedia.org" || domain.includes("wikipedia.org")) {
      return "ENCYCLOPEDIA_CONTEXT";
    }

    // 7. Community
    if (source.retrievalMethod === "COMMUNITY_EVIDENCE" || domain.includes("facebook.com") || domain.includes("forum")) {
      return "COMMUNITY";
    }

    return "INDEPENDENT_SECONDARY";
  }

  /**
   * Evaluates freshness and temporal validity of the source.
   */
  static evaluateFreshness(source, targetYear = 2026) {
    if (!source.publishedAt) {
      return { freshnessScore: 0.7, isStale: false, explanation: "Thời điểm phát hành không có siêu dữ liệu rõ ràng" };
    }

    const pubYear = new Date(source.publishedAt).getFullYear();
    if (Number.isNaN(pubYear)) {
      return { freshnessScore: 0.7, isStale: false, explanation: "Không phân tích được định dạng ngày tháng" };
    }

    const yearDiff = targetYear - pubYear;
    if (yearDiff <= 0) {
      return { freshnessScore: 1.0, isStale: false, explanation: `Tài liệu cập nhật năm hiện tại (${pubYear})` };
    }
    if (yearDiff === 1) {
      return { freshnessScore: 0.9, isStale: false, explanation: `Tài liệu ban hành năm trước (${pubYear}), vẫn có giá trị tham chiếu` };
    }
    if (yearDiff >= 3) {
      return { freshnessScore: 0.4, isStale: true, explanation: `Tài liệu từ năm ${pubYear} (đã cũ so với năm học ${targetYear}), có nguy cơ đã bị thay thế` };
    }

    return { freshnessScore: 0.75, isStale: false, explanation: `Tài liệu ban hành năm ${pubYear}` };
  }

  /**
   * Strips Vietnamese diacritics for robust lexical matching against URLs and domains.
   */
  static stripDiacritics(str = "") {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  }

  /**
   * Computes query-candidate specificity to ensure sources directly addressing
   * the queried institution/topic are prioritized over generic pre-indexed documents.
   */
  static computeQuerySpecificity(source, query = "") {
    if (!query) return 0.20;
    const qRaw = String(query);
    const qClean = this.stripDiacritics(qRaw);
    const domain = (source.domain || "").toLowerCase();
    const domainClean = this.stripDiacritics(domain);
    const title = (source.title || "").toLowerCase();
    const titleClean = this.stripDiacritics(title);
    const url = (source.canonicalUrl || source.url || "").toLowerCase();

    // Significant tokens excluding common educational stopwords
    const stopWords = new Set([
      "truong", "dai", "hoc", "thong", "bao", "nam", "sinh", "vien", "huong",
      "dan", "quy", "dinh", "xet", "tuyen", "chinh", "sach", "cua", "cho", "cac",
      "va", "la", "co", "khong", "ve", "tai", "trong", "theo", "ky", "thi"
    ]);

    const tokens = qClean
      .split(/[\s,()_./-]+/)
      .filter((t) => t.length > 1 && !stopWords.has(t));

    let matchCount = 0;
    let hasDomainKeywordMatch = false;

    for (const t of tokens) {
      if (domainClean.includes(t)) {
        matchCount += 2;
        hasDomainKeywordMatch = true;
      } else if (titleClean.includes(t) || url.includes(t)) {
        matchCount += 1;
      }
    }

    // Acronym extraction from parentheses e.g. (TBU), (HCMUTE), (VINIF)
    const acronymMatches = qRaw.match(/\b[A-Z0-9_]{2,8}\b/g) || [];
    for (const acr of acronymMatches) {
      const acrLower = acr.toLowerCase();
      if (domain.includes(acrLower) || title.toLowerCase().includes(acrLower)) {
        matchCount += 3;
        hasDomainKeywordMatch = true;
      }
    }

    const baseScore = Math.min(0.40, matchCount * 0.10);
    return hasDomainKeywordMatch ? Math.max(0.25, baseScore) : baseScore;
  }

  /**
   * Computes an explainable composite authority & quality score with query specificity.
   */
  static scoreSource(source, resolvedEntities = [], targetYear = 2026, query = "") {
    const tier = this.classifyAuthorityTier(source, resolvedEntities);
    const baseWeight = AUTHORITY_WEIGHTS[tier] || 0.5;
    const freshness = this.evaluateFreshness(source, targetYear);
    const specificity = this.computeQuerySpecificity(source, query);

    // Entity relevance boost (ranking signal, NOT a hard gate)
    let entityBoost = 0.0;
    for (const ent of resolvedEntities) {
      if (EntityResolutionService.isOfficialDomainForEntity(source.canonicalUrl || source.url, ent.entityId)) {
        entityBoost = 0.15;
        break;
      }
    }

    // Discovery metadata may be promoted in ordering only when it matches a
    // resolver-confirmed entity. This keeps useful identity candidates visible
    // without changing UNKNOWN authority, primary-source status, or verdict
    // eligibility.
    const discoveryEntityBoost = tier === "UNKNOWN" && source.discoveryOnly === true && entityBoost > 0
      ? 0.10
      : 0.0;

    // Live search discovery boost: protects targeted live web results from being drowned out by off-target static KB docs
    const isLive = source.retrievalMethod === "LIVE_WEB" || source.isLiveDiscovery === true;
    const liveBoost = isLive ? 0.20 : 0.0;

    // HTTPS security signal
    const isHttps = (source.canonicalUrl || source.url || "").startsWith("https://") ? 0.05 : 0.0;

    // Composite balanced score: Authority (30%) + Query Specificity (30%) + Live Discovery (20%) + Freshness (10%) + Entity (10%)
    const rawScore =
      baseWeight * 0.30 +
      specificity * 0.75 +
      liveBoost +
      freshness.freshnessScore * 0.10 +
      entityBoost +
      discoveryEntityBoost +
      isHttps;

    const normalizedScore = Math.min(1.0, Math.max(0.1, Number(rawScore.toFixed(3))));

    return {
      tier,
      tierWeight: baseWeight,
      freshness,
      specificity,
      score: normalizedScore,
      isPrimary:
        tier === "EXACT_OFFICIAL_DOCUMENT" ||
        tier === "OFFICIAL_INSTITUTION" ||
        tier === "GOVERNMENT_REGULATOR",
      explanation: `Hạng mục: ${tier} (Trọng số ${baseWeight}) | Độ khớp chủ đề: ${Math.round(specificity * 100)}% | Độ mới: ${freshness.explanation} | Điểm tổng hợp: ${Math.round(normalizedScore * 100)}%`,
    };
  }

  /**
   * Reranks candidate sources using the authority ladder with query specificity.
   */
  static rankSources(sources, resolvedEntities = [], targetYear = 2026, query = "") {
    const scored = sources.map((source) => {
      const forensic = this.scoreSource(source, resolvedEntities, targetYear, query);
      return {
        ...source,
        authorityTier: forensic.tier,
        isPrimary: forensic.isPrimary,
        isStale: forensic.freshness.isStale,
        qualityScore: forensic.score,
        qualityExplanation: forensic.explanation,
      };
    });

    return scored.sort((a, b) => b.qualityScore - a.qualityScore);
  }
}
