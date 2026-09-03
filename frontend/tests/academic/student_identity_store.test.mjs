import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { StudentIdentityModel } from "../../src/lib/intelligence/academic/studentIdentityModel.js";
import { StudentIdentityStore } from "../../src/lib/intelligence/academic/studentIdentityStore.js";

describe("Student Identity Durable Store V1", () => {
  beforeEach(() => {
    StudentIdentityStore.clear();
  });

  it("should persist and lookup identity across multi-indices (studentId, authUserId, email)", () => {
    const identity = StudentIdentityModel.createIdentity({
      studentId: "24110002",
      authUserId: "auth_uuid_9988",
      fullName: "Trần Thị B",
      institutionalEmail: "24110002@student.hcmute.edu.vn"
    });

    StudentIdentityStore.saveIdentity(identity);

    // 1. Lookup by MSSV
    const byId = StudentIdentityStore.getIdentityByStudentId("24110002");
    assert.ok(byId);
    assert.strictEqual(byId.fullName, "Trần Thị B");

    // 2. Lookup by Supabase Auth User ID
    const byAuth = StudentIdentityStore.getIdentityByAuthUserId("auth_uuid_9988");
    assert.ok(byAuth);
    assert.strictEqual(byAuth.studentId, "24110002");

    // 3. Lookup by Institutional Email
    const byEmail = StudentIdentityStore.getIdentityByEmail("24110002@student.hcmute.edu.vn");
    assert.ok(byEmail);
    assert.strictEqual(byEmail.studentId, "24110002");
  });

  it("should rehydrate from disk correctly after simulated restart", () => {
    const identity = StudentIdentityModel.createIdentity({
      studentId: "24110003",
      fullName: "Lê Văn C",
      institutionalEmail: "24110003@student.hcmute.edu.vn"
    });

    StudentIdentityStore.saveIdentity(identity);

    // Simulate process restart
    StudentIdentityStore.rehydrate();

    const rehydrated = StudentIdentityStore.getIdentityByStudentId("24110003");
    assert.ok(rehydrated);
    assert.strictEqual(rehydrated.fullName, "Lê Văn C");
  });
});
