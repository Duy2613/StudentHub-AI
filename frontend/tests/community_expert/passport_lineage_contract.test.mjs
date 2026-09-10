import assert from "node:assert/strict";
import test from "node:test";
import { EvidencePassportService } from "../../src/lib/server/trust/EvidencePassportService.js";

const base = {
  caseId: "case-1",
  runId: "run-1",
  revision: 4,
  claims: [{ claimId: "claim-1", text: "A claim" }],
  sources: [{ sourceId: "source-1", canonicalUrl: "https://example.edu/notice" }],
  relationships: [{ claimId: "claim-1", sourceId: "source-1", relation: "SUPPORTS" }],
  independenceGroups: [{ sourceId: "source-1", group: "official" }],
  modelTraces: [{ role: "critic", provider: "local", model: "fixture", decisionSummary: "bounded" }],
  verdictResult: { verdict: "SUPPORTED", confidenceScore: 0.8 },
  decisionTwin: { action: "VERIFY" },
  expertAssessments: [{
    id: "assessment-1",
    expert_id: "expert-1",
    domain_code: "SCHOLARSHIP",
    verification_id: "verification-1",
    verification_revision: 3,
    assignment_id: "assignment-1",
    assignment_revision: 2,
    case_id: "case-1",
    case_revision: 4,
    claim_id: "claim-1",
    evidence_revision_ids: ["evidence-1"],
    authority_snapshot_version: 1,
    authority_snapshot_digest: Buffer.from("a".repeat(64), "hex"),
    coi_state: "DECLARED_NO_CONFLICT",
    submitted_at: "2026-09-10T00:00:00.000Z",
  }],
};

test("passport artifact hash is stable across issuance time and preserves Expert authority lineage", () => {
  const first = EvidencePassportService.issuePassport({ ...base, issuedAt: "2026-09-10T00:00:00.000Z" });
  const replay = EvidencePassportService.issuePassport({ ...base, issuedAt: "2026-09-10T01:00:00.000Z" });
  assert.equal(first.artifactHash, replay.artifactHash);
  assert.notEqual(first.issuedAt, replay.issuedAt);
  assert.equal(first.expertAssessmentLineage[0].verificationId, "verification-1");
  assert.equal(first.expertAssessmentLineage[0].verificationRevision, 3);
  assert.equal(first.expertAssessmentLineage[0].assignmentRevision, 2);
  assert.equal(first.expertAssessmentLineage[0].authoritySnapshotVersion, 1);
  assert.equal(first.expertAssessmentLineage[0].coiState, "DECLARED_NO_CONFLICT");
});

test("passport artifact changes when the authority snapshot digest changes", () => {
  const first = EvidencePassportService.issuePassport({ ...base, issuedAt: "2026-09-10T00:00:00.000Z" });
  const changed = EvidencePassportService.issuePassport({
    ...base,
    issuedAt: "2026-09-10T00:00:00.000Z",
    expertAssessments: [{ ...base.expertAssessments[0], authority_snapshot_digest: Buffer.from("b".repeat(64), "hex") }],
  });
  assert.notEqual(first.artifactHash, changed.artifactHash);
});
