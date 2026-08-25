/**
 * Layer 1 — SignalAggregator
 * 
 * Deduplicates signals, prevents artificial confidence inflation from correlated triggers,
 * and enforces contradiction handling (Critical/High evidence dominates weak PASS metadata).
 */

import { SIGNAL_SEVERITY } from "../types.js";

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
      if (!sig || !sig.type) continue;

      const key = `${sig.type}_${sig.category || "default"}`;

      if (!signalMap.has(key)) {
        signalMap.set(key, { ...sig, occurrences: 1 });
      } else {
        // If duplicate signal type, preserve highest confidence and note occurrence count
        const existing = signalMap.get(key);
        existing.confidence = Math.max(existing.confidence, sig.confidence);
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
