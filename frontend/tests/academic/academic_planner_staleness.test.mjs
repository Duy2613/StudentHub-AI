import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicSemesterPlannerEngine } from "../../src/lib/intelligence/academic/academicSemesterPlannerEngine.js";

describe("AcademicPlannerStaleness", () => {
  it("should validate and detect stale plans when revisions mismatch", () => {
    const plansResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: "24110001",
      profile360: { profileRevision: 1 },
      digitalTwin: { revision: 1 }
    });

    const plan = plansResult.candidatePlans[0];

    // Current matches base revisions -> VALID
    const validCheck = AcademicSemesterPlannerEngine.revalidatePlan(
      plan,
      { profileRevision: 1 },
      { revision: 1 }
    );
    assert.strictEqual(validCheck.isValid, true);
    assert.strictEqual(validCheck.status, "VALID");

    // Profile updated to revision 2 -> STALE
    const staleCheck = AcademicSemesterPlannerEngine.revalidatePlan(
      plan,
      { profileRevision: 2 },
      { revision: 1 }
    );
    assert.strictEqual(staleCheck.isValid, false);
    assert.strictEqual(staleCheck.status, "STALE");
    assert.ok(staleCheck.reason.includes("Profile r1 ➔ r2"));
  });
});
