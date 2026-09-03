/**
 * StudentHub AI — Comprehensive Community Experience & Consensus Engine V2
 * 
 * Orchestrates:
 * 1. Post & Multi-claim extraction
 * 2. Provenance clustering & copy-paste collapse
 * 3. Context segmentation (CONTEXT_SPLIT vs CONTRADICTION)
 * 4. Operational Friction Graph & Heatmap mining
 * 5. Official vs Real-world Reality Gap evaluation
 * 6. Astroturf / Coordination / Sockpuppet defense
 * 
 * Non-Negotiable Invariant:
 * COMMUNITY SIGNAL NEVER OVERRIDES OFFICIAL ACADEMIC REGULATIONS.
 */

import { CommunityIntelligenceModel, CLAIM_TYPE, EVIDENCE_STATUS, CONSENSUS_STATE, CONSENSUS_SIGNAL, COORDINATION_RISK } from "./communityIntelligenceModel.js";
import { CommunityProvenanceEngine } from "./communityProvenanceEngine.js";
import { CommunityFrictionEngine } from "./communityFrictionEngine.js";
import { CommunityRealityGapEngine } from "./communityRealityGapEngine.js";
import { CommunityContextEngine } from "./communityContextEngine.js";
import { CommunityIntegrityEngine } from "./communityIntegrityEngine.js";

export class CommunityExperienceEngine {
  /**
   * Content fingerprint delegate
   */
  static generateContentFingerprint(text = "") {
    return CommunityIntelligenceModel.generateContentFingerprint(text);
  }

