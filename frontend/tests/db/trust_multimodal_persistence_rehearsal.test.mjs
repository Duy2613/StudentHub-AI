import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { DurableTrustRepository } from "../../src/lib/server/database/DurableTrustRepository.js";
import { closePostgresPoolForTests, getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { computeTrustInputHash } from "../../src/lib/server/database/TrustInputHash.js";
import { configureDisposableDatabase, disposableLiveGate } from "../helpers/disposableDbGuard.mjs";

const databaseUrl = configureDisposableDatabase({ envNames: ["STUDENTHUB_DISPOSABLE_DATABASE_URL"] });
const liveGate = disposableLiveGate({ envNames: ["STUDENTHUB_DISPOSABLE_DATABASE_URL"] });
process.env.STUDENTHUB_HERMETIC_TEST_MODE = "1";
const { prepareCanonicalMediaInput } = await import("../../src/lib/server/media/CanonicalMediaIntake.js");

after(async () => {
  if (databaseUrl) await closePostgresPoolForTests();
});

function mediaService(artifactId, sha256) {
  return {
    async ingestImage() {
      return { ok: true, artifact: { mediaArtifactId: artifactId, sha256, mimeType: "image/png", width: 120, height: 80, byteSize: 12 } };
    },
    getArtifactBytes() { return Buffer.from("disposable-image-fixture"); },
  };
}

test("DISPOSABLE POSTGRES: IMAGE/QR hashes, artifact links, graph, verdicts and revisions survive pool reconnect", liveGate, async () => {
  const pool = getPostgresPool();
  const user = await pool.query("SELECT id FROM auth.users ORDER BY id LIMIT 1");
  assert.ok(user.rows[0]?.id, "disposable target must contain the run-owned authenticated fixture user");
  const ownerId = user.rows[0].id;
  const imageBytes = Buffer.from("same-image-bytes-for-both-submissions");
  const imageDigest = crypto.createHash("sha256").update(imageBytes).digest("hex");
  const principal = { isAuthenticated: true, subjectId: `user:${ownerId}` };
  const caseIds = Array.from({ length: 4 }, () => crypto.randomUUID());
  const inputIds = Array.from({ length: 4 }, () => crypto.randomUUID());
  const runIds = Array.from({ length: 4 }, () => crypto.randomUUID());
  const evidenceIds = Array.from({ length: 4 }, () => crypto.randomUUID());
  const claimIds = Array.from({ length: 4 }, () => crypto.randomUUID());
  const artifactIds = [
    "run-owned-image-stale-draft", "run-owned-image-fresh-draft",
    "run-owned-qr-stale-draft", "run-owned-qr-fresh-draft",
  ];
  const scenarios = [
    { type: "image", content: "stale TEXT draft from the previous mode" },
    { type: "image", content: "" },
    { type: "qr", content: "stale TEXT draft from the previous mode" },
    { type: "qr", content: "" },
  ];

  try {
    const preparedInputs = await Promise.all(artifactIds.map((artifactId, index) => prepareCanonicalMediaInput({
      ...scenarios[index],
      metadata: { bytes: imageBytes, mimeType: "image/png", fileName: "same.png", fileSize: imageBytes.length },
    }, {
      principal,
      mediaService: mediaService(artifactId, imageDigest),
      async decodeQr(bytes) {
        assert.equal(bytes.toString(), "disposable-image-fixture");
        return { ok: true, payload: "https://example.org/qr-fixture" };
      },
    })));
    assert.ok(preparedInputs.every((result) => result.ok));
    assert.equal(preparedInputs[0].input.content, "");
    assert.equal(preparedInputs[2].input.content, "");
    assert.equal(preparedInputs[2].input.metadata.qrContent, "https://example.org/qr-fixture");
    const fingerprints = preparedInputs.map((result) => computeTrustInputHash(result.input));
    assert.deepEqual(fingerprints[0], fingerprints[1], "the stale draft must not change the IMAGE fingerprint");
    assert.deepEqual(fingerprints[2], fingerprints[3], "the stale draft must not change the QR fingerprint");

    for (let index = 0; index < preparedInputs.length; index += 1) {
      const input = { ...preparedInputs[index].input, id: inputIds[index] };
      const evidenceId = evidenceIds[index];
      const now = new Date();
      await DurableTrustRepository.persistTrustRecord({
        caseRecord: { id: caseIds[index], ownerId, state: "INSUFFICIENT_EVIDENCE", visibility: "PRIVATE" },
        input,
        evidence: [{
          id: evidenceId,
          sourceRef: "official-source-fixture",
          sourceType: "OFFICIAL_SOURCE",
          identifier: "https://example.org/fixture",
          observedAt: now,
          extractorVersion: "disposable-rehearsal.v1",
          confidence: 0.8,
          provenance: { fixture: true, runOwned: true },
        }],
        claims: [{
          id: claimIds[index],
          statement: "A run-owned claim linked to the image evidence fixture.",
          status: "UNVERIFIED",
          evidenceRelations: [{ evidenceId: "official-source-fixture", relation: "CONTEXT" }],
        }],
        runRecord: {
          id: runIds[index], caseId: caseIds[index], ownerId, inputFingerprint: fingerprints[index],
          status: "COMPLETED", pipelineVersion: "trust.v5-disposable-rehearsal", startedAt: now, completedAt: now,
        },
        stageRuns: [
          ["l1", 0], ["l2b", 2], ["l3", 4], ["l4", 5],
        ].map(([stageId, stageIndex]) => ({
          id: crypto.randomUUID(), stageId, stageIndex, status: "COMPLETED", attempt: 1,
          startedAt: now, completedAt: now, latencyMs: 1,
          resultDigest: crypto.createHash("sha256").update(`${caseIds[index]}:${stageId}`).digest(),
          summary: { fixture: true, stageId },
        })),
        caseRevision: {
          revision: 1,
          state: "INSUFFICIENT_EVIDENCE",
          snapshot: {
            input: {
              type: input.type,
              content: "",
              artifactId: artifactIds[index],
              imageHash: imageDigest,
              ...(input.metadata.qrContent ? { qrContent: input.metadata.qrContent } : {}),
            },
            fixture: true,
          },
        },
        verdictRevision: {
          revision: 1,
          verdict: { final: "INSUFFICIENT_EVIDENCE", source: "disposable-rehearsal-fixture" },
          decisionDigest: fingerprints[index],
        },
      });
    }

    for (const index of [0, 1, 2, 3]) {
      const beforeReconnect = await DurableTrustRepository.getCaseById(caseIds[index], { ownerId, revision: 1 });
      assert.equal(beforeReconnect.inputs[0].input_type, scenarios[index].type);
      assert.equal(beforeReconnect.inputs[0].object_key, artifactIds[index]);
      assert.deepEqual(beforeReconnect.inputs[0].content_hash, fingerprints[index]);
      assert.equal(beforeReconnect.evidence.length, 1);
      assert.equal(beforeReconnect.claims.length, 1);
      assert.equal(beforeReconnect.claims[0].statement, "A run-owned claim linked to the image evidence fixture.");
      assert.equal(beforeReconnect.savedRevision.revision, 1);
      assert.equal(beforeReconnect.savedRevision.run_id, runIds[index]);
      assert.equal(beforeReconnect.savedRevision.snapshot.input.imageHash, imageDigest);
      if (scenarios[index].type === "qr") assert.equal(beforeReconnect.savedRevision.snapshot.input.qrContent, "https://example.org/qr-fixture");
    }

    const listRow = (await DurableTrustRepository.listCasesByOwner(ownerId, { limit: 10 })).find((row) => row.id === caseIds[0]);
    assert.equal(listRow.object_key, artifactIds[0]);
    assert.deepEqual(listRow.content_hash, fingerprints[0]);

    await closePostgresPoolForTests();
    const reopenedPool = getPostgresPool();
    for (const index of [0, 1, 2, 3]) {
      const afterReconnect = await DurableTrustRepository.getCaseById(caseIds[index], { ownerId, revision: 1 });
      const verdict = await reopenedPool.query(
        "SELECT verdict FROM public.trust_verdict_revisions WHERE case_id = $1 AND owner_id = $2 AND revision = 1",
        [caseIds[index], ownerId],
      );
      assert.equal(afterReconnect.inputs[0].input_type, scenarios[index].type);
      assert.equal(afterReconnect.inputs[0].object_key, artifactIds[index]);
      assert.deepEqual(afterReconnect.inputs[0].content_hash, fingerprints[index]);
      assert.equal(afterReconnect.evidence.length, 1);
      assert.equal(afterReconnect.claims.length, 1);
      assert.equal(afterReconnect.savedRevision.run_id, runIds[index]);
      assert.equal(afterReconnect.savedRevision.snapshot.input.imageHash, imageDigest);
      if (scenarios[index].type === "qr") assert.equal(afterReconnect.savedRevision.snapshot.input.qrContent, "https://example.org/qr-fixture");
      assert.equal(verdict.rows[0]?.verdict?.final, "INSUFFICIENT_EVIDENCE");
    }
  } finally {
    const cleanupPool = getPostgresPool();
    await cleanupPool.query("DELETE FROM public.claims WHERE id = ANY($1::uuid[])", [claimIds]);
    await cleanupPool.query("DELETE FROM public.trust_cases WHERE id = ANY($1::uuid[])", [caseIds]);
    await cleanupPool.query("DELETE FROM private.audit_events WHERE target_id = ANY($1::text[])", [caseIds]);
  }
});
