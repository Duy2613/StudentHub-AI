/**
 * StudentHub AI — Master Evidence Graph & Multi-Evidence Reasoning Core
 * 
 * Implements Constitution 4, 5, 6, 7, 9, 10:
 * Represents and evaluates claims through an explicit Evidence DAG.
 * Decomposes single-score verdicts into atomic evidence, source tiers,
 * timestamps, corroborations, and contradicting signals.
 */

export const FactCategory = {
  OFFICIAL_FACT: "OFFICIAL_FACT",
  VERIFIED_FACT: "VERIFIED_FACT",
  OBSERVATION: "OBSERVATION",
  USER_REPORT: "USER_REPORT",
  PUBLIC_OPINION: "PUBLIC_OPINION",
  ALLEGATION: "ALLEGATION",
  INFERENCE: "INFERENCE",
  MODEL_PREDICTION: "MODEL_PREDICTION",
  ESTIMATE: "ESTIMATE",
  UNKNOWN: "UNKNOWN"
};

export const SourceTier = {
  TIER_1_OFFICIAL: "TIER_1_OFFICIAL",         // Gov, University portals, Verified Law
  TIER_2_THREAT_INTEL: "TIER_2_THREAT_INTEL", // NCSC, URLhaus, APWG, FTC
  TIER_3_RESEARCH: "TIER_3_RESEARCH",         // Peer-reviewed papers, Academic taxonomies
  TIER_4_COMMUNITY: "TIER_4_COMMUNITY",       // Trust-Score verified student reports
  TIER_5_UNVERIFIED: "TIER_5_UNVERIFIED",     // Anonymous claims, unverified forums
  TIER_S_SYNTHETIC: "TIER_S_SYNTHETIC"        // Adversarial red-team test samples
};

export class MasterEvidenceGraph {
  constructor(claimStatement, options = {}) {
    this.graphId = `EVID_GRAPH_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.claim = {
      statement: claimStatement,
      created_at: new Date().toISOString(),
      category: options.category || FactCategory.INFERENCE,
      context: options.context || "GENERIC_INVESTIGATION"
    };
    this.supportingEvidence = [];
    this.contradictingEvidence = [];
    this.lineageChain = [];
  }

  /**
   * Adds an atomic evidence piece to the graph
   * @param {object} evidence 
   */
  addEvidence({
    type,
    description,
    confidence = 0.90,
    sourceId,
    sourceName,
    sourceTier = SourceTier.TIER_2_THREAT_INTEL,
    sourceUrl = null,
    isContradicting = false,
    timestamp = new Date().toISOString(),
    extractedFeatures = {}
  }) {
    const item = {
      evidence_id: `EVID_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      description,
      confidence: Number(confidence.toFixed(4)),
      source: {
        source_id: sourceId || "SRC_INTERNAL_INFERENCE",
        publisher: sourceName || "StudentHub Neural Subsystem",
        tier: sourceTier,
        source_url: sourceUrl,
        retrieved_at: timestamp
      },
      features: extractedFeatures,
      is_contradicting: isContradicting
    };

    if (isContradicting) {
      this.contradictingEvidence.push(item);
    } else {
      this.supportingEvidence.push(item);
    }

    this.lineageChain.push({
      step: this.lineageChain.length + 1,
      evidence_id: item.evidence_id,
      timestamp: item.source.retrieved_at,
      action: isContradicting ? "RECORD_CONTRADICTING_EVIDENCE" : "RECORD_SUPPORTING_EVIDENCE"
    });

