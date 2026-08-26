/**
 * StudentHub AI — Comprehensive Community Experience & Consensus Engine V1
 */

import {
  CommunityIntelligenceModel,
  CLAIM_TYPE,
  EVIDENCE_STATUS,
  CONSENSUS_STATE,
  CONSENSUS_SIGNAL,
  COORDINATION_RISK,
  MANIPULATION_RISK
} from "./communityIntelligenceModel.js";

export class CommunityExperienceEngine {
  static generateContentFingerprint(text = "") {
    return CommunityIntelligenceModel.generateContentFingerprint(text);
  }

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

  static clusterProvenance(posts = []) {
    if (!Array.isArray(posts) || posts.length === 0) {
      return { clusters: new Map(), clusterCount: 0, isSyndicated: false };
    }

    const clusters = new Map();
    for (const p of posts) {
      const fp = this.generateContentFingerprint(p.body || p.content || "");
      if (!clusters.has(fp)) {
        clusters.set(fp, []);
      }
      clusters.get(fp).push(p);
    }

    const isSyndicated = Array.from(clusters.values()).some(cluster => cluster.length >= 3);
    return {
      clusters,
      clusterCount: clusters.size,
      isSyndicated
    };
  }

  static segmentByContext(posts = []) {
    const segments = new Map();

    for (const post of posts) {
      const ctx = post.context || {};
      const dept = ctx.department || "ALL";
      const cohort = ctx.cohort || "ALL";
      const proc = (ctx.procedure && ctx.procedure !== "GENERAL") ? ctx.procedure : "ALL";
      const key = `${dept}::${cohort}::${proc}`;
      if (!segments.has(key)) {
        segments.set(key, []);
      }
      segments.get(key).push(post);
    }

    return segments;
  }

