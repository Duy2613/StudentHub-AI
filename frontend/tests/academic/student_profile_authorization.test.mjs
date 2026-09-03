import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { StudentIdentityModel } from "../../src/lib/intelligence/academic/studentIdentityModel.js";
import { StudentIdentityStore } from "../../src/lib/intelligence/academic/studentIdentityStore.js";
import { StudentProfile360Service } from "../../src/lib/intelligence/academic/studentProfile360Service.js";

describe("Student Profile Authorization & Multi-Tenant Isolation V1", () => {
  beforeEach(() => {
    StudentIdentityStore.clear();
  });

  it("should permit student to read their own profile", () => {
    const identityA = StudentIdentityModel.createIdentity({
      studentId: "24110001",
      authUserId: "auth_user_A",
      fullName: "Sinh viên A",
      institutionalEmail: "24110001@student.hcmute.edu.vn"
    });
    StudentIdentityStore.saveIdentity(identityA);

    const authSessionA = {
      user: {
        id: "auth_user_A",
        email: "24110001@student.hcmute.edu.vn"
      }
    };

    const profile = StudentProfile360Service.getProfile360("24110001", authSessionA);
    assert.ok(profile);
    assert.strictEqual(profile.studentId, "24110001");
  });

  it("should deny student A from accessing student B profile (fail-closed)", () => {
    const identityB = StudentIdentityModel.createIdentity({
      studentId: "24110002",
      authUserId: "auth_user_B",
      fullName: "Sinh viên B",
      institutionalEmail: "24110002@student.hcmute.edu.vn"
    });
    StudentIdentityStore.saveIdentity(identityB);

    // Attacker session trying to view student B's profile
    const authSessionA = {
      user: {
        id: "auth_user_A",
        email: "24110001@student.hcmute.edu.vn"
      }
    };

    assert.throws(
      () => StudentProfile360Service.getProfile360("24110002", authSessionA),
      /FORBIDDEN/
    );
  });
});
