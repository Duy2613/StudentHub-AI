import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { computeTrustInputHash } from "../../src/lib/server/database/TrustInputHash.js";

process.env.STUDENTHUB_HERMETIC_TEST_MODE = "1";
const { prepareCanonicalMediaInput } = await import("../../src/lib/server/media/CanonicalMediaIntake.js");
const ownerId = "f67b61d6-17af-4c95-9ddd-7366d6cb3c32";
const artifact = { mediaArtifactId: "art_658bbeb0-36cc-472d-a3ed-954027c7d0d0", sha256: "a".repeat(64), mimeType: "image/png", width: 1, height: 1, byteSize: 24 };
const principal = { isAuthenticated: true, subjectId: `user:${ownerId}` };

function serviceFake() {
  const calls = [];
  return {
    calls,
    async ingestImage(params) { calls.push({ method: "ingest", params }); return { ok: true, artifact }; },
    async hydrateArtifact(id, params) { calls.push({ method: "hydrate", id, params }); return { ok: true, artifact }; },
    getArtifactBytes() { return Buffer.from("canonical-bytes"); },
    async cleanupUnreferencedArtifact(params) { calls.push({ method: "cleanup", params }); return { ok: true, removed: true }; },
  };
}

test("authenticated media intake uses the principal and replaces client bytes/hash/size with canonical metadata", async () => {
  const mediaService = serviceFake();
  const result = await prepareCanonicalMediaInput({ type: "image", content: "data:image/png;base64,AAAA", metadata: { imageHash: "forged", fileSize: 999 } }, { principal, mediaService });
  assert.equal(result.ok, true);
  assert.equal(mediaService.calls[0].params.ownerUserId, ownerId);
  assert.equal(mediaService.calls[0].params.requireDurableStorage, true);
  assert.equal(result.input.content, "");
  assert.equal(result.input.metadata.imageHash, artifact.sha256);
  assert.equal(result.input.metadata.fileSize, artifact.byteSize);
  assert.equal(result.input.metadata.bytes, undefined);
});

test("anonymous references, non-image references and mixed bytes/reference payloads never reach the artifact cache", async () => {
  const mediaService = serviceFake();
  const reference = { type: "image", metadata: { mediaArtifactId: artifact.mediaArtifactId } };
  const anonymous = await prepareCanonicalMediaInput(reference, { mediaService });
  assert.equal(anonymous.error.statusCode, 403);
  const wrongType = await prepareCanonicalMediaInput({ ...reference, type: "text", content: "text" }, { principal, mediaService });
  assert.equal(wrongType.error.code, "MEDIA_ARTIFACT_INPUT_TYPE_INVALID");
  const mixed = await prepareCanonicalMediaInput({ ...reference, metadata: { ...reference.metadata, bytes: "AAAA" } }, { principal, mediaService });
  assert.equal(mixed.error.code, "MEDIA_ARTIFACT_INPUT_CONFLICT");
  assert.equal(mediaService.calls.length, 0);
});

test("QR intake hydrates the exact artifact and derives its payload from server bytes", async () => {
  const mediaService = serviceFake();
  const roomId = "b9fda6cb-6e38-4cf3-91e5-fb05868becd1";
  const result = await prepareCanonicalMediaInput({ type: "qr", content: "substituted client content", metadata: { mediaArtifactId: artifact.mediaArtifactId, imageHash: artifact.sha256, qrPayload: "client payload" } }, {
    principal, roomId, mediaService,
    async decodeQr(bytes) { assert.equal(bytes.toString(), "canonical-bytes"); return { ok: true, payload: "https://example.org/canonical" }; },
  });
  assert.equal(result.ok, true);
  assert.equal(mediaService.calls[0].id, artifact.mediaArtifactId);
  assert.deepEqual(mediaService.calls[0].params, { requesterUserId: ownerId, roomId, expectedSha256: artifact.sha256 });
  assert.equal(result.input.content, "");
  assert.equal(result.input.metadata.qrContent, "https://example.org/canonical");
  assert.equal(result.input.metadata.qrPayload, undefined);
});

test("unreadable newly uploaded QR cleans only its own unreferenced artifact", async () => {
  const mediaService = serviceFake();
  const result = await prepareCanonicalMediaInput({ type: "qr", metadata: { bytes: Buffer.from("image") } }, { principal, mediaService, async decodeQr() { return { ok: false, code: "QR_IMAGE_UNREADABLE" }; } });
  assert.equal(result.error.code, "QR_IMAGE_UNREADABLE");
  assert.deepEqual(mediaService.calls[1], { method: "cleanup", params: { mediaArtifactId: artifact.mediaArtifactId, ownerUserId: ownerId } });
});

test("Trust input fingerprint includes image digest and excludes allocation-specific artifact id", () => {
  const input = { type: "image", content: "", metadata: { fileName: "image.png", fileSize: 100, mimeType: "image/png", imageHash: "a".repeat(64), mediaArtifactId: "first" } };
  const original = computeTrustInputHash(input);
  const sameBytes = computeTrustInputHash({ ...input, metadata: { ...input.metadata, mediaArtifactId: "retry" } });
  const differentBytes = computeTrustInputHash({ ...input, metadata: { ...input.metadata, imageHash: "b".repeat(64) } });
  assert.deepEqual(original, sameBytes);
  assert.notDeepEqual(original, differentBytes);
});

test("every API entry point consuming stored image references uses the shared authorization intake", async () => {
  for (const path of ["v1/trust/route.js", "verify/[...path]/route.js", "ai-trust/semantic/route.js", "ai-trust/screen/route.js"]) {
    const source = await readFile(new URL(`../../src/app/api/${path}`, import.meta.url), "utf8");
    assert.match(source, /prepareCanonicalMediaInput/);
    assert.match(source, /principal/);
  }
});
