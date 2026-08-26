/**
 * StudentHub AI — Comprehensive Community Experience & Consensus Engine V1
 * 
 * Analyzes real-world student experiences, computes experience consensus,
 * calculates real turnaround durations, mines edge-cases, and defends against
 * sockpuppets, copy-paste astroturfing & coordination.
 * 
 * Non-Negotiable Core Invariant:
 * ==================================================================================
 *             COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC POLICY
 * ==================================================================================
 */

import crypto from "node:crypto";
import {
  CommunityIntelligenceModel,
  CONTENT_TYPE,
  CONSENSUS_SIGNAL,
  MANIPULATION_RISK
} from "./communityIntelligenceModel.js";

export class CommunityExperienceEngine {
  /**
   * Normalizes text for similarity / fingerprinting
   */
  static normalizeText(text = "") {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s\p{P}]+/gu, " ")
      .trim();
  }

  /**
   * Generates a structural content fingerprint
   */
  static generateContentFingerprint(text = "") {
    const normalized = this.normalizeText(text);
    return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
  }

  /**
   * Evaluates Experience Consensus and detects coordinated astroturfing & sockpuppets
   * @param {string} topic Topic identifier (e.g. "TOEIC_SUBMISSION_TIME")
   * @param {Array} posts List of community posts
   * @returns {object} ConsensusEvaluation object
   */
  static evaluateConsensus(topic, posts = []) {
    if (!Array.isArray(posts) || posts.length === 0) {
      return CommunityIntelligenceModel.createConsensusEvaluation({
        topic,
        consensusSignal: CONSENSUS_SIGNAL.UNVERIFIED_RUMOR,
        manipulationRisk: MANIPULATION_RISK.NONE,
        independentAccountsCount: 0,
        totalPostsCount: 0,
        provenanceClustersCount: 0,
        edgeCases: [],
        summary: "Chưa có dữ liệu trải nghiệm thực tế từ sinh viên."
      });
    }

    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));
    const fingerprintClusters = new Map(); // hash -> [posts]
    const deviceClusters = new Map(); // deviceFingerprint -> [posts]
    const authors = new Set();
    const durations = [];
    const linkOccurrences = new Map();
    const minedEdgeCases = [];

    for (const post of validPosts) {
      authors.add(post.authorHash || post.authorId);

      // Content similarity cluster
      const fp = this.generateContentFingerprint(post.content);
      if (!fingerprintClusters.has(fp)) {
        fingerprintClusters.set(fp, []);
      }
      fingerprintClusters.get(fp).push(post);

      // Device cluster
      if (post.deviceFingerprint) {
        if (!deviceClusters.has(post.deviceFingerprint)) {
          deviceClusters.set(post.deviceFingerprint, []);
        }
        deviceClusters.get(post.deviceFingerprint).push(post);
      }

      // Durations
      if (typeof post.procedureDurationDays === "number") {
        durations.push(post.procedureDurationDays);
      }

      // External links
      for (const link of post.externalLinks) {
        linkOccurrences.set(link, (linkOccurrences.get(link) || 0) + 1);
      }

      // Edge case warnings
      if (post.contentType === CONTENT_TYPE.EDGE_CASE_WARNING || post.content.toLowerCase().includes("lưu ý") || post.content.toLowerCase().includes("cảnh báo")) {
        minedEdgeCases.push({
          postId: post.postId,
          warning: post.content,
          cohort: post.authorCohort
        });
      }
    }

    const totalPosts = validPosts.length;
    const independentAuthors = authors.size;
    const uniqueClusters = fingerprintClusters.size;

    // 1. Detect Sockpuppet Cluster (multiple accounts with identical deviceFingerprint)
    const hasSockpuppetBurst = Array.from(deviceClusters.values()).some(cluster => {
      const distinctAuthorsInDevice = new Set(cluster.map(p => p.authorId));
      return distinctAuthorsInDevice.size >= 3;
    });

    if (hasSockpuppetBurst) {
      return CommunityIntelligenceModel.createConsensusEvaluation({
        topic,
        consensusSignal: CONSENSUS_SIGNAL.SUSPECTED_COORDINATION,
        manipulationRisk: MANIPULATION_RISK.SUSPECTED_SOCKPUPPET,
        independentAccountsCount: independentAuthors,
        totalPostsCount: totalPosts,
        provenanceClustersCount: uniqueClusters,
        medianProcedureDays: this.#calculateMedian(durations),
        edgeCases: minedEdgeCases,
        summary: "Cảnh báo Sockpuppet: Phát hiện hành vi tạo nhiều tài khoản ảo từ cùng một thiết bị/mạng để thao túng trải nghiệm."
      });
    }

    // 2. Detect Coordinated Copy-Paste Astroturfing
    const hasCopyPasteSyndication = Array.from(fingerprintClusters.values()).some(cluster => cluster.length >= 3);
    const hasRepeatedPromoLink = Array.from(linkOccurrences.values()).some(count => count >= 3 && independentAuthors >= 3);

    if (hasCopyPasteSyndication || hasRepeatedPromoLink) {
      return CommunityIntelligenceModel.createConsensusEvaluation({
        topic,
        consensusSignal: CONSENSUS_SIGNAL.SUSPECTED_COORDINATION,
        manipulationRisk: hasRepeatedPromoLink ? MANIPULATION_RISK.ASTROTURFING_PROMOTION : MANIPULATION_RISK.COORDINATED_COPY_PASTE,
        independentAccountsCount: independentAuthors,
        totalPostsCount: totalPosts,
        provenanceClustersCount: uniqueClusters,
        medianProcedureDays: this.#calculateMedian(durations),
        edgeCases: minedEdgeCases,
        summary: "Cảnh báo phối hợp bất thường: Nhiều tài khoản đăng cùng nội dung sao chép hoặc liên kết quảng bá lặp lại (Astroturfing)."
      });
    }

    // 3. Filter genuine first-hand experiences & practical guides
    const firstHandExperiences = validPosts.filter(
      p => p.contentType === CONTENT_TYPE.FIRST_HAND_EXPERIENCE || 
           p.contentType === CONTENT_TYPE.GUIDE || 
           p.contentType === CONTENT_TYPE.PROCEDURE_TIMELINE ||
           p.contentType === CONTENT_TYPE.PRACTICAL_TIP
    );
    const firstHandAuthors = new Set(firstHandExperiences.map(p => p.authorHash || p.authorId));
    const medianDays = this.#calculateMedian(durations);

    if (firstHandAuthors.size >= 3) {
      return CommunityIntelligenceModel.createConsensusEvaluation({
        topic,
        consensusSignal: CONSENSUS_SIGNAL.STRONG_EXPERIENCE_CONSENSUS,
        manipulationRisk: MANIPULATION_RISK.NONE,
        independentAccountsCount: firstHandAuthors.size,
        totalPostsCount: totalPosts,
        provenanceClustersCount: uniqueClusters,
        medianProcedureDays: medianDays,
        edgeCases: minedEdgeCases,
        summary: `Đồng thuận trải nghiệm thực tế mạnh (${firstHandAuthors.size} sinh viên độc lập xác nhận cùng mốc quy trình). Thời gian xử lý trung vị thực tế: ${medianDays ?? 'N/A'} ngày.`
      });
    }

    if (firstHandAuthors.size === 2) {
      return CommunityIntelligenceModel.createConsensusEvaluation({
        topic,
        consensusSignal: CONSENSUS_SIGNAL.MODERATE_COMMUNITY_SIGNAL,
        manipulationRisk: MANIPULATION_RISK.NONE,
        independentAccountsCount: firstHandAuthors.size,
        totalPostsCount: totalPosts,
        provenanceClustersCount: uniqueClusters,
        medianProcedureDays: medianDays,
        edgeCases: minedEdgeCases,
        summary: `Tín hiệu trải nghiệm cộng đồng mức vừa (${firstHandAuthors.size} sinh viên xác nhận).`
      });
    }

    if (firstHandAuthors.size === 1) {
      return CommunityIntelligenceModel.createConsensusEvaluation({
        topic,
        consensusSignal: CONSENSUS_SIGNAL.WEAK_ANECDOTE,
        manipulationRisk: MANIPULATION_RISK.NONE,
        independentAccountsCount: 1,
        totalPostsCount: totalPosts,
        provenanceClustersCount: uniqueClusters,
        medianProcedureDays: medianDays,
        edgeCases: minedEdgeCases,
        summary: "Trải nghiệm đơn lẻ cá nhân (Anecdote). Cần thêm phản hồi độc lập để cấu thành đồng thuận."
      });
    }

    return CommunityIntelligenceModel.createConsensusEvaluation({
      topic,
      consensusSignal: CONSENSUS_SIGNAL.UNVERIFIED_RUMOR,
      manipulationRisk: MANIPULATION_RISK.NONE,
      independentAccountsCount: independentAuthors,
      totalPostsCount: totalPosts,
      provenanceClustersCount: uniqueClusters,
      medianProcedureDays: medianDays,
      edgeCases: minedEdgeCases,
      summary: "Tin đồn hoặc suy đoán chưa qua xác thực thực tế."
    });
  }

  /**
   * Distinguishes community rumors from verified facts
   */
  static classifyRumorVsFact(post) {
    if (!post) return { isRumor: true, category: "EMPTY" };
    const content = typeof post.content === "string" ? post.content : "";
    const type = post.contentType || CommunityIntelligenceModel.inferContentType(content);

    if (type === CONTENT_TYPE.SECOND_HAND_REPORT || type === CONTENT_TYPE.UNVERIFIED_RUMOR) {
      return {
        isRumor: true,
        category: "UNVERIFIED_RUMOR",
        explanation: "Ý kiến gián tiếp hoặc tin đồn chưa được kiểm chứng từ trải nghiệm trực tiếp."
      };
    }

    if (type === CONTENT_TYPE.FIRST_HAND_EXPERIENCE || type === CONTENT_TYPE.PROCEDURE_TIMELINE) {
      return {
        isRumor: false,
        category: "FIRST_HAND_FACT",
        explanation: "Kinh nghiệm thực tế trực tiếp từ sinh viên đã hoàn thành quy trình."
      };
    }

    return {
      isRumor: false,
      category: "COMMUNITY_OPINION",
      explanation: "Nhận định hoặc câu hỏi từ diễn đàn cộng đồng sinh viên."
    };
  }

  static #calculateMedian(numbers) {
    if (!numbers || numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
