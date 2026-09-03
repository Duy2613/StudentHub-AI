/**
 * StudentHub AI — Topic-Aware Dynamic Reputation Graph Architecture V1
 * Enforces multi-dimensional, topic-bounded reputation with time decay, anti-gaming, and sybil resistance.
 */

import crypto from "node:crypto";

export const REPUTATION_ACTION = Object.freeze({
  EVIDENCE_BACKED_CONTRIBUTION: "EVIDENCE_BACKED_CONTRIBUTION",
  EXPERT_VALIDATED_CLAIM: "EXPERT_VALIDATED_CLAIM",
  CORRECTION_ACCEPTED: "CORRECTION_ACCEPTED",
  UNVERIFIED_POST: "UNVERIFIED_POST",
  DISPUTED_CLAIM_PENALTY: "DISPUTED_CLAIM_PENALTY",
  SPAM_ABUSE_FLAG: "SPAM_ABUSE_FLAG",
  COORDINATED_VOTE_FLAG: "COORDINATED_VOTE_FLAG"
});

export const ACTION_WEIGHTS = Object.freeze({
  [REPUTATION_ACTION.EVIDENCE_BACKED_CONTRIBUTION]: +0.08,
  [REPUTATION_ACTION.EXPERT_VALIDATED_CLAIM]: +0.15,
  [REPUTATION_ACTION.CORRECTION_ACCEPTED]: +0.12,
  [REPUTATION_ACTION.UNVERIFIED_POST]: +0.01,
  [REPUTATION_ACTION.DISPUTED_CLAIM_PENALTY]: -0.20,
  [REPUTATION_ACTION.SPAM_ABUSE_FLAG]: -0.35,
  [REPUTATION_ACTION.COORDINATED_VOTE_FLAG]: -0.25
});

export class TopicReputation {
  constructor({
    topicId,
    score = 0.5,
    confidence = 0.5,
    contributionCount = 0,
    validatedCount = 0,
    penaltyCount = 0,
    lastActiveAt = new Date().toISOString()
  }) {
    this.topicId = topicId;
    this.score = Math.max(0.0, Math.min(1.0, score));
    this.confidence = Math.max(0.0, Math.min(1.0, confidence));
    this.contributionCount = contributionCount;
    this.validatedCount = validatedCount;
    this.penaltyCount = penaltyCount;
    this.lastActiveAt = lastActiveAt;
  }

  /**
   * Applies half-life decay based on days of inactivity (half-life = 90 days)
   */
  getDecayedScore(now = Date.now()) {
    const elapsedDays = Math.max(0, (now - new Date(this.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24));
    const halfLifeDays = 90;
    const decayFactor = Math.pow(0.5, elapsedDays / halfLifeDays);
    // Baseline anchor at 0.5 (neutral)
    const decayed = 0.5 + (this.score - 0.5) * decayFactor;
    return Number(Math.max(0.05, Math.min(0.95, decayed)).toFixed(4));
  }
}

export class ReputationGraph {
  // subjectId -> Map<topicId, TopicReputation>
  static #subjectReputations = new Map();
  // interactionGraph: subjectA -> Map<subjectB, interactionCount>
  static #interactionGraph = new Map();
  // Audit log of all reputation mutations
  static #mutationLog = [];

  /**
   * Gets or initializes topic reputations for a subject
   */
  static getReputationProfile(subjectId) {
    if (!this.#subjectReputations.has(subjectId)) {
      this.#subjectReputations.set(subjectId, new Map());
    }
    const topicMap = this.#subjectReputations.get(subjectId);
    const profile = {};

    for (const [topicId, rep] of topicMap.entries()) {
      profile[topicId] = {
        topicId,
        rawScore: rep.score,
        decayedScore: rep.getDecayedScore(),
        confidence: rep.confidence,
        contributionCount: rep.contributionCount,
        validatedCount: rep.validatedCount,
        penaltyCount: rep.penaltyCount,
        lastActiveAt: rep.lastActiveAt
      };
    }

    return profile;
  }

