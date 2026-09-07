export const LABBE_ASSURANCE_STATUS = Object.freeze(["CURRENT", "STALE", "UNAVAILABLE"]);
export const LABBE_ASSURANCE_PERMISSION = "ADMIN.SECURITY";
export const LABBE_ASSURANCE_FRESHNESS_MS = 5 * 60 * 1000;

function validAuthorization(authorization) {
  return authorization?.allowed === true
    && authorization?.permission === LABBE_ASSURANCE_PERMISSION;
}

function unavailable(reason, checkedAt) {
  return {
    status: "UNAVAILABLE",
    source: "LABBE_READ_ONLY",
    reason,
    checked_at: checkedAt,
  };
}

/**
 * Projects an independently authorized Labbe observation without importing
 * or changing Trust state. The projection intentionally contains no verdict,
 * enforcement, expert, community, or user-moderation fields.
 */
export function projectLabbeAssurance({
  observation = null,
  authorization = null,
  now = new Date(),
  freshnessMs = LABBE_ASSURANCE_FRESHNESS_MS,
} = {}) {
  const checkedAt = new Date(now);
  if (Number.isNaN(checkedAt.getTime())) return unavailable("CHECK_TIME_INVALID", new Date().toISOString());
  const checkedAtIso = checkedAt.toISOString();

  if (!validAuthorization(authorization)) return unavailable("AUTHORIZATION_REQUIRED", checkedAtIso);
  if (!observation || typeof observation !== "object" || Array.isArray(observation)) {
    return unavailable("NO_AUTHORIZED_OBSERVATION", checkedAtIso);
  }

  const eventId = typeof observation.event_id === "string" ? observation.event_id.trim() : "";
  const payloadHash = typeof observation.payload_hash === "string" ? observation.payload_hash.trim().toLowerCase() : "";
  const observedAt = new Date(observation.observed_at);
  const boundedFreshnessMs = Number.isFinite(freshnessMs) && freshnessMs >= 0 ? Math.floor(freshnessMs) : LABBE_ASSURANCE_FRESHNESS_MS;
  if (!eventId || !/^[0-9a-f]{64}$/i.test(payloadHash) || Number.isNaN(observedAt.getTime())) {
    return unavailable("OBSERVATION_INVALID", checkedAtIso);
  }

  const ageMs = checkedAt.getTime() - observedAt.getTime();
  if (ageMs < 0) return unavailable("OBSERVATION_CLOCK_SKEW", checkedAtIso);
  return {
    status: ageMs <= boundedFreshnessMs ? "CURRENT" : "STALE",
    source: "LABBE_READ_ONLY",
    event_id: eventId,
    payload_hash: payloadHash,
    observed_at: observedAt.toISOString(),
    checked_at: checkedAtIso,
    age_ms: ageMs,
    freshness_ms: boundedFreshnessMs,
  };
}
