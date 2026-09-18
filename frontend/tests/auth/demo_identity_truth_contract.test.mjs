import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEMO_ACCOUNT_ALLOWLIST,
  DEMO_ENTITLEMENTS,
  QA_VERIFICATION_SOURCE,
  deriveIdentityTruth,
  getDemoAccountSpec,
  isInstitutionalEmailAddress,
} from "../../src/lib/server/auth/demoAccountPolicy.js";

const root = resolve(import.meta.dirname, "../../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("demo allowlist is exact and Gmail mailbox proof does not become student-email proof", () => {
  assert.deepEqual(DEMO_ACCOUNT_ALLOWLIST, [
    "demo-user@gmail.com",
    "demo-user1@gmail.com",
    "demo-user2@gmail.com",
    "demo-user3@gmail.com",
    "demo-expert@gmail.com",
    "demo-expert1@gmail.com",
    "demo-expert2@gmail.com",
    "demo-expert3@gmail.com",
  ]);
  assert.equal(getDemoAccountSpec("attacker@gmail.com"), null);
  assert.equal(isInstitutionalEmailAddress("demo-user@gmail.com"), false);

  const truth = deriveIdentityTruth({
    email: "demo-user@gmail.com",
    emailVerified: true,
    qaEntitlements: getDemoAccountSpec("demo-user@gmail.com").entitlements,
  });
  assert.equal(truth.institutionalEmailVerified, false);
  assert.equal(truth.verificationSource, "NONE");
  assert.equal(truth.qaStudentFeatureAccess, true);
  assert.equal(truth.demoAccessSource, QA_VERIFICATION_SOURCE);
  assert.ok(truth.qaEntitlements.includes(DEMO_ENTITLEMENTS.STUDENT_FEATURES));
  assert.equal(deriveIdentityTruth({
    email: "other-user@gmail.com",
    emailVerified: true,
    qaEntitlements: [DEMO_ENTITLEMENTS.STUDENT_FEATURES],
  }).demoFeatureAccess, false);
});

test("institutional truth requires both an institutional-shaped address and mailbox proof", () => {
  assert.equal(deriveIdentityTruth({ email: "student@hcmute.edu.vn", emailVerified: true }).institutionalEmailVerified, true);
  assert.equal(deriveIdentityTruth({ email: "student@hcmute.edu.vn", emailVerified: false }).institutionalEmailVerified, false);
  assert.equal(deriveIdentityTruth({ email: "student@gmail.com", emailVerified: true }).institutionalEmailVerified, false);
});

test("QA entitlements are private and the public routes expose separate truth fields", () => {
  const migration = read("database/migrations/202609170002_demo_entitlements.sql");
  const sessionRoute = read("frontend/src/app/api/auth/session/route.js");
  const profileRoute = read("frontend/src/app/api/users/profile/route.js");
  const communityRoute = read("frontend/src/app/api/intelligence/community/posts/route.js");
  const provisioner = read("scripts/provision-demo-accounts.mjs");

  assert.match(migration, /private\.demo_entitlements/);
  assert.match(migration, /source text not null default 'QA_PROVISIONED'/);
  assert.match(migration, /revoke all on private\.demo_entitlements from public, anon, authenticated/);
  assert.match(sessionRoute, /institutionalEmailVerified: attributes\.institutionalEmailVerified === true/);
  assert.match(sessionRoute, /qaStudentFeatureAccess: attributes\.qaStudentFeatureAccess === true/);
  assert.match(profileRoute, /verificationSource: principal\.attributes\?\.verificationSource/);
  assert.match(communityRoute, /identityTruth\.institutionalEmailVerified \? "VERIFIED_STUDENT"/);
  assert.doesNotMatch(communityRoute, /principal\.attributes\?\.emailVerified \? "VERIFIED_STUDENT"/);
  assert.match(provisioner, /ALLOW_DEMO_PROVISIONING/);
  assert.match(provisioner, /DEMO_ACCOUNT_NOT_ALLOWLISTED/);
});
