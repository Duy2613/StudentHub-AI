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
    const evidenceBySource = new Map();

    for (const evidence of Array.isArray(evidenceItems) ? evidenceItems : []) {
      if (!evidence?.sourceId) continue;
      const current = evidenceBySource.get(evidence.sourceId) || [];
      current.push(evidence);
      evidenceBySource.set(evidence.sourceId, current);
    }

    for (const src of Array.isArray(sources) ? sources : []) {
      const sourceEvidence = evidenceBySource.get(src.sourceId) || [];
      const contentFingerprint = src.contentFingerprint || sourceEvidence.find((item) => item.contentFingerprint)?.contentFingerprint || null;
      const normalizedLineageTitle = typeof src.title === "string"
        ? src.title.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 180)
        : "";
      const clusterId = src.clusterId || contentFingerprint || (normalizedLineageTitle && src.publisher
        ? `title:${normalizedLineageTitle}|publisher:${String(src.publisher).toLowerCase().slice(0, 100)}`
        : null) || src.sourceId || src.domain || "unknown-source";
      if (!clusterMap.has(clusterId)) {
        clusterMap.set(clusterId, {
          clusterId,
          primarySource: src,
          memberSources: [],
          isSyndicated: false,
          lineageBasis: src.clusterId ? "declared_cluster" : contentFingerprint ? "content_fingerprint" : "source_metadata",
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
      independentlyCorroborated: clusters.filter((cluster) => cluster.memberSources.length === 1).length > 1,
      lineageValidated: clusters.every((cluster) => cluster.lineageBasis !== "source_metadata" || cluster.memberSources.length === 1),
    };
  }
}