  /**
   * Extracts atomic Community Claims from raw posts
   */
  static extractClaims(posts = []) {
    if (!Array.isArray(posts)) return [];
    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));

    return validPosts.map(post => {
      const claimType = post.contentType || CommunityIntelligenceModel.inferClaimType(post.body);
      
      let status = EVIDENCE_STATUS.HIGH_VALUE_EXPERIENCE;
      if (claimType === CLAIM_TYPE.SECOND_HAND_REPORT || claimType === CLAIM_TYPE.SPECULATION || claimType === CLAIM_TYPE.UNVERIFIED_RUMOR) {
        status = EVIDENCE_STATUS.UNVERIFIED;
      } else if (claimType === CLAIM_TYPE.OPINION) {
        status = EVIDENCE_STATUS.USEFUL_CONTEXT;
      } else if (claimType === CLAIM_TYPE.WARNING) {
        status = EVIDENCE_STATUS.HIGH_VALUE_EXPERIENCE;
      }

      return CommunityIntelligenceModel.createCommunityClaim({
        claimId: `CLM_${post.postId}`,
        authorId: post.authorHash || post.authorId,
        postIds: [post.postId],
        topic: post.topic,
        claimType,
        statement: post.body,
        context: post.context,
        publishedAt: post.publishedAt,
        status
      });
    });
  }

  /**
   * Provenance clustering delegate
   */
  static clusterProvenance(posts = []) {
    return CommunityProvenanceEngine.clusterProvenance(posts);
  }

  /**
   * Context segmentation delegate
   */
  static segmentByContext(posts = []) {
    return CommunityContextEngine.segmentByContext(posts);
  }

  /**
   * Contradiction & Context Split detection delegate
   */
  static detectContradictions(posts = []) {
    return CommunityContextEngine.analyzeVarianceAndContradiction(posts);
  }

  /**
   * Coordination risk delegate
   */
  static detectCoordinationRisk(posts = []) {
    const analysis = CommunityIntegrityEngine.analyzeIntegrity(posts);
    return {
      risk: analysis.coordinationRisk,
      reason: analysis.explanation
    };
  }

  /**
   * Evaluates comprehensive consensus on a topic
   */
  static evaluateConsensus(topic = "GENERAL", posts = [], queryContext = null) {
    const targetTopic = String(topic).toUpperCase();

    if (!Array.isArray(posts) || posts.length === 0) {
      return {
        topic: targetTopic,
        consensusState: CONSENSUS_STATE.UNKNOWN,
        consensusSignal: CONSENSUS_SIGNAL.UNKNOWN,
        manipulationRisk: COORDINATION_RISK.NONE,
        experienceScore: CommunityIntelligenceModel.createExperienceScore({ firstHandRate: 0, independence: 0, recency: 0 }),
        independentAuthorsCount: 0,
        independentAccountsCount: 0,
        provenanceClustersCount: 0,
        totalPostsCount: 0,
        medianProcedureDays: null,
        contradictionAnalysis: null,
        frictionHotspots: [],
        edgeCases: [],
        realityGap: CommunityRealityGapEngine.evaluateRealityGap({ topic: targetTopic, posts: [] }),
        summary: "Chưa có dữ liệu trải nghiệm thực tế từ sinh viên."
      };
    }

    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));
    const authors = new Set(validPosts.map(p => p.authorHash || p.authorId));
    
    // 1. Provenance Clustering
    const provAnalysis = CommunityProvenanceEngine.clusterProvenance(validPosts);
    const clusterCount = provAnalysis.clusterCount;

    // 2. Integrity & Coordination Analysis
    const integrityAnalysis = CommunityIntegrityEngine.analyzeIntegrity(validPosts);

    // 3. Contradiction & Context Split Analysis
    const contradictionAnalysis = CommunityContextEngine.analyzeVarianceAndContradiction(validPosts);

    // 4. First-Hand Evidence Filtering
    const firstHandPosts = validPosts.filter(
      p => p.contentType === CLAIM_TYPE.FIRST_HAND_EXPERIENCE ||
           p.contentType === CLAIM_TYPE.GUIDE ||
           p.contentType === CLAIM_TYPE.WARNING
    );
    const firstHandAuthors = new Set(firstHandPosts.map(p => p.authorHash || p.authorId));

    // 5. Turnaround Durations
    const durations = validPosts
      .filter(p => typeof p.procedureDurationDays === "number")
      .map(p => p.procedureDurationDays);
    const medianDays = this.#calculateMedian(durations);

    // 6. Friction Signals & Edge Cases
    const frictionHotspots = CommunityFrictionEngine.extractFrictionSignals(validPosts);
    const edgeCases = CommunityIntegrityEngine.mineEdgeCases(validPosts);

    // 7. Official vs Real-World Reality Gap
    const realityGap = CommunityRealityGapEngine.evaluateRealityGap({
      topic: targetTopic,
      posts: validPosts
    });

    // 8. Multi-Dimensional Experience Score
    const firstHandRate = validPosts.length > 0 ? Number((firstHandPosts.length / validPosts.length).toFixed(2)) : 0;
    const independence = validPosts.length > 0 ? Number((clusterCount / validPosts.length).toFixed(2)) : 0;
    const recency = 1.0;
    const contextMatch = 1.0;
    const provenanceQuality = clusterCount > 0 ? Number((clusterCount / validPosts.length).toFixed(2)) : 0;
    const contradictionRate = contradictionAnalysis.hasContradiction ? 0.35 : 0.0;

    const experienceScore = CommunityIntelligenceModel.createExperienceScore({
      firstHandRate,
      independence,
      recency,
      contextMatch,
      provenanceQuality,
      contradictionRate,
      coordinationRisk: integrityAnalysis.coordinationRisk
    });

    // 9. Consensus State Determination
    let consensusState = CONSENSUS_STATE.WEAK_SIGNAL;

    if (integrityAnalysis.coordinationRisk !== COORDINATION_RISK.NONE) {
      consensusState = CONSENSUS_STATE.APPARENT_CONSENSUS;
    } else if (contradictionAnalysis.hasContradiction) {
      consensusState = CONSENSUS_STATE.MIXED_EXPERIENCES;
    } else if (firstHandAuthors.size >= 3 && clusterCount >= 2) {
      consensusState = CONSENSUS_STATE.STRONG_COMMUNITY_SIGNAL;
    } else if (firstHandAuthors.size >= 2) {
      consensusState = CONSENSUS_STATE.MODERATE_COMMUNITY_SIGNAL;
    } else if (firstHandAuthors.size === 1) {
      consensusState = CONSENSUS_STATE.WEAK_SIGNAL;
    } else if (firstHandAuthors.size === 0) {
      consensusState = CONSENSUS_STATE.UNVERIFIED_RUMOR;
    }

    const consensusSignal = integrityAnalysis.coordinationRisk !== COORDINATION_RISK.NONE
      ? CONSENSUS_SIGNAL.SUSPECTED_COORDINATION
      : (consensusState === CONSENSUS_STATE.UNVERIFIED_RUMOR ? CONSENSUS_SIGNAL.UNVERIFIED_RUMOR : consensusState);

    let summary = `Tín hiệu trải nghiệm cộng đồng (${authors.size} tài khoản, ${clusterCount} cụm nguồn độc lập).`;
    if (consensusState === CONSENSUS_STATE.STRONG_COMMUNITY_SIGNAL) {
      summary = `Đồng thuận trải nghiệm thực tế mạnh (${firstHandAuthors.size} sinh viên độc lập xác nhận cùng mốc quy trình). Thời gian xử lý trung vị thực tế: ${medianDays ?? 'N/A'} ngày.`;
    } else if (consensusState === CONSENSUS_STATE.MIXED_EXPERIENCES) {
      summary = `Trải nghiệm phân kỳ (${contradictionAnalysis.varianceRangeDays?.min} - ${contradictionAnalysis.varianceRangeDays?.max} ngày). Vui lòng đối chiếu chi tiết phân đoạn.`;
    } else if (consensusState === CONSENSUS_STATE.APPARENT_CONSENSUS) {
      summary = `Cảnh báo phối hợp bất thường: Số lượng bài viết nhiều nhưng lặp lại từ nguồn sao chép hoặc có rủi ro phối hợp.`;
    } else if (consensusState === CONSENSUS_STATE.UNVERIFIED_RUMOR) {
      summary = "Tin đồn hoặc suy đoán chưa qua xác thực thực tế.";
    }

    return {
      topic: targetTopic,
      consensusState,
      consensusSignal,
      manipulationRisk: integrityAnalysis.coordinationRisk,
      experienceScore,
      independentAuthorsCount: authors.size,
      independentAccountsCount: authors.size,
      provenanceClustersCount: clusterCount,
      totalPostsCount: validPosts.length,
      medianProcedureDays: medianDays,
      contradictionAnalysis,
      frictionHotspots,
      edgeCases,
      realityGap,
      summary
    };
  }

  /**
   * Classifies post into Fact vs Rumor vs Opinion
   */
  static classifyRumorVsFact(post) {
    if (!post) return { isRumor: true, category: "EMPTY" };
    const content = typeof post.body === "string" ? post.body : (typeof post.content === "string" ? post.content : "");
    const type = post.contentType || CommunityIntelligenceModel.inferClaimType(content);

    if (type === CLAIM_TYPE.SECOND_HAND_REPORT || type === CLAIM_TYPE.SPECULATION || type === CLAIM_TYPE.UNVERIFIED_RUMOR || type === CLAIM_TYPE.RUMOR) {
      return {
        isRumor: true,
        category: "UNVERIFIED_RUMOR",
        explanation: "Ý kiến gián tiếp hoặc tin đồn chưa được kiểm chứng từ trải nghiệm trực tiếp."
      };
    }

    if (type === CLAIM_TYPE.FIRST_HAND_EXPERIENCE || type === CLAIM_TYPE.FACTUAL_CLAIM || type === CLAIM_TYPE.GUIDE) {
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

  /**
   * Mines friction hotspots delegate
   */
  static mineFrictionHotspots(posts = []) {
    return CommunityFrictionEngine.extractFrictionSignals(posts);
  }

  static #calculateMedian(numbers) {
    if (!numbers || numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
