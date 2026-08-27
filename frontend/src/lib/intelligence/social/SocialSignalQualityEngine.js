/**
 * StudentHub AI — SocialSignalQualityEngine V1
 * 
 * Computes multi-dimensional signal quality scores for incoming social and community items.
 * Evaluates specificity, evidence attachments, author reliability, and independence.
 * Invariant: Likes / engagement numbers are weak engagement signals, NEVER primary quality metrics.
 */

export class SocialSignalQualityEngine {
  /**
   * Computes quality breakdown for a ContentItem and its extracted ClaimCandidate
   * @param {object} contentItem 
   * @param {object} claimCandidate 
   * @param {object} [context]
   * @returns {object} QualityAssessment
   */
  static evaluateQuality(contentItem, claimCandidate, context = {}) {
    const text = (contentItem.rawText || "").trim();

    // 1. Specificity (presence of concrete entities, dates, times, course codes)
    let specificityScore = 0.3;
    if (contentItem.linkedEntities && contentItem.linkedEntities.length > 0) {
      specificityScore += 0.3;
    }
    const hasDateTime = /\d{1,2}[:h]\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|hôm nay|ngày \d+/i.test(text);
    if (hasDateTime) specificityScore += 0.2;
    if (text.length > 60 && text.length < 500) specificityScore += 0.2;
    specificityScore = Math.min(1.0, specificityScore);

    // 2. Evidence Attachment (screenshot, URL, document link)
    let evidenceAttachmentScore = 0.2;
    if (contentItem.mediaUrls && contentItem.mediaUrls.length > 0) {
      evidenceAttachmentScore += 0.4;
    }
    if (contentItem.url || /https?:\/\/[^\s]+/i.test(text)) {
      evidenceAttachmentScore += 0.4;
    }
    evidenceAttachmentScore = Math.min(1.0, evidenceAttachmentScore);

    // 3. Independence Score (deduplication check)
    const independenceScore = context.isDuplicate ? 0.2 : (context.isClusterCopy ? 0.4 : 0.95);

    // 4. Source Context Authority
    let sourceAuthorityScore = 0.4;
    if (contentItem.sourceClassification === "OFFICIAL") sourceAuthorityScore = 0.98;
    else if (contentItem.sourceClassification === "EXPERT") sourceAuthorityScore = 0.85;
    else if (contentItem.sourceClassification === "COMMUNITY") sourceAuthorityScore = 0.60;

    // 5. Freshness / Recency
    const publishedTime = new Date(contentItem.publishedAt || Date.now()).getTime();
    const ageHours = (Date.now() - publishedTime) / (1000 * 60 * 60);
    let freshnessScore = 1.0;
    if (ageHours > 72) freshnessScore = 0.6;
    if (ageHours > 168) freshnessScore = 0.4; // 1 week
    if (ageHours > 720) freshnessScore = 0.2; // 1 month

    // Weighted composite quality score
    const compositeScore = Number((
      specificityScore * 0.25 +
      evidenceAttachmentScore * 0.25 +
      sourceAuthorityScore * 0.25 +
      independenceScore * 0.15 +
      freshnessScore * 0.10
    ).toFixed(3));

    return Object.freeze({
      contentId: contentItem.contentId,
      compositeScore,
      breakdown: {
        specificity: Number(specificityScore.toFixed(2)),
        evidenceAttachment: Number(evidenceAttachmentScore.toFixed(2)),
        sourceAuthority: Number(sourceAuthorityScore.toFixed(2)),
        independence: Number(independenceScore.toFixed(2)),
        freshness: Number(freshnessScore.toFixed(2))
      },
      qualityTier: compositeScore >= 0.75 ? "HIGH" : (compositeScore >= 0.45 ? "MODERATE" : "LOW"),
      evaluatedAt: new Date().toISOString()
    });
  }
}
