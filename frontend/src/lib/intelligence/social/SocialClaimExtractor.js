/**
 * StudentHub AI — SocialClaimExtractor V1
 * 
 * Extracts structured claim candidates from normalized social items.
 * Classifies items into 11 signal categories and assigns initial evidentiary weights.
 * Invariant: Extracted claims are CANDIDATES and NEVER automatically trusted as truth.
 */

export const SOCIAL_SIGNAL_TYPE = Object.freeze({
  QUESTION: "QUESTION",
  EXPERIENCE: "EXPERIENCE",
  OPINION: "OPINION",
  OBSERVATION: "OBSERVATION",
  CLAIM: "CLAIM",
  RECOMMENDATION: "RECOMMENDATION",
  WARNING: "WARNING",
  CORRECTION: "CORRECTION",
  RUMOR: "RUMOR",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  OFFICIAL_STATEMENT: "OFFICIAL_STATEMENT"
});

export const SIGNAL_EVIDENTIAL_WEIGHT = Object.freeze({
  OFFICIAL_STATEMENT: 0.95,
  ANNOUNCEMENT: 0.90,
  CORRECTION: 0.70,
  OBSERVATION: 0.65,
  WARNING: 0.60,
  EXPERIENCE: 0.50,
  CLAIM: 0.40,
  RECOMMENDATION: 0.35,
  OPINION: 0.20,
  QUESTION: 0.15,
  RUMOR: 0.10
});

export class SocialClaimExtractor {
  /**
   * Classifies a normalized ContentItem into one of 11 signal types
   * @param {object} contentItem 
   * @returns {string} SOCIAL_SIGNAL_TYPE
   */
  static classifySignalType(contentItem) {
    const text = (contentItem.rawText || contentItem.normalizedText || "").toLowerCase();

    // 1. Official classification
    if (contentItem.sourceClassification === "OFFICIAL") {
      if (text.includes("quyết định") || text.includes("thông báo") || text.includes("nghị định")) {
        return SOCIAL_SIGNAL_TYPE.OFFICIAL_STATEMENT;
      }
      return SOCIAL_SIGNAL_TYPE.ANNOUNCEMENT;
    }

    // 2. Question patterns
    if (text.includes("?") || text.startsWith("ai biết") || text.startsWith("cho em hỏi") || text.includes("mọi người ơi cho hỏi")) {
      return SOCIAL_SIGNAL_TYPE.QUESTION;
    }

    // 3. Correction patterns
    if (text.includes("đính chính") || text.includes("thông tin sai") || text.includes("không phải vậy") || text.includes("sửa lại là")) {
      return SOCIAL_SIGNAL_TYPE.CORRECTION;
    }

    // 4. Warning / Incident patterns
    if (text.includes("cảnh báo") || text.includes("sập web") || text.includes("lỗi server") || text.includes("lỗi") || text.includes("504") || text.includes("500") || text.includes("502") || text.includes("nghẽn mạng") || text.includes("timeout")) {
      return SOCIAL_SIGNAL_TYPE.WARNING;
    }

    // 5. Rumor patterns
    if (text.includes("nghe nói") || text.includes("thấy đồn") || text.includes("có tin đồn") || text.includes("hình như")) {
      return SOCIAL_SIGNAL_TYPE.RUMOR;
    }

    // 6. Recommendation patterns
    if (text.includes("khuyên nên") || text.includes("nên chọn") || text.includes("gợi ý") || text.includes("tip học")) {
      return SOCIAL_SIGNAL_TYPE.RECOMMENDATION;
    }

    // 7. Experience patterns
    if (text.includes("mình từng học") || text.includes("kỳ trước mình") || text.includes("trải nghiệm") || text.includes("review môn")) {
      return SOCIAL_SIGNAL_TYPE.EXPERIENCE;
    }

    // 8. Observation
    if (text.includes("hôm nay thấy") || text.includes("vừa ghi nhận") || text.includes("phòng đào tạo vừa")) {
      return SOCIAL_SIGNAL_TYPE.OBSERVATION;
    }

    // 9. Opinion
    if (text.includes("mình nghĩ") || text.includes("theo quan điểm") || text.includes("thấy môn này khó")) {
      return SOCIAL_SIGNAL_TYPE.OPINION;
    }

    return SOCIAL_SIGNAL_TYPE.CLAIM;
  }

  /**
   * Extracts structured claim candidates from a ContentItem
   * @param {object} contentItem 
   * @returns {object} ClaimCandidate
   */
  static extractClaimCandidate(contentItem) {
    if (!contentItem || !contentItem.contentId) {
      throw new Error("[EXTRACTOR_ERROR] Valid contentItem is required.");
    }

    const signalType = this.classifySignalType(contentItem);
    const baseWeight = SIGNAL_EVIDENTIAL_WEIGHT[signalType] || 0.30;

    // Detect target entities from ContentItem
    const primaryEntity = contentItem.linkedEntities?.[0] || null;

    return Object.freeze({
      claimCandidateId: `cand_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      contentId: contentItem.contentId,
      sourceId: contentItem.sourceId,
      authorId: contentItem.author?.authorId,
      signalType,
      evidentialWeight: baseWeight,
      targetEntity: primaryEntity,
      extractedProposition: contentItem.normalizedText.slice(0, 200),
      verbatimProvenanceText: contentItem.rawText,
      language: contentItem.language,
      status: "CANDIDATE_UNVERIFIED",
      extractedAt: new Date().toISOString()
    });
  }
}
