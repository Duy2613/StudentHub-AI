import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StudentProfile360Model, CONFLICT_STATUSES } from "../../src/lib/intelligence/academic/studentProfile360Model.js";
import { CANONICAL_SOURCES } from "../../src/lib/intelligence/academic/studentDataProvenanceMatrix.js";

describe("Academic Profile Conflict Detection & Precedence Resolution V1", () => {
  it("should resolve conflict in favor of higher precedence source when student claims differ from portal", () => {
    // Portal GPA 2.85 vs Student Claim GPA 3.50
    const conflict = StudentProfile360Model.detectConflict(
      "cgpa",
      2.85,
      CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
      3.50,
      CANONICAL_SOURCES.STUDENT_SUBMISSION
    );

    assert.ok(conflict);
    assert.strictEqual(conflict.field, "cgpa");
    assert.strictEqual(conflict.status, CONFLICT_STATUSES.RESOLVED);
    assert.strictEqual(conflict.precedenceWinner, CANONICAL_SOURCES.HCMUTE_SIS_PORTAL);
  });

  it("should mark conflict as REQUIRES_REVIEW if two sources have equal authority", () => {
    const conflict = StudentProfile360Model.detectConflict(
      "earnedCredits",
      115,
      CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
      120,
      CANONICAL_SOURCES.HCMUTE_SIS_PORTAL
    );

    assert.ok(conflict);
    assert.strictEqual(conflict.status, CONFLICT_STATUSES.REQUIRES_REVIEW);
    assert.strictEqual(conflict.precedenceWinner, null);
  });
});
