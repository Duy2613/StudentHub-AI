/**
 * StudentHub AI — Comprehensive Community Integrity, Astroturf & Edge-Case Engine V2
 * 
 * Protects community reality graph from:
 * 1. Sockpuppet clusters & synchronized bursts
 * 2. Commercial astroturfing & hidden sales links
 * 3. Synthetic content risks
 * 4. Distinguishes RARE_EDGE_CASE from SYSTEMIC_INCIDENT
 */

import {
  CommunityIntelligenceModel,
  COORDINATION_RISK,
  MANIPULATION_RISK
} from "./communityIntelligenceModel.js";
import { CommunityProvenanceEngine } from "./communityProvenanceEngine.js";

export class CommunityIntegrityEngine {
  /**
   * Analyzes a set of posts for coordinated manipulation or astroturfing
   */
  static analyzeIntegrity(posts = []) {
    if (!Array.isArray(posts) || posts.length === 0) {
      return {
        coordinationRisk: COORDINATION_RISK.NONE,
        commercialSignals: [],
        sockpuppetClusters: [],
        syntheticSignals: [],
        explanation: "Không có dữ liệu bài đăng để đánh giá an toàn."
      };
    }

    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));

    // 1. Commercial Links & Promo Detector
    const commercialLinks = [];
    const linkCounts = new Map();
    for (const post of validPosts) {
      for (const link of (post.externalLinks || [])) {
        linkCounts.set(link, (linkCounts.get(link) || 0) + 1);
        if (this.#isCommercialUrl(link)) {
          commercialLinks.push({ postId: post.postId, link, author: post.authorHash });
        }
      }
    }

    const hasLinkSpam = Array.from(linkCounts.values()).some(cnt => cnt >= 3);
    const hasCommercial = commercialLinks.length >= 1 || hasLinkSpam;

    // 2. Sockpuppet Burst (Shared Device / Origin)
    const deviceClusters = new Map();
    for (const post of validPosts) {
      const dev = post.deviceFingerprint || post.provenance?.deviceFingerprint;
      if (dev) {
        if (!deviceClusters.has(dev)) deviceClusters.set(dev, []);
        deviceClusters.get(dev).push(post);
      }
    }

    const sockpuppetClusters = [];
    for (const [dev, list] of deviceClusters.entries()) {
      const authors = new Set(list.map(p => p.authorHash || p.authorId));
      if (authors.size >= 3) {
        sockpuppetClusters.push({
          deviceFingerprint: dev,
          accountCount: authors.size,
          postCount: list.length
        });
      }
    }

    // 3. Syndication / Coordinated copy-paste
    const provAnalysis = CommunityProvenanceEngine.clusterProvenance(validPosts);

    // 4. Suspected Synthetic / AI Pattern Matching
    const aiPatterns = [
      "tổng kết lại rằng",
      "với tư cách là một sinh viên",
      "trong bối cảnh học thuật số",
      "rất hữu ích và đáng cân nhắc",
      "nhìn chung theo quan điểm của tôi"
    ];
    const syntheticMatches = validPosts.filter(p => {
      const txt = (p.body || p.content || "").toLowerCase();
      return aiPatterns.some(pat => txt.includes(pat));
    });

    const isSynthetic = syntheticMatches.length >= 3;

    // Aggregate Risk (Priority: Sockpuppet -> Commercial Links -> Syndicated Copy-Paste -> Synthetic)
    let coordinationRisk = COORDINATION_RISK.NONE;
    let explanation = "Không phát hiện dấu hiệu phối hợp bất thường.";

    if (sockpuppetClusters.length > 0) {
      coordinationRisk = COORDINATION_RISK.SUSPECTED_SOCKPUPPET;
      explanation = `Cảnh báo tài khoản rối (Sockpuppet): Phát hiện ${sockpuppetClusters.length} cụm tài khoản chia sẻ cùng định danh thiết bị/mạng.`;
    } else if (hasCommercial) {
      coordinationRisk = COORDINATION_RISK.POTENTIAL_COMMERCIAL_INTEREST;
      explanation = "Phát hiện liên kết tiếp thị, bán tài liệu hoặc dịch vụ thương mại lặp lại giữa các bài viết.";
    } else if (provAnalysis.isSyndicated) {
      coordinationRisk = COORDINATION_RISK.COORDINATED_COPY_PASTE;
      explanation = provAnalysis.explanation;
    } else if (isSynthetic) {
      coordinationRisk = COORDINATION_RISK.SUSPECTED_SYNTHETIC;
      explanation = "Phát hiện dấu hiệu văn phong tổng hợp AI (AI-generated) với cấu trúc mẫu lặp lại.";
    }

    return {
      coordinationRisk,
      hasCommercial,
      commercialLinks,
      sockpuppetClusters,
      isSynthetic,
      syntheticCount: syntheticMatches.length,
      provenanceClustersCount: provAnalysis.clusterCount,
      explanation
    };
  }

  /**
   * Mines rare edge cases from low-frequency reports without dismissing them
   */
  static mineEdgeCases(posts = []) {
    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));
    const edgeCases = [];

    for (const post of validPosts) {
      const text = (post.body || post.content || "").toLowerCase();
      if (
        text.includes("trường hợp hiếm") ||
        text.includes("bị từ chối") ||
        text.includes("mã qr") ||
        text.includes("mờ") ||
        text.includes("nộp vào ngày thứ 7") ||
        text.includes("sai thông tin ngân hàng")
      ) {
        edgeCases.push({
          postId: post.postId,
          event: post.title || "Trường hợp đặc thù trong quy trình",
          warning: post.body || post.content,
          context: post.context,
          cohort: post.context?.cohort || "K24",
          isSystemic: false,
          classification: "RARE_EDGE_CASE",
          recommendation: "Lưu ý kiểm tra trước khi nộp để tránh bị trả hồ sơ."
        });
      }
    }

    return edgeCases;
  }

  static #isCommercialUrl(url = "") {
    const lower = String(url).toLowerCase();
    return lower.includes("zalo.me") ||
      lower.includes("facebook.com/groups") ||
      lower.includes("khoahoc") ||
      lower.includes("onthi") ||
      lower.includes("promo-center") ||
      lower.includes("ads-vendor") ||
      lower.includes("dichvuvietbai");
  }
}
