/**
 * StudentHub AI — Community Experience & Consensus Engine V1
 * 
 * Analyzes real-world student experiences, computes experience consensus,
 * and defends against sockpuppets, copy-paste astroturfing & coordination.
 * 
 * Core Invariant: COMMUNITY EXPERIENCE NEVER CREATES OFFICIAL ACADEMIC POLICY.
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
   * Evaluates Experience Consensus and detects coordinated astroturfing
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
        summary: "Chưa có dữ liệu trải nghiệm thực tế từ sinh viên."
      });
    }

    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));
    const fingerprintClusters = new Map(); // hash -> [posts]
    const authors = new Set();
    const durations = [];
    const linkOccurrences = new Map();

    for (const post of validPosts) {
      authors.add(post.authorId);
      const fp = this.generateContentFingerprint(post.content);
      if (!fingerprintClusters.has(fp)) {
        fingerprintClusters.set(fp, []);
      }
      fingerprintClusters.get(fp).push(post);

      if (typeof post.procedureDurationDays === "number") {
        durations.push(post.procedureDurationDays);
      }

      for (const link of post.externalLinks) {
        linkOccurrences.set(link, (linkOccurrences.get(link) || 0) + 1);
      }
    }

    const totalPosts = validPosts.length;
    const independentAuthors = authors.size;
    const uniqueClusters = fingerprintClusters.size;

    // Check for Coordinated Copy-Paste (Astroturfing)
    // E.g., multiple posts sharing the exact same content fingerprint
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
        summary: "Cảnh báo phối hợp bất thường: Nhiều tài khoản đăng cùng nội dung sao chép hoặc liên kết quảng bá lặp lại (Astroturfing)."
      });
    }

    // Filter only genuine first-hand experiences
    const firstHandExperiences = validPosts.filter(p => p.contentType === CONTENT_TYPE.FIRST_HAND_EXPERIENCE || p.contentType === CONTENT_TYPE.GUIDE);
    const firstHandAuthors = new Set(firstHandExperiences.map(p => p.authorId));

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
        summary: `Đồng thuận trải nghiệm thực tế mạnh (${firstHandAuthors.size} sinh viên độc lập xác nhận cùng mốc quy trình). Thời gian xử lý trung vị thực tế: ${medianDays ?? 'N/A'} ngày.`
      });
    }

    if (firstHandAuthors.size >= 2) {
      return CommunityIntelligenceModel.createConsensusEvaluation({
        topic,
        consensusSignal: CONSENSUS_SIGNAL.MODERATE_COMMUNITY_SIGNAL,
        manipulationRisk: MANIPULATION_RISK.NONE,
        independentAccountsCount: firstHandAuthors.size,
        totalPostsCount: totalPosts,
        provenanceClustersCount: uniqueClusters,
        medianProcedureDays: medianDays,
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
      summary: "Tin đồn hoặc suy đoán chưa qua xác thực thực tế."
    });
  }

  static #calculateMedian(numbers) {
    if (!numbers || numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
