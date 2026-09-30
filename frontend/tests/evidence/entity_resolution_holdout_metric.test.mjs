import assert from "node:assert/strict";
import test from "node:test";

import { expectedEntityResolved } from "./entity_resolution_holdout_metric.js";

test("entity metric rejects a different resolved institution", () => {
  assert.equal(expectedEntityResolved(
    { canonicalEntity: "UEL", knownOfficialDomains: ["uel.edu.vn"] },
    {
      status: "RESOLVED",
      matches: [{ entityId: "UEH", allowedDomains: ["ueh.edu.vn"] }],
    },
  ), false);
});

test("entity metric accepts an explicit canonical ID alias", () => {
  assert.equal(expectedEntityResolved(
    { canonicalEntity: "MPS", knownOfficialDomains: ["mps.gov.vn"] },
    {
      status: "RESOLVED",
      matches: [{ entityId: "MPS_VN", allowedDomains: ["bocongan.gov.vn", "mps.gov.vn"] }],
    },
  ), true);
});

test("entity metric excludes a policy topic from canonical entity accuracy", () => {
  assert.equal(expectedEntityResolved(
    { canonicalEntity: "ADMISSIONS_POLICY", knownOfficialDomains: ["moet.gov.vn"] },
    {
      status: "RESOLVED",
      matches: [{ entityId: "MOET_VN", allowedDomains: ["moet.gov.vn"] }],
    },
  ), null);
});

test("entity metric does not award credit to an unrelated nonempty resolution", () => {
  assert.equal(expectedEntityResolved(
    { canonicalEntity: "UEL", knownOfficialDomains: ["uel.edu.vn"] },
    {
      status: "RESOLVED",
      matches: [{ entityId: "NCSC_VN", allowedDomains: ["soc.gov.vn"] }],
    },
  ), false);
});

test("entity metric excludes other topical labels from canonical entity accuracy", () => {
  for (const canonicalEntity of ["CAREER_DISCOVERY", "STUDENT_SAFETY", "SCHOLARSHIP_FRAUD", "CAMPUS_HOUSING"]) {
    assert.equal(expectedEntityResolved(
      { canonicalEntity, knownOfficialDomains: ["moet.gov.vn"] },
      { status: "RESOLVED", matches: [{ entityId: "MOET_VN", allowedDomains: ["moet.gov.vn"] }] },
    ), null, canonicalEntity);
  }
});

test("entity metric scores the expected canonical identity without trusting a mismatched gold domain", () => {
  assert.equal(expectedEntityResolved(
    { canonicalEntity: "DNU", knownOfficialDomains: ["dnu.edu.vn"] },
    { status: "RESOLVED", matches: [{ entityId: "DNU", allowedDomains: ["dongnaiuni.edu.vn", "dnpu.edu.vn"] }] },
  ), true);
});
