import test from "node:test";
import assert from "node:assert/strict";
import { MediaArtifactService } from "../../src/lib/server/media/MediaArtifactService.js";

test("Payload Reference — MediaArtifactService validates magic bytes and registers artifact reference", async () => {
  // Minimal valid 1x1 PNG binary
  const validPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const res = await MediaArtifactService.ingestImage({
    bytes: validPng,
    ownerUserId: "user_test_456",
  });

  assert.equal(res.ok, true);
  assert.ok(res.artifact.mediaArtifactId.startsWith("art_"));
  assert.equal(res.artifact.mimeType, "image/png");
  assert.equal(res.artifact.width, 1);
  assert.equal(res.artifact.height, 1);
  assert.ok(res.artifact.sha256.length === 64);

  // Bytes can be retrieved server-side by ID for downstream pipeline stages
  const retrievedBytes = MediaArtifactService.getArtifactBytes(res.artifact.mediaArtifactId);
  assert.ok(retrievedBytes);
  assert.equal(retrievedBytes.length, validPng.length);

  // Invariant (Hardening Rule 14): Downstream reference object contains NO raw base64 payload
  assert.equal(res.artifact.bytes, undefined);
  assert.equal(res.artifact.base64, undefined);
  assert.equal(res.artifact.buffer, undefined);
});

test("Payload Reference — Rejects corrupt or unsupported image format", async () => {
  const fakeExecutable = Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00");
  const res = await MediaArtifactService.ingestImage({ bytes: fakeExecutable });

  assert.equal(res.ok, false);
  assert.equal(res.error.code, "UNSUPPORTED_OR_CORRUPT_FORMAT");
});

test("Payload Reference — Defends against oversized files", async () => {
  const giantBuffer = Buffer.alloc(9 * 1024 * 1024); // 9MB (> 8MB limit)
  const res = await MediaArtifactService.ingestImage({ bytes: giantBuffer });

  assert.equal(res.ok, false);
  assert.equal(res.error.code, "FILE_OVERSIZED");
});
