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
  assert.equal(dto.caseRevision.snapshot.schemaVersion, "trust.case.snapshot.v2");
  assert.equal(dto.caseRevision.snapshot.publicPipeline.finalDecision.truth, "SUPPORTED");
  assert.equal(dto.caseRevision.snapshot.publicPipeline.finalDecision.action, "ALLOW");
  assert.equal(dto.caseRevision.snapshot.publicPipeline.stages.l1.operationStatus, "COMPLETED");
  assert.equal(JSON.stringify(dto.caseRevision.snapshot).includes("private raw content"), false);
  assert.equal(dto.caseRevision.snapshot.rawInput, undefined);
  assert.equal(Buffer.isBuffer(dto.verdictRevision.decisionDigest), true);
  assert.equal(dto.verdictRevision.decisionDigest.length, 32);
});

test("Trust revision snapshot retains the public four-layer conclusion and evidence", () => {
  const ownerId = crypto.randomUUID();
  const pipelineResult = {
    requestId: "trust-four-layer-saved-result",
    verificationId: crypto.randomUUID(),
    pipelineModel: "FOUR_LAYER",
    pipelineStatus: "COMPLETED",
    state: "SUPPORTED",
    finalDecision: { security: "SAFE", truth: "SUPPORTED", action: "ALLOW" },
    finalPredict: {
      truthVerdict: "SUPPORTED",
      securityClassification: "SAFE",
      recommendedAction: "Đọc thêm nguồn gốc trước khi chia sẻ.",
      keyReasons: ["Nguồn chính thức xác nhận mệnh đề."],
      confidence: 0.87,
    },
    layerResults: {
      layer1: { inputType: "text", status: "COMPLETED" },
      layer2: {
        domainCode: "PUBLIC_HEALTH",
        claims: [{ claimId: "claim-1", text: "Mệnh đề đã lưu", status: "SUPPORTED" }],
      },
      layer3: {
        sources: [{ sourceId: "source-1", title: "Nguồn chính thức", url: "https://example.gov/source" }],
        evidence: [{ evidenceId: "evidence-1", claimId: "claim-1", sourceId: "source-1", excerpt: "Đoạn trích công khai", relation: "SUPPORTS" }],
      },
      layer4: {
        userExplanation: { why: "Nguồn phù hợp hỗ trợ mệnh đề.", recommendedActionNote: "Đọc thêm nguồn gốc trước khi chia sẻ." },
        aiVerification: { status: "COMPLETED", citationsUsed: [{ id: "source-1", url: "https://example.gov/source" }] },
      },
    },
    stages: Object.fromEntries(["l1", "l2", "l3", "l4"].map((stageId) => [stageId, {
      stageId,
      operationStatus: "COMPLETED",
      finding: "OBSERVED",
      summary: "bounded public stage summary",
      evidenceRefs: ["evidence-1"],
      latencyMs: 4,
    }])),
    evidence: [{ evidenceId: "evidence-1" }],
    startedAt: "2026-09-06T00:00:00.000Z",
    completedAt: "2026-09-06T00:00:01.000Z",
  };
  const dto = TrustPersistenceMapper.mapPipelineToDurableRecord({
    pipelineResult,
    input: { type: "text", content: "private raw content", metadata: { rawMetadata: "private metadata" } },
    principal: { subjectId: `user:${ownerId}` },
    requestId: "trust-four-layer-saved-result",
  });
  const snapshot = dto.caseRevision.snapshot;

  assert.equal(snapshot.schemaVersion, "trust.case.snapshot.v2");
  assert.equal(snapshot.publicPipeline.pipelineModel, "FOUR_LAYER");
  assert.equal(snapshot.publicPipeline.publicLayerCount, 4);
  assert.equal(snapshot.publicPipeline.finalPredict.truthVerdict, "SUPPORTED");
  assert.equal(snapshot.publicPipeline.layerResults.layer2.claims[0].text, "Mệnh đề đã lưu");
  assert.equal(snapshot.publicPipeline.layerResults.layer3.evidence[0].relation, "SUPPORTS");
  assert.equal(snapshot.publicPipeline.layerResults.layer4.aiVerification.citationsUsed.length, 1);
  assert.deepEqual(Object.keys(snapshot.publicPipeline.layerResults), ["layer1", "layer2", "layer3", "layer4"]);
  assert.equal(JSON.stringify(snapshot).includes("private raw content"), false);
  assert.equal(JSON.stringify(snapshot).includes("private metadata"), false);
});
