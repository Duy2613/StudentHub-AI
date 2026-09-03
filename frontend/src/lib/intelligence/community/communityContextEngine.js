/**
 * StudentHub AI — Comprehensive Context Segmentation & Contradiction Engine V2
 * 
 * Separates CONTEXT_SPLIT (e.g. Faculty A vs Faculty B) from genuine contradictions,
 * and manages multi-dimensional context relevance & temporal decay.
 */

import {
  CommunityIntelligenceModel,
  TEMPORAL_STATE
} from "./communityIntelligenceModel.js";

export class CommunityContextEngine {
  /**
   * Slices a collection of posts by context dimension
   */
  static segmentByContext(posts = []) {
    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));
    const segments = new Map();

    for (const post of validPosts) {
      const ctx = post.context || {};
      const faculty = ctx.faculty || ctx.department || "ALL";
      const cohort = ctx.cohort || "ALL";
      const proc = (ctx.procedure && ctx.procedure !== "GENERAL") ? ctx.procedure : "ALL";
      const key = `${faculty}::${cohort}::${proc}`;

      if (!segments.has(key)) {
        segments.set(key, {
          segmentKey: key,
          faculty,
          department: faculty,
          cohort,
          procedure: proc,
          posts: [],
          durations: []
        });
      }

      const seg = segments.get(key);
      seg.posts.push(post);
      if (typeof post.procedureDurationDays === "number") {
        seg.durations.push(post.procedureDurationDays);
      }
    }

    return segments;
  }

  /**
   * Evaluates temporal recency state of an observation based on elapsed time
   */
  static evaluateTemporalState(publishedAt) {
    if (!publishedAt) return TEMPORAL_STATE.UNKNOWN;
    const date = new Date(publishedAt);
    if (isNaN(date.getTime())) return TEMPORAL_STATE.UNKNOWN;

    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 90) return TEMPORAL_STATE.CURRENT_EXPERIENCE;
    if (diffDays <= 365) return TEMPORAL_STATE.RECENT;
    if (diffDays <= 730) return TEMPORAL_STATE.AGING;
    return TEMPORAL_STATE.HISTORICAL;
  }

  /**
   * Analyzes variance across reports to distinguish CONTEXT_SPLIT from true CONTRADICTION
   */
  static analyzeVarianceAndContradiction(posts = []) {
    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));
    const durations = validPosts
      .filter(p => typeof p.procedureDurationDays === "number")
      .map(p => ({
        postId: p.postId,
        days: p.procedureDurationDays,
        context: p.context,
        author: p.authorHash || p.authorId
      }));

    if (durations.length < 2) {
      return {
        hasContradiction: false,
        isContextSplit: false,
        segments: [],
        explanation: "Chưa đủ mẫu so sánh trải nghiệm đa chiều."
      };
    }

    const minDays = Math.min(...durations.map(d => d.days));
    const maxDays = Math.max(...durations.map(d => d.days));

    // Group by Faculty / Department
    const byFaculty = new Map();
    for (const d of durations) {
      const fac = d.context?.department || d.context?.faculty || "CHUNG";
      if (!byFaculty.has(fac)) byFaculty.set(fac, []);
      byFaculty.get(fac).push(d.days);
    }

    // If multiple faculties have distinct medians -> difference >= 3 days is a divergence
    if (byFaculty.size > 1) {
      const facultyMedians = [];
      for (const [fac, list] of byFaculty.entries()) {
        facultyMedians.push({
          faculty: fac,
          department: fac,
          medianDays: this.#calculateMedian(list),
          sampleCount: list.length
        });
      }

      const medians = facultyMedians.map(f => f.medianDays);
      const diff = Math.max(...medians) - Math.min(...medians);

      if (diff >= 3) {
        return {
          hasContradiction: true,
          isContextSplit: true,
          varianceRangeDays: { min: minDays, max: maxDays },
          segments: facultyMedians,
          explanation: `Phát hiện trải nghiệm phân kỳ theo khoa (${minDays} ngày vs ${maxDays} ngày). Hệ thống phân đoạn theo khoa thay vì lấy trung bình cộng sai lệch.`
        };
      }
    }

    // Same faculty but high variance (>= 6 days) -> genuine contradiction / operational variance
    if (maxDays - minDays >= 6) {
      return {
        hasContradiction: true,
        isContextSplit: false,
        varianceRangeDays: { min: minDays, max: maxDays },
        segments: Array.from(byFaculty.entries()).map(([fac, list]) => ({ faculty: fac, department: fac, medianDays: this.#calculateMedian(list), sampleCount: list.length })),
        explanation: `Phát hiện phương sai trải nghiệm lớn trong cùng phân đoạn (${minDays} ngày vs ${maxDays} ngày). Cần kiểm tra thêm yếu tố loại chứng chỉ hoặc thời điểm nộp.`
      };
    }

    return {
      hasContradiction: false,
      isContextSplit: false,
      varianceRangeDays: { min: minDays, max: maxDays },
      segments: Array.from(byFaculty.entries()).map(([fac, list]) => ({ faculty: fac, department: fac, medianDays: this.#calculateMedian(list), sampleCount: list.length })),
      explanation: "Các báo cáo trải nghiệm đồng nhất trong biên độ dung sai thông thường."
    };
  }

  static #calculateMedian(numbers = []) {
    if (!numbers || numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
