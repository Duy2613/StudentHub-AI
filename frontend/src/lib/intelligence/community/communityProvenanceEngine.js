/**
 * StudentHub AI — Comprehensive Provenance Clustering & Syndication Collapse Engine V2
 * 
 * Enforces the core invariant:
 * 10 COPIES OF ONE CLAIM = 1 PROVENANCE CLUSTER, NOT 10 INDEPENDENT OBSERVATIONS.
 */

import {
  CommunityIntelligenceModel,
  COORDINATION_RISK
} from "./communityIntelligenceModel.js";

export class CommunityProvenanceEngine {
  /**
   * Generates normalized content fingerprint
   */
  static generateFingerprint(text = "") {
    return CommunityIntelligenceModel.generateContentFingerprint(text);
  }

  /**
   * Clusters a list of posts into Provenance Clusters
   * Identifies syndication, copy-paste propagation, and collapses copies to 1 cluster.
   */
  static clusterProvenance(posts = []) {
    if (!Array.isArray(posts) || posts.length === 0) {
      return {
        clusters: [],
        clusterMap: new Map(),
        clusterCount: 0,
        independentObservationUnits: 0,
        isSyndicated: false,
        syndicationRatio: 0.0,
        coordinationRisk: COORDINATION_RISK.NONE,
        explanation: "Chưa có bài đăng nào để phân tích nguồn gốc."
      };
    }

    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));
    const clusterMap = new Map();

    for (const post of validPosts) {
      // Fingerprint combines normalized body + primary shared links
      const bodyHash = this.generateFingerprint(post.body || post.content || "");
      const primaryLink = (post.externalLinks && post.externalLinks.length > 0) ? post.externalLinks[0] : "";
      const clusterKey = primaryLink ? `LINK_${this.generateFingerprint(primaryLink).slice(0, 8)}_${bodyHash.slice(0, 8)}` : `TXT_${bodyHash}`;

      if (!clusterMap.has(clusterKey)) {
        clusterMap.set(clusterKey, {
          clusterKey,
          posts: [],
          authors: new Set(),
          links: new Set()
        });
      }

      const cluster = clusterMap.get(clusterKey);
      cluster.posts.push(post);
      cluster.authors.add(post.authorHash || post.authorId);
      for (const lk of post.externalLinks || []) {
        cluster.links.add(lk);
      }
    }

    const clusters = [];
    let syndicatedPostCount = 0;

    for (const [key, data] of clusterMap.entries()) {
      const isSyndicated = data.posts.length >= 3;
      if (isSyndicated) {
        syndicatedPostCount += data.posts.length;
      }

      clusters.push(CommunityIntelligenceModel.createProvenanceCluster({
        clusterId: `PROV_${key}`,
        signature: key,
        sourceOrigin: data.posts[0].sourcePlatform || "STUDENTHUB_FORUM",
        postIds: data.posts.map(p => p.postId),
        distinctAuthors: Array.from(data.authors),
        isSyndicated
      }));
    }

    const clusterCount = clusters.length;
    const independentObservationUnits = clusterCount;
    const isSyndicated = clusters.some(c => c.isSyndicated);
    const syndicationRatio = validPosts.length > 0 ? Number((syndicatedPostCount / validPosts.length).toFixed(2)) : 0.0;

    let coordinationRisk = COORDINATION_RISK.NONE;
    if (isSyndicated && syndicationRatio >= 0.5) {
      coordinationRisk = COORDINATION_RISK.COORDINATED_COPY_PASTE;
    }

    const explanation = isSyndicated
      ? `Phát hiện hiện tượng sao chép (Syndication): ${validPosts.length} bài viết được gom thành ${clusterCount} cụm nguồn độc lập. Hệ thống chỉ đếm các đơn vị quan sát độc lập thực sự thay vì đếm số lượng bài chia sẻ.`
      : `Ghi nhận ${validPosts.length} bài viết từ ${clusterCount} cụm nguồn độc lập.`;

    return {
      clusters,
      clusterMap,
      clusterCount,
      independentObservationUnits,
      isSyndicated,
      syndicationRatio,
      coordinationRisk,
      explanation
    };
  }

  /**
   * Evaluates if a collection of claims represents genuine independent consensus
   */
  static evaluateIndependence(claims = []) {
    const claimsArray = Array.isArray(claims) ? claims : [];
    if (claimsArray.length === 0) {
      return { isIndependentConsensus: false, independentUnitsCount: 0, clusterCount: 0 };
    }

    const uniqueAuthors = new Set();
    const uniqueClusters = new Set();

    for (const clm of claimsArray) {
      if (clm.authorId) uniqueAuthors.add(clm.authorId);
      const provId = clm.provenanceClusterId || clm.sourceHash || (clm.postIds && clm.postIds[0]) || `CLUS_${Math.random()}`;
      uniqueClusters.add(provId);
    }

    const isIndependentConsensus = uniqueAuthors.size >= 3 && uniqueClusters.size >= 2;

    return {
      isIndependentConsensus,
      independentUnitsCount: uniqueAuthors.size,
      clusterCount: uniqueClusters.size
    };
  }
}
