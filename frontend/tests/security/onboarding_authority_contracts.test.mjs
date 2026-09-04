import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { GET as getProfile, PUT as putProfile } from "../../src/app/api/users/profile/route.js";
import { POST as verifyEducation } from "../../src/app/api/users/verify-edu/route.js";
import { IdentityResolver } from "../../src/lib/security/identity/IdentityResolver.js";
import { setDurableSessionServiceForTests } from "../../src/lib/security/identity/DurableSessionService.js";
import { TokenValidator } from "../../src/lib/security/identity/TokenValidator.js";

const validator = new TokenValidator();
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function authRequest(path, { subject = USER_A, email = "user-a@gmail.com", body, method = "GET", extraHeaders = {} } = {}) {
  const token = validator.signToken({ sub: subject, email, roles: ["student"] });
  const headers = { Authorization: `Bearer ${token}`, ...extraHeaders };
  if (body !== undefined) headers["content-type"] = "application/json";
  return new Request(`https://staging-contract.test${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("Onboarding/profile authority contracts", () => {
  before(() => {
    delete process.env.DATABASE_URL;
    delete process.env.STUDENTHUB_RLS_TEST_DATABASE_URL;
    process.env.NODE_ENV = "test";
  });

  after(() => {
    setDurableSessionServiceForTests(undefined);
  });

  it("allows ordinary student onboarding while ignoring authority fields", async () => {
    const response = await putProfile(authRequest("/api/users/profile", {
      method: "PUT",
      body: {
        fullName: "User A",
        avatarId: "student-tech",
        university: "Claimed University",
        major: "Computer Science",
        academicYear: "2026",
        bio: "A normal onboarding profile.",
        onboardingCompleted: true,
        email: "user-a@gmail.com",
        ownerId: USER_B,
        role: "ADMIN",
        trustScore: 999,
        reputationScore: 999,
        universityEmailVerified: true,
        verifiedStudent: true,
        expert: true,
        verifiedExpert: true,
      }
    }));

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.profile.supabaseUserId, USER_A);
    assert.equal(payload.profile.email, "user-a@gmail.com");
    assert.equal(payload.profile.role, "student");
    assert.equal(payload.profile.universityEmailVerified, false);
    assert.equal(payload.profile.trustScore, 50);
    assert.equal(payload.profile.onboardingCompleted, true);
    assert.equal(payload.profile.expertField, undefined);

    const safeProfileUpdate = await putProfile(authRequest("/api/users/profile", {
      method: "PUT",
      body: { fullName: "User A display update" },
    }));
    assert.equal(safeProfileUpdate.status, 200);
    const safeProfilePayload = await safeProfileUpdate.json();
    assert.equal(
      safeProfilePayload.profile.onboardingCompleted,
      true,
      "omitting onboardingCompleted must preserve the server-owned state"
    );
  });

  it("enforces owner binding and rejects anonymous profile access", async () => {
    const own = await getProfile(authRequest("/api/users/profile"));
    assert.equal(own.status, 200);

    const foreignRead = await getProfile(authRequest(`/api/users/profile?email=user-a@gmail.com`, {
      subject: USER_B,
      email: "user-b@gmail.com",
    }));
    assert.equal(foreignRead.status, 403);

    const foreignWrite = await putProfile(authRequest("/api/users/profile", {
      subject: USER_B,
      email: "user-b@gmail.com",
      method: "PUT",
      body: { email: "user-a@gmail.com", fullName: "foreign mutation" },
    }));
    assert.equal(foreignWrite.status, 403);

    const anonymous = await getProfile(new Request("https://staging-contract.test/api/users/profile"));
    assert.equal(anonymous.status, 401);
  });

  it("does not treat an ordinary mailbox as institutional evidence", async () => {
    const response = await verifyEducation(authRequest("/api/users/verify-edu", {
      method: "POST",
      body: { email: "claimed@hust.edu.vn", email_verified: true },
    }));
    assert.equal(response.status, 403);

    const ordinary = await verifyEducation(authRequest("/api/users/verify-edu", {
      method: "POST",
      body: { email: "user-a@gmail.com", email_verified: true },
    }));
    assert.equal(ordinary.status, 422);
    const payload = await ordinary.json();
    assert.equal(payload.isEdu, false);
    assert.equal(payload.verificationStatus, "NOT_INSTITUTIONAL_DOMAIN");
  });

  it("hydrates durable-session identity from canonical server fields", async () => {
    setDurableSessionServiceForTests({
      validateSession: async () => ({
        user_id: USER_A,
        roles: ["STUDENT"],
        email: "canonical@hust.edu.vn",
        email_verified: true,
      }),
    });

    const principal = await IdentityResolver.resolvePrincipal(new Request("https://staging-contract.test/api/profile", {
      headers: { cookie: "studenthub_session=opaque-session" },
    }));
    assert.equal(principal.email, "canonical@hust.edu.vn");
    assert.equal(principal.attributes.emailVerified, true);
    assert.equal(principal.roles[0], "STUDENT");
  });
});
