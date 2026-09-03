import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StudentIdentityModel, ACADEMIC_STATUSES, EDUCATION_LEVELS } from "../../src/lib/intelligence/academic/studentIdentityModel.js";

describe("Student Identity & Profile Model V1", () => {
  it("should validate and create canonical student identity correctly", () => {
    const identity = StudentIdentityModel.createIdentity({
      studentId: "24110001",
      authUserId: "usr_123456",
      fullName: "Nguyễn Văn Duy",
      institutionalEmail: "24110001@student.hcmute.edu.vn",
      nationalId: "079204009988",
      cohort: 2024,
      programCode: "7480103",
      programName: "Kỹ thuật Phần mềm",
      faculty: "Khoa Công Nghệ Thông Tin"
    });

    assert.strictEqual(identity.studentId, "24110001");
    assert.strictEqual(identity.authUserId, "usr_123456");
    assert.strictEqual(identity.fullName, "Nguyễn Văn Duy");
    assert.strictEqual(identity.institutionalEmail, "24110001@student.hcmute.edu.vn");
    assert.strictEqual(identity.academicStatus, ACADEMIC_STATUSES.ACTIVE);
    assert.strictEqual(identity.nationalIdMasked, "079204******");
  });

  it("should reject invalid MSSV format", () => {
    assert.throws(
      () => StudentIdentityModel.createIdentity({
        studentId: "invalid_mssv",
        fullName: "Test Student"
      }),
      /Invalid studentId format/
    );
  });

  it("should reject non-institutional email domain", () => {
    assert.throws(
      () => StudentIdentityModel.createIdentity({
        studentId: "24110001",
        fullName: "Test Student",
        institutionalEmail: "hacker@evil.com"
      }),
      /Invalid institutional email/
    );
  });
});
