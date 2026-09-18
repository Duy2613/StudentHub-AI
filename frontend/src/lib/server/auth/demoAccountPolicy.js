/**
 * StudentHub AI — server-owned demo account and identity truth policy.
 *
 * This module is intentionally server-only by convention. It contains the
 * exact QA allowlist (8 controlled identities) and the projection rules that
 * keep mailbox verification, institutional verification, and QA product access
 * strictly separate concepts.
 */

export const QA_VERIFICATION_SOURCE = "QA_PROVISIONED";
export const INSTITUTIONAL_VERIFICATION_SOURCE = "IDENTITY_PROVIDER_EMAIL_PROOF";
export const NO_VERIFICATION_SOURCE = "NONE";

export const DEMO_ENTITLEMENTS = Object.freeze({
  FULL_USER: "DEMO_FULL_USER_ACCESS",
  FULL_EXPERT: "DEMO_FULL_EXPERT_ACCESS",
  STUDENT_FEATURES: "QA_STUDENT_FEATURE_ACCESS",
});

export const QA_SCOPES = Object.freeze({
  // User QA Scopes
  PROFILE_FULL: "PROFILE_FULL",
  DASHBOARD_FULL: "DASHBOARD_FULL",
  ACADEMIC_FULL: "ACADEMIC_FULL",
  TIMETABLE_MANUAL: "TIMETABLE_MANUAL",
  TIMETABLE_AI_IMPORT: "TIMETABLE_AI_IMPORT",
  ACADEMIC_TASKS: "ACADEMIC_TASKS",
  REMINDERS: "REMINDERS",
  NOTIFICATION_FULL: "NOTIFICATION_FULL",
  COMMUNITY_READ: "COMMUNITY_READ",
  COMMUNITY_WRITE: "COMMUNITY_WRITE",
  COMMUNITY_COMMENT: "COMMUNITY_COMMENT",
  COMMUNITY_REACTION: "COMMUNITY_REACTION",
  TRUST_FULL: "TRUST_FULL",
  TRUST_HISTORY: "TRUST_HISTORY",
  ASK_EXPERT: "ASK_EXPERT",
  EXPERT_DIRECTORY_READ: "EXPERT_DIRECTORY_READ",
  ASSESSMENT_RESULT_READ: "ASSESSMENT_RESULT_READ",
  SETTINGS_FULL: "SETTINGS_FULL",

  // Expert QA Scopes
  EXPERT_PROFILE_FULL: "EXPERT_PROFILE_FULL",
  EXPERT_REVIEW_DESK: "EXPERT_REVIEW_DESK",
  EXPERT_ASSIGNMENT_READ: "EXPERT_ASSIGNMENT_READ",
  EXPERT_ASSIGNMENT_ACTION: "EXPERT_ASSIGNMENT_ACTION",
  EXPERT_FORMAL_ASSESSMENT: "EXPERT_FORMAL_ASSESSMENT",
  EXPERT_ASSESSMENT_HISTORY: "EXPERT_ASSESSMENT_HISTORY",
  EXPERT_COMMUNITY_RESPONSE: "EXPERT_COMMUNITY_RESPONSE",
  EXPERT_REPUTATION_READ: "EXPERT_REPUTATION_READ",
  EXPERT_WORK_SUMMARY: "EXPERT_WORK_SUMMARY",
  QA_MULTI_DOMAIN_REVIEW: "QA_MULTI_DOMAIN_REVIEW",
});

const USER_BASE_SCOPES = Object.freeze([
  QA_SCOPES.PROFILE_FULL,
  QA_SCOPES.DASHBOARD_FULL,
  QA_SCOPES.ACADEMIC_FULL,
  QA_SCOPES.TIMETABLE_MANUAL,
  QA_SCOPES.TIMETABLE_AI_IMPORT,
  QA_SCOPES.ACADEMIC_TASKS,
  QA_SCOPES.REMINDERS,
  QA_SCOPES.NOTIFICATION_FULL,
  QA_SCOPES.COMMUNITY_READ,
  QA_SCOPES.COMMUNITY_WRITE,
  QA_SCOPES.COMMUNITY_COMMENT,
  QA_SCOPES.COMMUNITY_REACTION,
  QA_SCOPES.TRUST_FULL,
  QA_SCOPES.TRUST_HISTORY,
  QA_SCOPES.ASK_EXPERT,
  QA_SCOPES.EXPERT_DIRECTORY_READ,
  QA_SCOPES.ASSESSMENT_RESULT_READ,
  QA_SCOPES.SETTINGS_FULL,
]);

