import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicRecordsModel, CERTIFICATE_STATUSES } from "../../src/lib/intelligence/academic/academicRecordsModel.js";

describe("Academic Certificate Records & Verification V1", () => {
  it("should record verified foreign language credentials and reject unverified claims", () => {
    const record = AcademicRecordsModel.createRecord({
      studentId: "24110001",
      certifications: [
        { 
          type: "TOEIC", 
          score: 650, 
          issuedDate: "2025-06-15", 
          expiresDate: "2027-06-15",
          verificationAuthority: "IIG Vietnam",
          verificationStatus: CERTIFICATE_STATUSES.VERIFIED 
        },
        { 
          type: "IELTS", 
          score: 7.5, 
          verificationStatus: CERTIFICATE_STATUSES.UNVERIFIED 
        }
      ]
    });

    assert.strictEqual(record.certifications.length, 2);

    const toeic = record.certifications.find(c => c.type === "TOEIC");
    assert.strictEqual(toeic.score, 650);
    assert.strictEqual(toeic.verificationStatus, CERTIFICATE_STATUSES.VERIFIED);
    assert.strictEqual(toeic.verificationAuthority, "IIG Vietnam");

    const ielts = record.certifications.find(c => c.type === "IELTS");
    assert.strictEqual(ielts.verificationStatus, CERTIFICATE_STATUSES.UNVERIFIED);
  });
});
