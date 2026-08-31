/**
 * StudentHub AI — SocialDuplicationDetector V1
 * 
 * Detects cross-platform copies, reposts, syndicated announcements, and forwarded messages.
 * Core Principle: 10 copies of the same statement do NOT equal 10 independent sources.
 */

import { createSecureId } from "../../security/secureId.js";

export class SocialDuplicationDetector {
  static #clusterIndex = new Map(); // clusterId -> Array<ContentItem>

  /**
   * Tokenizes and normalizes text into a set of shingles
   * @param {string} text 
   * @returns {Set<string>}
   */
  static #getShingles(text = "") {
    const clean = text.toLowerCase().replace(/[^a-zA-Z0-9À-ỹ\s]/g, " ").trim();
    const words = clean.split(/\s+/).filter(w => w.length > 1);
    const shingles = new Set();
    for (let i = 0; i < words.length - 1; i++) {
      shingles.add(`${words[i]}_${words[i + 1]}`);
    }
    return shingles;
  }

  /**
   * Computes Jaccard Similarity coefficient between two shingle sets
   * @param {Set<string>} setA 
   * @param {Set<string>} setB 
   * @returns {number} Float in [0.0, 1.0]
   */
  static computeSimilarity(textA = "", textB = "") {
    if (textA === textB) return 1.0;
    const shinglesA = this.#getShingles(textA);
    const shinglesB = this.#getShingles(textB);

    if (shinglesA.size === 0 || shinglesB.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const item of shinglesA) {
      if (shinglesB.has(item)) intersectionCount += 1;
    }

    const unionCount = shinglesA.size + shinglesB.size - intersectionCount;
    return unionCount > 0 ? Number((intersectionCount / unionCount).toFixed(3)) : 0.0;
  }

  /**
   * Processes a ContentItem, checks if it is a duplicate of an existing item/cluster
   * @param {object} contentItem 
   * @param {number} [similarityThreshold=0.75]
   * @returns {{ isDuplicate: boolean, clusterId: string, clusterSize: number, effectiveIndependenceWeight: number }}
   */
  static processItem(contentItem, similarityThreshold = 0.75) {
    const text = contentItem.normalizedText || contentItem.rawText || "";

    for (const [clusterId, items] of this.#clusterIndex.entries()) {
      const representativeText = items[0].normalizedText || items[0].rawText || "";
      const similarity = this.computeSimilarity(text, representativeText);

      if (similarity >= similarityThreshold) {
        items.push(contentItem);
        const clusterSize = items.length;
        // Dampen independence weight: 1.0 / sqrt(clusterSize)
        const effectiveIndependenceWeight = Number((1.0 / Math.sqrt(clusterSize)).toFixed(3));

        return {
          isDuplicate: true,
          clusterId,
          clusterSize,
          effectiveIndependenceWeight,
          similarity
        };
      }
    }

    // New unique cluster
    const newClusterId = createSecureId("cluster");
    this.#clusterIndex.set(newClusterId, [contentItem]);

    return {
      isDuplicate: false,
      clusterId: newClusterId,
      clusterSize: 1,
      effectiveIndependenceWeight: 1.0,
      similarity: 1.0
    };
  }

  /**
   * Clears cluster index (for unit testing)
   */
  static clear() {
    this.#clusterIndex.clear();
  }
}
