/**
 * StudentHub AI — Comprehensive Official vs Real-World Reality Gap Engine V2
 * 
 * Compares official stated administrative targets with observed empirical
 * community turnarounds while strictly preserving the invariant:
 * COMMUNITY SIGNAL NEVER MODIFIES OFFICIAL ACADEMIC REGULATIONS.
 */

import {
  CommunityIntelligenceModel,
  REALITY_GAP_STATE
} from "./communityIntelligenceModel.js";

export class CommunityRealityGapEngine {
  /**
   * Evaluates the reality gap for a specific academic procedure / topic
   */
  static evaluateRealityGap(params = {}) {
    const topic = typeof params.topic === "string" ? params.topic.trim().toUpperCase() : "GENERAL";
    const officialTarget = params.officialTarget || this.#getOfficialBenchmark(topic).target;
    const officialCitation = params.officialCitation || this.#getOfficialBenchmark(topic).citation;
    const officialTargetDays = params.officialTargetDays || this.#getOfficialBenchmark(topic).targetDays;

    const posts = Array.isArray(params.posts) ? params.posts : [];
    const validPosts = posts.map(p => CommunityIntelligenceModel.createCommunityPost(p));

    const durations = validPosts
      .filter(p => typeof p.procedureDurationDays === "number")
      .map(p => p.procedureDurationDays);

    if (durations.length === 0) {
      return CommunityIntelligenceModel.createOfficialRealityGap({
        topic,
        officialTarget,
        officialCitation,
        communityObserved: "Chưa có báo cáo trải nghiệm",
        sampleSize: 0,
        gapStatus: REALITY_GAP_STATE.NO_COMMUNITY_EVIDENCE,
        explanation: `Chưa có báo cáo thực nghiệm từ sinh viên cho quy trình '${topic}'. Thời gian áp dụng theo mục tiêu quy định: ${officialTarget}.`
      });
    }

    const medianObservedDays = this.#calculateMedian(durations);
    const minDays = Math.min(...durations);
    const maxDays = Math.max(...durations);
    const sampleSize = durations.length;

    let gapStatus = REALITY_GAP_STATE.ALIGNED;
    let gapDescription = "";

    const delta = medianObservedDays - officialTargetDays;

    if (delta <= 0) {
      gapStatus = REALITY_GAP_STATE.ALIGNED;
      gapDescription = `Tiến độ thực tế (${medianObservedDays} ngày) bám sát hoặc nhanh hơn mục tiêu quy định (${officialTargetDays} ngày).`;
    } else if (delta <= 2) {
      gapStatus = REALITY_GAP_STATE.MINOR_GAP;
      gapDescription = `Độ trễ vận hành nhẹ: Thực tế ghi nhận khoảng ${minDays}–${maxDays} ngày (trung vị ${medianObservedDays} ngày) so với mục tiêu ${officialTargetDays} ngày.`;
    } else {
      gapStatus = REALITY_GAP_STATE.SIGNIFICANT_OPERATIONAL_GAP;
      gapDescription = `Chênh lệch vận hành đáng kể (SIGNIFICANT_OPERATIONAL_GAP): Quy định nêu mục tiêu ${officialTarget}, trong khi thực tế từ ${sampleSize} báo cáo độc lập phản ánh khoảng ${minDays}–${maxDays} ngày (trung vị ${medianObservedDays} ngày).`;
    }

    return CommunityIntelligenceModel.createOfficialRealityGap({
      topic,
      officialTarget,
      officialCitation,
      communityObserved: `${minDays}–${maxDays} ngày (trung vị ${medianObservedDays} ngày)`,
      sampleSize,
      gapStatus,
      explanation: `${gapDescription} Lưu ý: Dữ liệu thực tế giúp sinh viên chủ động kế hoạch cá nhân, không cấu thành vi phạm quy chế hành chính của nhà trường.`
    });
  }

  /**
   * Retrieves default official targets for common university procedures
   */
  static #getOfficialBenchmark(topic = "") {
    const benchmarks = {
      TOEIC_SUBMISSION_TIME: {
        target: "3–5 ngày làm việc",
        targetDays: 3,
        citation: "QĐ 3116/QĐ-ĐHSPKT — Quy trình xác thực chuẩn đầu ra Ngoại ngữ"
      },
      GRADUATION_DOSSIER_REVIEW: {
        target: "3 ngày làm việc",
        targetDays: 3,
        citation: "QĐ 3116/QĐ-ĐHSPKT — Quy định xét tốt nghiệp hệ chính quy"
      },
      COURSE_REGISTRATION: {
        target: "Xử lý tức thời (Real-time)",
        targetDays: 1,
        citation: "Thông báo Đào Tạo — Đăng ký học phần trực tuyến"
      },
      TUITION_PAYMENT_RECONCILIATION: {
        target: "24 giờ làm việc",
        targetDays: 1,
        citation: "Quy định Phòng Kế toán — Gạch nợ học phí tự động"
      },
      TRANSCRIPT_REQUEST: {
        target: "2 ngày làm việc",
        targetDays: 2,
        citation: "Cổng Một Cửa — Cấp bảng điểm chính thức"
      }
    };

    return benchmarks[topic] || {
      target: "3 ngày làm việc",
      targetDays: 3,
      citation: "QĐ 3116/QĐ-ĐHSPKT — Quy chế đào tạo chính quy HCMUTE"
    };
  }

  static #calculateMedian(numbers = []) {
    if (!numbers || numbers.length === 0) return 0;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
}
