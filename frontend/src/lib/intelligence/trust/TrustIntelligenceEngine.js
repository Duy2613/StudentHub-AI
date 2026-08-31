/**
 * StudentHub AI — Comprehensive T1 Multidimensional Trust Intelligence Engine V2
 * Evaluates 10 distinct trust dimensions without collapsing into a single opaque magic number.
 */

import { ReputationGraph } from "../fabric/ReputationGraph.js";


export const TRUST_LEVEL = Object.freeze({
  VERY_HIGH: "VERY_HIGH",   // 0.85 - 1.00
  HIGH: "HIGH",             // 0.70 - 0.84
  MODERATE: "MODERATE",     // 0.50 - 0.69
  LOW: "LOW",               // 0.30 - 0.49
  VERY_LOW: "VERY_LOW",     // 0.00 - 0.29
  UNVERIFIED: "UNVERIFIED"  // Lacking data
});

export class TrustIntelligenceEngine {
  /**
   * Computes the complete 10-dimension trust profile for a student or expert subject
   * @param {object} params
   * @param {string} params.subjectId - e.g. "student:24110001"
   * @param {object} [params.identityData] - Verified student identity model
   * @param {object[]} [params.contributions] - List of contributions/claims
   * @param {object[]} [params.abuseFlags] - List of flags or moderation events
   * @param {string} [params.targetTopicId] - Specific topic to contextualize
   * @returns {object} Full multidimensional trust evaluation
   */
  static evaluateTrustProfile({
    subjectId,
    identityData = null,
    contributions = [],
    abuseFlags = [],
    targetTopicId = "general"
  }) {
    if (!subjectId) throw new Error("evaluateTrustProfile requires subjectId.");

    // 1. Identity Trust (0.0 to 1.0)
    const identityTrust = identityData && identityData.isVerified
      ? (identityData.email && identityData.email.endsWith(".edu.vn") ? 0.95 : 0.85)
      : 0.35;

    // 2. Behavior Trust (Penalized by abuse flags)
    const flagCount = abuseFlags.length;
    const behaviorTrust = Math.max(0.1, 1.0 - (flagCount * 0.25));

    // 3. Contribution Trust (Count and quality of evidence attached)
    const totalContributions = contributions.length;
    const evidenceBackedCount = contributions.filter(c => (c.evidenceCount || 0) > 0).length;
    const contributionRate = totalContributions > 0 ? (evidenceBackedCount / totalContributions) : 0.5;
    const contributionTrust = Math.min(0.95, 0.4 + (contributionRate * 0.4) + (Math.min(totalContributions, 20) / 40));

    // 4. Evidence Trust (Average authority/relevance of submitted evidence)
    const avgEvidenceQuality = contributions.reduce((acc, c) => acc + (c.averageEvidenceQuality || 0.7), 0) / (totalContributions || 1);
    const evidenceTrust = totalContributions > 0 ? avgEvidenceQuality : 0.5;

    // 5. Academic Trust (Official enrollment and standing)
    const academicTrust = identityData && identityData.academicSummary
      ? (identityData.academicSummary.academicStanding === "EXCELLENT" ? 0.95 : 0.80)
      : 0.50;

    // 6. Community Trust (Peer acceptance & agreement)
    const validatedCount = contributions.reduce((acc, c) => acc + (c.validationCount || 0), 0);
    const communityTrust = Math.min(0.95, 0.5 + (validatedCount * 0.05));

    // 7. Expertise Trust (From ReputationGraph for topic)
    const topicReputation = ReputationGraph.getTopicScore(subjectId, targetTopicId);
    const expertiseTrust = topicReputation;

    // 8. Consistency Trust (Historical accuracy without retractions)
    const retractedCount = contributions.filter(c => c.status === "DISPUTED" || c.status === "SUPERSEDED").length;
    const consistencyTrust = Math.max(0.2, 1.0 - (retractedCount * 0.2));

    // 9. Temporal Trust (Activity recency)
    const temporalTrust = totalContributions > 0 ? 0.85 : 0.40;

    // 10. Integrity Signals (Collusion checks)
    const mutationHistory = ReputationGraph.getMutationHistory(subjectId);
    const hasCollusionPenalty = mutationHistory.some(m => m.action === "COORDINATED_VOTE_FLAG");
    const integrityTrust = hasCollusionPenalty ? 0.20 : 0.95;

    const dimensions = {
      identityTrust: Number(identityTrust.toFixed(3)),
      behaviorTrust: Number(behaviorTrust.toFixed(3)),
      contributionTrust: Number(contributionTrust.toFixed(3)),
      evidenceTrust: Number(evidenceTrust.toFixed(3)),
      academicTrust: Number(academicTrust.toFixed(3)),
      communityTrust: Number(communityTrust.toFixed(3)),
      expertiseTrust: Number(expertiseTrust.toFixed(3)),
      consistencyTrust: Number(consistencyTrust.toFixed(3)),
      temporalTrust: Number(temporalTrust.toFixed(3)),
      integrityTrust: Number(integrityTrust.toFixed(3))
    };

    // Calculate composite tier without destroying individual dimensions
    const weightedScore = (
      dimensions.identityTrust * 0.15 +
      dimensions.behaviorTrust * 0.15 +
      dimensions.contributionTrust * 0.15 +
      dimensions.evidenceTrust * 0.15 +
      dimensions.academicTrust * 0.10 +
      dimensions.communityTrust * 0.10 +
      dimensions.expertiseTrust * 0.10 +
      dimensions.consistencyTrust * 0.05 +
      dimensions.integrityTrust * 0.05
    );

    const overallLevel = this.#scoreToLevel(weightedScore);

    return {
      subjectId,
      targetTopicId,
      overallLevel,
      compositeScore: Number(weightedScore.toFixed(3)),
      dimensions,
      evidenceSummary: {
        totalContributions,
        evidenceBackedCount,
        validatedCount,
        retractedCount,
        flagCount
      },
      evaluatedAt: new Date().toISOString()
    };
  }

  static #scoreToLevel(score) {
    if (score >= 0.85) return TRUST_LEVEL.VERY_HIGH;
    if (score >= 0.70) return TRUST_LEVEL.HIGH;
    if (score >= 0.50) return TRUST_LEVEL.MODERATE;
    if (score >= 0.30) return TRUST_LEVEL.LOW;
    return TRUST_LEVEL.VERY_LOW;
  }
}
