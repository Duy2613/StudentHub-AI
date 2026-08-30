/**
 * Layer 3 — CompletenessEngine
 * 
 * Computes:
 * 1. Verification Completeness [0.0 - 1.0] (How thoroughly claims were verified)
 * 2. Cross-Source Agreement Score
 * 3. Compound Evidence Confidence
 */

import { LAYER_3_CONFIG } from "../config/Layer3Config.js";
import { SOURCE_AUTHORITY_TIER, CLAIM_EVIDENCE_RELATION, FRESHNESS_STATUS } from "../types.js";

export class CompletenessEngine {
  /**
   * Calculates completeness metrics for a verification run
   */
  static calculateCompleteness({ claims = [], evidence = [], sources = [], independence = {} }) {
    if (!claims || claims.length === 0) {
      return {
        verificationCompleteness: 0.0,
        evidenceConfidence: 0.0,
        crossSourceAgreement: { agreementScore: 0.0, supportingSourcesCount: 0, contradictingSourcesCount: 0 },
        provenanceCoverage: 0.0,
      };
    }

    let verifiedClaimsCount = 0;
    let totalEvidenceWeight = 0;
    let supportingCount = 0;
    let contradictingCount = 0;

    const validClaimIds = new Set(claims.map((claim) => claim?.claimId).filter(Boolean));
    const claimIdsWithEvidence = new Set(
      evidence.filter((item) => validClaimIds.has(item?.claimId)).map((item) => item.claimId)
    );
    verifiedClaimsCount = claimIdsWithEvidence.size;

    for (const ev of evidence) {
      let weight = 0.5;

      if (ev.liveEvidence !== true || ev.sourceType === "LOCAL_KNOWLEDGE_BASE") {
        weight -= 0.20;
      }

      if (ev.authorityTier === SOURCE_AUTHORITY_TIER.TIER_5_PRIMARY_AUTHORITATIVE) {
        weight += LAYER_3_CONFIG.WEIGHTS.PRIMARY_SOURCE_BONUS;
      } else if (ev.authorityTier === SOURCE_AUTHORITY_TIER.TIER_4_HIGH_REPUTABLE_SECONDARY) {
        weight += 0.25;
      }

      if (ev.freshness === FRESHNESS_STATUS.CURRENT) {
        weight += LAYER_3_CONFIG.WEIGHTS.TEMPORAL_VALIDITY_WEIGHT;
      } else if (ev.freshness === FRESHNESS_STATUS.OUTDATED) {
        weight -= 0.30;
      }

      if (
        ev.relation === CLAIM_EVIDENCE_RELATION.STRONGLY_SUPPORTS ||
        ev.relation === CLAIM_EVIDENCE_RELATION.SUPPORTS
      ) {
        supportingCount++;
      } else if (
        ev.relation === CLAIM_EVIDENCE_RELATION.STRONGLY_CONTRADICTS ||
        ev.relation === CLAIM_EVIDENCE_RELATION.CONTRADICTS
      ) {
        contradictingCount++;
      }

      totalEvidenceWeight += Math.max(0.1, weight);
    }

    // Completeness = Fraction of claims with retrieved evidence
    const completenessRatio = verifiedClaimsCount / claims.length;

    // Multi-cluster bonus
    const clusterCount = independence.independentSourcesCount || sources.length || 0;
    const clusterBonus = Math.min(0.2, clusterCount * 0.05);

    const verificationCompleteness = Math.min(1.0, completenessRatio * (0.8 + clusterBonus));

    // Agreement Score
    const totalPolarized = supportingCount + contradictingCount;
    let agreementScore = 0.0;
    if (totalPolarized > 0) {
      agreementScore = Math.max(supportingCount, contradictingCount) / totalPolarized;
    }

    // Evidence Confidence
    const avgWeight = evidence.length > 0 ? totalEvidenceWeight / evidence.length : 0;
    const evidenceConfidence = Math.min(0.99, Math.max(0, avgWeight * completenessRatio));
    const provenanceCoverage = evidence.length > 0
      ? evidence.filter((item) => item?.sourceType && item?.sourceFingerprint && item?.retrievalOutcome === "SUCCESS").length / evidence.length
      : 0;

    return {
      verificationCompleteness: Number(verificationCompleteness.toFixed(2)),
      evidenceConfidence: Number(evidenceConfidence.toFixed(2)),
      crossSourceAgreement: {
        agreementScore: Number(agreementScore.toFixed(2)),
        supportingSourcesCount: supportingCount,
        contradictingSourcesCount: contradictingCount,
        totalPolarizedSources: totalPolarized,
      },
      provenanceCoverage: Number(provenanceCoverage.toFixed(2)),
    };
  }
}
