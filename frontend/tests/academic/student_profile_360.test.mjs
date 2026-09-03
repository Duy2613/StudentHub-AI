import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StudentProfile360Model, ACADEMIC_STANDINGS } from "../../src/lib/intelligence/academic/studentProfile360Model.js";

describe("Student Profile 360 Aggregate Model V1", () => {
  it("should assemble canonical Profile 360 with identity, summary, courses, requirements, and provenance", () => {
    const profile = StudentProfile360Model.createProfile({
      identity: {
        studentId: "24110001",
        fullName: "Nguyễn Văn Duy",
        institutionalEmail: "24110001@student.hcmute.edu.vn",
        cohort: 2024,
        programCode: "7480103",
        programName: "Kỹ thuật Phần mềm",
        faculty: "Khoa Công Nghệ Thông Tin"
      },
      records: {
        totalRequiredCredits: 150,
        courses: [
          { courseCode: "MATH1411", credits: 3, grade10: 8.5, courseType: "GENERAL" },
          { courseCode: "SWEN3301", credits: 4, grade10: 9.0, courseType: "SPECIALIZED" }
        ],
        certifications: [
          { type: "TOEIC", score: 650, verificationStatus: "VERIFIED" }
        ],
        tuition: {
          remainingDebt: 0,
          totalDue: 15000000,
          paidAmount: 15000000
        }
      },
      profileRevision: 1
    });

    assert.strictEqual(profile.studentId, "24110001");
    assert.strictEqual(profile.profileRevision, 1);
    assert.strictEqual(profile.academicSummary.earnedCredits, 7);
    assert.strictEqual(profile.academicSummary.totalRequiredCredits, 150);
    assert.strictEqual(profile.academicSummary.academicStanding, ACADEMIC_STANDINGS.EXCELLENT);
    assert.strictEqual(profile.courseRecords.length, 2);
    assert.strictEqual(profile.certifications.length, 1);
    assert.strictEqual(profile.financialClearance.isCleared, true);
    assert.ok(profile.graduationRequirements.length >= 4);
    assert.ok(profile.provenance.identity);
    assert.ok(profile.freshness.sections);
  });

  it("should compute accurate academic standing based on GPA boundaries", () => {
    assert.strictEqual(StudentProfile360Model.computeAcademicStanding(3.8), ACADEMIC_STANDINGS.EXCELLENT);
    assert.strictEqual(StudentProfile360Model.computeAcademicStanding(3.4), ACADEMIC_STANDINGS.GOOD);
    assert.strictEqual(StudentProfile360Model.computeAcademicStanding(2.8), ACADEMIC_STANDINGS.FAIR);
    assert.strictEqual(StudentProfile360Model.computeAcademicStanding(2.1), ACADEMIC_STANDINGS.AVERAGE);
    assert.strictEqual(StudentProfile360Model.computeAcademicStanding(1.5), ACADEMIC_STANDINGS.PROBATION);
    assert.strictEqual(StudentProfile360Model.computeAcademicStanding(0.8), ACADEMIC_STANDINGS.CRITICAL);
    assert.strictEqual(StudentProfile360Model.computeAcademicStanding(null), ACADEMIC_STANDINGS.UNKNOWN);
  });
});
