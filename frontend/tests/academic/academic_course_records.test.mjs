import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicRecordsModel, COURSE_STATUSES } from "../../src/lib/intelligence/academic/academicRecordsModel.js";

describe("Academic Course Records & Normalization V1", () => {
  it("should normalize course statuses and validate passing grades", () => {
    const record = AcademicRecordsModel.createRecord({
      studentId: "24110001",
      courses: [
        { courseCode: "MATH1301", courseName: "Đại số tuyến tính", credits: 3, grade10: 8.5, courseStatus: COURSE_STATUSES.COMPLETED },
        { courseCode: "PHYS1302", courseName: "Vật lý 1", credits: 3, grade10: 3.5, courseStatus: COURSE_STATUSES.FAILED },
        { courseCode: "PROG1401", courseName: "Lập trình C++", credits: 4, courseStatus: COURSE_STATUSES.IN_PROGRESS }
      ]
    });

    const math = record.courses.find(c => c.courseCode === "MATH1301");
    assert.strictEqual(math.isPassed, true);
    assert.strictEqual(math.letterGrade, "A");
    assert.strictEqual(math.gpa4, 3.8);

    const phys = record.courses.find(c => c.courseCode === "PHYS1302");
    assert.strictEqual(phys.isPassed, false);
    assert.strictEqual(phys.letterGrade, "F");
    assert.strictEqual(phys.gpa4, 0.0);

    const prog = record.courses.find(c => c.courseCode === "PROG1401");
    assert.strictEqual(prog.isPassed, false);
    assert.strictEqual(prog.status, COURSE_STATUSES.IN_PROGRESS);

    // Total earned credits should only count passed courses: MATH (3 credits)
    assert.strictEqual(record.earnedCredits, 3);
  });
});
