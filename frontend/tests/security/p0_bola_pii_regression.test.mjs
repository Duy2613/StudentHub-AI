/**
 * StudentHub AI — P0 BOLA / IDOR & PII Leakage Security Regression Test Suite
 * 
 * Verifies permanent remediation of critical findings:
 * - SEC-01: Anonymous access and Cross-student BOLA on private academic endpoints
 * - SEC-02: Sensitive PII (Phone, Personal Email, CCCD) leakage on expert endpoints
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { GET as getProfile360 } from "../../src/app/api/academic/me/profile-360/route.js";
import { GET as getStudentIdentity } from "../../src/app/api/student/identity/route.js";
import { GET as getExpertDetail } from "../../src/app/api/intelligence/experts/[expertId]/route.js";
import { GET as getExpertsList } from "../../src/app/api/intelligence/experts/route.js";
import { TokenValidator } from "../../src/lib/security/identity/TokenValidator.js";
import { ExpertStore } from "../../src/lib/intelligence/expert/expertStore.js";
import { StudentIdentityStore } from "../../src/lib/intelligence/academic/studentIdentityStore.js";
import { StudentProfile360Store } from "../../src/lib/intelligence/academic/studentProfile360Store.js";

describe("P0 Security Regression — BOLA & PII Protection", () => {
  const tokenValidator = new TokenValidator();

  const tokenStudentA = tokenValidator.signToken({
    sub: "student:24110001",
    email: "24110001@student.hcmute.edu.vn",
    roles: ["student"],
    scopes: ["academic:read"]
  });

  beforeEach(() => {
    StudentIdentityStore.rehydrate();
    StudentProfile360Store.rehydrate();
    ExpertStore.rehydrate();
  });

  // =========================================================================
  // SEC-01 TESTS: BOLA & Anonymous Access Rejection
  // =========================================================================

  it("SEC-01 Test 1: Anonymous request to /api/academic/me/profile-360 must return 401", async () => {
    const anonReq = new Request("https://studenthub.ai/api/academic/me/profile-360?studentId=24110002");
    const response = await getProfile360(anonReq, {});
    
    assert.strictEqual(response.status, 401);
    const body = await response.json();
    assert.strictEqual(body.error?.code, "UNAUTHORIZED");
  });

  it("SEC-01 Test 2: Authenticated Student A requesting Student B (24110002) transcript must return 403 Forbidden", async () => {
    const attackReq = new Request("https://studenthub.ai/api/academic/me/profile-360?studentId=24110002", {
      headers: {
        Authorization: `Bearer ${tokenStudentA}`,
        "x-security-purpose": "ACADEMIC_PLANNING"
      }
    });

    const response = await getProfile360(attackReq, {});
    assert.strictEqual(response.status, 403);

    const body = await response.json();
    assert.strictEqual(body.error?.code, "OBJECT_NOT_OWNED");
  });

  it("SEC-01 Test 3: Authenticated Student A requesting /api/academic/me/profile-360 returns Student A's own profile", async () => {
    const validReq = new Request("https://studenthub.ai/api/academic/me/profile-360", {
      headers: {
        Authorization: `Bearer ${tokenStudentA}`,
        "x-security-purpose": "ACADEMIC_PLANNING"
      }
    });

    const response = await getProfile360(validReq, {});
    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data?.studentId, "24110001");
  });

  it("SEC-01 Test 4: Anonymous request to /api/student/identity must return 401", async () => {
    const anonReq = new Request("https://studenthub.ai/api/student/identity?studentId=24110001");
    const response = await getStudentIdentity(anonReq, {});
    
    assert.strictEqual(response.status, 401);
  });

  it("SEC-01 Test 5: Authenticated Student A requesting Student B identity must return 403", async () => {
    const attackReq = new Request("https://studenthub.ai/api/student/identity?studentId=24110002", {
      headers: {
        Authorization: `Bearer ${tokenStudentA}`
      }
    });

    const response = await getStudentIdentity(attackReq, {});
    assert.strictEqual(response.status, 403);
  });

  // =========================================================================
  // SEC-02 TESTS: Sensitive PII Stripping on Expert Endpoints
  // =========================================================================

  it("SEC-02 Test 1: GET /api/intelligence/experts/[expertId] must NEVER expose privateContact, phone, or CCCD", async () => {
    const req = new Request("https://studenthub.ai/api/intelligence/experts/EXP_DR_MINH_AI");
    const routeParams = { params: Promise.resolve({ expertId: "EXP_DR_MINH_AI" }) };

    const response = await getExpertDetail(req, routeParams);
    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.strictEqual(body.success, true);
    const expert = body.data?.expert;

    assert.ok(expert);
    assert.strictEqual(expert.expertId, "EXP_DR_MINH_AI");
    assert.strictEqual(expert.name, "TS. Nguyễn Văn Minh");

    // Strictly assert absence of private PII
    assert.strictEqual(expert.privateContact, undefined);
    assert.strictEqual(expert.personalPhone, undefined);
    assert.strictEqual(expert.personalEmail, undefined);
    assert.strictEqual(expert.citizenId, undefined);
    assert.strictEqual(expert.nationalId, undefined);

    const jsonStr = JSON.stringify(body);
    assert.strictEqual(jsonStr.includes("079088001234"), false);
    assert.strictEqual(jsonStr.includes("+84903123456"), false);
  });

  it("SEC-02 Test 2: GET /api/intelligence/experts list must NEVER expose privateContact in any listed expert", async () => {
    const req = new Request("https://studenthub.ai/api/intelligence/experts?limit=10");
    const response = await getExpertsList(req, {});
    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.experts.length >= 1);

    for (const exp of body.experts) {
      assert.strictEqual(exp.privateContact, undefined);
      assert.strictEqual(exp.personalPhone, undefined);
      assert.strictEqual(exp.citizenId, undefined);
    }
  });
});
