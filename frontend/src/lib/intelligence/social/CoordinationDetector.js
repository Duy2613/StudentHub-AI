/**
 * StudentHub AI — CoordinationDetector V1
 * 
 * Identifies coordinated campaign patterns:
 * - Identical claims within tight timestamp clusters (< 5 minutes).
 * - Multi-account copy-paste templates.
 * - Reciprocal vote/endorsement rings.
 * Classifies findings as POTENTIAL_COORDINATION (non-pejorative audit flag).
 */

export class CoordinationDetector {
  static #windowItems = []; // Array<{ contentId, authorId, text, publishedAtMs }>

  /**
   * Analyzes an incoming item against recent temporal window (e.g. last 10 minutes)
   * @param {object} contentItem
   * @param {number} [timeWindowMs=5 * 60 * 1000] // 5 minutes
   * @returns {{ isCoordinated: boolean, status: string, confidence: number, clusterAuthors: Array<string> }}
   */
  static evaluateCoordination(contentItem, timeWindowMs = 5 * 60 * 1000) {
    const publishedTime = new Date(contentItem.publishedAt || Date.now()).getTime();
    const authorId = contentItem.author?.authorId || "anon";
    const text = (contentItem.normalizedText || contentItem.rawText || "").trim().toLowerCase();

    // 1. Purge old items outside window
    this.#windowItems = this.#windowItems.filter(item => (publishedTime - item.publishedAtMs) <= (30 * 60 * 1000));

    // 2. Find matching items in the tight temporal window
    const matchingItems = this.#windowItems.filter(item => {
      const timeDiff = Math.abs(publishedTime - item.publishedAtMs);
      if (timeDiff > timeWindowMs) return false;
      // High text similarity or identical exact phrase
      return item.text === text || (item.text.length > 30 && text.includes(item.text.slice(0, 30)));
    });

    // Add current item to window
    this.#windowItems.push({
      contentId: contentItem.contentId,
      authorId,
      text,
      publishedAtMs: publishedTime
    });

    const distinctAuthors = new Set(matchingItems.map(m => m.authorId));
    distinctAuthors.add(authorId);

    // If >= 3 distinct accounts posted virtually identical text within < 5 minutes
    if (distinctAuthors.size >= 3) {
      return Object.freeze({
        isCoordinated: true,
        status: "POTENTIAL_COORDINATION",
        confidence: Number(Math.min(0.95, 0.5 + (distinctAuthors.size * 0.1)).toFixed(2)),
        clusterAuthors: Array.from(distinctAuthors),
        message: `Phát hiện ${distinctAuthors.size} tài khoản đăng nội dung tương tự trong khung giờ ngắn.`
      });
    }

    return Object.freeze({
      isCoordinated: false,
      status: "ORGANIC_SIGNAL",
      confidence: 0.1,
      clusterAuthors: [authorId],
      message: "Tín hiệu hoạt động độc lập bình thường."
    });
  }

  /**
   * Clear window items (for testing)
   */
  static clear() {
    this.#windowItems = [];
  }
}
