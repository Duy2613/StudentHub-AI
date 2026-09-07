import assert from "node:assert/strict";
import crypto from "node:crypto";
import { test } from "node:test";

import { TrustPersistenceMapper } from "../../src/lib/ai-trust/v5/TrustPersistenceMapper.js";

test("Trust persistence mapper keeps execution identity and redacts revision snapshots", () => {
  const ownerId = crypto.randomUUID();
  const pipelineResult = {
    verificationId: crypto.randomUUID(),
    contractVersion: "trust.v5",
    pipelineStatus: "COMPLETED",
    state: "SUPPORTED",
    decision: { verdict: "SUPPORTED" },
    audit: { inputFingerprint: "a".repeat(64) },
    startedAt: "2026-09-06T00:00:00.000Z",
    completedAt: "2026-09-06T00:00:01.000Z",
    evidence: [{ evidenceId: "evidence-1" }],
    stages: Object.fromEntries(["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"].map((stageId) => [stageId, {
      operationStatus: "COMPLETED",
      finding: "OBSERVED",
      summary: "bounded stage summary",
      evidenceRefs: ["evidence-1"],
      latencyMs: 4,
    }])),
    finalDecision: { security: "SAFE", truth: "SUPPORTED", action: "ALLOW" },
  };
  const dto = TrustPersistenceMapper.mapPipelineToDurableRecord({
    pipelineResult,
    input: { type: "text", content: "private raw content", metadata: {} },
    principal: { subjectId: `user:${ownerId}` },
    requestId: "revision-contract",
    idempotencyKey: "trust-contract-key",
  });

  assert.ok(dto);
  assert.notEqual(dto.runRecord.id, dto.caseRecord.id);
  assert.equal(dto.runRecord.ownerId, ownerId);
  assert.equal(dto.runRecord.idempotencyKey, "trust-contract-key");
  assert.deepEqual(dto.stageRuns.map((stage) => stage.stageId), ["l1", "l2a", "l2b", "l2c", "l3", "l4", "l5"]);
  assert.equal(dto.caseRevision.runId, dto.runRecord.id);
  assert.equal(dto.verdictRevision.runId, dto.runRecord.id);
  assert.equal(dto.caseRevision.snapshot.rawInput, undefined);
  assert.equal(Buffer.isBuffer(dto.verdictRevision.decisionDigest), true);
  assert.equal(dto.verdictRevision.decisionDigest.length, 32);
});
