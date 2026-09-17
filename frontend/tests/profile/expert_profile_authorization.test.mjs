import test from "node:test";
import assert from "node:assert/strict";
import { ExpertProfileService, ExpertProfileServiceError } from "../../src/lib/server/profile/ExpertProfileService.js";

const EXPERT_PRINCIPAL = {
  subjectId: "e0000000-0000-4000-8000-000000000002",
  email: "demo-expert@gmail.com",
  isAuthenticated: true,
  roles: ["EXPERT"],
  attributes: {
    fullName: "Chuyên gia Demo",
    emailVerified: true,
    institutionalEmailVerified: true,
  },
};

test("Expert Profile Authorization: Modification of server-owned authority fields is DENIED", async () => {
  const forbiddenAttempts = [
    { starLevel: 5 },
    { StarLevel: 5 },
    { reputation: 9999 },
    { Reputation: 9999 },
    { role: "ADMIN" },
    { roles: ["ADMIN"] },
    { active: true },
    { Active: true },
    { qualification: "APPROVED" },
    { qualificationStatus: "ACTIVE" },
    { verifiedDomains: ["FINANCE_FRAUD", "MEDICINE"] },
    { VerifiedDomains: ["ALL"] },
    { completedReviews: 100 },
    { trustScore: 100 },
    { authority: "SUPREME" },
  ];

  for (const attempt of forbiddenAttempts) {
    await assert.rejects(
      async () => {
        await ExpertProfileService.updateExpertProfile({
          principal: EXPERT_PRINCIPAL,
          updates: attempt,
        });
      },
      (error) => {
        assert.ok(error instanceof ExpertProfileServiceError);
        assert.equal(error.code, "FORBIDDEN_PROFILE_MUTATION");
        assert.equal(error.statusCode, 400);
        return true;
      },
      `Expected field ${Object.keys(attempt)[0]} to be rejected with FORBIDDEN_PROFILE_MUTATION`
    );
  }
});

test("Expert Profile Authorization: Unknown fields are rejected", async () => {
  await assert.rejects(
    async () => {
      await ExpertProfileService.updateExpertProfile({
        principal: EXPERT_PRINCIPAL,
        updates: { randomPrivilegeField: "grant" },
      });
    },
    (error) => {
      assert.ok(error instanceof ExpertProfileServiceError);
      assert.equal(error.code, "UNKNOWN_PROFILE_FIELD");
      assert.equal(error.statusCode, 400);
      return true;
    }
  );
});

test("Expert Profile Authorization: Anonymous expert profile access fails with authentication error", async () => {
  await assert.rejects(
    async () => {
      await ExpertProfileService.getExpertProfileView({
        principal: { isAuthenticated: false },
      });
    },
    (err) => err.code === "AUTHENTICATION_REQUIRED" || /authentication/i.test(err.message)
  );
});
