/**
 * StudentHub AI — Comprehensive Operational Friction Graph & Heatmap Engine V2
 * 
 * Maps student operational roadblocks across:
 * PROCESS -> STEP -> FRICTION TYPE -> COHORT -> TIME -> TREND -> REALITY GAP
 */

import {
  CommunityIntelligenceModel,
  FRICTION_STATE,
  FRICTION_TREND
} from "./communityIntelligenceModel.js";

export class CommunityFrictionEngine {
  /**
   * Mines operational friction signals from posts and claims
   */
  static extractFrictionSignals(posts = []) {
    if (!Array.isArray(posts) || posts.length === 0) return [];
    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));

    const frictionGroups = new Map();

    for (const post of validPosts) {
      const text = (post.body || post.content || "").toLowerCase();
      const detected = this.#classifyFrictionType(text, post.topic, post.context);
      
      if (detected) {
        const groupKey = `${detected.process}::${detected.step}::${detected.frictionType}::${post.context.cohort || "K24"}`;
        
        if (!frictionGroups.has(groupKey)) {
          frictionGroups.set(groupKey, {
            process: detected.process,
            step: detected.step,
            frictionType: detected.frictionType,
            severity: detected.severity,
            cohort: post.context.cohort || "K24",
            affectedContext: post.context,
            posts: [],
            authors: new Set(),
            firstSeen: post.publishedAt,
            lastSeen: post.publishedAt
          });
        }

        const group = frictionGroups.get(groupKey);
        group.posts.push(post);
        group.authors.add(post.authorHash || post.authorId);
        if (new Date(post.publishedAt) < new Date(group.firstSeen)) group.firstSeen = post.publishedAt;
        if (new Date(post.publishedAt) > new Date(group.lastSeen)) group.lastSeen = post.publishedAt;
      }
    }

    const signals = [];
    for (const [key, grp] of frictionGroups.entries()) {
      const reportCount = grp.authors.size;
      const state = reportCount >= 5 ? FRICTION_STATE.REPEATED : (reportCount >= 2 ? FRICTION_STATE.EMERGING : FRICTION_STATE.NEW);
      const trend = this.#calculateTrend(grp.posts);

      signals.push(CommunityIntelligenceModel.createFrictionSignal({
        frictionId: `FRIC_${CommunityIntelligenceModel.generateContentFingerprint(key).slice(0, 8)}`,
        process: grp.process,
        step: grp.step,
        frictionType: grp.frictionType,
        affectedContext: grp.affectedContext,
        firstSeen: grp.firstSeen,
        lastSeen: grp.lastSeen,
        independentReportCount: reportCount,
        trend,
        severity: grp.severity,
        state,
        description: `Ghi nhận ${reportCount} phản ánh độc lập về sự cố '${grp.frictionType}' tại bước '${grp.step}' (${grp.process}) cho khóa ${grp.cohort}.`
      }));
    }

    // Sort by severity and report count
    return signals.sort((a, b) => b.independentReportCount - a.independentReportCount);
  }

  /**
   * Builds a structured 2D Friction Heatmap Matrix for UI visualization
   * Rows = Processes / Steps, Columns = Cohorts (K21, K22, K23, K24, K25, K26)
   */
  static buildFrictionHeatmap(frictionSignals = []) {
    const cohorts = ["K21", "K22", "K23", "K24", "K25", "K26"];
    const processMap = new Map();

    for (const sig of frictionSignals) {
      const rowKey = `${sig.process} — ${sig.step}`;
      if (!processMap.has(rowKey)) {
        const initialCohortCounts = {};
        for (const c of cohorts) initialCohortCounts[c] = { count: 0, severity: "NONE", trend: FRICTION_TREND.STABLE };
        processMap.set(rowKey, {
          processName: sig.process,
          stepName: sig.step,
          frictionType: sig.frictionType,
          cohorts: initialCohortCounts,
          totalReports: 0
        });
      }

      const row = processMap.get(rowKey);
      const targetCohort = cohorts.includes(sig.cohort) ? sig.cohort : "K24";
      row.cohorts[targetCohort] = {
        count: sig.independentReportCount,
        severity: sig.severity,
        trend: sig.trend,
        frictionId: sig.frictionId
      };
      row.totalReports += sig.independentReportCount;
    }

    return {
      columns: cohorts,
      rows: Array.from(processMap.values()).sort((a, b) => b.totalReports - a.totalReports),
      generatedAt: new Date().toISOString()
    };
  }

  static #classifyFrictionType(text = "", topic = "", context = {}) {
    if (text.includes("scan") || text.includes("mã qr") || text.includes("chụp ảnh bị từ chối") || text.includes("bị mờ")) {
      return {
        process: "Xác thực Chứng chỉ Ngoại ngữ",
        step: "Tải lên bản scan chứng chỉ",
        frictionType: "DOCUMENT_SCAN_QUALITY_REJECTION",
        severity: "MEDIUM"
      };
    }
    if (text.includes("đợi duyệt") || text.includes("chờ phòng đào tạo") || text.includes("mất 7 ngày") || text.includes("mất 8 ngày") || text.includes("chậm trễ")) {
      return {
        process: "Xét duyệt Hồ sơ Tốt nghiệp",
        step: "Thẩm định hồ sơ Phòng Đào Tạo",
        frictionType: "VERIFICATION_TURNAROUND_DELAY",
        severity: "HIGH"
      };
    }
    if (text.includes("timeout") || text.includes("nghẽn mạng") || text.includes("sập web") || text.includes("không bấm đăng ký được") || text.includes("lỗi cổng")) {
      return {
        process: "Đăng ký Môn học Trực tuyến",
        step: "Chọn lớp & Lưu thời khóa biểu",
        frictionType: "PORTAL_REGISTRATION_TIMEOUT",
        severity: "CRITICAL"
      };
    }
    if (text.includes("học phí") || text.includes("chuyển khoản bị treo") || text.includes("momo chưa gạch nợ") || text.includes("ngân hàng")) {
      return {
        process: "Thanh toán Học phí Điện tử",
        step: "Gạch nợ học phí tự động",
        frictionType: "PAYMENT_RECONCILIATION_DELAY",
        severity: "HIGH"
      };
    }
    if (text.includes("đồ án") || text.includes("chữ ký hội đồng") || text.includes("nộp muộn") || text.includes("hạn nộp")) {
      return {
        process: "Bảo vệ Đồ án Tốt nghiệp",
        step: "Nộp quyển & Xác nhận GVHD",
        frictionType: "THESIS_DEADLINE_FRICTION",
        severity: "MEDIUM"
      };
    }

    if (topic.includes("TOEIC") || topic.includes("NGOAI_NGU")) {
      return {
        process: "Chuẩn Ngoại ngữ",
        step: "Kiểm tra hệ thống",
        frictionType: "GENERAL_LANGUAGE_FRICTION",
        severity: "LOW"
      };
    }

    return null;
  }

  static #calculateTrend(posts = []) {
    if (posts.length < 3) return FRICTION_TREND.STABLE;
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const recentCount = posts.filter(p => new Date(p.publishedAt).getTime() >= oneWeekAgo).length;
    const olderCount = posts.length - recentCount;

    if (recentCount > olderCount && recentCount >= 2) return FRICTION_TREND.NEW_SPIKE;
    if (recentCount === 0 && olderCount > 0) return FRICTION_TREND.DECLINING;
    return FRICTION_TREND.STABLE;
  }
}
