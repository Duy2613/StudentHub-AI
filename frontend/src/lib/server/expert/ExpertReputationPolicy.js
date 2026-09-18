/**
 * StudentHub AI — Server-Owned Canonical Expert Reputation Policy V1
 *
 * Single authority for Expert StarLevel and Reputation calculations.
 * Client mutation of starLevel, reputation, and completedReviews is strictly prohibited.
 */

export const EXPERT_REPUTATION_POLICY_VERSION = "EXPERT_REPUTATION_POLICY_V1";

export const STAR_THRESHOLDS = Object.freeze({
  STAR_5: Object.freeze({ starLevel: 5, minCompletedReviews: 50, minReputation: 250 }),
  STAR_4: Object.freeze({ starLevel: 4, minCompletedReviews: 30, minReputation: 150 }),
  STAR_3: Object.freeze({ starLevel: 3, minCompletedReviews: 15, minReputation: 75 }),
  STAR_2: Object.freeze({ starLevel: 2, minCompletedReviews: 5, minReputation: 25 }),
  STAR_1: Object.freeze({ starLevel: 1, minCompletedReviews: 1, minReputation: 10 }),
});

export const REPUTATION_DELTAS = Object.freeze({
  EXPERT_ASSESSMENT_COMPLETED: 5,
  EXPERT_REVIEW_ACCEPTED: 0,
});

export const REWARD_EVENTS_PER_NORMAL_ASSESSMENT = 1;

/**
 * Calculates server-owned StarLevel for an Expert from verified inputs.
 *
 * @param {Object} params
 * @param {number} params.completedReviews - Number of completed formal assessments/reviews
 * @param {number} params.reputation - Total reputation points from private.reputation_events
 * @param {string} [params.qualificationState] - Current qualification state (e.g. 'ACTIVE', 'DOMAIN_VERIFIED')
 * @param {string} [params.activationState] - Current activation state (e.g. 'ACTIVE')
 * @param {Date|string|null} [params.suspendedAt] - Suspension timestamp if suspended
 * @returns {number|null} StarLevel (1..5) or null if unrated/suspended/unqualified
 */
export function calculateStarLevel({
  completedReviews = 0,
  reputation = 0,
  qualificationState = "ACTIVE",
  activationState = "ACTIVE",
  suspendedAt = null,
} = {}) {
  // Quality Gate 1: Suspended experts have no active StarLevel
  if (suspendedAt) {
    return null;
  }

  // Quality Gate 2: Must have valid active/verified qualification
  const validQualificationStates = ["ACTIVE", "DOMAIN_VERIFIED"];
  if (!validQualificationStates.includes(String(qualificationState || "").toUpperCase())) {
    return null;
  }

  // Quality Gate 3: Activation state must be active
  if (String(activationState || "").toUpperCase() !== "ACTIVE") {
    return null;
  }

  const reviews = Math.max(0, Number(completedReviews) || 0);
  const rep = Math.max(0, Number(reputation) || 0);

  // Unrated if no completed reviews and no reputation
  if (reviews === 0 && rep === 0) {
    return null;
  }

  // Threshold evaluation from highest to lowest
  if (reviews >= STAR_THRESHOLDS.STAR_5.minCompletedReviews && rep >= STAR_THRESHOLDS.STAR_5.minReputation) {
    return 5;
  }
  if (reviews >= STAR_THRESHOLDS.STAR_4.minCompletedReviews && rep >= STAR_THRESHOLDS.STAR_4.minReputation) {
    return 4;
  }
  if (reviews >= STAR_THRESHOLDS.STAR_3.minCompletedReviews && rep >= STAR_THRESHOLDS.STAR_3.minReputation) {
    return 3;
  }
  if (reviews >= STAR_THRESHOLDS.STAR_2.minCompletedReviews && rep >= STAR_THRESHOLDS.STAR_2.minReputation) {
    return 2;
  }
  if (reviews >= STAR_THRESHOLDS.STAR_1.minCompletedReviews || rep >= STAR_THRESHOLDS.STAR_1.minReputation) {
    return 1;
  }

  return 1;
}

export class ExpertReputationPolicy {
  static get version() {
    return EXPERT_REPUTATION_POLICY_VERSION;
  }

  static get thresholds() {
    return STAR_THRESHOLDS;
  }

  static get deltas() {
    return REPUTATION_DELTAS;
  }

  static calculateStarLevel(params) {
    return calculateStarLevel(params);
  }
}
