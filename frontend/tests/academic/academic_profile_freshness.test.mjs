import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StudentProfile360Model } from "../../src/lib/intelligence/academic/studentProfile360Model.js";
import { SECTION_FRESHNESS } from "../../src/lib/intelligence/academic/studentDataProvenanceMatrix.js";
import { AcademicClock } from "../../src/lib/intelligence/academic/academicClock.js";

describe("Academic Profile Freshness & Stale Detection V1", () => {
  it("should evaluate section-level freshness dynamically against mock clock", () => {
    const mockClock = AcademicClock.createMockClock("2026-08-26T12:00:00.000Z");

    const profile = StudentProfile360Model.createProfile({
      identity: {
        studentId: "24110001",
        fullName: "Nguyễn Văn Duy"
      },
      identityVerifiedAt: "2026-08-20T10:00:00.000Z",   // ~6 days old, TTL 30 days => FRESH
      transcriptsVerifiedAt: "2026-08-24T08:00:00.000Z", // ~52 hours old, TTL 24 hours => STALE
      certificationsVerifiedAt: "2026-08-25T10:00:00.000Z", // ~26 hours old, TTL 7 days => FRESH
      financeVerifiedAt: "2026-08-26T11:00:00.000Z"        // ~1 hour old, TTL 12 hours => FRESH
    }, mockClock);

    assert.strictEqual(profile.freshness.sections.identity, SECTION_FRESHNESS.FRESH);
    assert.strictEqual(profile.freshness.sections.transcripts, SECTION_FRESHNESS.STALE);
    assert.strictEqual(profile.freshness.sections.certifications, SECTION_FRESHNESS.FRESH);
    assert.strictEqual(profile.freshness.sections.finance, SECTION_FRESHNESS.FRESH);
  });
});
