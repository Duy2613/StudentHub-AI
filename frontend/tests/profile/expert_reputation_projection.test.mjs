import test from "node:test";
import assert from "node:assert/strict";
import { ExpertProfileService } from "../../src/lib/server/profile/ExpertProfileService.js";
import { closePostgresPoolForTests } from "../../src/lib/server/database/PostgresPool.js";
import { configureDisposableDatabase } from "../helpers/disposableDbGuard.mjs";

const disposableDatabase = configureDisposableDatabase({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });

test("Expert Reputation Projection: Structure conforms to ExpertProfileViewDTO and policy boundaries", { skip: !disposableDatabase ? "DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV" : false }, async () => {
  const principal = {
    subjectId: "e2222222-2222-4222-8222-222222222222",
    email: "expert.verified@hcmute.edu.vn",
    isAuthenticated: true,
    roles: ["EXPERT"],
    attributes: {
      fullName: "TS. Nguyễn Chuyên Gia",
      emailVerified: true,
      institutionalEmailVerified: true,
    },
  };

  const view = await ExpertProfileService.getExpertProfileView({ principal });

  // 1. Identity
  assert.equal(view.identity.id, "e2222222-2222-4222-8222-222222222222");
  assert.equal(view.identity.fullName, "TS. Nguyễn Chuyên Gia");

  // 2. Expert core
  assert.ok(typeof view.expert === "object");
  assert.ok(typeof view.expert.active === "boolean");
  assert.ok(Array.isArray(view.expert.verifiedDomains));

  // 3. Qualification lifecycle
  assert.ok(typeof view.qualification === "object");
  assert.ok(typeof view.qualification.state === "string");

  // 4. Reputation projection
  assert.ok(typeof view.reputation === "object");
  assert.ok(typeof view.reputation.reputation === "number");
  assert.ok(typeof view.reputation.completedReviews === "number");
  assert.ok(view.reputation.policyNotice.includes("Reputation reflects platform contribution"));

  // 5. Work summary
  assert.ok(typeof view.work === "object");
  assert.ok(typeof view.work.assigned === "number");
  assert.ok(typeof view.work.inReview === "number");
  assert.ok(typeof view.work.completed === "number");

  // 6. Review Desk tasks and formal assessments
  assert.ok(Array.isArray(view.tasks));
  assert.ok(Array.isArray(view.assessments));

  // 7. No invented fake metrics
  assert.equal(view.reputation.accuracyPercentage, undefined);
  assert.equal(view.reputation.truthProbability, undefined);

  await closePostgresPoolForTests();
});
