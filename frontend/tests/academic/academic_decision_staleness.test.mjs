import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicDecisionEngine } from "../../src/lib/intelligence/academic/academicDecisionEngine.js";
import { AcademicDecisionStore } from "../../src/lib/intelligence/academic/academicDecisionStore.js";

describe("AcademicDecisionStaleness", () => {
  it("should reject plan adoption if base revisions are stale", () => {
    // Decision comparison generated under profile revision 1
    const studio = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: "24110001",
      profile360: { profileRevision: 1 },
      digitalTwin: { revision: 1 }
    });

    const planId = studio.plans[0].planId;

    // Student attempts adoption after profile updated to revision 2
    assert.throws(() => {
      AcademicDecisionEngine.adoptPlan({
        studentId: "24110001",
        planId,
        expectedBaseRevisions: studio.plans[0].baseRevisions,
        profile360: { profileRevision: 2 },
        digitalTwin: { revision: 1 }
      });
    }, /STALE_PLAN_ERROR/);
  });

  it("should identify stale adoption records in store", () => {
    const adoptionRecord = {
      baseRevisions: { profileRevision: 1, twinRevision: 1 }
    };

    assert.strictEqual(AcademicDecisionStore.isAdoptionStale(adoptionRecord, 1, 1), false);
    assert.strictEqual(AcademicDecisionStore.isAdoptionStale(adoptionRecord, 2, 1), true);
  });
});