  static detectContradictions(posts = []) {
    const durations = posts
      .filter(p => typeof p.procedureDurationDays === "number")
      .map(p => ({
        postId: p.postId,
        days: p.procedureDurationDays,
        context: p.context,
        author: p.authorHash || p.authorId
      }));

    if (durations.length < 2) {
      return { hasContradiction: false, segments: [], explanation: "Không đủ dữ liệu so sánh." };
    }

    const minDays = Math.min(...durations.map(d => d.days));
    const maxDays = Math.max(...durations.map(d => d.days));

    // Group by department
    const byDept = new Map();
    for (const d of durations) {
      const dept = d.context?.department || "CHUNG";
      if (!byDept.has(dept)) byDept.set(dept, []);
      byDept.get(dept).push(d.days);
    }

    // Contradiction occurs if distinct departments differ by >= 3 days, or same department differs by >= 6 days
    let isContradictory = false;
    if (byDept.size > 1) {
      const deptMedians = Array.from(byDept.values()).map(list => this.#calculateMedian(list));
      const minMed = Math.min(...deptMedians);
      const maxMed = Math.max(...deptMedians);
      if (maxMed - minMed >= 3) {
        isContradictory = true;
      }
    } else {
      if (maxDays - minDays >= 6) {
        isContradictory = true;
      }
    }

    if (!isContradictory) {
      return { hasContradiction: false, segments: [], explanation: "Các báo cáo thời gian đồng nhất trong biên độ cho phép." };
    }

    const segmentsSummary = [];
    for (const [dept, daysList] of byDept.entries()) {
      const med = this.#calculateMedian(daysList);
      segmentsSummary.push({ department: dept, medianDays: med, sampleCount: daysList.length });
    }

    return {
      hasContradiction: true,
      varianceRangeDays: { min: minDays, max: maxDays },
      segments: segmentsSummary,
      explanation: `Phát hiện trải nghiệm phân kỳ (${minDays} ngày vs ${maxDays} ngày). Hệ thống phân đoạn theo khoa/chương trình thay vì lấy trung bình cộng sai lệch.`
    };
  }

  static detectCoordinationRisk(posts = []) {
    if (!Array.isArray(posts) || posts.length === 0) {
      return { risk: COORDINATION_RISK.NONE, reason: "" };
    }

    // 1. Commercial promotion / Link spam
    const linkCounts = new Map();
    for (const p of posts) {
      for (const link of (p.externalLinks || [])) {
        linkCounts.set(link, (linkCounts.get(link) || 0) + 1);
      }
    }
    const hasSpamLinks = Array.from(linkCounts.values()).some(cnt => cnt >= 3);
    if (hasSpamLinks) {
      return {
        risk: COORDINATION_RISK.POTENTIAL_COMMERCIAL_INTEREST,
        reason: "Phát hiện liên kết quảng bá dịch vụ thương mại hoặc tài liệu lặp lại giữa các bài đăng."
      };
    }

    // 2. Sockpuppet Burst (deviceFingerprint)
    const deviceClusters = new Map();
    for (const p of posts) {
      const dev = p.deviceFingerprint || p.provenance?.deviceFingerprint;
      if (dev) {
        if (!deviceClusters.has(dev)) deviceClusters.set(dev, []);
        deviceClusters.get(dev).push(p);
      }
    }
    const hasSockpuppetBurst = Array.from(deviceClusters.values()).some(cluster => {
      const distinctAuthors = new Set(cluster.map(item => item.authorId || item.authorHash));
      return distinctAuthors.size >= 3;
    });
    if (hasSockpuppetBurst) {
      return {
        risk: COORDINATION_RISK.COORDINATION_RISK,
        reason: "Phát hiện nhiều tài khoản đăng bài từ cùng một thiết bị/mạng trong thời gian ngắn (Sockpuppet Cluster)."
      };
    }

    // 3. Syndication / Coordinated copy-paste
    const { isSyndicated } = this.clusterProvenance(posts);
    if (isSyndicated) {
      return {
        risk: COORDINATION_RISK.SUSPECTED_COORDINATION,
        reason: "Phát hiện hiện tượng sao chép nguyên văn (Copy-Paste Syndication) giữa nhiều tài khoản khác nhau."
      };
    }

    // 4. Suspected synthetic / AI repetitive phrasing
    const aiPhrases = ["tổng kết lại rằng", "với tư cách là một sinh viên", "trong bối cảnh học thuật số", "rất hữu ích và đáng cân nhắc"];
    const syntheticMatches = posts.filter(p => aiPhrases.some(phrase => (p.body || p.content || "").toLowerCase().includes(phrase)));
    if (syntheticMatches.length >= 3) {
      return {
        risk: COORDINATION_RISK.SUSPECTED_SYNTHETIC,
        reason: "Phát hiện dấu hiệu văn phong tổng hợp nhân tạo (AI-generated) với cấu trúc mẫu lặp lại."
      };
    }

    return { risk: COORDINATION_RISK.NONE, reason: "Không phát hiện dấu hiệu phối hợp bất thường." };
  }

  static evaluateConsensus(topic = "GENERAL", posts = [], queryContext = null) {
    if (!Array.isArray(posts) || posts.length === 0) {
      return {
        topic: String(topic).toUpperCase(),
        consensusState: CONSENSUS_STATE.UNKNOWN,
        consensusSignal: CONSENSUS_STATE.UNKNOWN,
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
        summary: "Chưa có dữ liệu trải nghiệm thực tế từ sinh viên."
      };
    }

    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));
    const authors = new Set(validPosts.map(p => p.authorHash || p.authorId));
    const { clusters, clusterCount } = this.clusterProvenance(validPosts);
    const coordRisk = this.detectCoordinationRisk(validPosts);
    const contradictionAnalysis = this.detectContradictions(validPosts);

    // Filter first-hand experiences & practical guides
    const firstHandPosts = validPosts.filter(
      p => p.contentType === CLAIM_TYPE.FIRST_HAND_EXPERIENCE || 
           p.contentType === CLAIM_TYPE.GUIDE ||
           p.contentType === CLAIM_TYPE.PROCEDURE_TIMELINE ||
           p.contentType === CLAIM_TYPE.PRACTICAL_TIP
    );
    const firstHandAuthors = new Set(firstHandPosts.map(p => p.authorHash || p.authorId));

    // Durations
    const durations = validPosts
      .filter(p => typeof p.procedureDurationDays === "number")
      .map(p => p.procedureDurationDays);
    const medianDays = this.#calculateMedian(durations);

    // Friction hotspots & edge-cases
    const frictionHotspots = this.mineFrictionHotspots(validPosts);
    const edgeCases = frictionHotspots.map(h => ({ warning: h.frictionSummary, cohort: h.cohort }));

