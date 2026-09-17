import crypto from "node:crypto";
import test from "node:test";
import assert from "node:assert/strict";
import { UserProfileService } from "../../src/lib/server/profile/UserProfileService.js";
import { closePostgresPoolForTests, getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { configureDisposableDatabase } from "../helpers/disposableDbGuard.mjs";

const disposableDatabase = configureDisposableDatabase({ envNames: ["STUDENTHUB_RLS_TEST_DATABASE_URL"] });
const testUserId = crypto.randomUUID();
const testEmail = `profile-activity-${testUserId}@example.test`;

test("Profile Activity Projection: UserProfileView structure adheres to DTO contract", { skip: !disposableDatabase ? "DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV" : false }, async () => {
  const pool = getPostgresPool();
  await pool.query(
    "insert into auth.users (id,email,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,email_confirmed_at) values ($1,$2,$3::jsonb,$4::jsonb,now(),now(),now()) on conflict (id) do nothing",
    [testUserId, testEmail, "{}", "{}"]
  );
  await pool.query(
    "insert into public.profiles (id,display_name,bio) values ($1,$2,null) on conflict (id) do update set display_name = excluded.display_name",
    [testUserId, "Nguyễn Văn Sinh Viên"]
  );

  const principal = {
    subjectId: testUserId,
    email: testEmail,
    isAuthenticated: true,
    roles: ["STUDENT"],
    attributes: {
      fullName: "Nguyễn Văn Sinh Viên",
      emailVerified: true,
      institutionalEmailVerified: true,
      verificationSource: "IDENTITY_PROVIDER_EMAIL_PROOF",
    },
  };

  const profileView = await UserProfileService.getUserProfileView({ principal });

  // 1. Identity DTO
  assert.equal(profileView.identity.id, testUserId);
  assert.equal(profileView.identity.fullName, "Nguyễn Văn Sinh Viên");
  assert.equal(profileView.identity.email, testEmail);

  // 2. Education DTO
  assert.equal(profileView.education.studentVerification, "VERIFIED");
  assert.equal(profileView.education.institutionalEmailVerified, true);

  // 3. Trust Activity DTO
  assert.ok(typeof profileView.trustActivity === "object");
  assert.ok(typeof profileView.trustActivity.count === "number");
  assert.ok(Array.isArray(profileView.trustActivity.recentCases));
  assert.ok(typeof profileView.trustActivity.pendingExpertRequests === "number");

  // 4. Community Activity DTO
  assert.ok(typeof profileView.communityActivity === "object");
  assert.ok(typeof profileView.communityActivity.posts === "number");
  assert.ok(typeof profileView.communityActivity.comments === "number");
  assert.ok(Array.isArray(profileView.communityActivity.recentActivity));

  // 5. Expert Requests DTO
  assert.ok(typeof profileView.expertRequests === "object");
  assert.ok(typeof profileView.expertRequests.total === "number");
  assert.ok(typeof profileView.expertRequests.pending === "number");
  assert.ok(typeof profileView.expertRequests.inReview === "number");
  assert.ok(typeof profileView.expertRequests.completed === "number");
  assert.ok(Array.isArray(profileView.expertRequests.recentRequests));

  // 6. Security boundaries: TrustScore and StarLevel are null on UserProfile
  assert.equal(profileView.trustScore, null);
  assert.equal(profileView.starLevel, null);

  await pool.query("delete from public.profiles where id = $1", [testUserId]);
  await pool.query("delete from auth.users where id = $1", [testUserId]);
  await closePostgresPoolForTests();
});
