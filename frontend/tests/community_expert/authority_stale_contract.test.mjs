import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { canSubmitAssessment } from "../../src/lib/communityExpert/promaxDomain.js";

const root = process.cwd();
const repository = readFileSync(join(root, "frontend", "src", "lib", "server", "database", "ExpertRepository.js"), "utf8");
const migration = readFileSync(join(root, "database", "migrations", "202609100001_expert_authority_snapshot.sql"), "utf8");

test("stale authority is denied for new submissions while historical lineage is retained", () => {
  assert.equal(canSubmitAssessment({
    expertId: "expert-1",
    verifiedDomain: "EDUCATION",
    domainStatus: "REVOKED",
    assignment: { expertId: "expert-1", status: "ASSIGNED", caseRevision: 1 },
    caseRevision: 1,
    coiDeclared: true,
  }).code, "DOMAIN_NOT_VERIFIED");

  const existingReplay = repository.indexOf("const existing = await client.query");
  const verificationRead = repository.indexOf("const verified = await client.query");
  assert.ok(existingReplay >= 0 && verificationRead > existingReplay, "idempotent historical replay must be checked before current authority");
  for (const field of ["verification_id", "verification_revision", "verified_domain", "assignment_revision", "case_revision", "evidence_revision_ids", "coi_state", "coi_declaration_ref", "qualification_policy_version", "submitted_at", "authority_snapshot_digest", "authority_snapshot"]) {
    assert.match(repository, new RegExp(field), field);
  }
  for (const field of ["verification_id", "verification_revision", "verified_domain", "assignment_revision", "coi_state", "coi_declaration_ref", "qualification_policy_version", "submitted_at", "authority_snapshot_digest", "authority_snapshot"]) {
    assert.match(migration, new RegExp(field), field);
  }
  assert.match(migration, /authority_snapshot_version\s*=\s*1[\s\S]*verification_status\s*=\s*'VERIFIED'[\s\S]*verification_qualification_state\s*=\s*'DOMAIN_VERIFIED'/i);
  assert.match(migration, /superseded|history|immutable|append-only/i);
});

test("verification and assignment revisions are database-owned and monotonic", () => {
  assert.match(migration, /bump_expert_verification_revision/i);
  assert.match(migration, /bump_expert_assignment_revision/i);
  assert.match(migration, /new\.revision\s*:=\s*old\.revision\s*\+\s*1/i);
  assert.match(migration, /revision\s+integer\s+not null\s+default 1/i);
});