    // Multi-Dimensional Experience Score
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
      coordinationRisk: coordRisk.risk
    });

    // Consensus State Determination
    let consensusState = CONSENSUS_STATE.WEAK_SIGNAL;

    if (coordRisk.risk !== COORDINATION_RISK.NONE) {
      consensusState = CONSENSUS_STATE.APPARENT_CONSENSUS;
    } else if (contradictionAnalysis.hasContradiction) {
      consensusState = CONSENSUS_STATE.MIXED_EXPERIENCES;
    } else if (firstHandAuthors.size >= 3 && clusterCount >= 3) {
      consensusState = CONSENSUS_STATE.STRONG_COMMUNITY_SIGNAL;
    } else if (firstHandAuthors.size >= 2) {
      consensusState = CONSENSUS_STATE.MODERATE_COMMUNITY_SIGNAL;
    } else if (firstHandAuthors.size === 1) {
      consensusState = CONSENSUS_STATE.WEAK_SIGNAL;
    } else if (firstHandAuthors.size === 0) {
      consensusState = CONSENSUS_STATE.UNVERIFIED_RUMOR;
    } else {
      consensusState = CONSENSUS_STATE.WEAK_SIGNAL;
    }

    let summary = `Tín hiệu trải nghiệm cộng đồng (${authors.size} tài khoản, ${clusterCount} cụm nguồn độc lập).`;
    if (consensusState === CONSENSUS_STATE.STRONG_COMMUNITY_SIGNAL) {
      summary = `Đồng thuận trải nghiệm thực tế mạnh (${firstHandAuthors.size} sinh viên độc lập xác nhận cùng mốc quy trình). Thời gian xử lý trung vị thực tế: ${medianDays ?? 'N/A'} ngày.`;
    } else if (consensusState === CONSENSUS_STATE.MIXED_EXPERIENCES) {
      summary = `Trải nghiệm phân kỳ giữa các đơn vị/khoa (${contradictionAnalysis.varianceRangeDays?.min} - ${contradictionAnalysis.varianceRangeDays?.max} ngày). Vui lòng xem chi tiết từng phân đoạn.`;
    } else if (consensusState === CONSENSUS_STATE.APPARENT_CONSENSUS) {
      summary = `Cảnh báo phối hợp bất thường: Số lượng bài viết nhiều nhưng xuất phát từ nguồn sao chép hoặc có rủi ro phối hợp.`;
    } else if (consensusState === CONSENSUS_STATE.UNVERIFIED_RUMOR) {
      summary = "Tin đồn hoặc suy đoán chưa qua xác thực thực tế.";
    }

    return {
      topic: String(topic).toUpperCase(),
      consensusState,
      consensusSignal: coordRisk.risk !== COORDINATION_RISK.NONE ? CONSENSUS_SIGNAL.SUSPECTED_COORDINATION : consensusState,
      manipulationRisk: coordRisk.risk,
      experienceScore,
      independentAuthorsCount: authors.size,
      independentAccountsCount: authors.size,
      provenanceClustersCount: clusterCount,
      totalPostsCount: validPosts.length,
      medianProcedureDays: medianDays,
      contradictionAnalysis,
      frictionHotspots,
      edgeCases,
      summary
    };
  }

  static classifyRumorVsFact(post) {
    if (!post) return { isRumor: true, category: "EMPTY" };
    const content = typeof post.body === "string" ? post.body : (typeof post.content === "string" ? post.content : "");
    const type = post.contentType || CommunityIntelligenceModel.inferClaimType(content);

    if (type === CLAIM_TYPE.SECOND_HAND_REPORT || type === CLAIM_TYPE.SPECULATION || type === CLAIM_TYPE.UNVERIFIED_RUMOR) {
      return {
        isRumor: true,
        category: "UNVERIFIED_RUMOR",
        explanation: "Ý kiến gián tiếp hoặc tin đồn chưa được kiểm chứng từ trải nghiệm trực tiếp."
      };
    }

    if (type === CLAIM_TYPE.FIRST_HAND_EXPERIENCE || type === CLAIM_TYPE.PROCEDURE_TIMELINE || type === CLAIM_TYPE.FACTUAL_CLAIM) {
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

  static mineFrictionHotspots(posts = []) {
    const hotspots = [];
    for (const post of posts) {
      const bodyLower = (post.body || post.content || "").toLowerCase();
      if (post.contentType === CLAIM_TYPE.WARNING || bodyLower.includes("lưu ý") || bodyLower.includes("cảnh báo") || bodyLower.includes("bị từ chối")) {
        hotspots.push({
          postId: post.postId,
          frictionSummary: post.body || post.content,
          cohort: post.authorCohort,
          department: post.context?.department || "CHUNG",
          category: bodyLower.includes("scan") ? "DOCUMENT_SCAN_QUALITY" : (bodyLower.includes("hạn") ? "DEADLINE_CUTOFF" : "OFFICE_QUEUE")
        });
      }
    }
    return hotspots;
  }

  static #calculateMedian(numbers) {
    if (!numbers || numbers.length === 0) return null;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
