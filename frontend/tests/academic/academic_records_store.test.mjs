import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicRecordsModel } from "../../src/lib/intelligence/academic/academicRecordsModel.js";
import { AcademicRecordsStore } from "../../src/lib/intelligence/academic/academicRecordsStore.js";

describe("Academic Records Durable Store V1", () => {
  beforeEach(() => {
    AcademicRecordsStore.clear();
  });

  it("should persist and rehydrate academic records across simulated restart", () => {
    const record = AcademicRecordsModel.createRecord({
      studentId: "24110005",
      courses: [
        { courseCode: "SWEN1001", credits: 3, grade10: 9.0, isPassed: true }
      ]
    });

    AcademicRecordsStore.saveRecord(record);

    // Simulate restart
    AcademicRecordsStore.rehydrate();

    const retrieved = AcademicRecordsStore.getRecordByStudentId("24110005");
    assert.ok(retrieved);
    assert.strictEqual(retrieved.studentId, "24110005");
    assert.strictEqual(retrieved.earnedCredits, 3);
  });

  it("should prevent stale writes via optimistic revision checks", () => {
    const record = AcademicRecordsModel.createRecord({
      studentId: "24110006",
      courses: []
    });

    AcademicRecordsStore.saveRecord(record);

    const stale = {
      ...record,
      revision: 0
    };

    assert.throws(
      () => AcademicRecordsStore.saveRecord(stale),
      /STALE_REVISION/
    );
  });
});
