import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { StudentIdentityModel } from "../../src/lib/intelligence/academic/studentIdentityModel.js";
import { StudentIdentityStore } from "../../src/lib/intelligence/academic/studentIdentityStore.js";
import { AcademicRecordsModel } from "../../src/lib/intelligence/academic/academicRecordsModel.js";
import { AcademicRecordsStore } from "../../src/lib/intelligence/academic/academicRecordsStore.js";
import { StudentDigitalTwinStore } from "../../src/lib/intelligence/academic/studentDigitalTwinStore.js";
import { StudentAcademicSyncBridge } from "../../src/lib/intelligence/academic/studentAcademicSyncBridge.js";

describe("Student Academic Sync Bridge V1", () => {
  beforeEach(() => {
    StudentIdentityStore.clear();
    AcademicRecordsStore.clear();
    StudentDigitalTwinStore.clear();
  });

  it("should project authoritative identity and academic records into digital twin store", () => {
    // 1. Authoritative Identity
    const identity = StudentIdentityModel.createIdentity({
      studentId: "24110010",
      fullName: "Phạm Hoàng D",
      institutionalEmail: "24110010@student.hcmute.edu.vn",
      cohort: 2024,
      programCode: "7480103",
      programName: "Kỹ thuật Phần mềm",
      faculty: "Khoa Công Nghệ Thông Tin"
    });
    StudentIdentityStore.saveIdentity(identity);

    // 2. Authoritative Records
    const record = AcademicRecordsModel.createRecord({
      studentId: "24110010",
      totalRequiredCredits: 150,
      courses: [
        { courseCode: "SWEN1001", credits: 4, grade10: 9.0, courseType: "SPECIALIZED" }
      ],
      certifications: [
        { type: "TOEIC", score: 600, verificationStatus: "VERIFIED" }
      ],
      tuition: {
        remainingDebt: 0
      }
    });
    AcademicRecordsStore.saveRecord(record);

    // 3. Execute Sync Bridge
    const twin = StudentAcademicSyncBridge.syncTwin("24110010");

    assert.ok(twin);
    assert.strictEqual(twin.studentId, "24110010");
    assert.strictEqual(twin.fullName, "Phạm Hoàng D");
    assert.strictEqual(twin.earnedCredits, 4);
    assert.strictEqual(twin.cgpa, 4.0);
    assert.strictEqual(twin.certificates.length, 1);
    assert.strictEqual(twin.certificates[0].score, 600);
    assert.strictEqual(twin.tuitionPaid, true);

    // Verify stored twin
    const storedTwin = StudentDigitalTwinStore.getTwin("24110010");
    assert.ok(storedTwin);
    assert.strictEqual(storedTwin.earnedCredits, 4);
  });
});
