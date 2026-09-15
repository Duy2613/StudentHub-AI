/**
 * Presentation-only auth state.
 *
 * These values are derived from the server-owned application session and the
 * server-owned expert qualification state. They are not permissions and must
 * never be inferred from profile.role, localStorage, or user metadata.
 */

export const PRESENTATION_STATE = Object.freeze({
  ANONYMOUS: "ANONYMOUS",
  AUTHENTICATED_USER: "AUTHENTICATED_USER",
  EXPERT_CANDIDATE: "EXPERT_CANDIDATE",
  ACTIVE_EXPERT: "ACTIVE_EXPERT",
});

export const EXPERT_LIFECYCLE_STATE = Object.freeze({
  NONE: "NONE",
  APPLICATION: "APPLICATION",
  IDENTITY_REVIEW: "IDENTITY_REVIEW",
  QUIZ: "QUIZ",
  PRACTICE: "PRACTICE",
  HUMAN_REVIEW: "HUMAN_REVIEW",
  ACTIVE: "ACTIVE",
  REJECTED: "REJECTED",
  APPEALED: "APPEALED",
  SUSPENDED: "SUSPENDED",
});

const CANDIDATE_STATES = new Set([
  EXPERT_LIFECYCLE_STATE.APPLICATION,
  EXPERT_LIFECYCLE_STATE.IDENTITY_REVIEW,
  EXPERT_LIFECYCLE_STATE.QUIZ,
  EXPERT_LIFECYCLE_STATE.PRACTICE,
  EXPERT_LIFECYCLE_STATE.HUMAN_REVIEW,
  EXPERT_LIFECYCLE_STATE.REJECTED,
  EXPERT_LIFECYCLE_STATE.APPEALED,
  EXPERT_LIFECYCLE_STATE.SUSPENDED,
]);

export function hasCanonicalSession(session) {
  return session?.authority === "APPLICATION_SESSION" && Boolean(session?.user?.id);
}

export function normalizeExpertLifecycleState(value) {
  const state = String(value || "").trim().toUpperCase();
  if (!state || state === "NOT_APPLIED") return EXPERT_LIFECYCLE_STATE.NONE;
  if (["QUIZ_ELIGIBLE", "QUIZ_IN_PROGRESS"].includes(state)) return EXPERT_LIFECYCLE_STATE.QUIZ;
  if (state === "DOMAIN_REVIEW") return EXPERT_LIFECYCLE_STATE.HUMAN_REVIEW;
  if (state === "ACTIVE") return EXPERT_LIFECYCLE_STATE.ACTIVE;
  if (state === "REJECTED") return EXPERT_LIFECYCLE_STATE.REJECTED;
  if (state === "APPEALED") return EXPERT_LIFECYCLE_STATE.APPEALED;
  if (state === "SUSPENDED") return EXPERT_LIFECYCLE_STATE.SUSPENDED;
  if (["APPLICATION", "IDENTITY_REVIEW", "QUIZ", "PRACTICE", "HUMAN_REVIEW", "NONE"].includes(state)) return state;
  return EXPERT_LIFECYCLE_STATE.APPLICATION;
}

export function resolvePresentationState({ session, expertState } = {}) {
  if (!hasCanonicalSession(session)) return PRESENTATION_STATE.ANONYMOUS;
  const lifecycle = normalizeExpertLifecycleState(expertState);
  if (lifecycle === EXPERT_LIFECYCLE_STATE.ACTIVE) return PRESENTATION_STATE.ACTIVE_EXPERT;
  if (CANDIDATE_STATES.has(lifecycle)) return PRESENTATION_STATE.EXPERT_CANDIDATE;
  return PRESENTATION_STATE.AUTHENTICATED_USER;
}

export function isModeratorEligible(session) {
  const roles = Array.isArray(session?.user?.roles) ? session.user.roles : [];
  return roles.some((role) => ["MODERATOR", "ADMIN"].includes(String(role).trim().toUpperCase()));
}
