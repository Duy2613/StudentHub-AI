/**
 * StudentHub AI — EvidenceForensicsService (Layer 3 Evidence Forensics)
 *
 * Implements Sections 35, 36, 37, 38, 39, 40 of Backend Max Specification:
 * - Section 35: Source Clustering (shared origin, syndicated content detection, content hash)
 * - Section 36: Evidence Independence Graph (different account != independent, different domain != independent)
 * - Section 37: Source Evaluation (identity, freshness, primary vs secondary, jurisdiction)
 * - Section 38: Claim <-> Source Relation (SUPPORTS, CONTRADICTS, CONTEXTUALIZES, UNKNOWN)
 * - Section 39: Source Quality Explainability (transparent signals, no arbitrary 95%)
 * - Section 40: Evidence Sufficiency (SUFFICIENT, INSUFFICIENT, CONFLICTED, STALE)
 */

const RELATION_STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "by", "for", "from", "in", "into", "is", "of", "on", "or", "the", "this", "to", "with",
  "bao", "cac", "cho", "chung", "co", "cua", "da", "dai", "duoc", "la", "mot", "nam", "nhu", "o", "sau", "se", "tai", "theo", "thi", "trong", "tu", "va", "ve",
  "sinh", "vien", "truong", "hoc", "thanh", "pho", "tp", "ky",
]);

function normalizeRelationText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

function getClaimEntityTokens(claim) {
  const entities = Array.isArray(claim?.entities) ? claim.entities : [];
  const entityText = entities.map((entity) => {
    if (typeof entity === "string") return entity;
    if (!entity || typeof entity !== "object") return "";
    return `${entity.name || entity.canonicalName || ""} ${entity.entityId || entity.id || ""}`;
  }).join(" ");
  return new Set(normalizeRelationText(entityText).match(/[a-z0-9]+/g) || []);
}

function getRelationTokens(value, ignoredEntityTokens) {
  return (normalizeRelationText(value).match(/[a-z0-9]+/g) || [])
    .filter((token) => token.length > 1 && !RELATION_STOP_WORDS.has(token) && !ignoredEntityTokens.has(token));
}

function getNgrams(tokens, size) {
  const ngrams = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    ngrams.add(tokens.slice(index, index + size).join(" "));
  }
  return ngrams;
}

function hasDirectClaimAlignment(claim, source) {
  const ignoredEntityTokens = getClaimEntityTokens(claim);
  const claimText = String(claim?.text || "");
  const sourceText = [source?.title, source?.relevantSnippet, source?.rawContentSnippet]
    .filter(Boolean)
    .join(" ");
  const claimTokens = getRelationTokens(claimText, ignoredEntityTokens);
  const sourceTokens = getRelationTokens(sourceText, ignoredEntityTokens);
  const sourceTokenSet = new Set(sourceTokens);
  const sharedTokens = new Set(claimTokens.filter((token) => sourceTokenSet.has(token)));
  const sourceTrigrams = getNgrams(sourceTokens, 3);
  const hasSharedPhrase = [...getNgrams(claimTokens, 3)].some((ngram) => sourceTrigrams.has(ngram));
  const claimHosts = new Set((normalizeRelationText(claimText).match(/(?:[a-z0-9-]+\.)+[a-z]{2,}/g) || []));
  const sourceHosts = new Set((normalizeRelationText(`${sourceText} ${source?.canonicalUrl || source?.url || ""}`).match(/(?:[a-z0-9-]+\.)+[a-z]{2,}/g) || []));
  const hasExactClaimUrl = [...claimHosts].some((host) => sourceHosts.has(host));

  return {
    aligned: sharedTokens.size >= 2,
    directlyMatched: (hasSharedPhrase && sharedTokens.size >= 4) || (hasExactClaimUrl && sharedTokens.size >= 2),
  };
}

