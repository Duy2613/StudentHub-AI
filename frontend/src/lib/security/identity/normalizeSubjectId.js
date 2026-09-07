// Canonical identity normalization shared by server principal resolution and
// browser application-session hydration.

export const UUID_SUBJECT_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Remove a legacy type prefix only when the remaining value is a UUID. Legacy
 * non-UUID subjects stay intact so numeric student IDs and service subjects do
 * not silently change identity semantics.
 */
export function normalizeSubjectId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const unprefixed = raw.replace(/^(?:student|expert|user):/i, "").trim();
  return UUID_SUBJECT_PATTERN.test(unprefixed) ? unprefixed : raw;
}

export function normalizeUuidSubjectId(value) {
  const normalized = normalizeSubjectId(value);
  return UUID_SUBJECT_PATTERN.test(normalized) ? normalized : null;
}

