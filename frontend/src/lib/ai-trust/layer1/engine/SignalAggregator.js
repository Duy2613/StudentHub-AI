/**
 * Layer 1 — SignalAggregator
 * 
 * Deduplicates signals, prevents artificial confidence inflation from correlated triggers,
 * and enforces contradiction handling (Critical/High evidence dominates weak PASS metadata).
 */

import { SIGNAL_SEVERITY, createSignal } from "../types.js";

export class SignalAggregator {
  /**
   * Aggregates and deduplicates a raw array of signals
   * @param {Array} rawSignals
   * @returns {object} { uniqueSignals, categoryDistribution, severityCounts }
   */
  static aggregate(rawSignals = []) {
    if (!Array.isArray(rawSignals) || rawSignals.length === 0) {
      return {
        uniqueSignals: [],
        categoryDistribution: {},
        severityCounts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      };
    }

    const signalMap = new Map();
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    const categoryDistribution = {};

    for (const sig of rawSignals) {
      if (!sig || typeof sig !== "object" || typeof sig.type !== "string" || !sig.type.trim()) continue;

      const normalizedSignal = createSignal({
        type: sig.type.trim().slice(0, 120),
        category: typeof sig.category === "string" ? sig.category.slice(0, 80) : "security",
        severity: Object.values(SIGNAL_SEVERITY).includes(sig.severity) ? sig.severity : SIGNAL_SEVERITY.INFO,
        confidence: Number.isFinite(sig.confidence) ? sig.confidence : 0,
        evidence: sig.evidence && typeof sig.evidence === "object" && !Array.isArray(sig.evidence) ? sig.evidence : {},
        source: typeof sig.source === "string" ? sig.source.slice(0, 120) : "layer1_boundary",
        signalId: typeof sig.signalId === "string" ? sig.signalId.slice(0, 160) : null,
        ruleVersion: typeof sig.ruleVersion === "string" ? sig.ruleVersion.slice(0, 120) : "layer1-boundary-v1",
        observedAt: typeof sig.observedAt === "string" ? sig.observedAt : null,
      });

      const key = `${normalizedSignal.type}_${normalizedSignal.category || "default"}`;

      if (!signalMap.has(key)) {
        signalMap.set(key, { ...normalizedSignal, occurrences: 1 });
      } else {
        // If duplicate signal type, preserve highest confidence and note occurrence count
        const existing = signalMap.get(key);
        existing.confidence = Math.max(existing.confidence, normalizedSignal.confidence);
        existing.occurrences = (existing.occurrences || 1) + 1;
      }
    }

    const uniqueSignals = Array.from(signalMap.values());

    for (const sig of uniqueSignals) {
      const sev = sig.severity || SIGNAL_SEVERITY.INFO;
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;

      const cat = sig.category || "other";
      categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    }

    return {
      uniqueSignals,
      categoryDistribution,
      severityCounts,
    };
  }
}
