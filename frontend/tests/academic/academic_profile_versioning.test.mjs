import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { StudentProfile360Model } from "../../src/lib/intelligence/academic/studentProfile360Model.js";
import { StudentProfile360Store } from "../../src/lib/intelligence/academic/studentProfile360Store.js";

describe("Academic Profile Versioning & Optimistic Concurrency V1", () => {
  beforeEach(() => {
    StudentProfile360Store.clear();
  });

  it("should increment revision on semantic update and reject stale revision overwrite", () => {
    const profileV1 = StudentProfile360Model.createProfile({
      identity: { studentId: "24110001", fullName: "Nguyễn Văn Duy" },
      records: { earnedCredits: 115 },
      profileRevision: 1
    });
    StudentProfile360Store.saveProfile(profileV1);

    const profileV2 = StudentProfile360Model.createProfile({
      identity: { studentId: "24110001", fullName: "Nguyễn Văn Duy" },
      records: { earnedCredits: 120 },
      profileRevision: 2
    });
    StudentProfile360Store.saveProfile(profileV2);

    const saved = StudentProfile360Store.getProfileByStudentId("24110001");
    assert.strictEqual(saved.profileRevision, 2);
    assert.strictEqual(saved.academicSummary.earnedCredits, 120);

    // Stale write attempt (incoming revision 1 < current revision 2)
    const staleV1 = StudentProfile360Model.createProfile({
      identity: { studentId: "24110001", fullName: "Nguyễn Văn Duy" },
      records: { earnedCredits: 115 },
      profileRevision: 1
    });

    assert.throws(
      () => StudentProfile360Store.saveProfile(staleV1),
      /STALE_PROFILE_REVISION/
    );
  });
});
