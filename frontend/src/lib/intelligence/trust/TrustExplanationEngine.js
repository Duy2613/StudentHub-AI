/**
 * StudentHub AI — Explainable Trust Generation Architecture V1
 * Produces structured, human-readable explanations of trust profiles grounded in verifiable evidence.
 */

export class TrustExplanationEngine {
  /**
   * Generates a fully traceable explanation of a subject's trust profile
   * @param {object} trustProfile - Output from TrustIntelligenceEngine.evaluateTrustProfile
   * @returns {object} Structured explanation with strengths, weaknesses, and rationale
   */
  static explainTrust(trustProfile) {
    if (!trustProfile || !trustProfile.dimensions) {
      throw new Error("explainTrust requires a valid trustProfile object.");
    }

    const d = trustProfile.dimensions;
    const summary = trustProfile.evidenceSummary || {};
    const strengths = [];
    const weaknesses = [];

    // Evaluate Identity
    if (d.identityTrust >= 0.85) {
      strengths.push("Xác thực danh tính chính quy qua email trường đại học (@student.hcmute.edu.vn / @hcmute.edu.vn).");
    } else {
      weaknesses.push("Tài khoản chưa liên kết email học vụ chính quy đã xác minh.");
    }

    // Evaluate Contributions
    if (summary.evidenceBackedCount >= 5) {
      strengths.push(`${summary.evidenceBackedCount} đóng góp kèm minh chứng xác thực (tỷ lệ đính kèm minh chứng cao).`);
    } else if (summary.totalContributions === 0) {
      weaknesses.push("Chưa có lịch sử đóng góp dữ liệu hoặc minh chứng học vụ trong hệ thống.");
    }

    // Evaluate Validations
    if (summary.validatedCount >= 3) {
      strengths.push(`${summary.validatedCount} lần được chuyên gia và hội đồng kiểm chứng độ chính xác.`);
    }

    // Evaluate Behavior & Integrity
    if (summary.flagCount === 0 && d.integrityTrust >= 0.90) {
      strengths.push("Không có lịch sử vi phạm tiêu chuẩn cộng đồng hoặc hành vi thao túng điểm uy tín.");
    } else if (summary.flagCount > 0) {
      weaknesses.push(`Phát hiện ${summary.flagCount} cảnh báo vi phạm tiêu chuẩn hoặc dữ liệu bị tranh chấp.`);
    }

    // Evaluate Topic-specific Expertise
    if (d.expertiseTrust >= 0.75) {
      strengths.push(`Điểm uy tín chuyên môn cao trong chủ đề '${trustProfile.targetTopicId}' (${(d.expertiseTrust * 100).toFixed(0)}%).`);
    } else if (d.expertiseTrust <= 0.45) {
      weaknesses.push(`Mức độ tích lũy chuyên môn còn hạn chế trong chủ đề '${trustProfile.targetTopicId}'.`);
    }

    // Build human-friendly summary text
    const textSummary = `Chủ thể '${trustProfile.subjectId}' đạt mức độ tin cậy '${trustProfile.overallLevel}' (${(trustProfile.compositeScore * 100).toFixed(1)}/100). Điểm mạnh then chốt: ${strengths.slice(0, 3).join(" ")} ${weaknesses.length > 0 ? "Hạn chế cần lưu ý: " + weaknesses.join(" ") : ""}`;

    return {
      subjectId: trustProfile.subjectId,
      overallLevel: trustProfile.overallLevel,
      compositeScore: trustProfile.compositeScore,
      targetTopicId: trustProfile.targetTopicId,
      textSummary,
      strongSignals: strengths,
      weaknesses: weaknesses,
      dimensionBreakdown: {
        identity: { score: d.identityTrust, label: this.#scoreToLabel(d.identityTrust) },
        behavior: { score: d.behaviorTrust, label: this.#scoreToLabel(d.behaviorTrust) },
        contribution: { score: d.contributionTrust, label: this.#scoreToLabel(d.contributionTrust) },
        evidence: { score: d.evidenceTrust, label: this.#scoreToLabel(d.evidenceTrust) },
        academic: { score: d.academicTrust, label: this.#scoreToLabel(d.academicTrust) },
        community: { score: d.communityTrust, label: this.#scoreToLabel(d.communityTrust) },
        expertise: { score: d.expertiseTrust, label: this.#scoreToLabel(d.expertiseTrust) },
        consistency: { score: d.consistencyTrust, label: this.#scoreToLabel(d.consistencyTrust) },
        integrity: { score: d.integrityTrust, label: this.#scoreToLabel(d.integrityTrust) }
      },
      explainedAt: new Date().toISOString()
    };
  }

  static #scoreToLabel(score) {
    if (score >= 0.85) return "RẤT CAO";
    if (score >= 0.70) return "CAO";
    if (score >= 0.50) return "TRUNG BÌNH";
    if (score >= 0.30) return "THẤP";
    return "RẤT THẤP";
  }
}