    return item.evidence_id;
  }

  /**
   * Evaluates the graph into a multi-dimensional calibrated decision
   * @returns {object} Structured Evidence Decision
   */
  evaluate() {
    const totalSupporting = this.supportingEvidence.length;
    const totalContradicting = this.contradictingEvidence.length;

    // 1. Evidence Strength Calculation
    let weightedSupportScore = 0;
    for (const ev of this.supportingEvidence) {
      const tierWeight = this._getTierWeight(ev.source.tier);
      weightedSupportScore += ev.confidence * tierWeight;
    }

    let weightedContradictScore = 0;
    for (const ev of this.contradictingEvidence) {
      const tierWeight = this._getTierWeight(ev.source.tier);
      weightedContradictScore += ev.confidence * tierWeight;
    }

    const netScore = Math.max(0, weightedSupportScore - (weightedContradictScore * 1.5));
    const evidenceStrength = totalSupporting === 0 
      ? "NONE" 
      : (netScore >= 2.0 ? "VERY_HIGH" : (netScore >= 1.2 ? "HIGH" : (netScore >= 0.6 ? "MEDIUM" : "LOW")));

    // 2. Data Quality & Source Confidence
    const sources = [...this.supportingEvidence, ...this.contradictingEvidence].map(e => e.source.tier);
    const hasTier1 = sources.includes(SourceTier.TIER_1_OFFICIAL);
    const hasTier2 = sources.includes(SourceTier.TIER_2_THREAT_INTEL);
    const sourceConfidence = hasTier1 ? 0.98 : (hasTier2 ? 0.94 : 0.75);
    const dataQuality = (hasTier1 || hasTier2) ? "HIGH" : (sources.length > 0 ? "MEDIUM" : "LOW");

    // 3. Final Calibrated Decision
    let verdict = "INSUFFICIENT_EVIDENCE";
    let riskLevel = "NONE";
    let uncertainty = 0.90;

    if (totalSupporting > 0 && totalContradicting === 0) {
      if (netScore >= 1.5) {
        verdict = "SCAM";
        riskLevel = "CRITICAL";
        uncertainty = 0.05;
      } else if (netScore >= 0.8) {
        verdict = "SUSPICIOUS";
        riskLevel = "HIGH";
        uncertainty = 0.18;
      } else {
        verdict = "AMBIGUOUS";
        riskLevel = "MEDIUM";
        uncertainty = 0.35;
      }
    } else if (totalSupporting > 0 && totalContradicting > 0) {
      verdict = "CONFLICT_UNRESOLVED";
      riskLevel = "HIGH";
      uncertainty = 0.45;
    } else if (totalSupporting === 0 && totalContradicting > 0) {
      verdict = "LEGITIMATE";
      riskLevel = "NONE";
      uncertainty = 0.08;
    }

    return {
      graph_id: this.graphId,
      claim: this.claim,
      calibrated_verdict: verdict,
      risk_level: riskLevel,
      multi_dimensional_confidence: {
        model_confidence: totalSupporting > 0 ? Number((Math.min(0.99, netScore / 2)).toFixed(4)) : 0.1,
        source_confidence: sourceConfidence,
        evidence_strength: evidenceStrength,
        data_quality: dataQuality,
        freshness: "CURRENT_2026",
        coverage_score: totalSupporting >= 3 ? "COMPREHENSIVE" : (totalSupporting >= 1 ? "PARTIAL" : "MINIMAL"),
        uncertainty_index: Number(uncertainty.toFixed(4))
      },
      supporting_evidence_count: totalSupporting,
      contradicting_evidence_count: totalContradicting,
      supporting_evidence: this.supportingEvidence,
      contradicting_evidence: this.contradictingEvidence,
      lineage_trail: this.lineageChain
    };
  }

  _getTierWeight(tier) {
    switch (tier) {
      case SourceTier.TIER_1_OFFICIAL: return 1.5;
      case SourceTier.TIER_2_THREAT_INTEL: return 1.2;
      case SourceTier.TIER_3_RESEARCH: return 1.0;
      case SourceTier.TIER_4_COMMUNITY: return 0.7;
      case SourceTier.TIER_5_UNVERIFIED: return 0.3;
      case SourceTier.TIER_S_SYNTHETIC: return 0.5;
      default: return 0.5;
    }
  }
}
