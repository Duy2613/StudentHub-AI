import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { StudentProfile360Model } from "../../src/lib/intelligence/academic/studentProfile360Model.js";
import { StudentProfile360Store } from "../../src/lib/intelligence/academic/studentProfile360Store.js";
import { StudentAcademicSyncBridge } from "../../src/lib/intelligence/academic/studentAcademicSyncBridge.js";
import { StudentDigitalTwinStore } from "../../src/lib/intelligence/academic/studentDigitalTwinStore.js";

describe("Digital Twin Profile 360 Integration & Revision Pinning V1", () => {
  beforeEach(() => {
    StudentProfile360Store.clear();
    StudentDigitalTwinStore.clear();
  });

  it("should project Profile 360 into Digital Twin with version pinning (evaluatedAgainstProfileRevision)", () => {
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
          { courseCode: "SWEN330103", credits: 4, grade10: 9.0, isPassed: true }
        ],
        certifications: [
          { type: "TOEIC", score: 650, verificationStatus: "VERIFIED" }
        ],
        tuition: {
          remainingDebt: 0
        }
      },
      profileRevision: 5
    });
    StudentProfile360Store.saveProfile(profile);

    // Sync to twin
    const twin = StudentAcademicSyncBridge.syncTwin("24110001", profile);

    assert.ok(twin);
    assert.strictEqual(twin.studentId, "24110001");
    assert.strictEqual(twin.earnedCredits, 4);
    assert.strictEqual(twin.evaluatedAgainstProfileRevision, 5);

    const stored = StudentDigitalTwinStore.getTwin("24110001");
    assert.strictEqual(stored.evaluatedAgainstProfileRevision, 5);
  });
});