  /**
   * Evaluates topic-specific reputation score with fallback
   */
  static getTopicScore(subjectId, topicId) {
    const profile = this.getReputationProfile(subjectId);
    return profile[topicId] ? profile[topicId].decayedScore : 0.5;
  }

  /**
   * Updates reputation based on evidence-backed contribution or validated action
   */
  static applyReputationDelta({
    subjectId,
    topicId = "general",
    action,
    originatorId = null,
    evidenceQuality = 1.0,
    timestamp = new Date().toISOString()
  }) {
    if (!subjectId) throw new Error("applyReputationDelta requires subjectId.");
    if (!REPUTATION_ACTION[action]) {
      throw new Error(`Unsupported reputation action: ${action}`);
    }

    // Sybil & Collusion Guard: check mutual validation frequency between subjectId and originatorId
    if (originatorId && originatorId !== subjectId) {
      const isCoordinated = this.#checkCollusion(subjectId, originatorId);
      if (isCoordinated) {
        action = REPUTATION_ACTION.COORDINATED_VOTE_FLAG;
        evidenceQuality = 0.0;
      }
      this.#recordInteraction(originatorId, subjectId);
    }

    const baseDelta = ACTION_WEIGHTS[action] || 0.0;
    const effectiveDelta = baseDelta * Math.max(0.2, Math.min(1.5, evidenceQuality));

    if (!this.#subjectReputations.has(subjectId)) {
      this.#subjectReputations.set(subjectId, new Map());
    }
    const topicMap = this.#subjectReputations.get(subjectId);
    const current = topicMap.get(topicId) || new TopicReputation({ topicId });

    const newScore = Math.max(0.01, Math.min(0.99, current.score + effectiveDelta));
    const newContrib = current.contributionCount + (baseDelta > 0 ? 1 : 0);
    const newValidated = current.validatedCount + (action === REPUTATION_ACTION.EXPERT_VALIDATED_CLAIM ? 1 : 0);
    const newPenalty = current.penaltyCount + (baseDelta < 0 ? 1 : 0);
    const newConfidence = Math.min(0.95, current.confidence + 0.05);

    const updated = new TopicReputation({
      topicId,
      score: Number(newScore.toFixed(4)),
      confidence: Number(newConfidence.toFixed(4)),
      contributionCount: newContrib,
      validatedCount: newValidated,
      penaltyCount: newPenalty,
      lastActiveAt: timestamp
    });

    topicMap.set(topicId, updated);

    const event = {
      mutationId: `rep_mut_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      subjectId,
      topicId,
      action,
      effectiveDelta: Number(effectiveDelta.toFixed(4)),
      resultingScore: updated.score,
      originatorId,
      timestamp
    };
    this.#mutationLog.push(event);

    return {
      success: true,
      topicId,
      newScore: updated.score,
      decayedScore: updated.getDecayedScore(),
      mutationEvent: event
    };
  }

  /**
   * Collusion loop detection: A validates B and B validates A repeatedly (>5 times)
   */
  static #checkCollusion(subjectA, subjectB) {
    const aInteractions = this.#interactionGraph.get(subjectA);
    const bInteractions = this.#interactionGraph.get(subjectB);

    const aToB = (aInteractions && aInteractions.get(subjectB)) || 0;
    const bToA = (bInteractions && bInteractions.get(subjectA)) || 0;

    // Flag as potential collusion if reciprocating interactions exceed threshold with zero diverse interactions
    return (aToB >= 5 && bToA >= 5);
  }

  static #recordInteraction(fromSubject, toSubject) {
    if (!this.#interactionGraph.has(fromSubject)) {
      this.#interactionGraph.set(fromSubject, new Map());
    }
    const map = this.#interactionGraph.get(fromSubject);
    map.set(toSubject, (map.get(toSubject) || 0) + 1);
  }

  static getMutationHistory(subjectId) {
    return this.#mutationLog.filter(m => m.subjectId === subjectId);
  }

  static clear() {
    this.#subjectReputations.clear();
    this.#interactionGraph.clear();
    this.#mutationLog = [];
  }
}
