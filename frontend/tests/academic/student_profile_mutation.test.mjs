import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StudentProfile360Model, CONFLICT_STATUSES } from "../../src/lib/intelligence/academic/studentProfile360Model.js";
import { StudentProfile360Store } from "../../src/lib/intelligence/academic/studentProfile360Store.js";
import { StudentProfile360Service } from "../../src/lib/intelligence/academic/studentProfile360Service.js";
import { StudentIdentityModel } from "../../src/lib/intelligence/academic/studentIdentityModel.js";
import { StudentIdentityStore } from "../../src/lib/intelligence/academic/studentIdentityStore.js";
import { StudentDataProvenanceMatrix, CANONICAL_SOURCES, SECTION_FRESHNESS } from "../../src/lib/intelligence/academic/studentDataProvenanceMatrix.js";
import { AcademicClock } from "../../src/lib/intelligence/academic/academicClock.js";

describe("Student Profile 360 Mutation Testing & Security Invariants V1", () => {
  it("MUTANT 1 — KILLED: Stale revision overwrite must be rejected", () => {
    StudentProfile360Store.clear();

    const profileV2 = StudentProfile360Model.createProfile({
      identity: { studentId: "24110001", fullName: "Nguyễn Văn Duy" },
      records: { earnedCredits: 120 },
      profileRevision: 2
    });
    StudentProfile360Store.saveProfile(profileV2);

    const staleV1 = StudentProfile360Model.createProfile({
      identity: { studentId: "24110001", fullName: "Nguyễn Văn Duy" },
      records: { earnedCredits: 115 },
      profileRevision: 1
    });

    assert.throws(
      () => StudentProfile360Store.saveProfile(staleV1),
      /STALE_PROFILE_REVISION/
    );
  });

  it("MUTANT 2 — KILLED: Cross-tenant unauthorized access must fail-closed", () => {
    StudentIdentityStore.clear();

    const identityTarget = StudentIdentityModel.createIdentity({
      studentId: "24110002",
      authUserId: "user_target_uuid",
      fullName: "Target Student",
      institutionalEmail: "24110002@student.hcmute.edu.vn"
    });
    StudentIdentityStore.saveIdentity(identityTarget);

    const attackerAuthSession = {
      user: {
        id: "user_attacker_uuid",
        email: "24110001@student.hcmute.edu.vn"
      }
    };

    assert.throws(
      () => StudentProfile360Service.getProfile360("24110002", attackerAuthSession),
      /FORBIDDEN/
    );
  });

  it("MUTANT 3 — KILLED: Source conflict must not silently overwrite without auditable resolution", () => {
    const conflict = StudentProfile360Model.detectConflict(
      "cgpa",
      2.85,
      CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
      3.50,
      CANONICAL_SOURCES.STUDENT_SUBMISSION
    );

    assert.ok(conflict);
    assert.strictEqual(conflict.status, CONFLICT_STATUSES.RESOLVED);
    assert.strictEqual(conflict.precedenceWinner, CANONICAL_SOURCES.HCMUTE_SIS_PORTAL);
  });

  it("MUTANT 4 — KILLED: Stale timestamp must be flagged as STALE, never masquerade as FRESH", () => {
    const mockClock = AcademicClock.createMockClock("2026-08-26T12:00:00.000Z");
    const staleTime = "2026-08-20T00:00:00.000Z"; // 6+ days old for a 24h TTL
    const freshness = StudentDataProvenanceMatrix.computeFreshness(staleTime, 24, mockClock);

    assert.strictEqual(freshness, SECTION_FRESHNESS.STALE);
    assert.notStrictEqual(freshness, SECTION_FRESHNESS.FRESH);
  });
});
