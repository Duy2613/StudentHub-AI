/**
 * StudentHub AI — server-owned demo account and identity truth policy.
 *
 * This module is intentionally server-only by convention.  It contains the
 * exact QA allowlist and the projection rules that keep mailbox verification,
 * institutional verification, and QA product access separate concepts.
 */

export const QA_VERIFICATION_SOURCE = "QA_PROVISIONED";
export const INSTITUTIONAL_VERIFICATION_SOURCE = "IDENTITY_PROVIDER_EMAIL_PROOF";
export const NO_VERIFICATION_SOURCE = "NONE";

export const DEMO_ENTITLEMENTS = Object.freeze({
  FULL_USER: "DEMO_FULL_USER_ACCESS",
  FULL_EXPERT: "DEMO_FULL_EXPERT_ACCESS",
  STUDENT_FEATURES: "QA_STUDENT_FEATURE_ACCESS",
});

const DEMO_ACCOUNT_SPECS = new Map([
  [
    "demo-user@gmail.com",
    Object.freeze({
      email: "demo-user@gmail.com",
      role: "STUDENT",
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
    }),
  ],
  [
    "demo-expert@gmail.com",
    Object.freeze({
      email: "demo-expert@gmail.com",
      role: "EXPERT",
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.FULL_EXPERT,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
    }),
  ],
]);

export const DEMO_ACCOUNT_ALLOWLIST = Object.freeze([...DEMO_ACCOUNT_SPECS.keys()]);

export function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getDemoAccountSpec(email) {
  return DEMO_ACCOUNT_SPECS.get(normalizeEmail(email)) || null;
}

export function assertDemoAccountEmail(email) {
  const normalized = normalizeEmail(email);
  if (!DEMO_ACCOUNT_SPECS.has(normalized)) {
    const error = new Error("DEMO_ACCOUNT_NOT_ALLOWLISTED");
    error.code = "DEMO_ACCOUNT_NOT_ALLOWLISTED";
    throw error;
  }
  return normalized;
}

/**
 * This is deliberately a domain-shape check, not a claim that every matching
 * domain is a known institution.  The caller must still require the provider
 * mailbox proof before treating the address as institutionally verified.
 */
export function isInstitutionalEmailAddress(email) {
  const normalized = normalizeEmail(email);
  const domain = normalized.split("@")[1] || "";
  return /(?:^|\.)edu(?:\.|$)|(?:^|\.)ac(?:\.|$)/i.test(domain);
}

export function normalizeQaEntitlements(value) {
  if (!Array.isArray(value)) return [];
  const allowed = new Set(Object.values(DEMO_ENTITLEMENTS));
  return [...new Set(value.map((entry) => String(entry || "").trim().toUpperCase()).filter((entry) => allowed.has(entry)))].sort();
}

export function deriveIdentityTruth({ email = "", emailVerified = false, qaEntitlements = [] } = {}) {
  const accountSpec = getDemoAccountSpec(email);
  const allowlistedEntitlements = new Set(accountSpec?.entitlements || []);
  // Even if a future server-side caller accidentally supplies an entitlement
  // for another user, the runtime projection remains fail-closed to the exact
  // two-account allowlist.
  const normalizedQaEntitlements = normalizeQaEntitlements(qaEntitlements)
    .filter((entry) => allowlistedEntitlements.has(entry));
  const institutionalEmailVerified = emailVerified === true && isInstitutionalEmailAddress(email);
  const hasQaStudentFeatureAccess = normalizedQaEntitlements.includes(DEMO_ENTITLEMENTS.STUDENT_FEATURES);
  const hasQaProductAccess = normalizedQaEntitlements.some((entry) => entry !== "");

  return {
    institutionalEmailVerified,
    verificationSource: institutionalEmailVerified
      ? INSTITUTIONAL_VERIFICATION_SOURCE
      : NO_VERIFICATION_SOURCE,
    qaEntitlements: normalizedQaEntitlements,
    qaStudentFeatureAccess: hasQaStudentFeatureAccess,
    demoFeatureAccess: hasQaProductAccess,
    demoAccessSource: hasQaProductAccess ? QA_VERIFICATION_SOURCE : null,
  };
}
