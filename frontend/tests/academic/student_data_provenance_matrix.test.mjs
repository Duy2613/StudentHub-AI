import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { 
  StudentDataProvenanceMatrix, 
  CANONICAL_SOURCES, 
  DATA_AUTHORITY_LEVELS, 
  SECTION_FRESHNESS 
} from "../../src/lib/intelligence/academic/studentDataProvenanceMatrix.js";
import { AcademicClock } from "../../src/lib/intelligence/academic/academicClock.js";

describe("Student Data Provenance Matrix & Authority Hierarchy V1", () => {
  it("should look up canonical source and authority level for core academic fields", () => {
    const studentIdProv = StudentDataProvenanceMatrix.getFieldProvenance("studentId");
    assert.ok(studentIdProv);
    assert.strictEqual(studentIdProv.canonicalSource, CANONICAL_SOURCES.SUPABASE_AUTH);
    assert.strictEqual(studentIdProv.authority, DATA_AUTHORITY_LEVELS.AUTHORITATIVE);

    const cgpaProv = StudentDataProvenanceMatrix.getFieldProvenance("cgpa");
    assert.ok(cgpaProv);
    assert.strictEqual(cgpaProv.canonicalSource, CANONICAL_SOURCES.HCMUTE_SIS_PORTAL);
    assert.strictEqual(cgpaProv.authority, DATA_AUTHORITY_LEVELS.AUTHORITATIVE);

    const certProv = StudentDataProvenanceMatrix.getFieldProvenance("certifications");
    assert.ok(certProv);
    assert.strictEqual(certProv.canonicalSource, CANONICAL_SOURCES.IIG_VIETNAM);
    assert.strictEqual(certProv.authority, DATA_AUTHORITY_LEVELS.AUTHORITATIVE);
  });

  it("should resolve source precedence correctly (Official Portal > Registrar > Student Submission)", () => {
    // Official Daotao Portal > Student Submission
    const prec1 = StudentDataProvenanceMatrix.resolvePrecedence(
      CANONICAL_SOURCES.HCMUTE_DAOTAO_PORTAL,
      CANONICAL_SOURCES.STUDENT_SUBMISSION
    );
    assert.ok(prec1 > 0, "DaoTao Portal should outrank Student Submission");

    // SIS Portal > Student Submission
    const prec2 = StudentDataProvenanceMatrix.resolvePrecedence(
      CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
      CANONICAL_SOURCES.STUDENT_SUBMISSION
    );
    assert.ok(prec2 > 0, "SIS Portal should outrank Student Submission");

    // Same source
    const precSame = StudentDataProvenanceMatrix.resolvePrecedence(
      CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
      CANONICAL_SOURCES.HCMUTE_SIS_PORTAL
    );
    assert.strictEqual(precSame, 0);
  });

  it("should compute freshness based on timestamp TTL and clock", () => {
    const mockClock = AcademicClock.createMockClock("2026-08-26T12:00:00.000Z");

    // 2 hours old with 24-hour TTL => FRESH
    const freshAsOf = "2026-08-26T10:00:00.000Z";
    const freshStatus = StudentDataProvenanceMatrix.computeFreshness(freshAsOf, 24, mockClock);
    assert.strictEqual(freshStatus, SECTION_FRESHNESS.FRESH);

    // 30 hours old with 24-hour TTL => STALE
    const staleAsOf = "2026-08-25T06:00:00.000Z";
    const staleStatus = StudentDataProvenanceMatrix.computeFreshness(staleAsOf, 24, mockClock);
    assert.strictEqual(staleStatus, SECTION_FRESHNESS.STALE);

    // Missing asOf => UNKNOWN
    const unknownStatus = StudentDataProvenanceMatrix.computeFreshness(null, 24, mockClock);
    assert.strictEqual(unknownStatus, SECTION_FRESHNESS.UNKNOWN);
  });
});
