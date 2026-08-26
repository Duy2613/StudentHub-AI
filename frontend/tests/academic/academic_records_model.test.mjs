import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicRecordsModel, TUITION_STATUSES } from "../../src/lib/intelligence/academic/academicRecordsModel.js";

describe("Academic Records Model V1", () => {
  it("should accurately convert 10-scale grade to 4-scale and letter grade", () => {
    assert.deepStrictEqual(AcademicRecordsModel.convertGrade10(9.2), { letter: "A+", gpa4: 4.0, isPassed: true });
    assert.deepStrictEqual(AcademicRecordsModel.convertGrade10(8.6), { letter: "A", gpa4: 3.8, isPassed: true });
    assert.deepStrictEqual(AcademicRecordsModel.convertGrade10(8.0), { letter: "B+", gpa4: 3.5, isPassed: true });
    assert.deepStrictEqual(AcademicRecordsModel.convertGrade10(7.2), { letter: "B", gpa4: 3.0, isPassed: true });
    assert.deepStrictEqual(AcademicRecordsModel.convertGrade10(5.8), { letter: "C", gpa4: 2.0, isPassed: true });
    assert.deepStrictEqual(AcademicRecordsModel.convertGrade10(4.2), { letter: "D", gpa4: 1.0, isPassed: true });
    assert.deepStrictEqual(AcademicRecordsModel.convertGrade10(3.5), { letter: "F", gpa4: 0.0, isPassed: false });
  });

  it("should aggregate credits and calculate CGPA correctly from verified course list", () => {
    const record = AcademicRecordsModel.createRecord({
      studentId: "24110001",
      totalRequiredCredits: 150,
      courses: [
        { courseCode: "MATH1411", credits: 3, grade10: 8.5, courseType: "GENERAL" },    // 3 * 3.8 = 11.4
        { courseCode: "ITEC1301", credits: 3, grade10: 9.0, courseType: "CORE" },       // 3 * 4.0 = 12.0
        { courseCode: "SOFE3301", credits: 4, grade10: 7.0, courseType: "SPECIALIZED" } // 4 * 3.0 = 12.0
      ],
      certifications: [
        { type: "TOEIC", score: 650, verificationStatus: "VERIFIED" }
      ],
      tuition: {
        totalDue: 12000000,
        paidAmount: 12000000,
        remainingDebt: 0
      }
    });

    // Total credits: 3 + 3 + 4 = 10
    assert.strictEqual(record.earnedCredits, 10);
    assert.strictEqual(record.remainingCredits, 140);
    assert.strictEqual(record.generalCredits, 3);
    assert.strictEqual(record.coreCredits, 3);
    assert.strictEqual(record.specializedCredits, 4);

    // Total points: 11.4 + 12.0 + 12.0 = 35.4 / 10 = 3.54
    assert.strictEqual(record.cgpa, 3.54);
    assert.strictEqual(record.tuition.status, TUITION_STATUSES.PAID_IN_FULL);
  });
});