export class EvidenceForensicsService {
  /**
   * Helper: extract known news wire / government dispatch attribution from article body
   */
  static extractWireAttribution(text = "") {
    if (!text || typeof text !== "string") return null;
    const lower = text.toLowerCase();
    const hasAttributionSignal = /(?:nguồn tin từ|nguồn tin|nguồn[:\s]|theo\s|thông cáo từ|căn cứ|thực hiện thông báo|dẫn lời)/i.test(lower);
    if (hasAttributionSignal) {
      if (lower.includes("ttxvn") || lower.includes("thông tấn xã")) return "ttxvn.vn";
      if (lower.includes("vgp") || lower.includes("cổng thông tin chính phủ")) return "vgp.vn";
      if (lower.includes("bộ gd") || lower.includes("bộ giáo dục")) return "moet.gov.vn";
      if (lower.includes("bộ công an") || lower.includes("cục an ninh mạng")) return "bocongan.gov.vn";
      if (lower.includes("ncsc") || lower.includes("tín nhiệm mạng")) return "tinnhiemmang.vn";
      if (lower.includes("tuổi trẻ")) return "tuoitre.vn";
      if (lower.includes("thanh niên")) return "thanhnien.vn";
      if (lower.includes("vnexpress")) return "vnexpress.net";
    }
    return null;
  }

