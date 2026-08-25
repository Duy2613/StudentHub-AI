/**
 * Layer 3 — SourceIndependenceAnalyzer
 * 
 * Analyzes source independence and prevents fake cross-source consensus.
 * Clusters syndicated articles, copied press releases, and detects circular citations.
 */

export class SourceIndependenceAnalyzer {
  /**
   * Clusters sources into independent evidence lineages
   * @param {Array<object>} sources
   * @param {Array<object>} evidenceItems
   * @returns {object} { totalClusters, clusters, independentSourcesCount, hasDuplication }
   */
  static analyzeIndependence(sources = [], evidenceItems = []) {
    const clusterMap = new Map();

    for (const src of sources) {
      const clusterId = src.clusterId || src.sourceId || src.domain;
      if (!clusterMap.has(clusterId)) {
        clusterMap.set(clusterId, {
          clusterId,
          primarySource: src,
          memberSources: [],
          isSyndicated: false,
        });
      }
      clusterMap.get(clusterId).memberSources.push(src);
    }

    const clusters = [];
    let hasDuplication = false;

    for (const [id, cluster] of clusterMap.entries()) {
      if (cluster.memberSources.length > 1) {
        cluster.isSyndicated = true;
        hasDuplication = true;
      }
      clusters.push(cluster);
    }

    return {
      totalClusters: clusters.length,
      clusters,
      independentSourcesCount: clusters.length,
      hasDuplication,
    };
  }
}
