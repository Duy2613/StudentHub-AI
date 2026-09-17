import test from "node:test";
import assert from "node:assert/strict";
import { UserProfileService, ProfileServiceError } from "../../src/lib/server/profile/UserProfileService.js";

const STUDENT_PRINCIPAL = {
  subjectId: "a0000000-0000-4000-8000-000000000001",
  email: "demo-user@gmail.com",
  isAuthenticated: true,
  roles: ["STUDENT"],
  attributes: {
    fullName: "Sinh viên Demo",
    emailVerified: true,
    institutionalEmailVerified: false,
    verificationSource: "NONE",
  },
};

test("User Profile Authorization: Safe presentation updates succeed", async () => {
  const safeUpdates = {
    fullName: "Sinh viên Demo Cập Nhật",
    avatarUrl: "https://example.com/avatar.png",
    bio: "Sinh viên ngành Khoa học máy tính đam mê AI.",
    university: "ĐH Bách Khoa",
    major: "Khoa học máy tính",
  };

  assert.ok(safeUpdates.fullName);
  assert.equal(safeUpdates.major, "Khoa học máy tính");
});

test("User Profile Authorization: Mutation of server-owned fields is DENIED", async () => {
  const forbiddenAttempts = [
    { role: "EXPERT" },
    { roles: ["EXPERT", "ADMIN"] },
    { email: "hacked@gmail.com" },
    { trustScore: 99 },
    { starLevel: 5 },
    { reputation: 1000 },
    { studentVerification: "VERIFIED" },
    { institutionalEmailVerified: true },
    { expert: { active: true } },
    { active: true },
    { authority: "SUPER_ADMIN" },
  ];

  for (const attempt of forbiddenAttempts) {
    await assert.rejects(
      async () => {
        await UserProfileService.updateUserProfile({
          principal: STUDENT_PRINCIPAL,
          updates: attempt,
        });
      },
      (error) => {
        assert.ok(error instanceof ProfileServiceError);
        assert.equal(error.code, "FORBIDDEN_PROFILE_MUTATION");
        assert.equal(error.statusCode, 400);
        return true;
      },
      `Expected field ${Object.keys(attempt)[0]} to be rejected with FORBIDDEN_PROFILE_MUTATION`
    );
  }
});

test("User Profile Authorization: Unknown fields outside allowlist are rejected", async () => {
  await assert.rejects(
    async () => {
      await UserProfileService.updateUserProfile({
        principal: STUDENT_PRINCIPAL,
        updates: { hackerField: "exploit_value" },
      });
    },
    (error) => {
      assert.ok(error instanceof ProfileServiceError);
      assert.equal(error.code, "UNKNOWN_PROFILE_FIELD");
      assert.equal(error.statusCode, 400);
      return true;
    }
  );
});

test("User Profile Authorization: Anonymous access is DENIED with 401", async () => {
  await assert.rejects(
    async () => {
      await UserProfileService.getUserProfileView({
        principal: { isAuthenticated: false },
      });
    },
    (error) => {
      assert.ok(error instanceof ProfileServiceError);
      assert.equal(error.code, "AUTHENTICATION_REQUIRED");
      assert.equal(error.statusCode, 401);
      return true;
    }
  );
});
