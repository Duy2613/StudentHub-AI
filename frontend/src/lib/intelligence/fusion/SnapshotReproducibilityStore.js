/**
 * StudentHub AI — Intelligence Snapshot & Reproducibility Architecture V1
 * Stores immutable point-in-time state snapshots for claim evaluations and evidence graphs.
 */

import crypto from "node:crypto";

export class SnapshotReproducibilityStore {
  static #snapshots = new Map();

  /**
   * Captures an immutable snapshot of an intelligence evaluation at timestamp T
   */
  static captureSnapshot({
    targetEntityId,
    entityType = "CLAIM",
    claimState,
    evidenceState = [],
    confidenceAssessment,
    modelVersion = "fusion-v2",
    policyVersion = "1.0.0"
  }) {
    if (!targetEntityId) throw new Error("captureSnapshot requires targetEntityId.");

    const snapshotId = `snap_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const timestamp = new Date().toISOString();

    const statePayload = {
      snapshotId,
      targetEntityId,
      entityType,
      claimState: JSON.parse(JSON.stringify(claimState || {})),
      evidenceState: JSON.parse(JSON.stringify(evidenceState || [])),
      confidenceAssessment: JSON.parse(JSON.stringify(confidenceAssessment || {})),
      modelVersion,
      policyVersion,
      timestamp,
      stateDigest: crypto.createHash("sha256")
        .update(`${targetEntityId}:${modelVersion}:${JSON.stringify(confidenceAssessment)}:${timestamp}`)
        .digest("hex")
    };

    this.#snapshots.set(snapshotId, Object.freeze(statePayload));
    return statePayload;
  }

  /**
   * Retrieves a snapshot by ID
   */
  static getSnapshot(snapshotId) {
    return this.#snapshots.get(snapshotId) || null;
  }

  /**
   * Retrieves all historical snapshots for an entity
   */
  static getSnapshotsForEntity(targetEntityId) {
    const list = [];
    for (const snap of this.#snapshots.values()) {
      if (snap.targetEntityId === targetEntityId) {
        list.push(snap);
      }
    }
    return list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  static clear() {
    this.#snapshots.clear();
  }
}
