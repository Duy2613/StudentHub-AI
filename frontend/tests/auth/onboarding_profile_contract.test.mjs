import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { buildOnboardingProfilePayload } from "../../src/lib/auth/onboardingProfile.js";

const root = new URL("../../../", import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root), "utf8");

test("onboarding sends only safe presentation fields and completes the server-owned state", () => {
  const payload = buildOnboardingProfilePayload({
    fullName: "  Duy Nguyen  ",
    avatarId: "student-tech",
    university: "ĐHQG TP.HCM",
    major: "Kỹ thuật phần mềm",
    academicYear: "K65",
    isExpert: false,
    bio: "Sinh viên StudentHub",
  });

  assert.deepEqual(Object.keys(payload).sort(), [
    "academicYear",
    "avatarId",
    "bio",
    "fullName",
    "major",
    "onboardingCompleted",
    "university",
  ]);
  assert.equal(payload.fullName, "Duy Nguyen");
  assert.equal(payload.onboardingCompleted, true);
  assert.equal("role" in payload, false);
  assert.equal("email" in payload, false);
  assert.equal("expertField" in payload, false);
  assert.equal("trustScore" in payload, false);
});

test("expert onboarding still stores safe profile data without granting client authority", () => {
  const payload = buildOnboardingProfilePayload({
    fullName: "Expert",
    avatarId: "expert-security",
    university: "Should not be authority",
    major: "Should not be authority",
    academicYear: "Should not be authority",
    isExpert: true,
  });

  assert.equal(payload.university, null);
  assert.equal(payload.major, null);
  assert.equal(payload.academicYear, null);
  assert.equal(payload.onboardingCompleted, true);
});

test("onboarding uses the canonical safe update flow", () => {
  const onboarding = read("frontend/src/app/onboarding/page.jsx");
  const authContext = read("frontend/src/lib/auth/AuthContext.jsx");
  const authService = read("frontend/src/lib/auth/authService.js");

  assert.match(onboarding, /updateProfile\(buildOnboardingProfilePayload\(/);
  assert.doesNotMatch(onboarding, /fetch\("\/api\/users\/profile"/);
  assert.match(authContext, /"onboardingCompleted"/);
  assert.match(authService, /"onboardingCompleted"/);
});