const EXPERT_BASE_SCOPES = Object.freeze([
  ...USER_BASE_SCOPES,
  QA_SCOPES.EXPERT_PROFILE_FULL,
  QA_SCOPES.EXPERT_REVIEW_DESK,
  QA_SCOPES.EXPERT_ASSIGNMENT_READ,
  QA_SCOPES.EXPERT_ASSIGNMENT_ACTION,
  QA_SCOPES.EXPERT_FORMAL_ASSESSMENT,
  QA_SCOPES.EXPERT_ASSESSMENT_HISTORY,
  QA_SCOPES.EXPERT_COMMUNITY_RESPONSE,
  QA_SCOPES.EXPERT_REPUTATION_READ,
  QA_SCOPES.EXPERT_WORK_SUMMARY,
  QA_SCOPES.QA_MULTI_DOMAIN_REVIEW,
]);

export const DEMO_ACCOUNT_SPECS = new Map([
  // USER_0: Full Active User (happy path)
  [
    "demo-user@gmail.com",
    Object.freeze({
      email: "demo-user@gmail.com",
      role: "STUDENT",
      scenario: "FULL_ACTIVE",
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
      scopes: USER_BASE_SCOPES,
    }),
  ],
  // USER_1: Brand New User (first-time empty state)
  [
    "demo-user1@gmail.com",
    Object.freeze({
      email: "demo-user1@gmail.com",
      role: "STUDENT",
      scenario: "NEW_USER",
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
      scopes: USER_BASE_SCOPES,
    }),
  ],
  // USER_2: Heavy Returning User (high density data)
  [
    "demo-user2@gmail.com",
    Object.freeze({
      email: "demo-user2@gmail.com",
      role: "STUDENT",
      scenario: "HEAVY_RETURNING",
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
      scopes: USER_BASE_SCOPES,
    }),
  ],
  // USER_3: Edge / Restricted User (missing optional fields, permission tests)
  [
    "demo-user3@gmail.com",
    Object.freeze({
      email: "demo-user3@gmail.com",
      role: "STUDENT",
      scenario: "EDGE_RESTRICTED",
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
      scopes: USER_BASE_SCOPES,
    }),
  ],

  // EXPERT_0: Senior Expert (5★, senior full QA)
  [
    "demo-expert@gmail.com",
    Object.freeze({
      email: "demo-expert@gmail.com",
      role: "EXPERT",
      scenario: "SENIOR_FULL_QA",
      targetStarLevel: 5,
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.FULL_EXPERT,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
      scopes: EXPERT_BASE_SCOPES,
    }),
  ],
  // EXPERT_1: Newly Qualified Expert (1★)
  [
    "demo-expert1@gmail.com",
    Object.freeze({
      email: "demo-expert1@gmail.com",
      role: "EXPERT",
      scenario: "NEWLY_QUALIFIED",
      targetStarLevel: 1,
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.FULL_EXPERT,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
      scopes: EXPERT_BASE_SCOPES,
    }),
  ],
  // EXPERT_2: Mid-Level Expert (3★)
  [
    "demo-expert2@gmail.com",
    Object.freeze({
      email: "demo-expert2@gmail.com",
      role: "EXPERT",
      scenario: "MID_LEVEL",
      targetStarLevel: 3,
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.FULL_EXPERT,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
      scopes: EXPERT_BASE_SCOPES,
    }),
  ],
  // EXPERT_3: Near Promotion Expert (4★ near 5★)
  [
    "demo-expert3@gmail.com",
    Object.freeze({
      email: "demo-expert3@gmail.com",
      role: "EXPERT",
      scenario: "NEAR_PROMOTION",
      targetStarLevel: 4,
      entitlements: Object.freeze([
        DEMO_ENTITLEMENTS.FULL_USER,
        DEMO_ENTITLEMENTS.FULL_EXPERT,
        DEMO_ENTITLEMENTS.STUDENT_FEATURES,
      ]),
      scopes: EXPERT_BASE_SCOPES,
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

export function isDemoAccountEmail(email) {
  return DEMO_ACCOUNT_SPECS.has(normalizeEmail(email));
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
 * Domain-shape check for institutional addresses.
 * Does NOT substitute for mailbox confirmation proof.
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
