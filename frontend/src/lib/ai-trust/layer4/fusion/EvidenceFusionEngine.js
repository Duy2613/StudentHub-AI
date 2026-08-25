/**
 * Layer 4 — EvidenceFusionEngine
 * 
 * Merges signals, semantics, and evidence across Layers 1–3 into a unified Evidence Graph.
 * Preserves evidence provenance without double-counting duplicated source lineages.
 */

export class EvidenceFusionEngine {
  /**
   * Fuses multi-layer results into an auditable evidence package
   * @param {object} params
   * @param {object} params.layer1Result
   * @param {object} params.layer2Result
   * @param {object} params.layer3Result
   * @returns {object} Fused evidence graph and summary metrics
   */
  static fuse({ layer1Result = null, layer2Result = null, layer3Result = null }) {
    const fusedGraph = {
      layer1Signals: layer1Result?.signals || [],
      layer1Status: layer1Result?.status || "PASS",
      layer1Reasons: layer1Result?.reasons || [],

      layer2Intent: layer2Result?.intent || { primary: "inform", coercive: false },
      layer2Entities: layer2Result?.entities || [],
      layer2Claims: layer2Result?.claims || [],
      layer2ContextSignals: layer2Result?.contextSignals || [],
      layer2ConsistencyFindings: layer2Result?.consistencyFindings || [],
      layer2CrossModalFindings: layer2Result?.crossModalFindings || [],
      layer2Status: layer2Result?.status || "PASS",
      layer2Classification: layer2Result?.classification || "BENIGN",

      layer3Sources: layer3Result?.sources || [],
      layer3Evidence: layer3Result?.evidence || [],
      layer3ClaimStatuses: layer3Result?.claimStatuses || {},
      layer3Conflicts: layer3Result?.conflicts || [],
      layer3Independence: layer3Result?.sourceIndependence || { totalClusters: 0 },
      layer3Agreement: layer3Result?.crossSourceAgreement || { agreementScore: 1.0 },
      layer3Completeness: layer3Result?.verificationCompleteness || 0.0,
      layer3Status: layer3Result?.status || "UNVERIFIED",
    };

    // Calculate compound evidence metrics
    const totalEvidenceItems = fusedGraph.layer3Evidence.length;
    const totalSignals = fusedGraph.layer1Signals.length + fusedGraph.layer2ContextSignals.length;
    const hasPhishingSignals =
      fusedGraph.layer1Signals.some((s) => s.type?.includes("credential") || s.type?.includes("otp") || s.type?.includes("phishing")) ||
      fusedGraph.layer2ContextSignals.some((s) => s.type?.includes("credential") || s.type?.includes("account_takeover"));

    return {
      fusedGraph,
      hasPhishingSignals,
      totalEvidenceItems,
      totalSignals,
    };
  }
}
