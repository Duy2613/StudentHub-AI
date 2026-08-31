/**
 * StudentHub AI — DataRetentionManager V1
 * 
 * Enforces minimal necessary data retention policies across
 * raw content, normalized items, derived signals, and security audit logs.
 */

export const RETENTION_POLICY_TIER = Object.freeze({
  RAW_EPHEMERAL: { name: "RAW_EPHEMERAL", ttlMs: 14 * 24 * 60 * 60 * 1000 }, // 14 days
  NORMALIZED_SEMESTER: { name: "NORMALIZED_SEMESTER", ttlMs: 90 * 24 * 60 * 60 * 1000 }, // 90 days
  DERIVED_SIGNALS: { name: "DERIVED_SIGNALS", ttlMs: 180 * 24 * 60 * 60 * 1000 }, // 180 days
  AUDIT_LOGS: { name: "AUDIT_LOGS", ttlMs: 365 * 24 * 60 * 60 * 1000 }, // 365 days
  PERMANENT_GRAPH: { name: "PERMANENT_GRAPH", ttlMs: Infinity } // Permanent versioned facts
});

export class DataRetentionManager {
  /**
   * Evaluates if a given record has exceeded its allowed retention period
   * @param {object} record
   * @param {string} record.createdAt - ISO Date string or ms timestamp
   * @param {string} tierName - Key of RETENTION_POLICY_TIER
   * @param {number} [currentTimeMs=Date.now()]
   * @returns {{ expired: boolean, ageMs: number, ttlMs: number }}
   */
  static evaluateRetention(record, tierName = "NORMALIZED_SEMESTER", currentTimeMs = Date.now()) {
    const tier = RETENTION_POLICY_TIER[tierName] || RETENTION_POLICY_TIER.NORMALIZED_SEMESTER;
    if (tier.ttlMs === Infinity) {
      return { expired: false, ageMs: 0, ttlMs: Infinity };
    }

    const createdTime = typeof record?.createdAt === "string" 
      ? new Date(record.createdAt).getTime() 
      : (record?.createdAt || currentTimeMs);

    const ageMs = currentTimeMs - createdTime;
    const expired = ageMs > tier.ttlMs;

    return {
      expired,
      ageMs,
      ttlMs: tier.ttlMs
    };
  }

  /**
   * Filters an array of items, retaining only non-expired records
   * @param {Array<object>} items 
   * @param {string} tierName 
   * @param {number} [currentTimeMs=Date.now()]
   * @returns {{ retained: Array<object>, purgedCount: number }}
   */
  static purgeExpiredRecords(items = [], tierName = "RAW_EPHEMERAL", currentTimeMs = Date.now()) {
    if (!Array.isArray(items)) return { retained: [], purgedCount: 0 };

    const retained = [];
    let purgedCount = 0;

    for (const item of items) {
      const evaluation = this.evaluateRetention(item, tierName, currentTimeMs);
      if (evaluation.expired) {
        purgedCount += 1;
      } else {
        retained.push(item);
      }
    }

    return { retained, purgedCount };
  }
}