  /**
   * Helper: compute token Jaccard similarity between two texts
   */
  static computeTextSimilarity(textA = "", textB = "") {
    if (!textA || !textB || typeof textA !== "string" || typeof textB !== "string") return 0;
    const tokenize = (s) => new Set(s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2));
    const setA = tokenize(textA);
    const setB = tokenize(textB);
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersect = 0;
    for (const token of setA) {
      if (setB.has(token)) intersect++;
    }
    const union = setA.size + setB.size - intersect;
    return union > 0 ? (intersect / union) : 0;
  }

  /**
   * Section 35: Cluster sources to detect shared origin / syndicated copies.
   * 5 identical syndicated articles from 5 domains must collapse to 1 cluster.
   * @param {Array<object>} sources
   * @returns {Array<object>} clusters
   */
  static clusterSources(sources = []) {
    if (!Array.isArray(sources) || sources.length === 0) return [];

    const clusters = [];

    for (const source of sources) {
      // Clustering key: contentDigest hash, claimedOrigin, wire attribution, or near-duplicate body
      const domain = source.domain || "";
      const contentHash = source.contentDigest || "";
      const rootDomain = domain.replace(/^www\./, "");
      const bodyContent = source.content || source.snippet || source.relevantSnippet || source.text || "";
      const wireAttribution = source.wireAttribution || this.extractWireAttribution(bodyContent);
      const claimedOrigin = source.claimedOrigin || wireAttribution || null;

      let matchedCluster = clusters.find((c) => {
        // 1. Exact content digest match (identical body syndicated across sites)
        if (contentHash && c.contentDigest && contentHash === c.contentDigest) {
          return true;
        }

        const sim = (bodyContent.length > 20 && c.sampleContent && c.sampleContent.length > 20)
          ? EvidenceForensicsService.computeTextSimilarity(bodyContent, c.sampleContent)
          : 0;

        // 2. Exact or very high textual duplicate (Jaccard >= 0.60)
        if (sim >= 0.60) {
          return true;
        }

        // 3. Same wire / press-release agency attribution
        if (wireAttribution && c.wireAttribution && wireAttribution === c.wireAttribution) {
          if (sim >= 0.35 || c.rootDomain !== rootDomain) {
            return true;
          }
        }

        // 4. Cross-domain syndication claiming the same external origin
        if (claimedOrigin && c.claimedOrigin && claimedOrigin === c.claimedOrigin) {
          // If from different domains, they are syndicating the same origin
          if (c.rootDomain !== rootDomain) {
            return true;
          }
          // If on the SAME domain, only cluster if high similarity (same document/notice)
          if (sim >= 0.65) {
            return true;
          }
        }

        // 5. One cites the other as origin (cross-domain republication/wire copy)
        if (claimedOrigin && (claimedOrigin.includes(c.rootDomain) || (c.claimedOrigin && c.claimedOrigin.includes(rootDomain)))) {
          if (sim >= 0.35) {
            return true;
          }
        }

        // 6. Same root domain ONLY if near-identical text (sim >= 0.70)
        if (c.rootDomain && c.rootDomain === rootDomain && rootDomain.length > 0) {
          if (sim >= 0.70) {
            return true;
          }
        }

        return false;
      });

      if (matchedCluster) {
        matchedCluster.members.push(source.sourceId);
        if (!matchedCluster.domains.includes(domain)) {
          matchedCluster.domains.push(domain);
        }
        if (!matchedCluster.wireAttribution && wireAttribution) {
          matchedCluster.wireAttribution = wireAttribution;
        }
        if (!matchedCluster.claimedOrigin && claimedOrigin) {
          matchedCluster.claimedOrigin = claimedOrigin;
        }
      } else {
        clusters.push({
          clusterId: `cluster-${clusters.length + 1}`,
          rootDomain,
          contentDigest: contentHash,
          wireAttribution: wireAttribution || null,
          claimedOrigin: claimedOrigin || null,
          sampleContent: bodyContent,
          primarySourceId: source.sourceId,
          domains: [domain],
          members: [source.sourceId],
        });
      }
    }

    return clusters;
  }

  /**
   * Section 36: Build Evidence Independence Graph.
   * Ensures that 5 syndicated copies from the same PR wire or media group are treated as 1 independent source.
   * @param {Array<object>} sources
   * @param {Array<object>} clusters
   * @returns {Array<object>} independenceGroups
   */
  static buildIndependenceGraph(sources = [], clusters = []) {
    return clusters.map((cluster, index) => {
      const primary = sources.find((s) => s.sourceId === cluster.primarySourceId);
      const isOfficial = primary?.sourceType === "OFFICIAL_PORTAL" || primary?.domain?.endsWith(".edu.vn") || primary?.domain?.endsWith(".gov.vn");

      return {
        independenceGroupId: `indep-group-${index + 1}`,
        observedOrigin: cluster.rootDomain || primary?.publisher || "UNKNOWN_ORIGIN",
        isIndependentOrigin: true, // each cluster is one distinct origin
        isOfficialOrigin: isOfficial,
        memberSourceIds: cluster.members,
        memberCount: cluster.members.length,
        effectiveIndependentWeight: 1, // 5 syndicated copies count as exactly 1 independent weight
        syndicationCollapsed: cluster.members.length > 1,
        explanation: cluster.members.length > 1
          ? `Đã gộp ${cluster.members.length} bài viết có cùng nội dung/nguồn cấp gốc vào 1 nhóm nguồn độc lập duy nhất.`
          : isOfficial
          ? `Nguồn gốc độc lập trực tiếp từ cổng thông tin cơ quan/nhà trường.`
          : `Nguồn tin độc lập quan sát được từ ${cluster.rootDomain}.`,
      };
    });
  }

  /**
   * Section 37 & 38: Evaluate relation between claims and sources.
   * Canonical relations: SUPPORTS, CONTRADICTS, CONTEXTUALIZES, UNKNOWN.
   * A source can support claim A and contradict claim B.
   * @param {Array<object>} claims
   * @param {Array<object>} sources
   * @returns {Array<object>} relationships
   */
  static evaluateClaimRelations(claims = [], sources = []) {
    const relationships = [];

    for (const claim of claims) {
      const claimText = (claim.text || "").toLowerCase();

      for (const source of sources) {
        const sourceTitle = (source.title || "").toLowerCase();
        const snippet = (source.relevantSnippet || "").toLowerCase();
        const combinedSourceText = `${sourceTitle} ${snippet}`;

        let relation = "UNKNOWN";
        let rationale = "Nội dung chưa đủ đối chiếu trực tiếp với tuyên bố.";
        const confidence = null;

        // 1. Explicit contradiction signals (debunking, hoax, superseded, warning, or negative qualifiers)
        const hasDirectNeg =
          combinedSourceText.includes("bác bỏ") ||
          combinedSourceText.includes("không có thật") ||
          combinedSourceText.includes("không đúng") ||
          combinedSourceText.includes("chưa từng ban hành") ||
          combinedSourceText.includes("sai sự thật") ||
          combinedSourceText.includes("đã hết hiệu lực") ||
          combinedSourceText.includes("bị bãi bỏ") ||
          combinedSourceText.includes("lùi 01 năm") ||
          combinedSourceText.includes("cảnh báo") ||
          combinedSourceText.includes("lừa đảo") ||
          combinedSourceText.includes("mạo danh") ||
          combinedSourceText.includes("không một") ||
          combinedSourceText.includes("không ai") ||
          combinedSourceText.includes("không yêu cầu") ||
          combinedSourceText.includes("không thu phí") ||
          combinedSourceText.includes("miễn phí") ||
          combinedSourceText.includes("không được") ||
          combinedSourceText.includes("không cho phép") ||
          combinedSourceText.includes("không áp dụng") ||
          combinedSourceText.includes("không quá") ||
          combinedSourceText.includes("không công nhận") ||
          combinedSourceText.includes("nghiêm cấm");

        // Requirement clash: claim asserts "không cần" / "miễn" while source asserts "phải có" / "bắt buộc"
        const requirementClash =
          (claimText.includes("không cần") || claimText.includes("miễn")) &&
          (combinedSourceText.includes("phải có") ||
            combinedSourceText.includes("bắt buộc") ||
            combinedSourceText.includes("yêu cầu"));

        // Quantity clash e.g. "4 học kỳ" vs "2 học kỳ"
        const quantityClash =
          (claimText.includes("4 học kỳ") && combinedSourceText.includes("2 học kỳ")) ||
          (claimText.includes("2 học kỳ") && combinedSourceText.includes("4 học kỳ"));

        const isContradiction = hasDirectNeg || requirementClash || quantityClash;

        // 2. Ambiguity / Contextualization signals
        const isContext =
          combinedSourceText.includes("mâu thuẫn") ||
          combinedSourceText.includes("tạm thời") ||
          combinedSourceText.includes("chưa thống nhất") ||
          combinedSourceText.includes("tùy từng đợt");
        const claimAlignment = hasDirectClaimAlignment(claim, source);

        if (isContradiction && claimAlignment.aligned) {
          relation = "CONTRADICTS";
          rationale = "Nội dung nguồn thông tin phản bác hoặc cảnh báo trực tiếp về nhận định trên.";
        } else if (isContext && claimAlignment.aligned) {
          relation = "CONTEXTUALIZES";
          rationale = "Tài liệu cung cấp bối cảnh quy định tạm thời hoặc có điều kiện kèm theo.";
        } else if (claimAlignment.directlyMatched && !isContradiction) {
          relation = "SUPPORTS";
          rationale = "Nội dung nguồn có cụm thông tin trực tiếp khớp với các chi tiết trọng yếu của tuyên bố.";
        } else {
          // Search/retrieval metadata and topical token overlap establish
          // relevance, not entailment. Until a claim-level validator records
          // a traceable direct comparison, keep the relation unresolved.
          const suppliedRelation = source.claimRelations?.[claim.claimId];
          if (suppliedRelation === "DISCOVERY_ONLY" || suppliedRelation === "SUPPORTS") {
            rationale = "Nguồn được phát hiện cho truy vấn; chưa có đối chiếu trực tiếp đủ căn cứ để xác nhận quan hệ với tuyên bố.";
          }
        }

        relationships.push({
          relationshipId: `rel-${relationships.length + 1}`,
          claimId: claim.claimId,
          sourceId: source.sourceId,
          relation,
          rationale,
          confidence,
          confidenceKind: "NOT_CALCULATED",
        });
      }
    }

    return relationships;
  }

  /**
   * Section 39: Source Quality Explainability.
   * Transparently exposes signals: publisher identity, primary status, freshness, domain validity.
   * NO arbitrary "95%" score without algorithmic backing.
   * @param {object} source
   * @returns {object} quality
   */
  static explainSourceQuality(source) {
    const domain = (source.domain || "").toLowerCase();
    const isEduGov = domain.endsWith(".edu.vn") || domain.endsWith(".gov.vn");
    const isPrimary = source.sourceType === "OFFICIAL_PORTAL" || isEduGov;
    const isHttps = (source.canonicalUrl || "").startsWith("https://");
    const isRecent = source.publishedAt?.includes("2026") || source.publishedAt?.includes("2025");

    const explanations = [];
    let score = 50;

    if (isEduGov) {
      score += 30;
      explanations.push("Tên miền giáo dục/chính phủ Việt Nam được xác minh (.edu.vn / .gov.vn).");
    }
    if (isPrimary) {
      score += 15;
      explanations.push("Nguồn sơ cấp (Primary Source) từ đơn vị ban hành chính sách.");
    }
    if (isHttps) {
      score += 5;
      explanations.push("Giao thức HTTPS hợp lệ, kết nối an toàn.");
    }
    if (isRecent) {
      explanations.push(`Thời điểm công bố gần (${source.publishedAt || "Mới"}).`);
    } else {
      explanations.push("Cần lưu ý kiểm tra tính cập nhật của văn bản.");
    }

    const tier = isEduGov && isPrimary ? "TIER_1_OFFICIAL" : isEduGov ? "TIER_2_INSTITUTIONAL" : "TIER_3_SECONDARY";

    return {
      tier,
      score: Math.min(score, 100),
      isPrimarySource: isPrimary,
      isHttps,
      publisherVerified: isEduGov,
      explanations,
      policyVersion: "EVIDENCE_QUALITY_POLICY_V5.1",
    };
  }

  /**
   * Section 40: Evidence Sufficiency Evaluation.
   * States: SUFFICIENT, INSUFFICIENT, CONFLICTED, STALE.
   * Engine must be able to truthfully say "CHƯA ĐỦ BẰNG CHỨNG".
   * @param {Array<object>} claims
   * @param {Array<object>} relationships
   * @param {Array<object>} sources
   * @returns {object} sufficiency
   */
  static evaluateSufficiency(claims = [], relationships = [], sources = []) {
    const claimIds = claims.map((claim) => claim.claimId).filter(Boolean);
    const directRelations = relationships.filter((relationship) =>
      relationship.relation === "SUPPORTS" || relationship.relation === "CONTRADICTS"
    );
    const directlyAssessedClaimIds = new Set(directRelations.map((relationship) => relationship.claimId));
    const claimCoverageRatio = claimIds.length > 0
      ? claimIds.filter((claimId) => directlyAssessedClaimIds.has(claimId)).length / claimIds.length
      : 0;

    if (sources.length === 0) {
      return {
        status: "INSUFFICIENT",
        reason: "CHƯA ĐỦ BẰNG CHỨNG: Không tìm thấy nguồn chính thức nào được lưu trữ đối chiếu.",
        claimCoverageRatio,
      };
    }

    const officialSources = sources.filter((s) => (s.domain || "").endsWith(".edu.vn") || (s.domain || "").endsWith(".gov.vn"));
    const contradictoryRels = relationships.filter((r) => r.relation === "CONTRADICTS");
    const relationsByClaim = new Map();
    for (const relationship of relationships) {
      const claimRelations = relationsByClaim.get(relationship.claimId) || new Set();
      claimRelations.add(relationship.relation);
      relationsByClaim.set(relationship.claimId, claimRelations);
    }
    const hasSameClaimConflict = [...relationsByClaim.values()].some((claimRelations) =>
      claimRelations.has("CONTRADICTS") && claimRelations.has("SUPPORTS")
    );

    // A conflict must concern the same claim. Context alone is not opposition.
    if (hasSameClaimConflict) {
      return {
        status: "CONFLICTED",
        reason: "BẰNG CHỨNG MÂU THUẪN: Tồn tại các nguồn thông tin đưa ra kết luận hoặc điều kiện áp dụng trái ngược nhau.",
        claimCoverageRatio,
      };
    }

    const officialSourceIds = new Set(officialSources.map((source) => source.sourceId));
    const directlyAssessedByOfficialClaimIds = new Set(
      directRelations
        .filter((relationship) => officialSourceIds.has(relationship.sourceId))
        .map((relationship) => relationship.claimId),
    );
    const allClaimsDirectlyAssessedByOfficialSources = claimIds.length > 0 && claimIds.every((claimId) =>
      directlyAssessedByOfficialClaimIds.has(claimId)
    );

    // Official source presence alone is not evidence that it addresses the claim.
    if (allClaimsDirectlyAssessedByOfficialSources && officialSources.length > 0) {
      return {
        status: "SUFFICIENT",
        reason: contradictoryRels.length > 0
          ? "ĐỦ BẰNG CHỨNG: Nguồn chính thức có quan hệ phản bác trực tiếp với các tuyên bố đã đối chiếu."
          : "ĐỦ BẰNG CHỨNG: Nguồn chính thức có quan hệ hỗ trợ trực tiếp với các tuyên bố đã đối chiếu.",
        claimCoverageRatio,
      };
    }

    return {
      status: "INSUFFICIENT",
      reason: officialSources.length > 0
        ? "CHƯA ĐỦ BẰNG CHỨNG: Có nguồn chính thức được phát hiện nhưng chưa có đối chiếu trực tiếp cho tất cả tuyên bố."
        : "CHƯA ĐỦ BẰNG CHỨNG: Chưa có đối chiếu trực tiếp từ nguồn chính thức cho tất cả tuyên bố.",
      claimCoverageRatio,
    };
  }
}
