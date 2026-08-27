/**
 * StudentHub AI — Evidence-Aware Community Consensus & Minority Opinion Engine V1
 * Evaluates collective student agreement while explicitly preserving minority viewpoints and cohort variances.
 */

export class CommunityConsensusEngine {
  /**
   * Computes evidence-weighted consensus across community observations for a specific proposition
   * @param {object} params
   * @param {string} params.claimId
   * @param {object[]} params.observations - List of student reports [{ studentId, stance: "SUPPORT"|"OPPOSE"|"EXCEPTION", evidenceAttached: boolean, cohort: "K22"|"K23"|"K24", commentary: string, authorReliability: number }]
   * @returns {object} Full consensus breakdown with majority and minority signals
   */
  static evaluateConsensus({ claimId, observations = [] }) {
    if (!claimId) throw new Error("evaluateConsensus requires claimId.");

    if (observations.length === 0) {
      return {
        claimId,
        consensusStatus: "NO_COMMUNITY_DATA",
        consensusPercentage: 0,
        independentContributorCount: 0,
        majorityView: null,
        minoritySignals: [],
        outliers: [],
        rationale: "Chưa có báo cáo trải nghiệm thực tế nào từ sinh viên."
      };
    }

    // 1. Group observations by distinct author to prevent duplicate astroturfing
    const uniqueAuthorMap = new Map();
    for (const obs of observations) {
      const author = obs.studentId || `anon_${Math.random()}`;
      if (!uniqueAuthorMap.has(author)) {
        uniqueAuthorMap.set(author, obs);
      }
    }

    const uniqueObservations = Array.from(uniqueAuthorMap.values());
    const independentCount = uniqueObservations.length;

    // 2. Score weighted support / oppose / exception based on evidence and contributor reliability
    let totalSupportWeight = 0;
    let totalOpposeWeight = 0;
    let totalExceptionWeight = 0;

    const supportCohortMap = new Map();
    const opposeCohortMap = new Map();
    const exceptionCohortMap = new Map();

    for (const obs of uniqueObservations) {
      const evidenceBoost = obs.evidenceAttached ? 1.5 : 1.0;
      const reliability = obs.authorReliability !== undefined ? Math.max(0.3, obs.authorReliability) : 0.7;
      const weight = reliability * evidenceBoost;

      const cohort = obs.cohort || "GENERAL";

      if (obs.stance === "SUPPORT" || obs.stance === "CONFIRMED") {
        totalSupportWeight += weight;
        supportCohortMap.set(cohort, (supportCohortMap.get(cohort) || 0) + 1);
      } else if (obs.stance === "OPPOSE" || obs.stance === "CONTRADICTED") {
        totalOpposeWeight += weight;
        opposeCohortMap.set(cohort, (opposeCohortMap.get(cohort) || 0) + 1);
      } else {
        totalExceptionWeight += weight;
        exceptionCohortMap.set(cohort, (exceptionCohortMap.get(cohort) || 0) + 1);
      }
    }

    const totalWeight = totalSupportWeight + totalOpposeWeight + totalExceptionWeight || 1;
    const supportPct = Math.round((totalSupportWeight / totalWeight) * 100);
    const opposePct = Math.round((totalOpposeWeight / totalWeight) * 100);
    const exceptionPct = Math.round((totalExceptionWeight / totalWeight) * 100);

    // 3. Determine Majority vs Minority
    let majorityView;
    const minoritySignals = [];

    if (supportPct >= 65) {
      majorityView = {
        stance: "SUPPORT",
        percentage: supportPct,
        weight: Number(totalSupportWeight.toFixed(2)),
        contributorCount: uniqueObservations.filter(o => o.stance === "SUPPORT" || o.stance === "CONFIRMED").length,
        summary: `Đa số sinh viên (${supportPct}%) xác nhận nhận định này đúng với thực tế vận hành.`
      };

      if (opposePct >= 15) {
        minoritySignals.push({
          stance: "OPPOSE",
          percentage: opposePct,
          contributorCount: uniqueObservations.filter(o => o.stance === "OPPOSE" || o.stance === "CONTRADICTED").length,
          cohortBreakdown: Object.fromEntries(opposeCohortMap),
          explanation: `Có ${opposePct}% sinh viên ghi nhận kết quả khác biệt, tập trung chủ yếu ở khóa ${Array.from(opposeCohortMap.keys()).join(", ")}.`
        });
      }

      if (exceptionPct >= 10) {
        minoritySignals.push({
          stance: "EXCEPTION",
          percentage: exceptionPct,
          contributorCount: uniqueObservations.filter(o => o.stance === "EXCEPTION").length,
          explanation: `${exceptionPct}% sinh viên ghi nhận điều kiện ngoại lệ áp dụng cho các chương trình đào tạo đặc thù.`
        });
      }
    } else if (opposePct >= 65) {
      majorityView = {
        stance: "OPPOSE",
        percentage: opposePct,
        weight: Number(totalOpposeWeight.toFixed(2)),
        contributorCount: uniqueObservations.filter(o => o.stance === "OPPOSE" || o.stance === "CONTRADICTED").length,
        summary: `Đa số sinh viên (${opposePct}%) bác bỏ nhận định này dựa trên trải nghiệm thực tế.`
      };

      if (supportPct >= 15) {
        minoritySignals.push({
          stance: "SUPPORT",
          percentage: supportPct,
          contributorCount: uniqueObservations.filter(o => o.stance === "SUPPORT" || o.stance === "CONFIRMED").length,
          explanation: `${supportPct}% sinh viên cho rằng nhận định vẫn đúng trong một số hoàn cảnh cá biệt.`
        });
      }
    } else {
      majorityView = {
        stance: "CONTESTED",
        percentage: Math.max(supportPct, opposePct),
        summary: "Ý kiến cộng đồng đang có sự phân hóa đáng kể (chưa đạt đồng thuận vững chắc)."
      };
    }

    const consensusStatus = supportPct >= 75
      ? "STRONG_CONSENSUS"
      : (supportPct >= 60 ? "MODERATE_CONSENSUS" : (opposePct >= 60 ? "STRONG_DISSENT" : "CONTESTED"));

    return {
      claimId,
      consensusStatus,
      consensusPercentage: supportPct,
      independentContributorCount: independentCount,
      totalObservationsAnalyzed: observations.length,
      majorityView,
      minoritySignals,
      shares: {
        supportPercentage: supportPct,
        opposePercentage: opposePct,
        exceptionPercentage: exceptionPct
      },
      evaluatedAt: new Date().toISOString()
    };
  }
}
